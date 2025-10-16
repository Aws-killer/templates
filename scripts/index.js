import fs from "fs";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import * as readline from "readline";
import Tesseract from "tesseract.js";
import { fromPath } from "pdf2pic";
import { createCanvas, loadImage } from "canvas";

// ============================================================================
// PDF Conversion & Image Processing
// ============================================================================

async function convertPDFPageToImage(pdfPath, pageNum, outputPath) {
  const options = {
    density: 600,
    saveFilename: `page_${pageNum}`,
    savePath: outputPath,
    format: "png",
    width: 2000,
    height: 2000,
    preserveAspectRatio: true,
  };

  const convert = fromPath(pdfPath, options);
  const result = await convert(pageNum, { responseType: "image" });
  return result.path;
}

async function convertPDFPagesToImages(pdfPath, pageNumbers, outputDir) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const options = {
    density: 600,
    saveFilename: "page",
    savePath: outputDir,
    format: "png",
    width: 2000,
    height: 2000,
    preserveAspectRatio: true,
  };

  const convert = fromPath(pdfPath, options);
  const results = await convert.bulk(pageNumbers, { responseType: "image" });
  return results.map((r) => r.path);
}

// ============================================================================
// OCR Processing
// ============================================================================

async function getOCRWordBoxes(pdfPath, pageNum, tempDir = "./temp_ocr") {
  console.log(`   Scanning page ${pageNum}...`);

  const imagePath = await convertPDFPageToImage(pdfPath, pageNum, tempDir);

  const result = await Tesceract.recognize(imagePath, "eng", {
    logger: (info) => {
      if (info.status === "recognizing text") {
        process.stdout.write(
          `\r   OCR Progress: ${Math.round(info.progress * 100)}%`
        );
      }
    },
  });

  process.stdout.write("\r   ✓ OCR completed                    \n");

  if (!result || !result.data) {
    console.error("   ⚠️  OCR returned no data");
    return {
      page: pageNum,
      words: [],
      fullText: "",
      imagePath: imagePath,
    };
  }

  let words = extractOCRWords(result.data);

  if (fs.existsSync(imagePath)) {
    fs.unlinkSync(imagePath);
  }

  return {
    page: pageNum,
    words: words,
    fullText: result.data.text || "",
    imagePath: imagePath,
  };
}

async function refineMatchWithOCR(
  pdfPath,
  pageNum,
  boundingBox,
  searchQuery,
  tempDir = "./temp_ocr"
) {
  console.log(`   Refining match on page ${pageNum} with OCR...`);

  // Add padding to the bounding box to capture context
  const padding = 20;
  const refinedBox = {
    x: Math.max(0, boundingBox.x - padding),
    y: Math.max(0, boundingBox.y - padding),
    width: boundingBox.width + padding * 2,
    height: boundingBox.height + padding * 2,
  };

  // Get the full page image
  const imagePath = await convertPDFPageToImage(pdfPath, pageNum, tempDir);
  const image = await loadImage(imagePath);

  // Extract the region from the image
  const canvas = createCanvas(refinedBox.width, refinedBox.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(
    image,
    refinedBox.x,
    refinedBox.y,
    refinedBox.width,
    refinedBox.height,
    0,
    0,
    refinedBox.width,
    refinedBox.height
  );

  const regionImagePath = `${tempDir}/region_${pageNum}_${Date.now()}.png`;
  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(regionImagePath, buffer);

  // Run OCR on the extracted region
  const result = await Tesseract.recognize(regionImagePath, "eng", {
    logger: (info) => {
      if (info.status === "recognizing text") {
        process.stdout.write(`\r   OCR refining: ${Math.round(info.progress * 100)}%`);
      }
    },
  });

  process.stdout.write("\r   ✓ Refinement complete            \n");

  if (!result || !result.data) {
    console.error("   ⚠️  OCR refinement returned no data");
    if (fs.existsSync(regionImagePath)) fs.unlinkSync(regionImagePath);
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    return null;
  }

  // Extract words from OCR result
  const words = extractOCRWords(result.data);

  // Search for the query in the OCR results
  const normalizedQuery = normalizeForSearch(searchQuery);
  const pageText = words.map((w) => w.text).join(" ");
  const normalizedPageText = normalizeForSearch(pageText);

  const foundIndex = normalizedPageText.indexOf(normalizedQuery);

  if (foundIndex === -1) {
    console.log("   ⚠️  Query not found in OCR refinement");
    if (fs.existsSync(regionImagePath)) fs.unlinkSync(regionImagePath);
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    return null;
  }

  const wordIndices = findWordIndicesByNormalizedPos(
    words,
    foundIndex,
    normalizedQuery.length
  );

  if (wordIndices.start === -1 || wordIndices.end === -1) {
    if (fs.existsSync(regionImagePath)) fs.unlinkSync(regionImagePath);
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    return null;
  }

  const matchWords = words.slice(wordIndices.start, wordIndices.end + 1);
  const regionBoundingBox = calculateWordsBoundingBox(matchWords);

  // Convert region coordinates back to full page coordinates
  const refinedBoundingBox = {
    x: refinedBox.x + regionBoundingBox.x,
    y: refinedBox.y + regionBoundingBox.y,
    width: regionBoundingBox.width,
    height: regionBoundingBox.height,
  };

  // Cleanup
  if (fs.existsSync(regionImagePath)) fs.unlinkSync(regionImagePath);
  if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);

  return {
    text: matchWords.map((w) => w.text).join(" "),
    boundingBox: refinedBoundingBox,
    wordBoxes: matchWords.map((w) => ({
      text: w.text,
      confidence: w.confidence,
      x: refinedBox.x + w.bbox.x,
      y: refinedBox.y + w.bbox.y,
      width: w.bbox.width,
      height: w.bbox.height,
    })),
    ocrRefined: true,
  };
}

function extractOCRWords(data) {
  let words = [];

  if (data.words && Array.isArray(data.words)) {
    words = data.words.map((word) => ({
      text: word.text,
      confidence: word.confidence,
      bbox: {
        x: word.bbox.x0,
        y: word.bbox.y0,
        width: word.bbox.x1 - word.bbox.x0,
        height: word.bbox.y1 - word.bbox.y0,
      },
      baseline: word.baseline,
    }));
  } else if (data.lines && Array.isArray(data.lines)) {
    data.lines.forEach((line) => {
      if (line.words && Array.isArray(line.words)) {
        line.words.forEach((word) => {
          words.push({
            text: word.text,
            confidence: word.confidence,
            bbox: {
              x: word.bbox.x0,
              y: word.bbox.y0,
              width: word.bbox.x1 - word.bbox.x0,
              height: word.bbox.y1 - word.bbox.y0,
            },
            baseline: word.baseline,
          });
        });
      }
    });
  }

  return words;
}

async function performOCROnPDF(pdfPath, pageNumbers = null) {
  console.log("\n📸 Performing OCR on PDF...");

  if (!pageNumbers) {
    const data = new Uint8Array(fs.readFileSync(pdfPath));
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    pageNumbers = Array.from({ length: pdf.numPages }, (_, i) => i + 1);
  }

  const tempDir = "./temp_ocr";
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const ocrResults = [];

  for (const pageNum of pageNumbers) {
    const result = await getOCRWordBoxes(pdfPath, pageNum, tempDir);
    ocrResults.push(result);
  }

  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  console.log(`✓ OCR completed for ${pageNumbers.length} page(s)\n`);
  return ocrResults;
}

// ============================================================================
// Text Normalization & Utilities
// ============================================================================

function normalizeForSearch(text) {
  let normalized = text.replace(/([(`])/g, " $1 ");
  normalized = normalized.replace(/([)`])/g, " $1 ");
  normalized = normalized.replace(/\s+/g, " ").trim().toLowerCase();
  return normalized;
}

function normalizeText(text) {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

// ============================================================================
// Bounding Box Calculations
// ============================================================================

function calculateWordsBoundingBox(words) {
  const x0 = Math.min(...words.map((w) => w.bbox.x));
  const y0 = Math.min(...words.map((w) => w.bbox.y));
  const x1 = Math.max(...words.map((w) => w.bbox.x + w.bbox.width));
  const y1 = Math.max(...words.map((w) => w.bbox.y + w.bbox.height));

  return {
    x: x0,
    y: y0,
    width: x1 - x0,
    height: y1 - y0,
  };
}

function calculateBoundingBox(items) {
  const x0 = Math.min(...items.map((item) => item.x));
  const y0 = Math.min(...items.map((item) => item.y));
  const x1 = Math.max(...items.map((item) => item.x + item.width));
  const y1 = Math.max(...items.map((item) => item.y + item.height));

  return {
    x: x0,
    y: y0,
    width: x1 - x0,
    height: y1 - y0,
  };
}

// ============================================================================
// OCR-based Search
// ============================================================================

function searchInOCR(ocrResults, searchQuery) {
  const matches = [];
  const normalizedQuery = normalizeForSearch(searchQuery);
  const queryWords = normalizedQuery.split(/\s+/).filter((w) => w.length > 0);

  ocrResults.forEach((pageResult) => {
    const pageWords = pageResult.words;
    const pageText = pageWords.map((w) => w.text).join(" ");
    const normalizedPageText = normalizeForSearch(pageText);

    let startPos = 0;
    while (true) {
      const foundIndex = normalizedPageText.indexOf(normalizedQuery, startPos);
      if (foundIndex === -1) break;

      const wordIndices = findWordIndicesByNormalizedPos(
        pageWords,
        foundIndex,
        normalizedQuery.length
      );

      if (wordIndices.start !== -1 && wordIndices.end !== -1) {
        const matchWords = pageWords.slice(
          wordIndices.start,
          wordIndices.end + 1
        );
        const boundingBox = calculateWordsBoundingBox(matchWords);

        matches.push({
          text: matchWords.map((w) => w.text).join(" "),
          page: pageResult.page,
          boundingBox: boundingBox,
          wordBoxes: matchWords.map((w) => ({
            text: w.text,
            confidence: w.confidence,
            x: w.bbox.x,
            y: w.bbox.y,
            width: w.bbox.width,
            height: w.bbox.height,
          })),
          ocrBased: true,
        });
      }

      startPos = foundIndex + 1;
    }
  });

  return matches;
}

function findWordIndicesByNormalizedPos(words, charStart, charLength) {
  let currentPos = 0;
  let startWordIndex = -1;
  let endWordIndex = -1;

  for (let i = 0; i < words.length; i++) {
    const wordText = words[i].text;
    const normalizedWord = normalizeForSearch(wordText);
    const wordLength = normalizedWord.length;

    if (startWordIndex === -1 && currentPos + wordLength > charStart) {
      startWordIndex = i;
    }

    if (
      startWordIndex !== -1 &&
      currentPos + wordLength >= charStart + charLength
    ) {
      endWordIndex = i;
      break;
    }

    currentPos += wordLength + 1;
  }

  return { start: startWordIndex, end: endWordIndex };
}

// ============================================================================
// PDF.js Text Extraction & Search
// ============================================================================

async function extractTextItems(pdfPath) {
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const allItems = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();

    textContent.items.forEach((item) => {
      const transform = item.transform;
      allItems.push({
        text: item.str,
        x: transform[4],
        y: transform[5],
        width: item.width,
        height: item.height,
        page: i,
      });
    });
  }
  return allItems;
}

function buildCharacterMap(items) {
  const charMap = [];
  let fullText = "";

  items.forEach((item, itemIndex) => {
    const itemText = item.text;
    for (let i = 0; i < itemText.length; i++) {
      charMap.push({
        char: itemText[i],
        itemIndex: itemIndex,
        charIndexInItem: i,
        item: item,
      });
      fullText += itemText[i];
    }
    if (itemIndex < items.length - 1) {
      charMap.push({
        char: " ",
        itemIndex: itemIndex,
        charIndexInItem: -1,
        item: item,
      });
      fullText += " ";
    }
  });

  return { fullText, charMap };
}

function findTextInPDF(items, searchQuery) {
  const matches = [];
  const query = searchQuery.trim();

  if (!query) return matches;

  const pageGroups = {};
  items.forEach((item) => {
    if (!pageGroups[item.page]) {
      pageGroups[item.page] = [];
    }
    pageGroups[item.page].push(item);
  });

  let exactMatches = performExactSearch(pageGroups, query);
  if (exactMatches.length > 0) return exactMatches;

  console.log(
    "⚠️  No exact match found. Trying fuzzy search (ignoring spaces)..."
  );
  const fuzzyMatches = performFuzzySearch(pageGroups, query);
  if (fuzzyMatches.length > 0) {
    console.log("✓ Found matches with fuzzy search!");
    return fuzzyMatches;
  }

  console.log("⚠️  No fuzzy match found. Trying multi-line search...");
  return performMultiLineSearch(pageGroups, query);
}

function performExactSearch(pageGroups, query) {
  const matches = [];
  const normalizedQuery = normalizeForSearch(query);

  Object.keys(pageGroups).forEach((pageNum) => {
    const pageItems = pageGroups[pageNum];
    const { fullText, charMap } = buildCharacterMap(pageItems);
    const normalizedFullText = normalizeForSearch(fullText);

    let startPos = 0;
    while (true) {
      const foundIndex = normalizedFullText.indexOf(normalizedQuery, startPos);
      if (foundIndex === -1) break;

      const originalRange = mapNormalizedToOriginal(
        fullText,
        foundIndex,
        normalizedQuery.length
      );

      if (!originalRange) {
        startPos = foundIndex + 1;
        continue;
      }

      const actualText = fullText.substring(
        originalRange.start,
        originalRange.end
      );
      const matchChars = charMap.slice(originalRange.start, originalRange.end);

      const involvedItems = [];
      const itemsSeen = new Set();

      matchChars.forEach((charInfo) => {
        if (
          charInfo.charIndexInItem >= 0 &&
          !itemsSeen.has(charInfo.itemIndex)
        ) {
          involvedItems.push(charInfo.item);
          itemsSeen.add(charInfo.itemIndex);
        }
      });

      if (involvedItems.length > 0) {
        const boundingBox = calculateBoundingBox(involvedItems);

        matches.push({
          text: actualText,
          page: parseInt(pageNum),
          boundingBox: boundingBox,
          wordBoxes: involvedItems.map((item) => ({
            text: item.text,
            x: item.x,
            y: item.y,
            width: item.width,
            height: item.height,
          })),
        });
      }

      startPos = foundIndex + 1;
    }
  });

  return matches;
}

function performFuzzySearch(pageGroups, query) {
  const matches = [];
  const queryNoSpaces = query.replace(/\s+/g, "").toLowerCase();

  Object.keys(pageGroups).forEach((pageNum) => {
    const pageItems = pageGroups[pageNum];
    const { fullText, charMap } = buildCharacterMap(pageItems);
    const fullTextNoSpaces = fullText.replace(/\s+/g, "").toLowerCase();

    let startPos = 0;
    while (true) {
      const foundIndex = fullTextNoSpaces.indexOf(queryNoSpaces, startPos);
      if (foundIndex === -1) break;

      const originalRange = mapNoSpaceToOriginal(
        fullText,
        foundIndex,
        queryNoSpaces.length
      );

      if (!originalRange) {
        startPos = foundIndex + 1;
        continue;
      }

      const actualText = fullText.substring(
        originalRange.start,
        originalRange.end
      );
      const matchChars = charMap.slice(originalRange.start, originalRange.end);

      const involvedItems = [];
      const itemsSeen = new Set();

      matchChars.forEach((charInfo) => {
        if (
          charInfo.charIndexInItem >= 0 &&
          !itemsSeen.has(charInfo.itemIndex)
        ) {
          involvedItems.push(charInfo.item);
          itemsSeen.add(charInfo.itemIndex);
        }
      });

      if (involvedItems.length > 0) {
        const boundingBox = calculateBoundingBox(involvedItems);

        matches.push({
          text: actualText,
          page: parseInt(pageNum),
          boundingBox: boundingBox,
          wordBoxes: involvedItems.map((item) => ({
            text: item.text,
            x: item.x,
            y: item.y,
            width: item.width,
            height: item.height,
          })),
          fuzzyMatch: true,
        });
      }

      startPos = foundIndex + 1;
    }
  });

  return matches;
}

function performMultiLineSearch(pageGroups, query) {
  const matches = [];
  // TODO: Implement multi-line search logic
  return matches;
}

function mapNormalizedToOriginal(
  originalText,
  normalizedStart,
  normalizedLength
) {
  let normalizedPos = 0;
  let originalStart = -1;
  let originalEnd = -1;

  for (let i = 0; i < originalText.length; i++) {
    const char = originalText[i];

    if (
      char.trim().length > 0 ||
      (i > 0 && originalText[i - 1].trim().length > 0 && char === " ")
    ) {
      if (normalizedPos === normalizedStart && originalStart === -1) {
        originalStart = i;
      }

      if (originalStart !== -1) {
        const currentNormalizedText = originalText.substring(
          originalStart,
          i + 1
        );
        const currentNormalized = normalizeForSearch(currentNormalizedText);

        if (currentNormalized.length >= normalizedLength) {
          originalEnd = i + 1;
          break;
        }
      }

      normalizedPos++;
    }
  }

  if (originalStart === -1 || originalEnd === -1) return null;
  return { start: originalStart, end: originalEnd };
}

function mapNoSpaceToOriginal(originalText, noSpaceStart, noSpaceLength) {
  let noSpacePos = 0;
  let originalStart = -1;
  let originalEnd = -1;

  for (let i = 0; i < originalText.length; i++) {
    const char = originalText[i];

    if (char === " " || char === "\t" || char === "\n" || char === "\r")
      continue;

    if (noSpacePos === noSpaceStart && originalStart === -1) {
      originalStart = i;
    }

    if (originalStart !== -1) {
      if (noSpacePos - noSpaceStart + 1 >= noSpaceLength) {
        originalEnd = i + 1;
        break;
      }
    }

    noSpacePos++;
  }

  if (originalStart === -1 || originalEnd === -1) return null;
  return { start: originalStart, end: originalEnd };
}

// ============================================================================
// Visualization
// ============================================================================

async function renderPageWithBoundingBoxes(
  pdfPath,
  pageNum,
  matches,
  outputPath,
  ocrBased = false
) {
  const tempDir = "./temp_viz";
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const baseImagePath = await convertPDFPageToImage(pdfPath, pageNum, tempDir);
  const image = await loadImage(baseImagePath);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(image, 0, 0);

  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale: 1.0 });

  const scaleX = image.width / viewport.width;
  const scaleY = image.height / viewport.height;

  matches.forEach((match, index) => {
    if (match.page === pageNum) {
      const box = match.boundingBox;

      let x, y, width, height;

      if (ocrBased || match.ocrBased) {
        x = box.x;
        y = box.y;
        width = box.width;
        height = box.height;
      } else {
        x = box.x * scaleX;
        y = (viewport.height - box.y - box.height) * scaleY;
        width = box.width * scaleX;
        height = box.height * scaleY;
      }

      ctx.fillStyle = "rgba(255, 255, 0, 0.3)";
      ctx.fillRect(x, y, width, height);

      ctx.strokeStyle = "rgba(255, 0, 0, 0.8)";
      ctx.lineWidth = 4;
      ctx.strokeRect(x, y, width, height);

      ctx.fillStyle = "rgba(255, 0, 0, 0.9)";
      ctx.font = "bold 30px Arial";
      ctx.fillText(`#${index + 1}`, x + 10, y + 40);

      if (match.wordBoxes && match.wordBoxes.length > 1) {
        ctx.strokeStyle = "rgba(0, 0, 255, 0.6)";
        ctx.lineWidth = 2;
        ctx.font = "16px Arial";

        match.wordBoxes.forEach((wordBox) => {
          let wx, wy, wwidth, wheight;

          if (ocrBased || match.ocrBased) {
            wx = wordBox.x;
            wy = wordBox.y;
            wwidth = wordBox.width;
            wheight = wordBox.height;
          } else {
            wx = wordBox.x * scaleX;
            wy = (viewport.height - wordBox.y - wordBox.height) * scaleY;
            wwidth = wordBox.width * scaleX;
            wheight = wordBox.height * scaleY;
          }

          ctx.strokeRect(wx, wy, wwidth, wheight);

          if (wordBox.confidence !== undefined) {
            ctx.fillStyle = "rgba(0, 0, 255, 0.9)";
            ctx.fillText(`${Math.round(wordBox.confidence)}%`, wx, wy - 5);
          }
        });
      }
    }
  });

  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(outputPath, buffer);

  if (fs.existsSync(baseImagePath)) {
    fs.unlinkSync(baseImagePath);
  }

  console.log(`   Page ${pageNum} saved to: ${outputPath}`);
}

async function visualizeMatches(pdfPath, matches, ocrBased = false) {
  if (matches.length === 0) return;

  console.log("\nGenerating visualizations...");

  const timestamp = Date.now();
  const outputDir = `visualization_${timestamp}`;
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  const pageNumbers = [...new Set(matches.map((m) => m.page))];

  for (const pageNum of pageNumbers) {
    const outputPath = `${outputDir}/page_${pageNum}.png`;
    await renderPageWithBoundingBoxes(
      pdfPath,
      pageNum,
      matches,
      outputPath,
      ocrBased
    );
  }

  console.log(`\n✓ Visualization complete! Images saved in: ${outputDir}/`);
  return outputDir;
}

// ============================================================================
// CLI & Utilities
// ============================================================================

function parseArgs(args) {
  const result = {
    mode: null,
    pdfPath: null,
    useOCR: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "-r" || arg === "--read") {
      result.mode = "read";
      if (i + 1 < args.length) {
        result.pdfPath = args[i + 1];
        i++;
      } else {
        throw new Error("Missing PDF path after -r flag");
      }
    } else if (arg === "-f" || arg === "--find") {
      result.mode = "find";
      if (i + 1 < args.length) {
        result.pdfPath = args[i + 1];
        i++;
      } else {
        throw new Error("Missing PDF path after -f flag");
      }
    } else if (arg === "--ocr") {
      result.useOCR = true;
    }
  }

  return result;
}

function getUserInput(
  prompt = 'Enter your text (type "DONE" on a new line when finished):'
) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const lines = [];
    console.log(prompt);

    rl.on("line", (line) => {
      if (line.trim().toUpperCase() === "DONE") {
        rl.close();
      } else {
        lines.push(line);
      }
    });

    rl.on("close", () => {
      resolve(lines.join("\n"));
    });
  });
}

function showUsage() {
  console.log("PDF Search Tool");
  console.log("\nUsage:");
  console.log(
    "  node index.js -r <pdf_path>           Read and extract all sentences from PDF"
  );
  console.log(
    "  node index.js -f <pdf_path>           Find specific text in PDF with coordinates"
  );
  console.log(
    "  node index.js -f <pdf_path> --ocr     Find text using OCR (Tesseract.js)"
  );
  console.log("\nExamples:");
  console.log("  node index.js -r document.pdf");
  console.log("  node index.js -f document.pdf");
  console.log("  node index.js -f document.pdf --ocr");
}

function displaySearchResults(results) {
  if (results.length === 0) {
    console.log("\nNo matches found.");
    return;
  }

  console.log(`\n✓ Found ${results.length} match(es):\n`);
  console.log("=".repeat(80));

  results.forEach((match, index) => {
    const tags = [];
    if (match.multiLine) tags.push("MULTI-LINE");
    if (match.fuzzyMatch) tags.push("FUZZY");
    if (match.ocrBased) tags.push("OCR");
    const tagStr = tags.length > 0 ? ` [${tags.join(", ")}]` : "";

    console.log(`\nMatch #${index + 1}:${tagStr}`);
    console.log(`  Text: "${match.text}"`);
    console.log(`  Page: ${match.page}`);
    console.log(`  Bounding Box:`);
    console.log(`    x: ${match.boundingBox.x.toFixed(2)}`);
    console.log(`    y: ${match.boundingBox.y.toFixed(2)}`);
    console.log(`    width: ${match.boundingBox.width.toFixed(2)}`);
    console.log(`    height: ${match.boundingBox.height.toFixed(2)}`);
    console.log(`  Word Boxes: ${match.wordBoxes.length} word(s)`);
    match.wordBoxes.forEach((box, i) => {
      console.log(
        `    [${i + 1}] "${box.text}" at (${box.x.toFixed(2)}, ${box.y.toFixed(
          2
        )})`
      );
    });
    console.log("-".repeat(80));
  });

  console.log(`\nSummary:`);
  const pageNumbers = [...new Set(results.map((r) => r.page))];
  console.log(`   Matches on ${pageNumbers.length} page(s): ${pageNumbers.join(", ")}`);
  console.log(`   Total matches: ${results.length}`);
  console.log("=".repeat(80));
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    showUsage();
    process.exit(0);
  }

  try {
    const { mode, pdfPath, useOCR } = parseArgs(args);

    if (!mode || !pdfPath) {
      console.error("Error: Please specify a mode (-r or -f) and PDF path");
      showUsage();
      process.exit(1);
    }

    if (!fs.existsSync(pdfPath)) {
      console.error(`Error: File not found at "${pdfPath}"`);
      process.exit(1);
    }

    if (mode === "read") {
      console.log("Processing PDF...");
      const items = await extractTextItems(pdfPath);
      console.log(`✓ Extracted ${items.length} text items.\n`);
      console.log(JSON.stringify(items, null, 2));
    } else if (mode === "find") {
      const queryText = await getUserInput(
        "Enter the text to search for:"
      );

      if (!queryText.trim()) {
        console.log("No search text provided.");
        process.exit(0);
      }

      let results;

      if (useOCR) {
        console.log("\nUsing OCR mode...");
        const ocrResults = await performOCROnPDF(pdfPath);
        const timestamp = Date.now();
        const ocrFile = `ocr_results_${timestamp}.json`;
        fs.writeFileSync(ocrFile, JSON.stringify(ocrResults, null, 2));
        console.log(`OCR data saved to: ${ocrFile}\n`);

        console.log("Searching in OCR results...");
        results = searchInOCR(ocrResults, queryText);
      } else {
        console.log("Processing PDF...");
        const items = await extractTextItems(pdfPath);
        console.log(`✓ Extracted ${items.length} text items.\n`);

        console.log("Searching...");
        results = findTextInPDF(items, queryText);
      }

      displaySearchResults(results);

      if (results.length > 0) {
        const timestamp = Date.now();
        const outputFile = `search_results_${timestamp}.json`;
        fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
        console.log(`\nResults saved to: ${outputFile}`);

        const vizDir = await visualizeMatches(pdfPath, results, useOCR);
      }
    }
  } catch (error) {
    console.error("Error:", error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
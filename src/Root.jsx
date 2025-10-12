import { Composition } from "remotion";
import { SearchResultScene } from "./Pdfviewer"; // Make sure the path is correct

export const RemotionRoot = () => {
  const sampleData = [
  {
    "text": "However, strict   0 – 1   verification is coarse and brittle: many reasoning tasks allow for partially correct solutions, equivalent answers in alternative formats, or open-ended outputs that resist exact matching.",
    "page": 2,
    "boundingBox": {
      "x": 70.866,
      "y": 604.684,
      "width": 471.6517205232001,
      "height": 21.917599999999993
    },
    "wordBoxes": [
      {
        "text": "However, strict",
        "x": 70.866,
        "y": 616.639,
        "width": 64.18229708239998,
        "height": 9.9626
      },
      {
        "text": " ",
        "x": 135.04829708239998,
        "y": 616.639,
        "width": 3.078443400000003,
        "height": 0
      },
      {
        "text": "0",
        "x": 138.0651716144,
        "y": 616.639,
        "width": 4.881674,
        "height": 9.9626
      },
      {
        "text": "–",
        "x": 142.9468456144,
        "y": 616.639,
        "width": 4.8806976652,
        "height": 9.9626
      },
      {
        "text": "1",
        "x": 147.82754327959998,
        "y": 616.639,
        "width": 4.881674,
        "height": 9.9626
      },
      {
        "text": " ",
        "x": 152.70921727959998,
        "y": 616.639,
        "width": 3.08840600000001,
        "height": 0
      },
      {
        "text": "verification is coarse and brittle: many reasoning tasks allow for partially correct solutions,",
        "x": 155.7358551596,
        "y": 616.639,
        "width": 386.78186536360005,
        "height": 9.9626
      },
      {
        "text": "equivalent answers in alternative formats, or open-ended outputs that resist exact matching. In such cases,",
        "x": 70.866,
        "y": 604.684,
        "width": 471.65037557220046,
        "height": 9.9626
      }
    ],
    "fuzzyMatch": true
  }
];

  return (
    <>
      {sampleData.map((match, idx) => (
        <Composition
          key={`match-${idx}`}
          id={`SearchResult-${idx + 1}`}
          component={SearchResultScene}
          durationInFrames={300} // Increased duration for better visibility
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            match: match,
            matchNumber: idx + 1,
            zoomTo: 2.5, // This will zoom in 2.2 times
            // IMPORTANT: Replace these with the real dimensions
            // from your `index.js` console output.
            pdfPointWidth: 595.276, // PDF page width in points
            pdfPointHeight: 841.89, // PDF page height in points
            imagePixelWidth: 2000, // Rendered PNG width in pixels
            imagePixelHeight: 2831, // Rendered PNG height in pixels

            pageImageFile: "page_2 copy.png", // Ensure this is in the /public folder
          }}
        />
      ))}
    </>
  );
};

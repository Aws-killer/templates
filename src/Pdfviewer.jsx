import React, { useMemo } from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Img,
  staticFile,
  spring,
} from "remotion";

// --- 1. Load Excalifont ---
const fontCss = `
@font-face {
  font-family: 'Excalifont';
  src: url('https://excalidraw.nyc3.cdn.digitaloceanspaces.com/oss/fonts/Excalifont/Excalifont-Regular-a88b72a24fb54c9f94e3b5fdaa7481c9.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
`;

// Unchanged Component: MarkerHighlight
const MarkerHighlight = ({ bbox, scale, pageHeight }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const drawProgress = spring({
    frame: frame - 20,
    fps,
    config: { damping: 100, stiffness: 150 },
  });

  const y = (pageHeight - bbox.y - bbox.height) * scale;
  const x = bbox.x * scale;
  const width = bbox.width * scale;
  const height = bbox.height * scale;

  const pathData = `
    M ${x - 2},${y + 2}
    L ${x + width * drawProgress},${y - 1}
    L ${x + width * drawProgress},${y + height + 1}
    L ${x + 2},${y + height - 2}
    Z
  `;

  return (
    <path
      d={pathData}
      fill="#00BFFF"
      opacity={0.7}
      filter="url(#realisticHighlightEffect)"
    />
  );
};

// --- NEW COMPONENT: Handwritten Notes ---
const HandwrittenNotes = ({ text, startFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 1. Fade in container
  const containerOpacity = spring({
    frame: frame - startFrame,
    fps,
    config: { mass: 0.5 },
  });

  // 2. Typewriter effect progress (0 to 1 over time)
  const typeProgress = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 200, stiffness: 50 }, // Slower, linear feel
  });

  // Calculate how many characters to show based on progress
  const charsToShow = Math.floor(typeProgress * text.length);
  const currentText = text.substring(0, charsToShow);

  return (
    <div
      className="absolute top-8 left-8 z-20 max-w-xs"
      style={{ opacity: containerOpacity }}
    >
      {/* Excalidraw-style paper background */}
      <div
        className="bg-[#ffffe0] text-gray-900 p-6 rounded-sm shadow-md rotate-[-2deg] border border-gray-300"
        style={{ fontFamily: "'Excalifont', cursive" }}
      >
        <h3 className="text-2xl font-bold mb-2 border-b border-gray-400 pb-1">Notes</h3>
        <p className="text-xl leading-relaxed whitespace-pre-wrap">
          {currentText}
          {/* Blinking cursor */}
          <span
            style={{
              opacity: interpolate(frame, [0, 15, 30], [1, 0, 1], {
                extrapolateRight: "clamp",
              }) % 1,
            }}
          >
            |
          </span>
        </p>
      </div>
    </div>
  );
};

// Main Scene Component
export const SearchResultScene = ({
  match,
  matchNumber,
  pageWidth = 612,
  pageHeight = 792,
  pageImageFile = "page_2.png",
  zoomTo = 1.5,
  // New Props for timing and notes
  notesText = "Review this section carefully.\nKey evidence found here.",
  notesStartFrame = 10,
  modalStartFrame = 25,
  modalDuration = 120, // How long the modal stays visible
}) => {
  const frame = useCurrentFrame();
  const { fps, width: videoWidth, height: videoHeight } = useVideoConfig();
  const scale = 0.85;

  // PDF setup
  const pdfContainerWidth = pageWidth * scale;
  const pdfContainerHeight = pageHeight * scale;
  const bboxCenterX = (match.boundingBox.x + match.boundingBox.width / 2) * scale;
  const bboxCenterY = (pageHeight - match.boundingBox.y - match.boundingBox.height / 2) * scale;

  // --- ANIMATIONS ---

  // 1. PDF Animations
  const pdfSlideUp = interpolate(
    spring({ frame: frame - 5, fps, config: { damping: 100 } }),
    [0, 1],
    [videoHeight, 0]
  );
  const pdfOpacity = interpolate(frame, [5, 20], [0, 1], { extrapolateRight: 'clamp' });
  const zoomLevel = interpolate(
    spring({ frame: frame - 20, fps, config: { damping: 100 } }),
    [0, 1],
    [1, zoomTo]
  );

  // 2. Right Modal Animations (Enter -> Wait -> Exit)
  const modalExitFrame = modalStartFrame + modalDuration;

  // Entrance Spring
  const modalEnterProgress = spring({
    frame: frame - modalStartFrame,
    fps,
    config: { stiffness: 120, damping: 14 },
  });

  // Exit Spring
  const modalExitProgress = spring({
    frame: frame - modalExitFrame,
    fps,
    config: { stiffness: 120, damping: 14 },
  });

  // Combine for opacity: (0->1) during enter, then minus (0->1) during exit forces it back to 0
  // We use Math.max to ensure it doesn't go below 0.
  const rawModalOpacity = modalEnterProgress - modalExitProgress;
  const modalOpacity = Math.max(0, Math.min(1, rawModalOpacity));

  // Slide In from right, Slide Out to right
  const modalTranslateX = interpolate(
    modalEnterProgress,
    [0, 1],
    [50, 0]
  ) + interpolate(
    modalExitProgress,
    [0, 1],
    [0, 50]
  );

  // Only render modal logic if it has started and hasn't fully exited
  const showModal = frame >= modalStartFrame && modalOpacity > 0.01;

  return (
    <AbsoluteFill className="bg-gray-950">
      {/* Inject Custom Font */}
      <style>{fontCss}</style>

      <div className="grid grid-cols-5 gap-4 w-full h-full">
        
        {/* --- LEFT PANEL (Cols 1-3): PDF + NOTES --- */}
        <div className="col-span-3 relative w-full h-full">
          
          {/* 1. PERMANENT NOTES (Animated In) */}
          <HandwrittenNotes text={notesText} startFrame={notesStartFrame} />

          {/* 2. PDF VIEWER (Centered in this panel) */}
          <div className="w-full h-full flex items-center justify-center p-8 z-10">
            <div
              className="bg-white rounded-lg shadow-2xl overflow-hidden"
              style={{
                width: pdfContainerWidth,
                height: pdfContainerHeight,
                transformOrigin: `${bboxCenterX}px ${bboxCenterY}px`,
                opacity: pdfOpacity,
                transform: `translateY(${pdfSlideUp}px) scale(${zoomLevel})`,
              }}
            >
              <Img
                src={staticFile(pageImageFile)}
                className="w-full h-full object-cover"
                alt="PDF page"
              />
              <AbsoluteFill style={{ mixBlendMode: "multiply" }}>
                <svg
                  width="100%"
                  height="100%"
                  viewBox={`0 0 ${pdfContainerWidth} ${pdfContainerHeight}`}
                >
                  <defs>
                    <filter id="realisticHighlightEffect">
                      <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="5" />
                      <feDisplacementMap in="SourceGraphic" scale="5" />
                    </filter>
                  </defs>
                  <MarkerHighlight
                    bbox={match.boundingBox}
                    scale={scale}
                    pageHeight={pageHeight}
                  />
                </svg>
              </AbsoluteFill>
            </div>
          </div>
        </div>

        {/* --- RIGHT PANEL (Cols 4-5): TEMPORARY MODAL --- */}
        <div className="col-span-2 flex items-center justify-center p-8 relative">
          {showModal && (
            <div
              className="rounded-2xl bg-gray-900/90 backdrop-blur-md p-10 outline outline-1 outline-white/10 w-full grid grid-cols-1 gap-y-8 shadow-[0_0_50px_-12px_rgb(0,0,0,0.5)]"
              style={{
                opacity: modalOpacity,
                transform: `translateX(${modalTranslateX}px)`,
              }}
            >
              {/* Header / Tag */}
              <div className="flex gap-2 items-center">
                <svg aria-hidden="true" viewBox="0 0 16 16" className="h-6 w-4 shrink-0 text-gray-500">
                  <path fill="currentColor" d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zM1.5 8a6.5 6.5 0 1 1 13 0 6.5 6.5 0 0 1-13 0z"/>
                  <path fill="currentColor" d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
                </svg>
                <p className="text-sky-400 font-mono text-[0.8125rem]/6 font-medium tracking-widest uppercase">
                  Search Result
                </p>
              </div>
              
              {/* Page Number */}
              <div className="flex items-center gap-x-4 text-white">
                <p className="text-5xl font-light">
                  Page <span className="font-medium text-sky-200">{match.page}</span>
                </p>
                <div className="px-3 py-1 rounded-full bg-white/10 text-xs font-medium text-gray-300 border border-white/5">
                  Match #{matchNumber}
                </div>
              </div>

              {/* Match Text */}
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-sky-500 rounded-full"></div>
                <p className="pl-4 text-lg leading-7 text-gray-300 font-light italic">
                  "{match.text}"
                </p>
              </div>

              {match.fuzzyMatch && (
                <div className="flex items-center gap-2 text-sm font-medium text-purple-400 bg-purple-400/10 px-3 py-2 rounded-md w-fit border border-purple-400/20">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M10 1a6 6 0 00-3.815 10.631C7.237 12.5 8 13.443 8 14.456v.644a.75.75 0 00.572.729 6.001 6.001 0 002.856 0A.75.75 0 0012 15.1v-.644c0-1.013.762-1.957 1.815-2.825A6 6 0 0010 1zM8.863 17.414a.75.75 0 00-.226 1.483 9.001 9.001 0 002.726 0 .75.75 0 00-.226-1.483 7.501 7.501 0 01-2.274 0z" />
                  </svg>
                  Approximate Match
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};
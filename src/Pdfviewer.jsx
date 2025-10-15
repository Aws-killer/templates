import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Img,
  staticFile,
  spring,
  Audio,
} from "remotion";

/* -------------------------------------------------------------------------- */
/* 🧩 UTILITIES */
/* -------------------------------------------------------------------------- */

const fontCss = `
@font-face {
  font-family: 'Excalifont';
  src: url('https://excalidraw.nyc3.cdn.digitaloceanspaces.com/oss/fonts/Excalifont/Excalifont-Regular-a88b72a24fb54c9f94e3b5fdaa7481c9.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
`;

const timeToFrame = (seconds, fps) => Math.floor(seconds * fps);

/* -------------------------------------------------------------------------- */
/* 🧱 COMPONENT: PaperTitleCard */
/* -------------------------------------------------------------------------- */

const PaperTitleCard = ({ title, visible, startFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (!visible) return null;

  const fadeIn = spring({ frame: frame - startFrame, fps, config: { damping: 100, stiffness: 200 } });
  const fadeOut = spring({ frame: frame - startFrame - 60, fps, config: { damping: 100, stiffness: 200 } });
  const opacity = Math.max(0, fadeIn - fadeOut);

  return (
    <div
      className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
      style={{ opacity }}
    >
      <div className="bg-gradient-to-br from-sky-900/95 to-indigo-900/95 backdrop-blur-lg px-16 py-12 rounded-2xl shadow-2xl border border-white/10 max-w-3xl">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-2 h-12 bg-sky-400 rounded-full" />
          <p className="text-sky-300 font-mono text-sm tracking-wider uppercase">Research Paper</p>
        </div>
        <h1 className="text-4xl font-light text-white leading-tight">{title}</h1>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 🧱 COMPONENT: MarkerHighlight */
/* -------------------------------------------------------------------------- */

const MarkerHighlight = ({
  bbox,
  pageHeight,
  startFrame,
  scale = 2.5,
  highlightDuration = 34,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (frame < startFrame) return null;

  const drawProgress = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 100, stiffness: 150 },
    durationInFrames: highlightDuration,
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

/* -------------------------------------------------------------------------- */
/* 🧱 COMPONENT: MatchModal */
/* -------------------------------------------------------------------------- */

const MatchModal = ({ match, matchNumber, startFrame, duration = 120 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const exitFrame = startFrame + duration;

  const enterProgress = spring({ frame: frame - startFrame, fps, config: { stiffness: 120, damping: 14 } });
  const exitProgress = spring({ frame: frame - exitFrame, fps, config: { stiffness: 120, damping: 14 } });
  const modalOpacity = Math.max(0, Math.min(1, enterProgress - exitProgress));
  const modalTranslateX = interpolate(enterProgress, [0, 1], [50, 0]) + interpolate(exitProgress, [0, 1], [0, 50]);

  if (frame < startFrame || modalOpacity < 0.01) return null;

  return (
    <div
      className="rounded-2xl bg-gray-900/90 backdrop-blur-md p-10 outline outline-1 outline-white/10 w-full grid grid-cols-1 gap-y-8 shadow-[0_0_50px_-12px_rgb(0,0,0,0.5)]"
      style={{
        opacity: modalOpacity,
        transform: `translateX(${modalTranslateX}px)`,
      }}
    >
      <div className="flex gap-2 items-center">
        <svg aria-hidden="true" viewBox="0 0 16 16" className="h-6 w-4 shrink-0 text-gray-500">
          <path
            fill="currentColor"
            d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zM1.5 8a6.5 6.5 0 1 1 13 0 6.5 6.5 0 0 1-13 0z"
          />
          <path
            fill="currentColor"
            d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"
          />
        </svg>
        <p className="text-sky-400 font-mono text-[0.8125rem]/6 font-medium tracking-widest uppercase">
          Search Result
        </p>
      </div>

      <div className="flex items-center gap-x-4 text-white">
        <p className="text-5xl font-light">
          Page <span className="font-medium text-sky-200">{match.page}</span>
        </p>
        <div className="px-3 py-1 rounded-full bg-white/10 text-xs font-medium text-gray-300 border border-white/5">
          Match #{matchNumber}
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-sky-500 rounded-full" />
        <p className="pl-4 text-lg leading-7 text-gray-300 font-light italic">"{match.text}"</p>
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
  );
};

/* -------------------------------------------------------------------------- */
/* 🎬 MAIN SCENE: AudioSyncedScene */
/* -------------------------------------------------------------------------- */

export const AudioSyncedScene = ({
  match,
  matchNumber,
  pageWidth = 612,
  pageHeight = 792,
  pageImageFile,
  audioFile,
  paperTitle,
  quoteStartTime,
  zoomTo = 1.5,
}) => {
  const frame = useCurrentFrame();
  const { fps, width: videoWidth, height: videoHeight } = useVideoConfig();
  const scale = 0.85;

  const pdfContainerWidth = pageWidth * scale;
  const pdfContainerHeight = pageHeight * scale;

  const bboxCenterX = (match.boundingBox.x + match.boundingBox.width / 2) * scale;
  const bboxCenterY = (pageHeight - match.boundingBox.y - match.boundingBox.height / 2) * scale;

  const HIGHLIGHT_ANIMATION_DURATION = 34;
  const quoteFrame = timeToFrame(quoteStartTime, fps);
  const highlightStartFrame = quoteFrame - HIGHLIGHT_ANIMATION_DURATION;
  const modalStartFrame = quoteFrame + 15;
  const titleVisible = frame < highlightStartFrame - 10;

  const pdfSlideUp = interpolate(spring({ frame: frame - 5, fps, config: { damping: 100 } }), [0, 1], [videoHeight, 0]);
  const pdfOpacity = interpolate(frame, [5, 20], [0, 1], { extrapolateRight: "clamp" });
  const zoomLevel = interpolate(spring({ frame: frame - 20, fps, config: { damping: 100 } }), [0, 1], [1, zoomTo]);

  return (
    <AbsoluteFill className="bg-gray-950">
      <style>{fontCss}</style>
      {audioFile && <Audio src={staticFile(audioFile)} />}

      {titleVisible && <PaperTitleCard title={paperTitle} visible startFrame={0} />}

      <div className="grid grid-cols-5 gap-4 w-full h-full">
        {/* LEFT PANEL: PDF */}
        <div className="col-span-3 relative w-full h-full">
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
              <Img src={staticFile(pageImageFile)} className="w-full h-full object-cover" alt="PDF page" />
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
                    startFrame={highlightStartFrame}
                    highlightDuration={HIGHLIGHT_ANIMATION_DURATION}
                  />
                </svg>
              </AbsoluteFill>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: MODAL */}
        <div className="col-span-2 flex items-center justify-center p-8 relative">
          <MatchModal match={match} matchNumber={matchNumber} startFrame={modalStartFrame} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

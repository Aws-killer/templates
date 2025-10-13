import {
  AbsoluteFill,
  interpolate,
  Easing,
  useCurrentFrame,
  useVideoConfig,
  Img,
  staticFile,
  spring,
} from "remotion";

// Unchanged Component: MarkerHighlight
const MarkerHighlight = ({ bbox, scale, pageHeight }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const drawProgress = spring({
    frame: frame - 20, // Delayed to start after the zoom settles
    fps,
    config: {
      damping: 100,
      stiffness: 150,
    },
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

// Unchanged Component: MatchBadge
const MatchBadge = ({ bbox, scale, matchNumber, pageHeight }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const slideDown = interpolate(frame, [0, fps * 0.4], [-30, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateRight: "clamp",
  });
  const y = pageHeight - bbox.y - bbox.height;

  return (
    <div
      style={{
        position: "absolute",
        left: bbox.x * scale + 5,
        top: y * scale + 5 + slideDown,
        backgroundColor: "rgb(220, 38, 38)",
        color: "white",
        padding: "4px 8px",
        borderRadius: "4px",
        fontSize: "14px",
        fontWeight: "bold",
        zIndex: 10,
      }}
    >
      #{matchNumber}
    </div>
  );
};

// Unchanged Component: MatchInfo
const MatchInfo = ({ match, matchNumber }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeIn = interpolate(frame, [fps * 0.5, fps * 1.5], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: "20px",
        left: "20px",
        right: "20px",
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        color: "white",
        padding: "16px",
        borderRadius: "8px",
        fontSize: "14px",
        fontFamily: "system-ui, sans-serif",
        opacity: fadeIn,
        zIndex: 20,
      }}
    >
      <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
        Match #{matchNumber} - Page {match.page}
      </div>
      <div style={{ marginBottom: "8px", fontSize: "12px", opacity: 0.9 }}>
        {match.text.substring(0, 150)}
        {match.text.length > 150 ? "..." : ""}
      </div>
      {match.fuzzyMatch && (
        <div style={{ fontSize: "11px", color: "rgb(168, 85, 247)" }}>
          [Fuzzy Match]
        </div>
      )}
    </div>
  );
};

// Main Scene Component (UPDATED WITH ZOOM)
export const SearchResultScene = ({
  match,
  matchNumber,
  pageWidth = 612,
  pageHeight = 792,
  pageImageFile = "page_2.png",
  zoomTo = 1.5,
}) => {
  const frame = useCurrentFrame();
  const { fps, width: videoWidth, height: videoHeight } = useVideoConfig();
  const scale = 0.7;

  // Panel dimensions (50-50 split)
  const panelWidth = videoWidth / 2;
  const leftPanelCenterX = panelWidth / 2;
  const leftPanelCenterY = videoHeight / 2;

  // PDF container dimensions
  const pdfContainerWidth = pageWidth * scale;
  const pdfContainerHeight = pageHeight * scale;

  // Bounding box center for zoom
  const bboxCenterX =
    (match.boundingBox.x + match.boundingBox.width / 2) * scale;
  const bboxCenterY =
    (pageHeight - match.boundingBox.y - match.boundingBox.height / 2) * scale;

  // --- SMOOTHER ANIMATION LOGIC ---

  // 1. Slide up animation using a spring for a natural bounce
  const slideUpProgress = spring({
    frame,
    fps,
    config: {
      damping: 15,
      stiffness: 100,
      mass: 0.8,
    },
  });

  const slideUp = interpolate(
    slideUpProgress,
    [0, 1],
    [videoHeight + 100, leftPanelCenterY - pdfContainerHeight / 2]
  );

  // 2. Zoom animation that starts slightly after the slide-up begins
  const zoomProgress = spring({
    frame: frame - 20, // Start the zoom animation after 20 frames
    fps,
    config: {
      damping: 15,
      stiffness: 120,
    },
  });

  const zoomLevel = interpolate(zoomProgress, [0, 1], [1, zoomTo]);

  // 3. Text fade-in animation, timed to start as the zoom begins
  const textFadeIn = interpolate(frame, [25, 45], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#1e293b" }}>
      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          color: "white",
          fontSize: "28px",
          fontWeight: "bold",
          fontFamily: "system-ui, sans-serif",
          zIndex: 5,
        }}
      >
        PDF Search Results
      </div>

      {/* Left Panel - PDF */}
      <div
        style={{
          position: "absolute",
          left: 0,
          width: panelWidth,
          height: videoHeight,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: slideUp,
            left: leftPanelCenterX - pdfContainerWidth / 2,
            transformOrigin: `${bboxCenterX}px ${bboxCenterY}px`,
            transform: `scale(${zoomLevel})`,
            width: pdfContainerWidth,
            height: pdfContainerHeight,
            backgroundColor: "white",
            borderRadius: "8px",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
            overflow: "hidden",
          }}
        >
          <Img
            src={staticFile(pageImageFile)}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
            alt="PDF page"
          />

          <AbsoluteFill style={{ mixBlendMode: "multiply" }}>
            <svg
              width="100%"
              height="100%"
              viewBox={`0 0 ${pageWidth * scale} ${pageHeight * scale}`}
            >
              <defs>
                <filter id="realisticHighlightEffect">
                  <feTurbulence
                    type="fractalNoise"
                    baseFrequency="0.04"
                    numOctaves="5"
                  />
                  <feDisplacementMap in="SourceGraphic" scale="5" />
                  <feDropShadow
                    dx="2"
                    dy="3"
                    stdDeviation="2"
                    floodColor="rgba(0,0,0,0.4)"
                  />
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

      {/* Right Panel - Text */}
      <div
        style={{
          position: "absolute",
          right: 0,
          width: panelWidth,
          height: videoHeight,
          padding: "40px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          color: "white",
          opacity: textFadeIn,
        }}
      >
        <h2 style={{ fontSize: "24px", marginBottom: "20px" }}>
          Match #{matchNumber} - Page {match.page}
        </h2>

        <div
          style={{
            fontSize: "18px",
            lineHeight: "1.6",
            marginBottom: "20px",
            backgroundColor: "rgba(255,255,255,0.1)",
            padding: "20px",
            borderRadius: "8px",
          }}
        >
          {match.text}
        </div>

        {match.fuzzyMatch && (
          <div
            style={{
              fontSize: "14px",
              color: "rgb(168, 85, 247)",
              fontStyle: "italic",
            }}
          >
            [Fuzzy Match]
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
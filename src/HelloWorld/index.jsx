import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

// Load fonts
const { fontFamily: spaceGrotesk } = loadFont();
const { fontFamily: inter } = loadInter();

const fontStyle = {
  fontFamily: `${spaceGrotesk}, ${inter}, -apple-system, BlinkMacSystemFont, sans-serif`,
};

export const PodcastIntro = ({ episodeNumber, title, date, duration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo slides up with aggressive snap
  const logoY = interpolate(frame, [0, 20], [100, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(2)),
  });

  const logoOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Shadow snaps into place with logo
  const shadowOffset = interpolate(frame, [0, 20], [0, 8], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.5)),
  });

  // Episode label punches in from below
  const episodeLabelY = interpolate(frame, [15, 30], [50, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(2)),
  });

  const episodeLabelOpacity = interpolate(frame, [15, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Episode label shadow grows aggressively
  const labelShadowOffset = interpolate(frame, [15, 30], [0, 4], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.ease),
  });

  // Title lines slide up with stagger
  const titleLines = title.split("\n");

  // Main title container
  const titleContainerY = interpolate(frame, [25, 45], [80, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.8)),
  });

  const titleOpacity = interpolate(frame, [25, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Text shadow appears with snap
  const textShadowOffset = interpolate(frame, [25, 45], [0, 5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.ease),
  });

  // Badges slam up from bottom with heavy impact
  const badge1Y = interpolate(frame, [50, 65], [100, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(2.5)),
  });

  const badge2Y = interpolate(frame, [55, 70], [100, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(2.5)),
  });

  const badge1Opacity = interpolate(frame, [50, 65], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const badge2Opacity = interpolate(frame, [55, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Badge shadows snap into place
  const badge1ShadowOffset = interpolate(frame, [50, 65], [0, 5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.ease),
  });

  const badge2ShadowOffset = interpolate(frame, [55, 70], [0, 5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.ease),
  });

  // Accent line slides in from left, hard and fast
  const accentLineWidth = interpolate(frame, [10, 25], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.ease),
  });

  return (
    <AbsoluteFill
      className="bg-pink-600 flex flex-col items-center justify-center p-20 overflow-hidden"
      style={fontStyle}
    >
      {/* Decorative accent line that slides in */}
      <div
        className="absolute top-20 left-20 h-2 bg-gray-900"
        style={{
          width: `${accentLineWidth}px`,
          boxShadow: `3px 3px 0px rgba(26, 35, 50, 0.8)`,
        }}
      />

      {/* Logo slams up */}
      <div
        className="w-32 h-32 bg-white border-[6px] border-gray-900 flex items-center justify-center text-6xl mb-10 relative z-10"
        style={{
          transform: `translateY(${logoY}px)`,
          opacity: logoOpacity,
          boxShadow: `${shadowOffset}px ${shadowOffset}px 0px #1a2332`,
        }}
      >
        🎙️
      </div>

      {/* Content container */}
      <div className="text-white text-center max-w-4xl relative z-10">
        {/* Episode label punches up */}
        <div
          className="text-base font-bold uppercase tracking-[3px] mb-5 bg-gray-900 inline-block px-6 py-2.5 border-[3px] border-gray-900"
          style={{
            transform: `translateY(${episodeLabelY}px)`,
            opacity: episodeLabelOpacity,
            boxShadow: `${labelShadowOffset}px ${labelShadowOffset}px 0px rgba(0,0,0,0.3)`,
          }}
        >
          Episode {episodeNumber}
        </div>

        {/* Title slides up as single unit */}
        <div
          style={{
            transform: `translateY(${titleContainerY}px)`,
            opacity: titleOpacity,
          }}
        >
          <h1
            className="text-7xl font-bold leading-tight mb-8 uppercase"
            style={{
              textShadow: `${textShadowOffset}px ${textShadowOffset}px 0px rgba(26, 35, 50, 0.4)`,
            }}
          >
            {titleLines.map((line, idx) => (
              <div key={idx}>{line}</div>
            ))}
          </h1>
        </div>

        {/* Badges slam up with stagger */}
        <div className="flex gap-5 justify-center mt-10">
          <div
            className="text-lg font-bold bg-white text-gray-900 px-7 py-3 border-[4px] border-gray-900 uppercase"
            style={{
              transform: `translateY(${badge1Y}px)`,
              opacity: badge1Opacity,
              boxShadow: `${badge1ShadowOffset}px ${badge1ShadowOffset}px 0px #1a2332`,
            }}
          >
            {date}
          </div>
          <div
            className="text-lg font-bold bg-white text-gray-900 px-7 py-3 border-[4px] border-gray-900 uppercase"
            style={{
              transform: `translateY(${badge2Y}px)`,
              opacity: badge2Opacity,
              boxShadow: `${badge2ShadowOffset}px ${badge2ShadowOffset}px 0px #1a2332`,
            }}
          >
            {duration}
          </div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div
        className="absolute bottom-20 right-20 h-2 bg-gray-900"
        style={{
          width: `${interpolate(frame, [60, 75], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px`,
          boxShadow: `3px 3px 0px rgba(26, 35, 50, 0.8)`,
        }}
      />
    </AbsoluteFill>
  );
};

// Slide 2: Headlines Grid
export const HeadlinesGrid = ({ headlines }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Header accent line slides in hard from left
  const accentLineWidth = interpolate(frame, [0, 15], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.ease),
  });

  // Header title slams up
  const headerY = interpolate(frame, [5, 20], [60, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(2)),
  });

  const headerOpacity = interpolate(frame, [5, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Subtitle appears after header
  const subtitleOpacity = interpolate(frame, [15, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const subtitleY = interpolate(frame, [15, 25], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.5)),
  });

  return (
    <AbsoluteFill className="bg-gray-100 p-16" style={fontStyle}>
      <div className="mb-10">
        {/* Accent line */}
        <div
          className="h-1.5 bg-pink-600 mb-5 shadow-[3px_3px_0px_#1a2332]"
          style={{ width: `${accentLineWidth}px` }}
        ></div>

        {/* Header */}
        <div
          style={{
            transform: `translateY(${headerY}px)`,
            opacity: headerOpacity,
          }}
        >
          <h2 className="text-6xl font-bold text-gray-900 uppercase mb-3">
            Today's Headlines
          </h2>
        </div>

        {/* Subtitle */}
        <div
          className="text-lg font-semibold text-gray-600 uppercase"
          style={{
            transform: `translateY(${subtitleY}px)`,
            opacity: subtitleOpacity,
          }}
        >
          Top stories this week
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 flex-1">
        {headlines.map((headline, idx) => {
          // Each card slams up from bottom with stagger
          const cardDelay = 25 + idx * 8;

          const cardY = interpolate(
            frame,
            [cardDelay, cardDelay + 20],
            [100, 0],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.back(2.2)),
            },
          );

          const cardOpacity = interpolate(
            frame,
            [cardDelay, cardDelay + 20],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          );

          // Shadow grows with card
          const shadowOffset = interpolate(
            frame,
            [cardDelay, cardDelay + 20],
            [0, 8],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.ease),
            },
          );

          // Number badge pops in after card
          const badgeScale = interpolate(
            frame,
            [cardDelay + 15, cardDelay + 25],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.back(2.5)),
            },
          );

          const badgeOpacity = interpolate(
            frame,
            [cardDelay + 15, cardDelay + 25],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          );

          // Badge shadow snaps
          const badgeShadowOffset = interpolate(
            frame,
            [cardDelay + 15, cardDelay + 25],
            [0, 4],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          );

          // Content reveals with slight delay
          const contentOpacity = interpolate(
            frame,
            [cardDelay + 10, cardDelay + 25],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          );

          return (
            <div
              key={idx}
              className="bg-white border-[5px] border-gray-900 p-8 flex flex-col transition-all relative"
              style={{
                transform: `translateY(${cardY}px)`,
                opacity: cardOpacity,
                boxShadow: `${shadowOffset}px ${shadowOffset}px 0px #1a2332`,
              }}
            >
              {/* Number badge */}
              <div
                className="absolute -top-4 left-5 bg-pink-600 text-white w-12 h-12 border-[5px] border-gray-900 flex items-center justify-center text-2xl font-bold"
                style={{
                  transform: `scale(${badgeScale})`,
                  opacity: badgeOpacity,
                  boxShadow: `${badgeShadowOffset}px ${badgeShadowOffset}px 0px #1a2332`,
                }}
              >
                {String(idx + 1).padStart(2, "0")}
              </div>

              {/* Content */}
              <div style={{ opacity: contentOpacity }}>
                <div className="text-xs font-bold uppercase tracking-wider text-pink-600 mb-3 mt-5">
                  {headline.category}
                </div>
                <div className="text-2xl font-bold leading-tight text-gray-900 mb-3 uppercase">
                  {headline.title}
                </div>
                <div className="text-base font-medium leading-relaxed text-gray-600 flex-grow">
                  {headline.preview}
                </div>
                <div className="mt-5 pt-4 border-t-[3px] border-gray-100 text-sm font-bold text-gray-900 uppercase">
                  {headline.meta}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// Slide 3: Featured Story
export const FeaturedStory = ({
  category,
  title,
  description,
  imageEmoji,
  meta,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Image section slides up from bottom
  const imageY = interpolate(frame, [0, 25], [100, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(2)),
  });

  const imageOpacity = interpolate(frame, [0, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Emoji scales in after container
  const emojiScale = interpolate(frame, [20, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(2.5)),
  });

  // Featured tag pops in
  const tagScale = interpolate(frame, [25, 38], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(3)),
  });

  const tagShadowOffset = interpolate(frame, [25, 38], [0, 5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Content section slides up from bottom
  const contentY = interpolate(frame, [10, 35], [100, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(2)),
  });

  const contentOpacity = interpolate(frame, [10, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Accent line slides in
  const accentWidth = interpolate(frame, [30, 42], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.ease),
  });

  // Category punches in
  const categoryY = interpolate(frame, [38, 48], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(2)),
  });

  const categoryOpacity = interpolate(frame, [38, 48], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Title slams up
  const titleY = interpolate(frame, [43, 58], [50, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(2.2)),
  });

  const titleOpacity = interpolate(frame, [43, 58], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Description fades in
  const descriptionOpacity = interpolate(frame, [55, 68], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const descriptionY = interpolate(frame, [55, 68], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.ease),
  });

  return (
    <AbsoluteFill className="bg-white flex" style={fontStyle}>
      {/* Image Section */}
      <div
        className="w-[55%] bg-gradient-to-br from-gray-100 to-gray-200 border-r-[5px] border-gray-900 relative flex items-center justify-center overflow-hidden"
        style={{
          transform: `translateY(${imageY}px)`,
          opacity: imageOpacity,
        }}
      >
        {/* Image placeholder with fixed dimensions */}
        <div className="relative">
          <div
            className="w-[500px] h-[350px] bg-white border-[6px] border-gray-900 flex items-center justify-center text-[100px] shadow-[8px_8px_0px_#1a2332]"
            style={{ transform: `scale(${emojiScale})` }}
          >
            {imageEmoji}
          </div>

          {/* Featured tag positioned on image */}
          <div
            className="absolute top-6 left-6 bg-pink-600 text-white px-5 py-2.5 text-sm font-bold uppercase border-[4px] border-gray-900 z-10"
            style={{
              transform: `scale(${tagScale})`,
              boxShadow: `${tagShadowOffset}px ${tagShadowOffset}px 0px #1a2332`,
            }}
          >
            Featured Story
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div
        className="w-[45%] bg-gray-100 p-16 flex flex-col"
        style={{
          transform: `translateY(${contentY}px)`,
          opacity: contentOpacity,
        }}
      >
        {/* Accent line */}
        <div
          className="h-1.5 bg-pink-600 mb-6 shadow-[3px_3px_0px_#1a2332]"
          style={{ width: `${accentWidth}px` }}
        ></div>

        {/* Category */}
        <div
          className="text-sm font-bold uppercase tracking-wider text-pink-600 mb-4"
          style={{
            transform: `translateY(${categoryY}px)`,
            opacity: categoryOpacity,
          }}
        >
          {category}
        </div>

        {/* Title */}
        <h2
          className="text-5xl font-bold leading-tight text-gray-900 mb-6 uppercase"
          style={{
            transform: `translateY(${titleY}px)`,
            opacity: titleOpacity,
          }}
        >
          {title}
        </h2>

        {/* Description */}
        <p
          className="text-lg font-medium leading-relaxed text-gray-800 mb-6 flex-grow"
          style={{
            transform: `translateY(${descriptionY}px)`,
            opacity: descriptionOpacity,
          }}
        >
          {description}
        </p>

        {/* Meta badges */}
        <div className="flex gap-4 flex-wrap">
          {meta.map((item, idx) => {
            const badgeDelay = 68 + idx * 5;

            const badgeScale = interpolate(
              frame,
              [badgeDelay, badgeDelay + 12],
              [0, 1],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.out(Easing.back(2.5)),
              },
            );

            const badgeShadowOffset = interpolate(
              frame,
              [badgeDelay, badgeDelay + 12],
              [0, 3],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              },
            );

            return (
              <div
                key={idx}
                className="bg-gray-900 text-white px-4 py-2 text-sm font-bold uppercase border-[3px] border-gray-900"
                style={{
                  transform: `scale(${badgeScale})`,
                  boxShadow: `${badgeShadowOffset}px ${badgeShadowOffset}px 0px rgba(0,0,0,0.2)`,
                }}
              >
                {item}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Slide 5: Key Insights
export const KeyInsights = ({ title, description, keyPoints, stats }) => {
  return (
    <AbsoluteFill className="bg-gray-900 p-16" style={fontStyle}>
      <div className="h-1.5 bg-pink-600 mb-8 shadow-[3px_3px_0px_#1a2332] w-24"></div>
      <h2 className="text-6xl font-bold text-white uppercase mb-10">
        Key Insights
      </h2>
      <div className="grid grid-cols-[2fr_1fr] gap-6 flex-1">
        <div className="bg-white border-[5px] border-gray-900 p-10 shadow-[8px_8px_0px_rgba(0,0,0,0.3)] flex flex-col">
          <div className="text-4xl font-bold text-gray-900 mb-6 uppercase leading-tight">
            {title}
          </div>
          <div className="text-lg font-medium leading-relaxed text-gray-800 mb-6">
            {description}
          </div>
          <div className="flex flex-col gap-4 mt-auto">
            {keyPoints.map((point, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 text-base font-semibold text-gray-900"
              >
                <div className="w-10 h-10 bg-pink-600 border-[4px] border-gray-900 flex items-center justify-center font-bold text-white flex-shrink-0 shadow-[3px_3px_0px_#1a2332]">
                  ✓
                </div>
                <div>{point}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-6">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="bg-pink-600 border-[5px] border-gray-900 p-7 text-white shadow-[8px_8px_0px_rgba(0,0,0,0.3)]"
            >
              <div className="text-xs font-bold uppercase tracking-wider mb-3 opacity-90">
                {stat.label}
              </div>
              <div className="text-5xl font-bold leading-none mb-2">
                {stat.number}
              </div>
              <div className="text-sm font-medium leading-tight">
                {stat.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Slide 6: Quote
export const QuoteSlide = ({ quote, author, role }) => {
  return (
    <AbsoluteFill
      className="bg-gray-100 flex items-center justify-center p-20"
      style={fontStyle}
    >
      <div className="max-w-4xl text-center">
        <div className="text-[120px] font-bold text-pink-600 leading-none mb-8">
          "
        </div>
        <div className="text-5xl font-bold leading-tight text-gray-900 mb-10 uppercase">
          {quote}
        </div>
        <div className="text-xl font-bold text-white bg-gray-900 inline-block px-7 py-3 border-[4px] border-gray-900 shadow-[5px_5px_0px_rgba(0,0,0,0.2)] uppercase">
          {author} - {role}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Slide 7: Comparison
export const ComparisonSlide = ({ opportunities, challenges }) => {
  return (
    <AbsoluteFill className="bg-gray-100 p-16" style={fontStyle}>
      <div className="mb-10">
        <div className="h-1.5 bg-pink-600 mb-5 shadow-[3px_3px_0px_#1a2332] w-24"></div>
        <h2 className="text-6xl font-bold text-gray-900 uppercase">
          The Full Picture
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-6 flex-1">
        <div className="bg-pink-600 text-white border-[5px] border-gray-900 p-10 shadow-[8px_8px_0px_#1a2332] flex flex-col">
          <div className="flex items-center gap-4 mb-6 pb-5 border-b-[4px] border-white border-opacity-30">
            <div className="w-16 h-16 border-[5px] border-gray-900 bg-white flex items-center justify-center text-3xl shadow-[4px_4px_0px_#1a2332]">
              ✓
            </div>
            <div className="text-4xl font-bold uppercase">Opportunities</div>
          </div>
          <div className="flex flex-col gap-4">
            {opportunities.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 text-base font-semibold leading-relaxed"
              >
                <div className="w-6 h-6 bg-white border-[3px] border-gray-900 flex-shrink-0 mt-0.5"></div>
                <div>{item}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white border-[5px] border-gray-900 p-10 shadow-[8px_8px_0px_#1a2332] flex flex-col">
          <div className="flex items-center gap-4 mb-6 pb-5 border-b-[4px] border-gray-900">
            <div className="w-16 h-16 border-[5px] border-gray-900 bg-gray-100 flex items-center justify-center text-3xl shadow-[4px_4px_0px_#1a2332]">
              ⚠
            </div>
            <div className="text-4xl font-bold uppercase text-gray-900">
              Challenges
            </div>
          </div>
          <div className="flex flex-col gap-4">
            {challenges.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 text-base font-semibold leading-relaxed text-gray-900"
              >
                <div className="w-6 h-6 bg-pink-600 border-[3px] border-gray-900 flex-shrink-0 mt-0.5"></div>
                <div>{item}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Slide 4: Deep Dive
export const DeepDive = ({ mainStory, sideStories }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Header accent line slides in
  const accentWidth = interpolate(frame, [0, 15], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.ease),
  });

  // Header slams up
  const headerY = interpolate(frame, [5, 20], [60, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(2)),
  });

  const headerOpacity = interpolate(frame, [5, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Main story (large card) slams up
  const mainCardY = interpolate(frame, [20, 40], [120, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(2.2)),
  });

  const mainCardOpacity = interpolate(frame, [20, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const mainCardShadow = interpolate(frame, [20, 40], [0, 8], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Main story emoji pops in
  const mainEmojiScale = interpolate(frame, [35, 48], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(2.5)),
  });

  // Main story content fades in
  const mainContentOpacity = interpolate(frame, [45, 58], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill className="bg-gray-100 p-16" style={fontStyle}>
      <div className="mb-10">
        <div
          className="h-1.5 bg-pink-600 mb-5 shadow-[3px_3px_0px_#1a2332]"
          style={{ width: `${accentWidth}px` }}
        ></div>
        <h2
          className="text-6xl font-bold text-gray-900 uppercase"
          style={{
            transform: `translateY(${headerY}px)`,
            opacity: headerOpacity,
          }}
        >
          Deep Dive
        </h2>
      </div>

      <div className="grid grid-cols-2 grid-rows-2 gap-6 flex-1">
        {/* Main Story - Large Card */}
        <div
          className="row-span-2 bg-white border-[5px] border-gray-900 overflow-hidden flex flex-col"
          style={{
            transform: `translateY(${mainCardY}px)`,
            opacity: mainCardOpacity,
            boxShadow: `${mainCardShadow}px ${mainCardShadow}px 0px #1a2332`,
          }}
        >
          <div className="h-[60%] bg-gradient-to-br from-gray-100 to-gray-200 border-b-[5px] border-gray-900 flex items-center justify-center text-[64px]">
            <span
              style={{
                transform: `scale(${mainEmojiScale})`,
                display: "inline-block",
              }}
            >
              {mainStory.emoji}
            </span>
          </div>
          <div
            className="p-8 flex-grow flex flex-col"
            style={{ opacity: mainContentOpacity }}
          >
            <div className="text-xs font-bold uppercase tracking-wider text-pink-600 mb-3">
              {mainStory.tag}
            </div>
            <div className="text-3xl font-bold leading-tight text-gray-900 mb-3 uppercase">
              {mainStory.title}
            </div>
            <div className="text-base font-medium leading-relaxed text-gray-600">
              {mainStory.text}
            </div>
          </div>
        </div>

        {/* Side Stories */}
        {sideStories.map((story, idx) => {
          const cardDelay = 35 + idx * 12;

          const cardY = interpolate(
            frame,
            [cardDelay, cardDelay + 20],
            [100, 0],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.back(2.2)),
            },
          );

          const cardOpacity = interpolate(
            frame,
            [cardDelay, cardDelay + 20],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          );

          const cardShadow = interpolate(
            frame,
            [cardDelay, cardDelay + 20],
            [0, 8],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          );

          const emojiScale = interpolate(
            frame,
            [cardDelay + 12, cardDelay + 24],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.back(2.5)),
            },
          );

          const contentOpacity = interpolate(
            frame,
            [cardDelay + 15, cardDelay + 28],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          );

          return (
            <div
              key={idx}
              className="bg-white border-[5px] border-gray-900 overflow-hidden flex flex-col"
              style={{
                transform: `translateY(${cardY}px)`,
                opacity: cardOpacity,
                boxShadow: `${cardShadow}px ${cardShadow}px 0px #1a2332`,
              }}
            >
              <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 border-b-[5px] border-gray-900 flex items-center justify-center text-[64px]">
                <span
                  style={{
                    transform: `scale(${emojiScale})`,
                    display: "inline-block",
                  }}
                >
                  {story.emoji}
                </span>
              </div>
              <div
                className="p-6 flex-grow flex flex-col"
                style={{ opacity: contentOpacity }}
              >
                <div className="text-xs font-bold uppercase tracking-wider text-pink-600 mb-3">
                  {story.tag}
                </div>
                <div className="text-xl font-bold leading-tight text-gray-900 mb-3 uppercase">
                  {story.title}
                </div>
                <div className="text-sm font-medium leading-relaxed text-gray-600">
                  {story.text}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
// Slide 9: Expert Panel
export const ExpertPanel = ({ experts }) => {
  return (
    <AbsoluteFill className="bg-gray-100 p-16" style={fontStyle}>
      <div className="mb-10">
        <div className="h-1.5 bg-pink-600 mb-5 shadow-[3px_3px_0px_#1a2332] w-24"></div>
        <h2 className="text-6xl font-bold text-gray-900 uppercase mb-3">
          Expert Perspectives
        </h2>
        <div className="text-lg font-semibold text-gray-600 uppercase">
          What industry leaders are saying
        </div>
      </div>
      <div className="grid grid-cols-3 gap-6 mt-10">
        {experts.map((expert, idx) => (
          <div
            key={idx}
            className="bg-white border-[5px] border-gray-900 p-8 shadow-[6px_6px_0px_#1a2332] flex flex-col items-center text-center"
          >
            <div className="w-24 h-24 border-[5px] border-gray-900 bg-gradient-to-br from-gray-100 to-gray-200 mb-5 shadow-[4px_4px_0px_#1a2332] flex items-center justify-center text-5xl">
              {expert.avatar}
            </div>
            <div className="mb-5">
              <div className="text-2xl font-bold text-gray-900 mb-1.5 uppercase">
                {expert.name}
              </div>
              <div className="text-sm font-semibold text-pink-600 uppercase tracking-wide">
                {expert.title}
              </div>
            </div>
            <div className="text-base font-medium leading-relaxed text-gray-600 italic">
              {expert.quote}
            </div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// Slide 10: Outro
export const OutroSlide = ({ nextEpisode }) => {
  return (
    <AbsoluteFill
      className="bg-gray-900 flex items-center justify-center p-20"
      style={fontStyle}
    >
      <div className="text-center max-w-3xl">
        <div className="text-[100px] mb-8">🎙️</div>
        <h2 className="text-6xl font-bold text-white uppercase mb-6">
          Thanks For Listening!
        </h2>
        <div className="text-xl font-medium text-white leading-relaxed mb-10">
          Join us next week as we explore the rise of quantum computing and its
          implications for cybersecurity.
        </div>
        <div className="flex gap-4 justify-center flex-wrap mb-12">
          <div className="bg-white text-gray-900 px-6 py-3 text-base font-bold uppercase border-[4px] border-gray-900 shadow-[4px_4px_0px_rgba(0,0,0,0.3)]">
            @TechPulseWeekly
          </div>
          <div className="bg-white text-gray-900 px-6 py-3 text-base font-bold uppercase border-[4px] border-gray-900 shadow-[4px_4px_0px_rgba(0,0,0,0.3)]">
            Subscribe on Spotify
          </div>
          <div className="bg-white text-gray-900 px-6 py-3 text-base font-bold uppercase border-[4px] border-gray-900 shadow-[4px_4px_0px_rgba(0,0,0,0.3)]">
            Apple Podcasts
          </div>
        </div>
        <div className="bg-pink-600 border-[5px] border-white p-8 shadow-[8px_8px_0px_rgba(0,0,0,0.3)]">
          <div className="text-sm font-bold text-white uppercase tracking-wider mb-3 opacity-90">
            Next Episode
          </div>
          <div className="text-3xl font-bold text-white uppercase mb-3">
            {nextEpisode.title}
          </div>
          <div className="text-lg font-semibold text-white opacity-90">
            {nextEpisode.date}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Demo Usage
export default function App() {
  return (
    <div className="space-y-4">
      <PodcastIntro
        episodeNumber="127"
        title="Tech Pulse Weekly"
        date="15 Jan 2025"
        duration="45 Min"
      />
    </div>
  );
}

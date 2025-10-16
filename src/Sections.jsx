import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Audio,
  staticFile,
} from 'remotion';
import { useMemo } from 'react';
// src/lib/timestamps.js

/**
 * A mapping from English number words to their digit representation.
 */
const wordToNumber = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
};

/**
 * Finds the start times for phrases like "section 1", "section two", etc. from a transcript.
 * @param {object} transcript The full transcript object with segments and words.
 * @returns {Record<string, number>} A map where the key is the section number (as a string)
 * and the value is the start time in seconds.
 */
export const findSectionTimings = (transcript) => {
  const timings = {};

  if (!transcript || !transcript.segments) {
    console.error("Invalid transcript format provided.");
    return timings;
  }

  transcript.segments.forEach((segment) => {
    segment.words.forEach((word, index) => {
      // Check for the trigger word "section" (case-insensitive)
      if (word.word.toLowerCase().trim() === 'section') {
        const nextWord = segment.words[index + 1];
        if (nextWord) {
          const cleanNextWord = nextWord.word.toLowerCase().replace(/[^a-z0-9]/g, '');
          
          let sectionNumber;
          
          // First, try converting from a word (e.g., "one")
          if (wordToNumber[cleanNextWord]) {
            sectionNumber = wordToNumber[cleanNextWord];
          } else {
            // If not a word, try parsing as an integer
            const parsedNumber = parseInt(cleanNextWord, 10);
            if (!isNaN(parsedNumber)) {
              sectionNumber = parsedNumber;
            }
          }

          if (sectionNumber && sectionNumber >= 1 && sectionNumber <= 6) {
            // Store the start time of the word "section"
            timings[sectionNumber] = word.start;
          }
        }
      }
    });
  });

  return timings;
};

// --- DATA & CONFIGURATION ---
// Refactored to hold Tailwind class strings instead of raw CSS values
const sections = [
  {
    number: "01",
    title: "Introduction",
    description: "Overview of video dubbing challenges and how InfiniteTalk addresses the limitations of existing lip-sync technologies.",
    readTime: "3 min read",
    color: "sky",
    gradient: "bg-[conic-gradient(from_0deg,#00d4ff_0%,#0099ff_25%,transparent_40%,transparent_60%,#00d4ff_75%)]",
  },
  {
    number: "02",
    title: "Methodology",
    description: "Deep dive into the audio-driven motion generation architecture and identity-preserving techniques used in our framework.",
    readTime: "8 min read",
    color: "blue",
    gradient: "bg-[conic-gradient(from_0deg,#3b82f6_0%,#60a5fa_25%,transparent_40%,transparent_60%,#3b82f6_75%)]",
  },
  {
    number: "03",
    title: "Architecture",
    description: "Technical breakdown of the multi-stage pipeline including sparse reference encoding and temporal coherence mechanisms.",
    readTime: "6 min read",
    color: "purple",
    gradient: "bg-[conic-gradient(from_0deg,#8b5cf6_0%,#a78bfa_25%,transparent_40%,transparent_60%,#8b5cf6_75%)]",
  },
  {
    number: "04",
    title: "Experiments",
    description: "Comprehensive evaluation metrics, benchmark comparisons, and ablation studies demonstrating superior performance.",
    readTime: "10 min read",
    color: "pink",
    gradient: "bg-[conic-gradient(from_0deg,#ec4899_0%,#f472b6_25%,transparent_40%,transparent_60%,#ec4899_75%)]",
  },
  {
    number: "05",
    title: "Results",
    description: "Visual and quantitative results showcasing emotion preservation, lip-sync accuracy, and real-world application demos.",
    readTime: "7 min read",
    color: "emerald",
    gradient: "bg-[conic-gradient(from_0deg,#10b981_0%,#34d399_25%,transparent_40%,transparent_60%,#10b981_75%)]",
  },
  {
    number: "06",
    title: "Conclusion",
    description: "Summary of contributions, impact on the field, and future research directions for holistic video dubbing systems.",
    readTime: "4 min read",
    color: "amber",
    gradient: "bg-[conic-gradient(from_0deg,#f59e0b_0%,#fbbf24_25%,transparent_40%,transparent_60%,#f59e0b_75%)]",
  }
];

// Helper to get color classes based on the color name
const getColorClasses = (color) => ({
  number: `text-${color}-400/30`,
  gradientLine: `from-${color}-400/50`,
  text: `text-${color}-400`,
  dot: `bg-${color}-400`,
  titleHover: `group-hover:text-${color}-400`,
});


export const TableOfContents = ({ transcript }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  // Use the helper function to get section timings
  const sectionTimings = useMemo(() => findSectionTimings(transcript), [transcript]);

  // Header animation
  const headerOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });
  const headerY = interpolate(frame, [0, 30], [30, 0], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill className="bg-gray-950 antialiased">
      <Audio src={staticFile('sections.wav')} />
      
      <div className="flex items-center justify-center min-h-full p-4">
        <div className="w-full max-w-[90rem] px-6 py-16 relative">
          
          {/* Header */}
          <div className="text-center mb-16" style={{ opacity: headerOpacity, transform: `translateY(${headerY}px)` }}>
            <div className="flex items-center justify-center gap-3 text-sm text-neutral-400 mb-4">
              <span className="inline-block h-1 w-8 rounded-full bg-sky-400/60" />
              <span className="uppercase tracking-widest">NAVIGATION</span>
              <span className="inline-block h-1 w-8 rounded-full bg-sky-400/60" />
            </div>
            <h2 className="text-5xl font-bold text-white">Table of Contents</h2>
            <p className="mt-4 text-neutral-400">Explore the key sections of InfiniteTalk</p>
          </div>

          {/* Grid */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {sections.map((section, index) => {
              const colors = getColorClasses(section.color);
              
              // Staggered entrance animation
              const delay = 40 + index * 8;
              const cardScale = spring({ frame: frame - delay, fps, config: { damping: 15, stiffness: 100, mass: 0.5 } });
              const cardOpacity = interpolate(frame, [delay, delay + 20], [0, 1], { extrapolateRight: 'clamp' });

              // NEW: Get the start time for this specific section
              const highlightStartTime = sectionTimings[parseInt(section.number, 10)];
              const highlightStartFrame = highlightStartTime ? highlightStartTime * fps : -1;

              // NEW: Animate ring opacity based on the audio timestamp
              const ringOpacity = highlightStartFrame === -1 ? 0 : interpolate(
                frame,
                [
                  highlightStartFrame - 5, // Start fading in slightly before
                  highlightStartFrame + 15, // Fully visible
                  highlightStartFrame + 120, // Hold for 4 seconds
                  highlightStartFrame + 135, // Fade out
                ],
                [0, 1, 1, 0],
                { extrapolateRight: 'clamp' }
              );

              return (
                <div
                  key={section.number}
                  className="relative group"
                  style={{ transform: `scale(${cardScale})`, opacity: cardOpacity }}
                >
                  {/* Spinning ring with dynamic opacity */}
                  <div
                    className={`absolute -inset-1 rounded-2xl blur-[1px] animate-spin-slow ${section.gradient}`}
                    style={{ animation: 'spin 8s linear infinite', opacity: ringOpacity }}
                  />
                  
                  {/* Card background */}
                  <div className="relative rounded-2xl bg-gray-900/20 p-1 backdrop-blur-md h-full">
                    {/* Card content */}
                    <div className="bg-gray-900/95 rounded-xl p-7 shadow-[0_0_60px_-15px_rgba(0,0,0,0.6)] h-full flex flex-col">
                      <div className="flex items-center gap-4 mb-4">
                        <span className={`text-4xl font-bold ${colors.number}`}>{section.number}</span>
                        <div className={`h-px flex-1 bg-gradient-to-r ${colors.gradientLine} to-transparent`} />
                      </div>
                      
                      <h3 className={`text-2xl font-bold text-white mb-3 transition-colors ${colors.titleHover}`}>
                        {section.title}
                      </h3>
                      
                      <p className="text-sm text-neutral-400 leading-relaxed flex-1">
                        {section.description}
                      </p>

                      <div className={`mt-6 inline-flex items-center gap-2 text-xs ${colors.text}`}>
                        <span className={`inline-block h-1.5 w-1.5 rounded-full ${colors.dot} animate-pulse`} />
                        <span>{section.readTime}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Decorative blurs */}
          <div className="absolute top-1/4 left-10 h-40 w-40 rounded-full bg-blue-600/20 blur-3xl -z-10" style={{ opacity: interpolate(frame, [0, 60], [0, 1]) }} />
          <div className="absolute bottom-1/4 right-10 h-40 w-40 rounded-full bg-purple-500/20 blur-3xl -z-10" style={{ opacity: interpolate(frame, [0, 60], [0, 1]) }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
import { Composition } from "remotion";
import {
  PodcastIntro,
  HeadlinesGrid,
  FeaturedStory,
  DeepDive,
} from "./HelloWorld";
import { Logo } from "./HelloWorld/Logo";

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="HeadlinesGrid"
        component={HeadlinesGrid}
        durationInFrames={90}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          headlines: [
            {
              category: "Technology",
              title: "AI Breakthrough in Medical Diagnosis",
              preview:
                "New machine learning model achieves 99% accuracy in early disease detection, revolutionizing healthcare worldwide.",
              meta: "5 min read • Breaking",
            },
            {
              category: "Business",
              title: "Tech Giants Report Record Q4 Earnings",
              preview:
                "Major technology companies exceed expectations with unprecedented growth in cloud and AI services.",
              meta: "8 min read • Trending",
            },
            {
              category: "Innovation",
              title: "Quantum Computing Reaches New Milestone",
              preview:
                "Researchers achieve quantum supremacy with 1000-qubit processor, opening doors to impossible calculations.",
              meta: "6 min read • Featured",
            },
            {
              category: "Environment",
              title: "Green Tech Investment Hits $500B",
              preview:
                "Global investment in sustainable technology solutions reaches record high as climate action accelerates.",
              meta: "7 min read • Popular",
            },
          ],
        }}
      />
    </>
  );
};

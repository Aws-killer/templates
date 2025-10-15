import { Composition } from "remotion";
// UPDATE: Import the new component names
import { AudioSyncedScene } from "./Pdfviewer";

export const RemotionRoot = () => {
  const sampleMatch = {
    text: "However, strict 0–1 verification is coarse and brittle: many reasoning tasks allow for partially correct solutions, equivalent answers in alternative formats, or open-ended outputs that resist exact matching.",
    page: 2,
    boundingBox: {
      "x": 70.866,
      "y": 604.684,
      "width": 471.6517205232001,
      "height": 21.917599999999993
    },
    fuzzyMatch: true
  };

  return (
    <>
      <Composition
        id="SingleQuote"
        // UPDATE: Use the new component name
        component={AudioSyncedScene}
        durationInFrames={50 * 30}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          match: sampleMatch,
          matchNumber: 1,

          // REMOVED: imagePixelWidth and imagePixelHeight are no longer needed
          pageImageFile: "page_2 copy.png",
          audioFile: "podcast_generated_1760527617.wav",
          paperTitle: "Verification in Reasoning Models: A Comprehensive Study",
          quoteStartTime: 13.04,
          // REMOVED: quoteText is no longer needed
          notesText: "Key limitation identified:\nBinary verification insufficient",
          notesStartFrame: 10,
          zoomTo: 2.5,
        }}
      />
    </>
  );
};
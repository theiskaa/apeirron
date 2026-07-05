import { Composition } from "remotion";
import { ShortVideo, type ShortPlan } from "./ShortVideo";

const FPS = 30;

// Placeholder so `remotion studio` opens without a short selected; the real data
// is supplied by shorts.mjs as inputProps and overrides this.
const PLACEHOLDER: ShortPlan = {
  id: "placeholder",
  slug: "preview",
  title: "Apeirron",
  duration: 6,
  words: [
    ["Render", 0.4, 1.2],
    ["a", 1.2, 1.4],
    ["short", 1.4, 2.2],
    ["to", 2.2, 2.5],
    ["preview", 2.5, 3.4],
  ],
  images: [],
  audioFile: null,
};

const END_SECONDS = 2.2; // end card after the narration

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="short"
      component={ShortVideo}
      width={1080}
      height={1920}
      fps={FPS}
      defaultProps={PLACEHOLDER}
      calculateMetadata={({ props }) => ({
        durationInFrames: Math.ceil((props.duration + END_SECONDS) * FPS),
      })}
    />
  );
};

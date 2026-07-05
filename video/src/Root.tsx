import { Composition } from "remotion";
import { NodeVideo, type NodePlan } from "./NodeVideo";
import { FPS, WIDTH, HEIGHT, INTRO_SECONDS, MAP_SECONDS, OUTRO_SECONDS } from "./theme.mjs";

// A tiny placeholder so `remotion studio` opens without a node selected; the real
// data is supplied by generate.mjs as inputProps and overrides all of this.
const PLACEHOLDER: NodePlan = {
  id: "placeholder",
  title: "Apeirron",
  description: "Render a node with generate.mjs to see it here.",
  category: "cosmos",
  color: "#6790b5",
  duration: 6,
  sections: [],
  cues: [],
  shots: [],
  words: [
    ["Render", 0.4, 1.2],
    ["a", 1.2, 1.4],
    ["node", 1.4, 2.2],
    ["to", 2.2, 2.5],
    ["preview", 2.5, 3.4],
  ],
  peaks: [],
  numbers: [],
  graph: null,
  audioFile: null,
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="node"
      component={NodeVideo}
      width={WIDTH}
      height={HEIGHT}
      fps={FPS}
      defaultProps={PLACEHOLDER}
      // durationInFrames is derived from the narration length in the inputProps,
      // padded by the intro title card and the outro credits.
      calculateMetadata={({ props }) => ({
        durationInFrames: Math.ceil(
          (INTRO_SECONDS +
            (props.graph ? MAP_SECONDS : 0) +
            props.duration +
            OUTRO_SECONDS) *
            FPS,
        ),
      })}
    />
  );
};

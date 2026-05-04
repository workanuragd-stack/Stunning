import { Composition, registerRoot } from "remotion";
import { Reel } from "./components/Reel";
import { reels } from "./data/reels";

export const RemotionRoot = () => {
  return (
    <>
      {reels.map((reel) => (
        <Composition
          key={reel.id}
          id={`Reel-${reel.id}`}
          component={Reel}
          durationInFrames={30 * 75}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ reel }}
        />
      ))}
    </>
  );
};

registerRoot(RemotionRoot);

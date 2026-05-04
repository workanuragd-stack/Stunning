import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  AbsoluteFill,
  Sequence,
} from "remotion";
import {
  DualOrgChart,
  NetworkGraph,
  ThreePillars,
  BridgeBuilder,
  TwoPaths,
  TimelinePlaybook,
} from "./Visuals";

const visualMap = {
  dual_org_chart: DualOrgChart,
  network_graph: NetworkGraph,
  three_pillars: ThreePillars,
  bridge_builder: BridgeBuilder,
  two_paths: TwoPaths,
  timeline_playbook: TimelinePlaybook,
};

// ─── NARRATION LINE ────────────────────────────────────────────────────────
const NarrationLine = ({ text, startFrame, accentColor }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [startFrame, startFrame + 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const translateY = interpolate(frame, [startFrame, startFrame + 10], [12, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        fontSize: 26,
        fontFamily: "'Courier New', monospace",
        color: "#fff",
        lineHeight: 1.5,
        fontWeight: 500,
        letterSpacing: "0.01em",
        textShadow: `0 0 40px ${accentColor}44`,
      }}
    >
      {text}
    </div>
  );
};

// ─── HOOK SCREEN ───────────────────────────────────────────────────────────
const HookScreen = ({ hook, accentColor, bgGradient }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const scale = interpolate(frame, [0, 20], [0.95, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${bgGradient[0]} 0%, ${bgGradient[1]} 100%)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 80px",
        opacity,
        transform: `scale(${scale})`,
      }}
    >
      {/* Accent line */}
      <div style={{
        width: 60,
        height: 4,
        background: accentColor,
        borderRadius: 2,
        marginBottom: 32,
        boxShadow: `0 0 20px ${accentColor}`,
      }} />

      <div style={{
        fontSize: 38,
        fontFamily: "'Courier New', monospace",
        color: "#fff",
        fontWeight: 700,
        textAlign: "center",
        lineHeight: 1.3,
        letterSpacing: "-0.01em",
        textShadow: `0 0 60px ${accentColor}33`,
      }}>
        {hook}
      </div>

      {/* Pulsing dot */}
      <div style={{
        width: 10,
        height: 10,
        borderRadius: "50%",
        background: accentColor,
        marginTop: 40,
        boxShadow: `0 0 20px ${accentColor}`,
        animation: "none",
        opacity: Math.sin(frame / 8) * 0.4 + 0.6,
      }} />
    </AbsoluteFill>
  );
};

// ─── MAIN REEL ─────────────────────────────────────────────────────────────
export const Reel = ({ reel }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();

  const VisualComponent = visualMap[reel.visual];
  const hookDuration = Math.floor(fps * 4); // 4 seconds
  const narrationStart = hookDuration;
  const linesPerFrame = Math.floor((durationInFrames - narrationStart - fps * 3) / reel.narration.length);

  const takeawayStart = durationInFrames - Math.floor(fps * 5);
  const takeawayOpacity = interpolate(frame, [takeawayStart, takeawayStart + 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const bgGlow = `radial-gradient(ellipse at 50% 50%, ${reel.accentColor}11 0%, transparent 70%)`;

  if (frame < hookDuration) {
    return <HookScreen hook={reel.hook} accentColor={reel.accentColor} bgGradient={reel.bgGradient} />;
  }

  const narrationFrame = frame - narrationStart;

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${reel.bgGradient[0]} 0%, ${reel.bgGradient[1]} 100%)`,
        overflow: "hidden",
      }}
    >
      {/* Background glow */}
      <div style={{
        position: "absolute", inset: 0,
        background: bgGlow,
        pointerEvents: "none",
      }} />

      {/* Subtle grid */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
        backgroundSize: "60px 60px",
        pointerEvents: "none",
      }} />

      {/* Part number badge */}
      <div style={{
        position: "absolute", top: 40, left: 60,
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: "50%",
          background: reel.accentColor,
          boxShadow: `0 0 12px ${reel.accentColor}`,
        }} />
        <span style={{
          fontFamily: "'Courier New', monospace",
          fontSize: 13, color: "rgba(255,255,255,0.5)",
          letterSpacing: "0.15em", textTransform: "uppercase",
        }}>
          Part {reel.id} / 6
        </span>
      </div>

      {/* Title */}
      <div style={{
        position: "absolute", top: 80, left: 60, right: 60,
        fontFamily: "'Courier New', monospace",
        fontSize: 20, fontWeight: 700,
        color: reel.accentColor,
        letterSpacing: "0.02em",
        opacity: interpolate(frame, [hookDuration, hookDuration + 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        {reel.title}
      </div>

      {/* Visual — top half */}
      <div style={{
        position: "absolute",
        top: 130, left: 0, right: 0,
        height: 280,
        display: "flex", alignItems: "center", justifyContent: "center",
        opacity: interpolate(frame, [hookDuration, hookDuration + 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        <VisualComponent accentColor={reel.accentColor} />
      </div>

      {/* Narration lines — bottom */}
      <div style={{
        position: "absolute",
        bottom: frame >= takeawayStart ? 160 : 60,
        left: 60, right: 60,
        display: "flex", flexDirection: "column", gap: 2,
        transition: "bottom 0.3s ease",
      }}>
        {reel.narration.map((line, i) => {
          const lineStart = i * linesPerFrame;
          const lineEnd = (i + 2) * linesPerFrame;
          if (narrationFrame < lineStart || narrationFrame > lineEnd + 20) return null;
          return (
            <NarrationLine
              key={i}
              text={line}
              startFrame={lineStart}
              accentColor={reel.accentColor}
            />
          );
        })}
      </div>

      {/* Key Takeaway */}
      {frame >= takeawayStart && (
        <div style={{
          position: "absolute",
          bottom: 40, left: 60, right: 60,
          opacity: takeawayOpacity,
          borderLeft: `3px solid ${reel.accentColor}`,
          paddingLeft: 20,
          background: `linear-gradient(90deg, ${reel.accentColor}15 0%, transparent 100%)`,
          padding: "16px 20px",
          borderRadius: "0 8px 8px 0",
        }}>
          <div style={{
            fontFamily: "'Courier New', monospace",
            fontSize: 11, letterSpacing: "0.15em",
            color: reel.accentColor, marginBottom: 6,
            textTransform: "uppercase",
          }}>
            KEY TAKEAWAY
          </div>
          <div style={{
            fontFamily: "'Courier New', monospace",
            fontSize: 15, color: "#fff",
            lineHeight: 1.4, fontWeight: 500,
          }}>
            {reel.keyTakeaway}
          </div>
        </div>
      )}

      {/* Accent corner */}
      <div style={{
        position: "absolute", top: 0, right: 0,
        width: 120, height: 120,
        background: `linear-gradient(225deg, ${reel.accentColor}22 0%, transparent 70%)`,
      }} />
    </AbsoluteFill>
  );
};

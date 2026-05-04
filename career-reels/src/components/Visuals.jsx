import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

// Shared spring config
const springConfig = { damping: 14, stiffness: 120, mass: 0.8 };

// ─── DUAL ORG CHART (Reel 1) ───────────────────────────────────────────────
export const DualOrgChart = ({ accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const officialOpacity = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: "clamp" });
  const crackProgress = interpolate(frame, [60, 90], [0, 1], { extrapolateRight: "clamp" });
  const informalOpacity = interpolate(frame, [80, 110], [0, 1], { extrapolateRight: "clamp" });
  const pulse = Math.sin(frame / 12) * 0.3 + 0.7;

  const nodes = [
    { x: 320, y: 80, label: "CEO", formal: true },
    { x: 180, y: 180, label: "VP Eng", formal: true },
    { x: 460, y: 180, label: "VP Sales", formal: true },
    { x: 120, y: 280, label: "Lead", formal: false, influence: true },
    { x: 240, y: 280, label: "PM", formal: false },
    { x: 400, y: 280, label: "Sr. AE", formal: false, influence: true },
    { x: 520, y: 280, label: "Ops", formal: false },
  ];

  const edges = [
    [0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]
  ];

  const informalEdges = [[3, 5], [4, 0], [6, 1]];

  return (
    <svg width="640" height="400" viewBox="0 0 640 400">
      {/* Formal edges */}
      {edges.map(([a, b], i) => (
        <line
          key={`fe-${i}`}
          x1={nodes[a].x} y1={nodes[a].y}
          x2={nodes[b].x} y2={nodes[b].y}
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="2"
          opacity={officialOpacity * (1 - crackProgress * 0.6)}
        />
      ))}

      {/* Informal edges */}
      {informalEdges.map(([a, b], i) => (
        <line
          key={`ie-${i}`}
          x1={nodes[a].x} y1={nodes[a].y}
          x2={nodes[b].x} y2={nodes[b].y}
          stroke={accentColor}
          strokeWidth="2"
          strokeDasharray="8 4"
          opacity={informalOpacity * 0.8}
        />
      ))}

      {/* Nodes */}
      {nodes.map((n, i) => {
        const isInfluencer = n.influence;
        const nodeOpacity = n.formal
          ? officialOpacity
          : informalOpacity;
        const radius = isInfluencer ? 28 : 22;
        const glowRadius = isInfluencer ? radius * (1 + pulse * 0.15) : radius;

        return (
          <g key={i} opacity={nodeOpacity}>
            {isInfluencer && (
              <circle
                cx={n.x} cy={n.y} r={glowRadius + 8}
                fill="none"
                stroke={accentColor}
                strokeWidth="2"
                opacity={0.4 * pulse}
              />
            )}
            <circle
              cx={n.x} cy={n.y} r={radius}
              fill={isInfluencer ? accentColor : "rgba(255,255,255,0.1)"}
              stroke={isInfluencer ? accentColor : "rgba(255,255,255,0.3)"}
              strokeWidth="2"
            />
            <text
              x={n.x} y={n.y + 5}
              textAnchor="middle"
              fill={isInfluencer ? "#000" : "#fff"}
              fontSize="10"
              fontFamily="monospace"
              fontWeight="bold"
            >
              {n.label}
            </text>
          </g>
        );
      })}

      {/* Labels */}
      <text x="20" y="350" fill="rgba(255,255,255,0.4)" fontSize="12" fontFamily="monospace" opacity={officialOpacity}>
        OFFICIAL STRUCTURE
      </text>
      <text x="20" y="370" fill={accentColor} fontSize="12" fontFamily="monospace" opacity={informalOpacity}>
        INVISIBLE INFLUENCE →
      </text>
    </svg>
  );
};

// ─── NETWORK GRAPH (Reel 2) ────────────────────────────────────────────────
export const NetworkGraph = ({ accentColor }) => {
  const frame = useCurrentFrame();
  const pulse = Math.sin(frame / 10) * 0.3 + 0.7;

  const nodes = [
    { x: 320, y: 200, type: "formal", label: "Director" },
    { x: 180, y: 130, type: "formal", label: "Manager" },
    { x: 460, y: 130, type: "formal", label: "VP" },
    { x: 140, y: 270, type: "informal", label: "Sr. IC", key: true },
    { x: 300, y: 310, type: "informal", label: "Exec PA", key: true },
    { x: 480, y: 270, type: "informal", label: "TL", key: true },
    { x: 220, y: 200, type: "peer", label: "Peer A" },
    { x: 420, y: 200, type: "peer", label: "Peer B" },
  ];

  const connections = [
    [0,1],[0,2],[1,3],[2,5],[0,4],[3,4],[4,5],[1,6],[2,7]
  ];

  const colors = { formal: "rgba(100,150,255,0.8)", informal: accentColor, peer: "rgba(255,255,255,0.3)" };

  return (
    <svg width="640" height="420" viewBox="0 0 640 420">
      {connections.map(([a, b], i) => {
        const isKeyConn = nodes[a].key || nodes[b].key;
        return (
          <line
            key={i}
            x1={nodes[a].x} y1={nodes[a].y}
            x2={nodes[b].x} y2={nodes[b].y}
            stroke={isKeyConn ? accentColor : "rgba(255,255,255,0.15)"}
            strokeWidth={isKeyConn ? 2 : 1}
            strokeDasharray={isKeyConn ? "none" : "4 4"}
          />
        );
      })}

      {nodes.map((n, i) => {
        const r = n.key ? 30 : 20;
        return (
          <g key={i}>
            {n.key && (
              <circle cx={n.x} cy={n.y} r={r + 10}
                fill="none" stroke={accentColor}
                strokeWidth="1.5" opacity={0.3 * pulse}
              />
            )}
            <circle
              cx={n.x} cy={n.y} r={r}
              fill={n.key ? accentColor : colors[n.type]}
              opacity={n.key ? 1 : 0.7}
            />
            <text x={n.x} y={n.y + 5}
              textAnchor="middle"
              fill={n.key ? "#000" : "#fff"}
              fontSize="9" fontFamily="monospace" fontWeight="bold"
            >
              {n.label}
            </text>
          </g>
        );
      })}

      <rect x="20" y="370" width="16" height="16" fill={accentColor} rx="3" />
      <text x="44" y="382" fill="rgba(255,255,255,0.7)" fontSize="11" fontFamily="monospace">KEY INFLUENCER</text>
      <rect x="200" y="370" width="16" height="16" fill="rgba(100,150,255,0.8)" rx="3" />
      <text x="224" y="382" fill="rgba(255,255,255,0.7)" fontSize="11" fontFamily="monospace">FORMAL AUTHORITY</text>
    </svg>
  );
};

// ─── THREE PILLARS (Reel 3) ────────────────────────────────────────────────
export const ThreePillars = ({ accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pillars = [
    { label: "ATTACH", sub: "Visible Work", icon: "◎", delay: 20 },
    { label: "COMMUNICATE", sub: "Progress Up", icon: "↑", delay: 50 },
    { label: "INSIGHT", sub: "One Sharp Point", icon: "◈", delay: 80 },
  ];

  return (
    <svg width="640" height="400" viewBox="0 0 640 400">
      {pillars.map((p, i) => {
        const progress = interpolate(frame, [p.delay, p.delay + 30], [0, 1], { extrapolateRight: "clamp" });
        const x = 100 + i * 185;
        const pillarH = 200 * progress;
        const y = 300 - pillarH;

        return (
          <g key={i}>
            {/* Pillar body */}
            <rect
              x={x} y={y} width={120} height={pillarH}
              fill={progress > 0 ? accentColor : "transparent"}
              opacity={0.15 + i * 0.05}
              rx="4"
            />
            <rect
              x={x} y={y} width={120} height={4}
              fill={accentColor}
              opacity={progress}
            />

            {/* Icon */}
            <text x={x + 60} y={y - 20}
              textAnchor="middle"
              fill={accentColor}
              fontSize="28"
              opacity={progress}
            >
              {p.icon}
            </text>

            {/* Labels */}
            <text x={x + 60} y={320}
              textAnchor="middle"
              fill="#fff"
              fontSize="13"
              fontFamily="monospace"
              fontWeight="bold"
              opacity={progress}
            >
              {p.label}
            </text>
            <text x={x + 60} y={340}
              textAnchor="middle"
              fill="rgba(255,255,255,0.5)"
              fontSize="11"
              fontFamily="monospace"
              opacity={progress}
            >
              {p.sub}
            </text>
          </g>
        );
      })}

      <text x="320" y="380"
        textAnchor="middle"
        fill="rgba(255,255,255,0.3)"
        fontSize="11" fontFamily="monospace"
      >
        VISIBILITY = SYSTEM, NOT PERSONALITY
      </text>
    </svg>
  );
};

// ─── BRIDGE BUILDER (Reel 4) ───────────────────────────────────────────────
export const BridgeBuilder = ({ accentColor }) => {
  const frame = useCurrentFrame();

  const blocks = [
    { label: "Understand Their Goals", delay: 15 },
    { label: "Remove Ambiguity", delay: 45 },
    { label: "Deliver + One Insight", delay: 75 },
  ];

  const bridgeProgress = interpolate(frame, [15, 105], [0, 1], { extrapolateRight: "clamp" });

  return (
    <svg width="640" height="380" viewBox="0 0 640 380">
      {/* You node */}
      <circle cx="80" cy="200" r="40" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
      <text x="80" y="196" textAnchor="middle" fill="#fff" fontSize="11" fontFamily="monospace" fontWeight="bold">YOU</text>
      <text x="80" y="210" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="9" fontFamily="monospace">Junior</text>

      {/* Manager node */}
      <circle cx="560" cy="200" r="40" fill={accentColor} opacity="0.15" stroke={accentColor} strokeWidth="2" />
      <text x="560" y="196" textAnchor="middle" fill={accentColor} fontSize="11" fontFamily="monospace" fontWeight="bold">MANAGER</text>
      <text x="560" y="210" textAnchor="middle" fill={accentColor} opacity="0.7" fontSize="9" fontFamily="monospace">Sponsor</text>

      {/* Bridge base */}
      <line x1="120" y1="200" x2="520" y2="200"
        stroke="rgba(255,255,255,0.1)" strokeWidth="8" strokeLinecap="round"
      />

      {/* Bridge progress */}
      <line x1="120" y1="200"
        x2={120 + 400 * bridgeProgress} y2="200"
        stroke={accentColor} strokeWidth="8" strokeLinecap="round"
        opacity="0.8"
      />

      {/* Bridge blocks */}
      {blocks.map((b, i) => {
        const bProgress = interpolate(frame, [b.delay, b.delay + 25], [0, 1], { extrapolateRight: "clamp" });
        const bx = 155 + i * 120;
        return (
          <g key={i} opacity={bProgress}>
            <rect x={bx} y={160} width={100} height={32} rx="4"
              fill={accentColor} opacity="0.2"
              stroke={accentColor} strokeWidth="1"
            />
            <text x={bx + 50} y={178} textAnchor="middle"
              fill={accentColor} fontSize="9" fontFamily="monospace" fontWeight="bold"
            >
              {b.label.split(" ").slice(0, 2).join(" ")}
            </text>
          </g>
        );
      })}

      {/* Sponsorship flag */}
      {frame > 100 && (
        <g opacity={interpolate(frame, [100, 120], [0, 1], { extrapolateRight: "clamp" })}>
          <line x1="560" y1="160" x2="560" y2="100" stroke={accentColor} strokeWidth="2" />
          <polygon points="560,100 590,112 560,124" fill={accentColor} opacity="0.8" />
          <text x="598" y="115" fill={accentColor} fontSize="10" fontFamily="monospace">ADVOCATE</text>
        </g>
      )}
    </svg>
  );
};

// ─── TWO PATHS (Reel 5) ────────────────────────────────────────────────────
export const TwoPaths = ({ accentColor }) => {
  const frame = useCurrentFrame();

  const pathProgress = interpolate(frame, [20, 120], [0, 1], { extrapolateRight: "clamp" });

  const busyPoints = Array.from({ length: 20 }, (_, i) => {
    const x = 80 + (i / 19) * 480;
    const y = 300 - (i / 19) * 30 + Math.sin(i) * 8;
    return `${x},${y}`;
  });

  const growthPoints = Array.from({ length: 20 }, (_, i) => {
    const t = i / 19;
    const x = 80 + t * 480;
    const y = 300 - (t * t) * 200;
    return `${x},${y}`;
  });

  const busyClip = Math.floor(pathProgress * 19);
  const growthClip = Math.floor(pathProgress * 19);

  return (
    <svg width="640" height="380" viewBox="0 0 640 380">
      {/* Axes */}
      <line x1="80" y1="60" x2="80" y2="310" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
      <line x1="80" y1="310" x2="580" y2="310" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
      <text x="30" y="190" fill="rgba(255,255,255,0.4)" fontSize="11" fontFamily="monospace"
        transform="rotate(-90,30,190)">GROWTH</text>
      <text x="320" y="340" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="11" fontFamily="monospace">TIME (24 months)</text>

      {/* Busy path */}
      <polyline
        points={busyPoints.slice(0, busyClip + 1).join(" ")}
        fill="none"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Growth path */}
      <polyline
        points={growthPoints.slice(0, growthClip + 1).join(" ")}
        fill="none"
        stroke={accentColor}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Labels */}
      <text x="570" y="285" fill="rgba(255,255,255,0.4)" fontSize="11" fontFamily="monospace">BUSY</text>
      <text x="570" y={300 - Math.pow(1, 2) * 200 + 5}
        fill={accentColor} fontSize="11" fontFamily="monospace"
        opacity={pathProgress > 0.8 ? 1 : 0}
      >DELIBERATE</text>

      {/* Icons row */}
      {frame > 100 && (
        <g opacity={interpolate(frame, [100, 130], [0, 1], { extrapolateRight: "clamp" })}>
          {[
            { icon: "⟳", label: "Reflect" },
            { icon: "◉", label: "Study" },
            { icon: "▦", label: "Pattern Lib" }
          ].map((item, i) => (
            <g key={i}>
              <text x={130 + i * 160} y="360" textAnchor="middle"
                fill={accentColor} fontSize="18">{item.icon}</text>
              <text x={130 + i * 160} y="375" textAnchor="middle"
                fill="rgba(255,255,255,0.5)" fontSize="10" fontFamily="monospace">{item.label}</text>
            </g>
          ))}
        </g>
      )}
    </svg>
  );
};

// ─── TIMELINE PLAYBOOK (Reel 6) ────────────────────────────────────────────
export const TimelinePlaybook = ({ accentColor }) => {
  const frame = useCurrentFrame();

  const phases = [
    {
      days: "Day 1–30",
      label: "OBSERVE",
      color: "#00D4FF",
      items: ["Power map", "3–5 nodes", "Don't perform"],
      delay: 15
    },
    {
      days: "Day 31–60",
      label: "ATTACH",
      color: "#FF6B35",
      items: ["Visible project", "Weekly update", "One insight/meeting"],
      delay: 55
    },
    {
      days: "Day 61–90",
      label: "DELIVER",
      color: "#00FF88",
      items: ["Over-deliver", "6-month align", "Pattern library"],
      delay: 95
    }
  ];

  return (
    <svg width="640" height="400" viewBox="0 0 640 400">
      {/* Timeline bar */}
      <rect x="40" y="155" width="560" height="8" rx="4" fill="rgba(255,255,255,0.1)" />

      {phases.map((p, i) => {
        const progress = interpolate(frame, [p.delay, p.delay + 35], [0, 1], { extrapolateRight: "clamp" });
        const x = 40 + i * 187;
        const markerX = x + 93;

        return (
          <g key={i}>
            {/* Fill segment */}
            <rect
              x={x} y={155}
              width={187 * progress} height={8}
              rx="4"
              fill={p.color}
              opacity="0.8"
            />

            {/* Marker dot */}
            <circle cx={markerX} cy={159} r={10 * progress}
              fill={p.color} opacity={progress}
            />

            {/* Phase card */}
            <g opacity={progress}>
              <rect x={x + 10} y={185} width={165} height={150} rx="8"
                fill={p.color} opacity="0.08"
                stroke={p.color} strokeWidth="1" strokeOpacity="0.3"
              />

              <text x={x + 92} y={205} textAnchor="middle"
                fill={p.color} fontSize="9" fontFamily="monospace" fontWeight="bold"
              >
                {p.days}
              </text>
              <text x={x + 92} y={225} textAnchor="middle"
                fill={p.color} fontSize="18" fontFamily="monospace" fontWeight="bold"
              >
                {p.label}
              </text>

              {p.items.map((item, j) => (
                <g key={j}>
                  <circle cx={x + 26} cy={250 + j * 24} r="3" fill={p.color} opacity="0.7" />
                  <text x={x + 38} y={255 + j * 24}
                    fill="rgba(255,255,255,0.75)" fontSize="11" fontFamily="monospace"
                  >
                    {item}
                  </text>
                </g>
              ))}
            </g>
          </g>
        );
      })}

      {/* Bottom tagline */}
      <text x="320" y="375" textAnchor="middle"
        fill="rgba(255,255,255,0.35)" fontSize="12" fontFamily="monospace"
        opacity={interpolate(frame, [120, 145], [0, 1], { extrapolateRight: "clamp" })}
      >
        REPUTATION + NETWORK + LEARNING SYSTEM
      </text>
    </svg>
  );
};

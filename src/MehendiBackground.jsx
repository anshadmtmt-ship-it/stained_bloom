import React from 'react';

/* ─── Colour tokens ───────────────────────────────────────────────────────── */
const G = '#B89A5A'; // antique gold — exact Stained Blooms mood board value
const LW = '0.5';   // light stroke weight
const MW = '0.8';   // medium stroke weight
const HW = '1.1';   // heavy stroke weight

/* ─── HELPER: 4-quadrant Star ─────────────────────────────────────────────── */
function Star({ cx, cy, r = 4 }) {
  const pts = [0, 90, 45, 135].map(a => {
    const ra = (a * Math.PI) / 180;
    const inner = r * 0.38;
    return `${cx + r * Math.cos(ra - Math.PI / 2)},${cy + r * Math.sin(ra - Math.PI / 2)} ${cx + inner * Math.cos(ra + Math.PI / 4 - Math.PI / 2)},${cy + inner * Math.sin(ra + Math.PI / 4 - Math.PI / 2)}`;
  }).join(' ');
  return <polygon points={pts} fill={G} opacity="0.25" />;
}

/* ─── HELPER: Mehendi Dot cluster ────────────────────────────────────────── */
function Dots({ cx, cy, n = 5, spread = 18, r = 1.3 }) {
  return Array.from({ length: n }).map((_, i) => {
    const a = (i * 360 / n) * Math.PI / 180;
    return <circle key={i} cx={cx + spread * Math.cos(a)} cy={cy + spread * Math.sin(a)} r={r} fill={G} />;
  });
}

/* ─── TOP-LEFT CORNER: Mandala + paisley + vine ───────────────────────────── */
function TopLeftCorner() {
  return (
    <g id="top-left">
      {/* ── Large corner mandala (cropped, only bottom-right quadrant visible) ── */}
      <g transform="translate(-180, -180)">
        {[12, 24, 38, 54, 72, 92, 115, 142, 172, 206].map((r, i) => (
          <circle key={i} cx="180" cy="180" r={r}
            fill="none" stroke={G} strokeWidth={i % 3 === 0 ? MW : LW}
            strokeDasharray={i % 4 === 0 ? '3,3' : undefined} />
        ))}
        {/* Petal ring at r=54 */}
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * 30) * Math.PI / 180;
          const x = 180 + 54 * Math.cos(a); const y = 180 + 54 * Math.sin(a);
          return (
            <ellipse key={i} cx={x} cy={y} rx="7" ry="13"
              fill="none" stroke={G} strokeWidth={LW}
              transform={`rotate(${i * 30} ${x} ${y})`} />
          );
        })}
        {/* Scallops at outer ring */}
        {Array.from({ length: 24 }).map((_, i) => {
          const a = (i * 15) * Math.PI / 180;
          const x1 = 180 + 172 * Math.cos(a); const y1 = 180 + 172 * Math.sin(a);
          const x2 = 180 + 192 * Math.cos(a); const y2 = 180 + 192 * Math.sin(a);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={G} strokeWidth={LW} />;
        })}
        {/* Dot ring */}
        <Dots cx="180" cy="180" n={16} spread={92} r={1.5} />
        <Dots cx="180" cy="180" n={24} spread={142} r={1.0} />
      </g>

      {/* ── Paisley 1: sweeping from top-left ─────────────────────────────── */}
      <path
        d="M -10 40 C 20 20, 70 10, 90 50 C 110 90, 70 130, 90 170 C 110 210, 160 200, 170 240 C 180 280, 140 310, 120 350 C 100 390, 110 430, 80 460"
        fill="none" stroke={G} strokeWidth={MW} strokeLinecap="round" />
      {/* Inner echo of paisley */}
      <path
        d="M 0 50 C 25 30, 68 22, 86 58 C 104 96, 66 134, 85 172 C 104 210, 148 202, 157 240"
        fill="none" stroke={G} strokeWidth={LW} strokeLinecap="round" strokeDasharray="2,4" />

      {/* ── Teardrop paisley body ────────────────────────────────────────── */}
      <path
        d="M 50 320 C 30 280, 15 250, 30 220 C 45 190, 85 185, 95 210 C 108 240, 85 270, 75 300 C 65 330, 70 360, 50 320 Z"
        fill="none" stroke={G} strokeWidth={MW} />
      <circle cx="72" cy="230" r="14" fill="none" stroke={G} strokeWidth={LW} />
      <circle cx="72" cy="230" r="6" fill="none" stroke={G} strokeWidth={MW} />
      <circle cx="72" cy="230" r="2" fill={G} />

      {/* ── Flower cluster lower-left ────────────────────────────────────── */}
      <g transform="translate(25, 480)">
        {/* Petal flower */}
        {Array.from({ length: 6 }).map((_, i) => {
          const a = (i * 60) * Math.PI / 180;
          return (
            <ellipse key={i} cx={34 * Math.cos(a)} cy={34 * Math.sin(a)} rx="9" ry="18"
              fill="none" stroke={G} strokeWidth={MW}
              transform={`rotate(${i * 60} ${34 * Math.cos(a)} ${34 * Math.sin(a)})`} />
          );
        })}
        <circle cx="0" cy="0" r="10" fill="none" stroke={G} strokeWidth={HW} />
        <circle cx="0" cy="0" r="4" fill={G} />
        {/* tiny dot ring */}
        <Dots cx="0" cy="0" n={8} spread={22} r={1.2} />
      </g>

      {/* ── Leaf vine lower-left ─────────────────────────────────────────── */}
      <path d="M 0 390 C 30 400, 20 440, 50 450 C 80 460, 70 500, 100 510 C 130 520, 120 560, 150 570"
        fill="none" stroke={G} strokeWidth={LW} strokeLinecap="round" />
      {[
        [20, 415], [55, 453], [105, 513],
      ].map(([x, y], i) => (
        <g key={i} transform={`translate(${x},${y})`}>
          <path d={`M 0 0 C -12 -18, -8 -32, 0 -14 C 8 -32, 12 -18, 0 0 Z`}
            fill="none" stroke={G} strokeWidth={LW} />
        </g>
      ))}

      {/* ── Scattered small flowers & dots ──────────────────────────────── */}
      {[
        [140, 140], [190, 310], [110, 400],
      ].map(([x, y], i) => (
        <g key={i} transform={`translate(${x},${y})`}>
          {Array.from({ length: 5 }).map((_, j) => (
            <path key={j} d="M 0 -8 C -3 -15, 3 -15, 0 -8" transform={`rotate(${j * 72})`} fill="none" stroke={G} strokeWidth={LW} />
          ))}
          <circle cx="0" cy="0" r="2.5" fill={G} />
        </g>
      ))}

      {/* ── Sparkle stars scattered ─────────────────────────────────────── */}
      <Star cx="230" cy="90" r={5} />
      <Star cx="160" cy="360" r={4} />
      <Star cx="280" cy="250" r={3.5} />
      <circle cx="200" cy="180" r="1.4" fill={G} />
      <circle cx="260" cy="320" r="1.2" fill={G} />
      <circle cx="130" cy="290" r="1" fill={G} />
    </g>
  );
}

/* ─── TOP-RIGHT CORNER: Small mandala + rising vine ──────────────────────── */
function TopRightCorner({ w }) {
  return (
    <g id="top-right" transform={`translate(${w}, 0) scale(-1, 1)`}>
      {/* Mirror of top-left corner, slightly different inner details */}

      {/* ── Smaller corner mandala ────────────────────────────────────────── */}
      <g transform="translate(-150, -150)">
        {[10, 20, 32, 46, 62, 80, 102, 128].map((r, i) => (
          <circle key={i} cx="150" cy="150" r={r}
            fill="none" stroke={G} strokeWidth={i % 2 === 0 ? MW : LW}
            strokeDasharray={i % 3 === 0 ? '2,3' : undefined} />
        ))}
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i * 45) * Math.PI / 180;
          const x = 150 + 46 * Math.cos(a); const y = 150 + 46 * Math.sin(a);
          return (
            <ellipse key={i} cx={x} cy={y} rx="6" ry="12"
              fill="none" stroke={G} strokeWidth={LW}
              transform={`rotate(${i * 45} ${x} ${y})`} />
          );
        })}
        <Dots cx="150" cy="150" n={12} spread={80} r={1.3} />
        {Array.from({ length: 20 }).map((_, i) => {
          const a = (i * 18) * Math.PI / 180;
          const x1 = 150 + 128 * Math.cos(a); const y1 = 150 + 128 * Math.sin(a);
          const x2 = 150 + 142 * Math.cos(a); const y2 = 150 + 142 * Math.sin(a);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={G} strokeWidth={LW} />;
        })}
      </g>

      {/* ── Vertical climbing vine ─────────────────────────────────────────── */}
      <path d="M 0 60 C 40 100, -10 160, 30 210 C 70 260, 0 310, 40 360 C 80 410, 10 470, 50 520"
        fill="none" stroke={G} strokeWidth={LW} strokeLinecap="round" />
      {/* Leaves off the vine */}
      {[[18, 140], [38, 230], [18, 340]].map(([x, y], i) => (
        <path key={i} d={`M ${x} ${y} C ${x - 20} ${y - 20}, ${x - 28} ${y + 5}, ${x} ${y} Z`}
          fill="none" stroke={G} strokeWidth={LW} />
      ))}

      {/* ── Large paisley body top-right ─────────────────────────────────── */}
      <path
        d="M -20 200 C 10 160, 55 155, 62 185 C 72 220, 44 255, 60 290 C 76 325, 120 330, 110 370 C 100 410, 55 415, -20 400"
        fill="none" stroke={G} strokeWidth={MW} strokeLinecap="round" />
      {/* Inner detail */}
      <path
        d="M -5 210 C 15 178, 48 175, 54 198 C 62 228, 38 258, 52 290"
        fill="none" stroke={G} strokeWidth={LW} strokeDasharray="2,4" strokeLinecap="round" />
      <circle cx="40" cy="200" r="12" fill="none" stroke={G} strokeWidth={LW} />
      <circle cx="40" cy="200" r="5" fill="none" stroke={G} strokeWidth={MW} />
      <circle cx="40" cy="200" r="1.8" fill={G} />

      {/* ── Dotted decorative sprays ─────────────────────────────────────── */}
      <Dots cx="-5" cy="90" n={6} spread={14} r={1.2} />
      <Dots cx="30" cy="440" n={5} spread={12} r={1.0} />

      {/* ── Stars ────────────────────────────────────────────────────────── */}
      <Star cx="-30" cy="140" r={4.5} />
      <Star cx="55" cy="340" r={3.5} />
      <circle cx="10" cy="250" r="1.3" fill={G} />
    </g>
  );
}

/* ─── LEFT EDGE: vine + mid-page decorations (Gallery area) ──────────────── */
function LeftEdge() {
  return (
    <g id="left-edge">
      {/* ── Continued vine from top-left ─────────────────────────────────── */}
      <path d="M 10 620 C 50 650, 0 700, 40 740 C 80 780, 20 830, 60 880 C 100 930, 30 980, 70 1030"
        fill="none" stroke={G} strokeWidth={LW} strokeLinecap="round" />
      {[[38, 672], [18, 800], [48, 910]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x}, ${y})`}>
          <path d="M 0 0 C -15 -12, -18 -28, 0 -16 C 18 -28, 15 -12, 0 0 Z"
            fill="none" stroke={G} strokeWidth={LW} />
          <circle cx="0" cy="-8" r="1.5" fill={G} />
        </g>
      ))}

      {/* ── Small lotus ──────────────────────────────────────────────────── */}
      <g transform="translate(22, 1100)">
        {Array.from({ length: 6 }).map((_, i) => {
          const a = (i * 60) * Math.PI / 180;
          return (
            <path key={i}
              d={`M 0 0 C ${-18 * Math.sin(a + 0.5)} ${-18 * Math.cos(a + 0.5)}, ${-22 * Math.sin(a)} ${-22 * Math.cos(a)}, 0 0`}
              fill="none" stroke={G} strokeWidth={LW} />
          );
        })}
        <circle cx="0" cy="0" r="5" fill="none" stroke={G} strokeWidth={LW} />
        <circle cx="0" cy="0" r="2" fill={G} />
      </g>

      {/* ── Scattered tiny flowers & dots ─────────────────────────────────── */}
      {[[55, 750], [30, 920], [70, 1200]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x}, ${y})`}>
          {Array.from({ length: 4 }).map((_, j) => (
            <path key={j} d="M 0 -6 C -2.5 -11, 2.5 -11, 0 -6" transform={`rotate(${j * 90})`} fill="none" stroke={G} strokeWidth={LW} />
          ))}
          <circle cx="0" cy="0" r="2" fill={G} />
        </g>
      ))}

      <Star cx="65" cy="840" r={3.5} />
      <circle cx="40" cy="1050" r="1.2" fill={G} />
      <circle cx="20" cy="970" r="1" fill={G} />
    </g>
  );
}

/* ─── RIGHT EDGE: vine + mid-page decorations (Packages area) ────────────── */
function RightEdge({ w }) {
  return (
    <g id="right-edge" transform={`translate(${w}, 0) scale(-1, 1)`}>
      {/* Continued vine from top-right */}
      <path d="M 15 630 C 55 665, 5 715, 48 765 C 90 815, 25 865, 65 920 C 105 975, 35 1025, 78 1080"
        fill="none" stroke={G} strokeWidth={LW} strokeLinecap="round" />
      {[[40, 685], [22, 810], [55, 940]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x}, ${y})`}>
          <path d="M 0 0 C -15 -12, -18 -28, 0 -16 C 18 -28, 15 -12, 0 0 Z"
            fill="none" stroke={G} strokeWidth={LW} />
        </g>
      ))}

      {/* Large ornamental flower mid-right */}
      <g transform="translate(30, 1160)">
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i * 45) * Math.PI / 180;
          const x = 42 * Math.cos(a); const y = 42 * Math.sin(a);
          return (
            <ellipse key={i} cx={x} cy={y} rx="8" ry="18"
              fill="none" stroke={G} strokeWidth={LW}
              transform={`rotate(${i * 45} ${x} ${y})`} />
          );
        })}
        <circle cx="0" cy="0" r="14" fill="none" stroke={G} strokeWidth={MW} />
        <circle cx="0" cy="0" r="6" fill="none" stroke={G} strokeWidth={LW} />
        <circle cx="0" cy="0" r="2.5" fill={G} />
        <Dots cx="0" cy="0" n={8} spread={14} r={1} />
      </g>

      <Star cx="12" cy="755" r={4} />
      <Star cx="60" cy="1050" r={3} />
      {[[25, 700], [48, 900], [20, 1020]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.2" fill={G} />
      ))}
    </g>
  );
}

/* ─── BOTTOM-LEFT CORNER: rising vine + large paisley + small mandala ────── */
function BottomLeftCorner({ h }) {
  return (
    <g id="bottom-left" transform={`translate(0, ${h})`}>
      {/* ── Small mandala sitting bottom-left ───────────────────────────── */}
      <g transform="translate(-80, 80)">
        {[8, 18, 30, 44, 58, 74, 90].map((r, i) => (
          <circle key={i} cx="80" cy="-80" r={r}
            fill="none" stroke={G} strokeWidth={i % 2 === 0 ? MW : LW}
            strokeDasharray={i % 3 === 0 ? '2,3' : undefined} />
        ))}
        <Dots cx="80" cy="-80" n={10} spread={58} r={1.2} />
        {Array.from({ length: 6 }).map((_, i) => {
          const a = (i * 60) * Math.PI / 180;
          const x = 80 + 44 * Math.cos(a); const y = -80 + 44 * Math.sin(a);
          return (
            <ellipse key={i} cx={x} cy={y} rx="5" ry="11"
              fill="none" stroke={G} strokeWidth={LW}
              transform={`rotate(${i * 60} ${x} ${y})`} />
          );
        })}
      </g>

      {/* ── Large drooping paisley bottom-left ──────────────────────────── */}
      <path
        d="M -20 -120 C 20 -160, 70 -160, 80 -120 C 92 -80, 60 -50, 78 -20 C 96 10, 145 15, 145 50 C 145 88, 100 100, 55 80 C 10 60, -10 20, -20 -40"
        fill="none" stroke={G} strokeWidth={MW} strokeLinecap="round" />
      <circle cx="85" cy="-90" r="16" fill="none" stroke={G} strokeWidth={LW} />
      <circle cx="85" cy="-90" r="7" fill="none" stroke={G} strokeWidth={MW} />
      <circle cx="85" cy="-90" r="2.5" fill={G} />
      <Dots cx="85" cy="-90" n={8} spread={12} r={1} />

      {/* ── Botanical vine climbing up from bottom ────────────────────────── */}
      <path d="M 0 -30 C 40 -70, 10 -120, 50 -170 C 90 -220, 30 -280, 70 -340"
        fill="none" stroke={G} strokeWidth={LW} strokeLinecap="round" />
      {[[35, -90], [18, -190], [52, -300]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x}, ${y})`}>
          <path d="M 0 0 C -12 -14, -14 -28, 0 -16 C 14 -28, 12 -14, 0 0 Z"
            fill="none" stroke={G} strokeWidth={LW} />
        </g>
      ))}

      {/* ── Tiny flowers scattered ─────────────────────────────────────── */}
      {[[110, -50], [170, -30], [60, -240]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x}, ${y})`}>
          {Array.from({ length: 5 }).map((_, j) => (
            <path key={j} d="M 0 -7 C -2.5 -13, 2.5 -13, 0 -7" transform={`rotate(${j * 72})`} fill="none" stroke={G} strokeWidth={LW} />
          ))}
          <circle cx="0" cy="0" r="2" fill={G} />
        </g>
      ))}

      <Star cx="200" cy="-70" r={4} />
      <Star cx="130" cy="-180" r={3.5} />
      <circle cx="160" cy="-120" r="1.3" fill={G} />
    </g>
  );
}

/* ─── BOTTOM-RIGHT CORNER: large mandala + paisley vine ──────────────────── */
function BottomRightCorner({ w, h }) {
  return (
    <g id="bottom-right" transform={`translate(${w}, ${h}) scale(-1, 1)`}>
      {/* ── Large mandala bottom-right ─────────────────────────────────── */}
      <g transform="translate(-200, 100)">
        {[10, 22, 36, 52, 70, 92, 118, 148, 180].map((r, i) => (
          <circle key={i} cx="200" cy="-100" r={r}
            fill="none" stroke={G} strokeWidth={i % 3 === 0 ? HW : LW}
            strokeDasharray={i % 4 === 0 ? '3,4' : undefined} />
        ))}
        {Array.from({ length: 16 }).map((_, i) => {
          const a = (i * 22.5) * Math.PI / 180;
          const x = 200 + 70 * Math.cos(a); const y = -100 + 70 * Math.sin(a);
          return (
            <ellipse key={i} cx={x} cy={y} rx="7" ry="15"
              fill="none" stroke={G} strokeWidth={LW}
              transform={`rotate(${i * 22.5} ${x} ${y})`} />
          );
        })}
        <Dots cx="200" cy="-100" n={20} spread={118} r={1.2} />
        {Array.from({ length: 32 }).map((_, i) => {
          const a = (i * 11.25) * Math.PI / 180;
          const x1 = 200 + 148 * Math.cos(a); const y1 = -100 + 148 * Math.sin(a);
          const x2 = 200 + 164 * Math.cos(a); const y2 = -100 + 164 * Math.sin(a);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={G} strokeWidth={LW} />;
        })}
        <Dots cx="200" cy="-100" n={30} spread={180} r={0.9} />
      </g>

      {/* ── Climbing paisley vine ──────────────────────────────────────── */}
      <path
        d="M -10 -50 C 30 -90, 80 -80, 85 -120 C 90 -160, 55 -200, 75 -240 C 95 -280, 145 -270, 145 -320"
        fill="none" stroke={G} strokeWidth={MW} strokeLinecap="round" />
      <circle cx="75" cy="-110" r="14" fill="none" stroke={G} strokeWidth={LW} />
      <circle cx="75" cy="-110" r="6" fill="none" stroke={G} strokeWidth={LW} />
      <circle cx="75" cy="-110" r="2" fill={G} />

      {/* ── Leaf accents ──────────────────────────────────────────────── */}
      {[[-5, -70], [40, -190], [80, -280]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x}, ${y})`}>
          <path d="M 0 0 C -10 -14, -12 -28, 0 -18 C 12 -28, 10 -14, 0 0 Z"
            fill="none" stroke={G} strokeWidth={LW} />
        </g>
      ))}

      {/* ── Stars & dots ────────────────────────────────────────────── */}
      <Star cx="-40" cy="-160" r={4} />
      <Star cx="100" cy="-60" r={3.5} />
      <circle cx="20" cy="-240" r="1.3" fill={G} />
      <circle cx="-20" cy="-100" r="1" fill={G} />
    </g>
  );
}

/* ─── LOWER LEFT EDGE: decorations behind Contact section ────────────────── */
function LowerLeftEdge({ h }) {
  const midY = h * 0.68;
  return (
    <g id="lower-left-edge">
      {/* Deep vine extension */}
      <path d={`M 18 ${midY} C 55 ${midY + 50}, 10 ${midY + 110}, 52 ${midY + 170} C 94 ${midY + 230}, 25 ${midY + 290}, 68 ${midY + 360}`}
        fill="none" stroke={G} strokeWidth={LW} strokeLinecap="round" />
      {[
        [midY + 60], [midY + 170], [midY + 290]
      ].map(([y], i) => (
        <g key={i} transform={`translate(38, ${y})`}>
          <path d="M 0 0 C -14 -12, -16 -24, 0 -14 C 16 -24, 14 -12, 0 0 Z"
            fill="none" stroke={G} strokeWidth={LW} />
          <circle cx="0" cy="-7" r="1.2" fill={G} />
        </g>
      ))}

      {/* Mid-scroll flower */}
      <g transform={`translate(30, ${midY + 220})`}>
        {Array.from({ length: 5 }).map((_, j) => (
          <path key={j} d="M 0 -10 C -4 -18, 4 -18, 0 -10" transform={`rotate(${j * 72})`} fill="none" stroke={G} strokeWidth={LW} />
        ))}
        <circle cx="0" cy="0" r="3" fill="none" stroke={G} strokeWidth={LW} />
        <circle cx="0" cy="0" r="1.2" fill={G} />
      </g>
      <Star cx="65" cy={midY + 130} r={3.5} />
    </g>
  );
}

/* ─── LOWER RIGHT EDGE: decorations behind Packages section ──────────────── */
function LowerRightEdge({ w, h }) {
  const midY = h * 0.58;
  return (
    <g id="lower-right-edge" transform={`translate(${w}, 0) scale(-1, 1)`}>
      <path d={`M 20 ${midY} C 60 ${midY + 55}, 12 ${midY + 120}, 55 ${midY + 185} C 98 ${midY + 250}, 28 ${midY + 315}, 72 ${midY + 390}`}
        fill="none" stroke={G} strokeWidth={LW} strokeLinecap="round" />
      {[[midY + 65], [midY + 185], [midY + 315]].map(([y], i) => (
        <g key={i} transform={`translate(42, ${y})`}>
          <path d="M 0 0 C -13 -11, -15 -22, 0 -13 C 15 -22, 13 -11, 0 0 Z"
            fill="none" stroke={G} strokeWidth={LW} />
        </g>
      ))}

      {/* Mid-scroll lotus */}
      <g transform={`translate(35, ${midY + 230})`}>
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i * 45) * Math.PI / 180;
          const x = 30 * Math.cos(a); const y = 30 * Math.sin(a);
          return (
            <ellipse key={i} cx={x} cy={y} rx="6" ry="14"
              fill="none" stroke={G} strokeWidth={LW}
              transform={`rotate(${i * 45} ${x} ${y})`} />
          );
        })}
        <circle cx="0" cy="0" r="10" fill="none" stroke={G} strokeWidth={LW} />
        <circle cx="0" cy="0" r="4" fill="none" stroke={G} strokeWidth={MW} />
        <circle cx="0" cy="0" r="1.5" fill={G} />
      </g>
      <Star cx="18" cy={midY + 130} r={3.5} />
    </g>
  );
}

/* ─── SCATTERED INTERIOR ACCENTS (very small — mid-page sparkles only) ────── */
function ScatteredAccents({ w, h }) {
  // Very fine scattered sparkle stars and dots across the full page height
  // Only placed within 12% of either edge — never in the center
  const accents = [
    // left edge accents across full page height
    { x: w * 0.04, y: h * 0.18, type: 'star', r: 3.5 },
    { x: w * 0.06, y: h * 0.29, type: 'dot' },
    { x: w * 0.03, y: h * 0.42, type: 'star', r: 3 },
    { x: w * 0.09, y: h * 0.53, type: 'dot' },
    { x: w * 0.05, y: h * 0.62, type: 'star', r: 4 },
    { x: w * 0.07, y: h * 0.74, type: 'dot' },
    { x: w * 0.04, y: h * 0.84, type: 'star', r: 3 },
    // right edge accents
    { x: w * 0.94, y: h * 0.15, type: 'star', r: 3.5 },
    { x: w * 0.97, y: h * 0.26, type: 'dot' },
    { x: w * 0.92, y: h * 0.39, type: 'star', r: 3 },
    { x: w * 0.96, y: h * 0.49, type: 'dot' },
    { x: w * 0.93, y: h * 0.60, type: 'star', r: 4 },
    { x: w * 0.95, y: h * 0.71, type: 'dot' },
    { x: w * 0.97, y: h * 0.82, type: 'star', r: 3 },
  ];

  return (
    <g id="scattered-accents">
      {accents.map((a, i) => (
        a.type === 'star'
          ? <Star key={i} cx={a.x} cy={a.y} r={a.r} />
          : <circle key={i} cx={a.x} cy={a.y} r={1.4} fill={G} />
      ))}
    </g>
  );
}

/* ─── Main component ──────────────────────────────────────────────────────── */
export default function MehendiBackground() {
  // Use a large fixed canvas that covers even very tall pages.
  // We render at 1440 wide × 5500 tall then let CSS scale/clip as needed.
  const W = 1440;
  const H = 5500;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMin slice"
        style={{ width: '100%', height: '100%', opacity: 0.032 }}
      >
        <TopLeftCorner />
        <TopRightCorner w={W} />
        <LeftEdge />
        <RightEdge w={W} />
        <LowerLeftEdge h={H} />
        <LowerRightEdge w={W} h={H} />
        <BottomLeftCorner h={H} />
        <BottomRightCorner w={W} h={H} />
        <ScatteredAccents w={W} h={H} />
      </svg>
    </div>
  );
}

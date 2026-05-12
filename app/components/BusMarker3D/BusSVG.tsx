/**
 * BusSVG — 3D isometric school bus for the live-tracking map marker.
 *
 * viewBox: "-10 -20 120 80"   (x: -10→110, y: -20→60)
 *
 * Cabinet-projection layout (3/4 from above-left, bus front on the RIGHT):
 *
 *                 13,3 ─────────────────────── 93,3
 *                /                                 \   ← TOP FACE (#FFE566)
 *         0,12 ─────────────────────── 80,12 ─── 93,3
 *           |                            |   \    /
 *           |   SIDE FACE (#FFD700)      |   FRONT (#B8900A)
 *           |   (the long side — 80 u)   |   (end cap — 13 u)
 *         0,45 ─────────────────────── 80,45 ─── 93,36
 *
 * The side face is 80 units long × 33 tall — bus ratio ≈ 2.4 : 1,
 * clearly rectangular (no more "yellow square").
 *
 * NO animation logic here — driven entirely by props.
 */

import React from "react";
import Svg, {
  Ellipse,
  Polygon,
  Rect,
  Text as SvgText,
} from "react-native-svg";
import { SVG_RENDER_H, SVG_RENDER_W } from "./constants";
import type { BusSVGProps } from "./types";

// ─── 3-D cabinet projection constants ─────────────────────────────────────────
// Each unit of "depth" moves +13 px right and -9 px up in the image.
const DEPTH_DX = 13;   // how far the front-face offset shifts right
const DEPTH_DY = -9;   // how far up the offset shifts

// Main bus body extents on the side face
const BL = 0;    // body left
const BR = 80;   // body right
const BT = 12;   // body top
const BB = 45;   // body bottom

// Front face (right end cap) after adding depth offset
const FL = BR;                   // 80
const FR = BR + DEPTH_DX;        // 93
const FT = BT + DEPTH_DY;        // 3
const FB = BB + DEPTH_DY;        // 36

export default function BusSVG({
  isLive,
  busNumber,
  width = SVG_RENDER_W,
  height = SVG_RENDER_H,
}: BusSVGProps) {
  const badgeColor = isLive ? "#22C55E" : "#1565C0";

  return (
    <Svg width={width} height={height} viewBox="-10 -20 120 80">

      {/* ── 1. Ground shadow ─────────────────────────────────────────── */}
      <Ellipse cx="44" cy="53" rx="48" ry="6" fill="rgba(0,0,0,0.15)" />

      {/* ── 2. SIDE FACE — long left face, medium yellow ─────────────── */}
      {/* Rectangle: x 0→80, y 12→45 */}
      <Rect
        x={BL} y={BT}
        width={BR - BL} height={BB - BT}
        fill="#FFD700"
      />

      {/* ── 3. TOP / ROOF FACE — parallelogram, lightest yellow ──────── */}
      {/* "0,12  80,12  93,3  13,3" */}
      <Polygon
        points={`${BL},${BT}  ${BR},${BT}  ${FR},${FT}  ${BL + DEPTH_DX},${BT + DEPTH_DY}`}
        fill="#FFE566"
      />

      {/* ── 4. FRONT FACE — narrow end cap, darkest yellow ───────────── */}
      {/* "80,12  93,3  93,36  80,45" */}
      <Polygon
        points={`${FL},${BT}  ${FR},${FT}  ${FR},${FB}  ${FL},${BB}`}
        fill="#B8900A"
      />

      {/* ── 5. Side windows — 4 panes across the body ────────────────── */}
      {[8, 24, 40, 56].map((wx) => (
        <Rect
          key={wx}
          x={wx} y={BT + 4}
          width={13} height={10}
          rx="1.5"
          fill="#A8D8F0"
          stroke="#7EC8E8"
          strokeWidth="0.8"
        />
      ))}

      {/* ── 6. Windshield inset on front face ────────────────────────── */}
      {/* Parallelogram inside the front face — same depth offset */}
      <Polygon
        points={`${FL + 2},${BT + 3}  ${FR - 1},${FT + 3}  ${FR - 1},${FT + 19}  ${FL + 2},${BT + 16}`}
        fill="#A8D8F0"
        opacity="0.9"
        stroke="#7EC8E8"
        strokeWidth="0.7"
      />

      {/* ── 7. Black rubber stripe — across side face ────────────────── */}
      <Rect x={BL} y={BB - 12} width={BR - BL} height={5} fill="#1A1A1A" />

      {/* ── 8. Black rubber stripe — across front face ───────────────── */}
      <Polygon
        points={`${FL},${BB - 12}  ${FR},${FB - 12}  ${FR},${FB - 7}  ${FL},${BB - 7}`}
        fill="#111111"
      />

      {/* ── 9. "SCHOOL BUS" lettering on the side ────────────────────── */}
      <SvgText
        x="38"
        y={BB - 14}
        textAnchor="middle"
        fontSize="5.5"
        fontWeight="bold"
        fill="#1A1A1A"
        letterSpacing="0.4"
      >
        SCHOOL BUS
      </SvgText>

      {/* ── 10. Emergency door outline — rear of side face ───────────── */}
      <Rect
        x={BR - 14} y={BT + 13}
        width={11} height={17}
        rx="1"
        fill="none"
        stroke="#555555"
        strokeWidth="0.9"
        strokeDasharray="2,1.5"
      />
      {/* Door centre split */}
      <Rect
        x={BR - 9} y={BT + 13}
        width="0.9" height={17}
        fill="#555555"
        opacity="0.55"
      />

      {/* ── 11. Bottom trim / side ────────────────────────────────────── */}
      <Rect x={BL} y={BB - 4} width={BR - BL} height={4} fill="#999999" rx="1" />

      {/* ── 12. Bottom trim / front face ─────────────────────────────── */}
      <Polygon
        points={`${FL},${BB - 4}  ${FR},${FB - 4}  ${FR},${FB}  ${FL},${BB}`}
        fill="#777777"
      />

      {/* ── 13. Headlights on front face ─────────────────────────────── */}
      <Rect
        x={FL + 2} y={FB - 10}
        width={8} height={4}
        rx="1"
        fill="#FFFDE0"
      />

      {/* ── 14. Wheels — left (visible side) ─────────────────────────── */}
      {/* Rear wheel */}
      <Ellipse cx="15" cy="49" rx="9" ry="4.5" fill="#1A1A1A" />
      <Ellipse cx="15" cy="49" rx="5" ry="2.5" fill="#444444" />
      {/* Front wheel */}
      <Ellipse cx="63" cy="49" rx="9" ry="4.5" fill="#1A1A1A" />
      <Ellipse cx="63" cy="49" rx="5" ry="2.5" fill="#444444" />

      {/* ── 15. Wheels — right (front face, partially visible) ───────── */}
      <Ellipse cx={FR - 5} cy={FB + 6} rx="6" ry="3.5" fill="#1A1A1A" />
      <Ellipse cx={FR - 5} cy={FB + 6} rx="3.5" ry="2" fill="#444444" />

      {/* ── 16. Bus number badge above the roof ──────────────────────── */}
      <Rect x="29" y="-9" width="22" height="12" rx="3" fill={badgeColor} />
      <SvgText
        x="40"
        y="0"
        textAnchor="middle"
        fontSize="7"
        fontWeight="bold"
        fill="#FFFFFF"
      >
        {busNumber || "01"}
      </SvgText>
    </Svg>
  );
}

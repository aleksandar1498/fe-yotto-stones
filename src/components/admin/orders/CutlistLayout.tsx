"use client";

import { useState } from "react";
import { fmtLen, pieceColorMap, pieceKey, readableText } from "@/lib/cutlist/colors";
import type { Offcut, Placement, SlabResult, SlabSpec } from "@/lib/cutlist/types";

function GrainArrow({ p, gap }: { p: Placement; gap: number }) {
  const x = p.xMm + gap / 2;
  const y = p.yMm + gap / 2;
  const w = Math.max(1, p.lengthMm - gap);
  const h = Math.max(1, p.widthMm - gap);
  const cx = x + w / 2;
  const cy = y + h / 2;
  const half = Math.max(8, Math.min(w, h) * 0.32);
  const head = Math.max(6, half * 0.42);
  const dx = p.rotated ? 0 : 1;
  const dy = p.rotated ? 1 : 0;
  const headPoints = (px: number, py: number, hx: number, hy: number) => {
    const nx = -hy;
    const ny = hx;
    const len = head * 1.5;
    return `${px + hx * len},${py + hy * len} ${px + nx * head},${py + ny * head} ${px - nx * head},${py - ny * head}`;
  };
  const a = { x: cx - dx * half, y: cy - dy * half };
  const b = { x: cx + dx * half, y: cy + dy * half };
  return (
    <g fill="#111827" opacity={0.75} pointerEvents="none">
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#111827" strokeWidth={head * 0.26} />
      <polygon points={headPoints(a.x, a.y, -dx, -dy)} />
      <polygon points={headPoints(b.x, b.y, dx, dy)} />
    </g>
  );
}

export default function CutlistLayout({
  slab,
  slabSpec,
  kerfMm,
  labelOf,
}: {
  slab: SlabResult;
  slabSpec: SlabSpec;
  kerfMm: number;
  labelOf?: (orderId: string) => string;
}) {
  const L = slab.lengthMm;
  const W = slab.widthMm;
  const [zoom, setZoom] = useState(1);
  const [hovered, setHovered] = useState<Placement | null>(null);

  const colors = pieceColorMap(slab.placements, kerfMm);
  const vw = L / zoom;
  const vh = W / zoom;
  // Padding between pieces reflects the saw kerf; a small floor keeps it visible when zoomed out.
  const gap = Math.max(kerfMm, L * 0.0035);
  const inset = gap / 2;
  const stroke = Math.max(kerfMm, L * 0.0012);
  const font = L / 64;
  const offcutText = readableText("#ecfdf5");
  const grainAxis = slabSpec.grainAxis ?? "length";

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <div className="flex overflow-hidden rounded-lg border border-darkGold text-xs font-semibold">
          <button className="px-3 py-1 text-darkGold hover:bg-darkGold/10" onClick={() => setZoom((z) => Math.min(8, z * 1.5))} aria-label="Увеличи">
            Зум +
          </button>
          <button className="px-3 py-1 text-darkGold hover:bg-darkGold/10" onClick={() => setZoom((z) => Math.max(1, z / 1.5))} aria-label="Намали">
            Зум −
          </button>
          <button className="px-3 py-1 text-darkGold hover:bg-darkGold/10" onClick={() => setZoom(1)}>
            Нулирай
          </button>
        </div>
        <span className="text-xs text-gray-500">
          Плоча {L / 10} × {W / 10} см · текстура по {grainAxis === "length" ? "дължина" : "ширина"} · прорез {kerfMm} мм
          (изобразен условно за видимост)
        </span>
      </div>

      <div className="overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-2">
        <svg
          viewBox={`-${L * 0.06} -${W * 0.06} ${vw * 1.12} ${vh * 1.12}`}
          className="h-auto w-full touch-none"
          style={{ minWidth: 280 }}
          role="img"
          aria-label={`Разположение на плоча ${slab.slabIndex}`}
          onMouseLeave={() => setHovered(null)}
        >
          {/* Slab body — the kerf color shows through the gaps between pieces. */}
          <rect x={0} y={0} width={L} height={W} fill="#94a3b8" stroke="#374151" strokeWidth={stroke * 1.5} />

          {/* Remaining / offcut areas with their sizes. */}
          {slab.offcuts.map((o: Offcut, i) => {
            const big = o.lengthMm > L * 0.05 && o.widthMm > W * 0.05;
            return (
              <g key={`off-${i}`} pointerEvents="none">
                <rect
                  x={o.xMm}
                  y={o.yMm}
                  width={o.lengthMm}
                  height={o.widthMm}
                  fill="#ecfdf5"
                  stroke="#10b981"
                  strokeWidth={stroke}
                  strokeDasharray={`${font} ${font}`}
                />
                {big && (
                  <text
                    x={o.xMm + o.lengthMm / 2}
                    y={o.yMm + o.widthMm / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={font}
                    fill={offcutText}
                  >
                    <tspan x={o.xMm + o.lengthMm / 2} dy={-font * 0.2}>
                      остатък
                    </tspan>
                    <tspan x={o.xMm + o.lengthMm / 2} dy={font * 1.15}>
                      {fmtLen(o.lengthMm)} × {fmtLen(o.widthMm)}
                    </tspan>
                  </text>
                )}
              </g>
            );
          })}

          {/* Placed pieces, each in its own color, inset so the kerf gap is visible. */}
          {slab.placements.map((p) => {
            const color = colors.get(pieceKey(p)) ?? "#4e79a7";
            const pw = Math.max(1, p.lengthMm - gap);
            const ph = Math.max(1, p.widthMm - gap);
            const px = p.xMm + inset;
            const py = p.yMm + inset;
            const showText = p.lengthMm > L * 0.07 && p.widthMm > W * 0.06;
            const label = labelOf?.(p.orderId) ?? p.orderId;
            const text = readableText(color);
            return (
              <g key={pieceKey(p)} onMouseEnter={() => setHovered(p)}>
                <rect x={px} y={py} width={pw} height={ph} fill={color} fillOpacity={hovered && hovered !== p ? 0.4 : 1} stroke="#1f2937" strokeWidth={stroke * 0.6}>
                  <title>
                    {`${p.label ?? p.pieceId} · ${label} · ${fmtLen(p.lengthMm)}×${fmtLen(p.widthMm)} мм${p.rotated ? " · завъртян" : ""}${p.grainRequired ? " · текстура" : ""}`}
                  </title>
                </rect>
                {p.grainRequired && <GrainArrow p={p} gap={gap} />}
                {showText && (
                  <text x={px + pw / 2} y={py + ph / 2} textAnchor="middle" dominantBaseline="middle" fontSize={font} fill={text} pointerEvents="none">
                    <tspan x={px + pw / 2} dy={-font * 0.2}>
                      {p.rotated ? "↻ " : ""}
                      {p.label ?? p.pieceId}
                    </tspan>
                    <tspan x={px + pw / 2} dy={font * 1.15}>
                      {fmtLen(p.lengthMm)} × {fmtLen(p.widthMm)}
                    </tspan>
                  </text>
                )}
              </g>
            );
          })}

          {/* Sheet dimensions around the diagram. */}
          <text x={L / 2} y={-W * 0.02} textAnchor="middle" fontSize={font * 0.9} fill="#374151">
            {fmtLen(L)} мм
          </text>
          <text x={-L * 0.02} y={W / 2} textAnchor="middle" fontSize={font * 0.9} fill="#374151" transform={`rotate(-90 ${-L * 0.02} ${W / 2})`}>
            {fmtLen(W)} мм
          </text>
        </svg>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
        {slab.placements.map((p) => (
          <span key={pieceKey(p)} className="inline-flex items-center gap-1.5" onMouseEnter={() => setHovered(p)}>
            <span className="inline-block h-3 w-3 rounded-sm border border-gray-300" style={{ backgroundColor: colors.get(pieceKey(p)) }} />
            {p.label ?? p.pieceId} · {labelOf?.(p.orderId) ?? p.orderId}
          </span>
        ))}
      </div>

      {hovered && (
        <div className="rounded-lg border border-gray-200 bg-white p-3 text-xs text-obsidian shadow-sm">
          <span className="font-semibold">{hovered.label ?? hovered.pieceId}</span> · {labelOf?.(hovered.orderId) ?? hovered.orderId} ·{" "}
          {fmtLen(hovered.lengthMm)}×{fmtLen(hovered.widthMm)} мм · X={fmtLen(hovered.xMm)} Y={fmtLen(hovered.yMm)}
          {hovered.rotated && " · завъртян 90°"}
          {hovered.grainRequired && " · със запазена текстура"}
        </div>
      )}
    </div>
  );
}

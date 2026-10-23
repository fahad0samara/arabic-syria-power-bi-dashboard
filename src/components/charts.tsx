import { useId, useState } from "react";
import { MAP_H, MAP_SHAPES, MAP_W } from "../data/mapShapes";

export const PALETTE = ["#1d4f48", "#4d8c84", "#e0b252", "#7fa8a3", "#c9892b"];

const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);

export function scaleColor(t: number) {
  const c = Math.max(0, Math.min(1, t));
  return `rgb(${lerp(226, 20, c)},${lerp(236, 66, c)},${lerp(230, 59, c)})`;
}

export function divergingColor(t: number) {
  const c = Math.max(-1, Math.min(1, t));
  if (c >= 0) return `rgb(${lerp(238, 20, c)},${lerp(233, 66, c)},${lerp(219, 59, c)})`;
  const k = -c;
  return `rgb(${lerp(238, 168, k)},${lerp(233, 80, k)},${lerp(219, 46, k)})`;
}

const DRAW_ORDER = [
  "homs", "hasakah", "deir", "raqqa", "aleppo", "idlib", "hama",
  "latakia", "tartus", "sweida", "daraa", "quneitra", "rif", "damascus",
];

const LABELS: Record<string, { x: number; y: number; fs: number }> = {
  aleppo: { x: 166, y: 112, fs: 14 },
  hasakah: { x: 434, y: 84, fs: 14 },
  deir: { x: 386, y: 220, fs: 14 },
  homs: { x: 228, y: 286, fs: 14 },
  raqqa: { x: 278, y: 132, fs: 13 },
  hama: { x: 132, y: 210, fs: 13 },
  rif: { x: 148, y: 396, fs: 13 },
  idlib: { x: 88, y: 154, fs: 12 },
  daraa: { x: 52, y: 448, fs: 12 },
  sweida: { x: 104, y: 458, fs: 12 },
  latakia: { x: 36, y: 172, fs: 11 },
  tartus: { x: 40, y: 238, fs: 11 },
  quneitra: { x: 28, y: 424, fs: 10 },
  damascus: { x: 54, y: 366, fs: 11 },
};

export function SyriaMap({
  values,
  names,
  active,
  format,
  onPick,
  selected,
  metricLabel,
  diverging = false,
}: {
  values: Record<string, number>;
  names: Record<string, string>;
  active: Set<string>;
  format: (v: number) => string;
  onPick: (id: string) => void;
  selected: string;
  metricLabel: string;
  diverging?: boolean;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const vals = Object.values(values);
  const max = Math.max(...vals);
  const min = Math.min(...vals);
  const span = max - min;
  const maxAbs = Math.max(Math.abs(max), Math.abs(min), 0.001);
  const norm = (v: number) => (span === 0 ? 0.5 : (v - min) / span);

  return (
    <div className="relative w-full select-none">
      <svg
        viewBox={`-6 -6 ${MAP_W + 12} ${MAP_H + 12}`}
        className="h-auto w-full"
        style={{ maxHeight: 370, direction: "rtl" }}
      >
        {DRAW_ORDER.map((id) => {
          const s = MAP_SHAPES[id];
          if (!s) return null;
          const on = active.has(id);
          const isSel = selected === id;
          const isHov = hover === id;
          const v = values[id] ?? 0;
          return (
            <path
              key={id}
              d={s.d}
              fillRule="evenodd"
              fill={on ? (diverging ? divergingColor(v / maxAbs) : scaleColor(norm(v))) : "#e6e0d4"}
              stroke={isSel ? "#8a6a1a" : isHov ? "#1d4f48" : "#fffdf8"}
              strokeWidth={isSel ? 2.8 : isHov ? 2 : 1.1}
              strokeLinejoin="round"
              className="cursor-pointer"
              onMouseEnter={() => setHover(id)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onPick(id)}
            />
          );
        })}

        {DRAW_ORDER.map((id) => {
          const s = MAP_SHAPES[id];
          const L = LABELS[id];
          if (!s || !L) return null;
          const on = active.has(id);
          const v = values[id] ?? 0;
          const strong = diverging ? Math.abs(v / maxAbs) > 0.5 : norm(v) > 0.55;
          return (
            <text
              key={id + "_lb"}
              x={L.x}
              y={L.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={L.fs}
              fontWeight={700}
              pointerEvents="none"
              fill={!on ? "#8a938c" : strong ? "#ffffff" : "#1d4f48"}
            >
              {names[id]}
            </text>
          );
        })}
      </svg>

      {hover && (
        <div className="pointer-events-none absolute top-1 right-1 z-10 rounded-lg bg-[#1d4f48] px-2.5 py-1.5 text-white shadow-lg">
          <div className="text-[13px] font-bold">{names[hover]}</div>
          <div className="text-[12px] text-[#e0b252]">
            {metricLabel}: {format(values[hover] ?? 0)}
          </div>
        </div>
      )}
    </div>
  );
}

export function HBars({
  items,
  selectedId,
  onPick,
  barColor = "#2a6f67",
  logScale = false,
}: {
  items: { id?: string; label: string; value: number; display: string }[];
  selectedId?: string;
  onPick?: (id: string) => void;
  barColor?: string;
  logScale?: boolean;
}) {
  const mag = (v: number) => (logScale ? Math.log10(Math.abs(v) + 1) : Math.abs(v));
  const max = Math.max(...items.map((i) => mag(i.value)), 0.001);

  return (
    <div className="space-y-1">
      {items.map((it, i) => {
        const sel = !!selectedId && it.id === selectedId;
        return (
          <div
            key={it.label}
            onClick={() => it.id && onPick?.(it.id)}
            className={`flex items-center gap-2 rounded-md px-1 py-0.5 text-[13px] ${
              onPick ? "cursor-pointer hover:bg-[#1d4f48]/5" : ""
            } ${sel ? "bg-[#e0b252]/20" : ""}`}
          >
            <span className={`w-[72px] shrink-0 truncate ${sel ? "font-bold" : ""}`}>{it.label}</span>
            <div className="h-[15px] flex-1 overflow-hidden rounded-sm bg-[#ece4d4]">
              <div
                className="bar-x h-full rounded-sm"
                style={{
                  width: `${Math.max((mag(it.value) / max) * 100, 1.5)}%`,
                  background: sel ? "#c9a227" : barColor,
                  animationDelay: `${i * 25}ms`,
                }}
              />
            </div>
            <span className="w-[58px] shrink-0 text-left text-[12px] font-semibold tabular-nums" dir="ltr">
              {it.display}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function Columns({
  items,
  height = 160,
  color = "#2a6f67",
  selectedLabel,
  onPick,
}: {
  items: { label: string; value: number; display: string }[];
  height?: number;
  color?: string;
  selectedLabel?: string;
  onPick?: (label: string) => void;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  const dense = items.length > 8;

  return (
    <div className="flex items-end justify-around gap-1 pt-2" style={{ height: height + 48 }}>
      {items.map((it, i) => {
        const sel = selectedLabel === it.label;
        return (
          <div
            key={it.label}
            onClick={() => onPick?.(it.label)}
            className={`flex h-full min-w-0 flex-1 flex-col items-center justify-end ${onPick ? "cursor-pointer" : ""}`}
          >
            <span
              className={`mb-1 tabular-nums ${dense ? "text-[10px]" : "text-[12px]"} ${
                sel ? "font-bold text-[#8a6a1a]" : "font-semibold text-[#1d4f48]/85"
              }`}
              dir="ltr"
            >
              {it.display}
            </span>
            <div
              className="bar-y w-full max-w-[48px] rounded-t"
              style={{
                height: Math.max((it.value / max) * height, 4),
                background: sel ? "#c9a227" : color,
                animationDelay: `${i * 35}ms`,
              }}
            />
            <span
              className={`mt-1.5 w-full truncate text-center leading-tight ${dense ? "text-[10px]" : "text-[11px]"} ${
                sel ? "font-bold" : "text-[#1d4f48]/75"
              }`}
            >
              {it.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function Donut({
  items,
  center,
  sub,
  size = 168,
  selectedLabel,
  onPick,
  valuesArePercent = false,
}: {
  items: { label: string; value: number }[];
  center: string;
  sub?: string;
  size?: number;
  selectedLabel?: string;
  onPick?: (label: string) => void;
  valuesArePercent?: boolean;
}) {
  const total = items.reduce((s, i) => s + i.value, 0) || 1;
  const r = 38;
  const C = 2 * Math.PI * r;
  let acc = 0;

  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          {items.map((it, i) => {
            const len = (it.value / total) * C;
            const sel = selectedLabel === it.label;
            const el = (
              <circle
                key={it.label}
                cx="50"
                cy="50"
                r={r}
                fill="none"
                stroke={sel ? "#c9a227" : PALETTE[i % PALETTE.length]}
                strokeWidth={sel ? 17 : 15}
                strokeDasharray={`${Math.max(len - 0.7, 0)} ${C}`}
                strokeDashoffset={-acc}
                className={onPick ? "cursor-pointer hover:opacity-80" : ""}
                onClick={() => onPick?.(it.label)}
              />
            );
            acc += len;
            return el;
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[28px] font-bold leading-none tabular-nums">{center}</span>
          {sub && <span className="mt-0.5 text-[11px] text-[#1d4f48]/65">{sub}</span>}
        </div>
      </div>

      <ul className="min-w-[140px] space-y-1 text-[12.5px]">
        {items.map((it, i) => {
          const sel = selectedLabel === it.label;
          const pct = (it.value / total) * 100;
          return (
            <li
              key={it.label}
              onClick={() => onPick?.(it.label)}
              className={`flex items-center justify-between gap-3 rounded px-1.5 py-1 ${
                onPick ? "cursor-pointer hover:bg-[#1d4f48]/5" : ""
              } ${sel ? "bg-[#e0b252]/20 font-bold" : ""}`}
            >
              <span className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: sel ? "#c9a227" : PALETTE[i % PALETTE.length] }}
                />
                {it.label}
              </span>
              <span className="shrink-0 font-semibold tabular-nums text-[#2a6f67]" dir="ltr">
                {valuesArePercent ? `${it.value}%` : `${it.value} (${pct.toFixed(0)}%)`}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function LineChart({
  data,
  format,
  height = 210,
  color = "#2a6f67",
  yMin,
  axis,
}: {
  data: { x: string; y: number }[];
  format: (v: number) => string;
  height?: number;
  color?: string;
  yMin?: number;
  axis?: (v: number) => string;
}) {
  const [hi, setHi] = useState<number | null>(null);
  const gid = useId().replace(/:/g, "");
  const W = 640;
  const H = height;
  const pad = axis ? { l: 44, r: 14, t: 26, b: 28 } : { l: 16, r: 16, t: 26, b: 28 };
  const ys = data.map((d) => d.y);
  const n = data.length;
  if (n === 0) return null;

  const lo = yMin ?? Math.min(0, ...ys);
  const up = Math.max(...ys, lo + 1) * 1.08;
  const inner = Math.max(n - 1, 1);

  const px = (i: number) => pad.l + (i / inner) * (W - pad.l - pad.r);
  const py = (v: number) => pad.t + (1 - (v - lo) / (up - lo)) * (H - pad.t - pad.b);

  const line = data.map((d, i) => `${i ? "L" : "M"}${px(i).toFixed(1)},${py(d.y).toFixed(1)}`).join("");
  const areaD = `${line}L${px(n - 1).toFixed(1)},${H - pad.b}L${px(0).toFixed(1)},${H - pad.b}Z`;

  const tip = hi !== null ? format(data[hi].y) : "";
  const tipW = Math.max(72, tip.length * 7.2 + 16);
  const tipX = hi !== null ? Math.min(Math.max(px(hi), 4 + tipW / 2), W - 4 - tipW / 2) : 0;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full select-none"
      style={{ direction: "ltr" }}
      onMouseLeave={() => setHi(null)}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {[0, 0.5, 1].map((t) => {
        const y = pad.t + t * (H - pad.t - pad.b);
        return (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y} y2={y} stroke="#e5dcc9" />
            {axis && (
              <text x={pad.l - 7} y={y + 3.5} textAnchor="end" fontSize="10" fill="#5d7a74">
                {axis(up - t * (up - lo))}
              </text>
            )}
          </g>
        );
      })}

      <path d={areaD} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />

      {data.map((d, i) => (
        <g key={d.x} onMouseEnter={() => setHi(i)}>
          <rect x={px(i) - 16} y={0} width={32} height={H} fill="transparent" className="cursor-pointer" />
          <circle
            cx={px(i)}
            cy={py(d.y)}
            r={hi === i ? 5.5 : 3}
            fill={hi === i ? "#c9a227" : color}
            stroke="#fffdf8"
            strokeWidth="1.6"
          />
          {(i % 2 === 0 || i === n - 1) && (
            <text x={px(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="#5d7a74">
              {d.x}
            </text>
          )}
        </g>
      ))}

      {hi !== null && (
        <g className="pointer-events-none">
          <line x1={px(hi)} x2={px(hi)} y1={pad.t} y2={H - pad.b} stroke="#c9a227" strokeDasharray="4 3" />
          <rect x={tipX - tipW / 2} y={Math.max(py(data[hi].y) - 30, 2)} width={tipW} height={22} rx={5} fill="#1d4f48" />
          <text x={tipX} y={Math.max(py(data[hi].y) - 19, 13)} textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">
            {tip}
          </text>
        </g>
      )}
    </svg>
  );
}

export function GroupedBars({
  items,
  labelA,
  labelB,
  colorA = "#b5c7c2",
  colorB = "#2a6f67",
  format,
}: {
  items: { label: string; a: number; b: number }[];
  labelA: string;
  labelB: string;
  colorA?: string;
  colorB?: string;
  format: (v: number) => string;
}) {
  const max = Math.max(...items.flatMap((i) => [i.a, i.b]), 1);
  return (
    <div>
      <div className="mb-2 flex items-center justify-end gap-4 text-[11px] font-semibold text-[#1d4f48]/85">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: colorA }} />
          {labelA}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: colorB }} />
          {labelB}
        </span>
      </div>
      <div className="space-y-1.5">
        {items.map((it) => (
          <div key={it.label} className="flex items-center gap-2 text-[12.5px]">
            <span className="w-[70px] shrink-0 truncate">{it.label}</span>
            <div className="flex-1 space-y-0.5">
              <div className="flex items-center gap-1.5">
                <div className="h-[8px] flex-1 overflow-hidden rounded-sm bg-[#ece4d4]">
                  <div className="bar-x h-full rounded-sm" style={{ width: `${(it.a / max) * 100}%`, background: colorA }} />
                </div>
                <span className="w-[50px] text-left text-[11px] tabular-nums text-[#1d4f48]/70" dir="ltr">
                  {format(it.a)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-[8px] flex-1 overflow-hidden rounded-sm bg-[#ece4d4]">
                  <div className="bar-x h-full rounded-sm" style={{ width: `${(it.b / max) * 100}%`, background: colorB }} />
                </div>
                <span className="w-[50px] text-left text-[11px] font-semibold tabular-nums" dir="ltr">
                  {format(it.b)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StackedBar({
  segments,
  format,
}: {
  segments: { label: string; value: number; color: string }[];
  format: (v: number) => string;
}) {
  const total = segments.reduce((s, i) => s + i.value, 0) || 1;
  return (
    <div>
      <div className="flex h-[18px] w-full overflow-hidden rounded-md bg-[#ece4d4]">
        {segments
          .filter((s) => s.value > 0)
          .map((s) => (
            <div
              key={s.label}
              style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
              title={`${s.label}: ${format(s.value)}`}
            />
          ))}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-x-5 gap-y-1 text-[11.5px]">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: s.color }} />
              {s.label}
            </span>
            <span className="font-semibold tabular-nums text-[#1d4f48]/85" dir="ltr">
              {format(s.value)} · {((s.value / total) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

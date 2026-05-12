// Honeycaps logo — two golden dome mushrooms, matching the GT encyclopedia art
export default function ShroomLogo({ size = 28 }) {
  // Keep the aspect ratio of the pair: ~52 wide × 40 tall
  const h = size
  const w = Math.round(size * 1.3)

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 52 40"
      width={w}
      height={h}
      style={{ flexShrink: 0, display: 'block' }}
      aria-label="Honeycaps — Shroomberg Terminal logo"
    >
      {/* ── Small mushroom (right, partially behind) ── */}

      {/* stem */}
      <rect x="33" y="27" width="8" height="13" rx="4" fill="#EDD898" />

      {/* gills / cap underside shadow */}
      <ellipse cx="37" cy="28.5" rx="9" ry="2.5" fill="#9A6208" opacity="0.55" />

      {/* cap dome */}
      <path d="M28 28 Q28 16 37 16 Q46 16 46 28 Z" fill="#C07A10" />

      {/* cap top highlight (lighter golden centre) */}
      <ellipse cx="37" cy="20.5" rx="5.5" ry="3.5" fill="#E09C28" opacity="0.55" />

      {/* ── Large mushroom (left, in front) ── */}

      {/* stem */}
      <rect x="14" y="22" width="11" height="18" rx="5.5" fill="#EDD898" />

      {/* gills / cap underside shadow */}
      <ellipse cx="19.5" cy="23.5" rx="15" ry="3.5" fill="#9A6208" opacity="0.55" />

      {/* cap dome — Q bezier creates the classic dome arch */}
      <path d="M5 23 Q5 7 19.5 7 Q34 7 34 23 Z" fill="#C07A10" />

      {/* cap top highlight */}
      <ellipse cx="19.5" cy="13" rx="8.5" ry="5" fill="#E09C28" opacity="0.55" />

      {/* subtle rim edge line */}
      <path
        d="M5 23 Q5 7 19.5 7 Q34 7 34 23"
        stroke="#A86410"
        strokeWidth="0.6"
        fill="none"
        opacity="0.4"
      />
    </svg>
  )
}

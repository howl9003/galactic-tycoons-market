export default function ShroomLogo({ size = 28 }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      style={{ flexShrink: 0, display: 'block' }}
      aria-label="Shroomberg Terminal logo"
    >
      {/* Stem */}
      <path d="M12 21 Q11.5 29 16 29 Q20.5 29 20 21" fill="var(--bg3)" />
      {/* Gill line */}
      <path d="M10 22 Q16 24 22 22" stroke="var(--border)" strokeWidth="0.8" fill="none" />
      {/* Cap */}
      <path d="M3 23 Q2 9 16 7 Q30 9 29 23 Z" fill="var(--accent)" />
      {/* Sheen */}
      <path
        d="M7 18 Q10 11 16 8.5"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Spots */}
      <circle cx="10"  cy="18" r="2.2" fill="rgba(255,255,255,0.75)" />
      <circle cx="18"  cy="13" r="2.8" fill="rgba(255,255,255,0.75)" />
      <circle cx="24"  cy="19" r="1.8" fill="rgba(255,255,255,0.75)" />
    </svg>
  )
}

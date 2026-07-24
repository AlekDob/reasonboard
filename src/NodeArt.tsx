/** Generic whiteboard-style SVG fallback when a section has no image */

type Props = { id?: string };

export function NodeArt(_props: Props) {
  return (
    <svg viewBox="0 0 160 90" className="node-art-svg" aria-hidden>
      <rect
        x="28"
        y="16"
        width="104"
        height="58"
        rx="10"
        fill="#fff"
        stroke="#111"
        strokeWidth="2"
      />
      <path
        d="M42 32h76M42 44h64M42 56h48"
        stroke="#bbb"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle
        cx="128"
        cy="66"
        r="14"
        fill="rgba(13,148,136,0.15)"
        stroke="#0d9488"
        strokeWidth="2"
      />
      <text
        x="128"
        y="71"
        textAnchor="middle"
        fontSize="12"
        fontWeight="800"
        fill="#0d9488"
        fontFamily="Inter,sans-serif"
      >
        ?
      </text>
    </svg>
  );
}

import React from "react";

type P = { size?: number; color?: string; stroke?: number };
const base = (size = 22, color = "currentColor", stroke = 1.8) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: color,
  strokeWidth: stroke,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export const PlusIcon = ({ size, color, stroke }: P) => (
  <svg {...base(size, color, stroke)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const SearchIcon = ({ size, color, stroke }: P) => (
  <svg {...base(size, color, stroke)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.2-3.2" />
  </svg>
);
export const FolderIcon = ({ size, color, stroke }: P) => (
  <svg {...base(size, color, stroke)}>
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </svg>
);
export const GridIcon = ({ size, color, stroke }: P) => (
  <svg {...base(size, color, stroke)}>
    <rect x="3" y="3" width="8" height="6" rx="1.5" />
    <rect x="13" y="3" width="8" height="6" rx="1.5" />
    <rect x="3" y="13" width="8" height="8" rx="1.5" />
    <rect x="13" y="13" width="8" height="8" rx="1.5" />
  </svg>
);
export const PaletteIcon = ({ size, color, stroke }: P) => (
  <svg {...base(size, color, stroke)}>
    <path d="M12 3a9 9 0 1 0 0 18c1.2 0 2-.9 2-2 0-1.2-1-1.6-1-2.6 0-.7.6-1.4 1.4-1.4H17a4 4 0 0 0 4-4c0-4.5-4-8-9-8z" />
    <circle cx="7.5" cy="11" r="1" fill={color || "currentColor"} stroke="none" />
    <circle cx="10" cy="7.5" r="1" fill={color || "currentColor"} stroke="none" />
    <circle cx="14.5" cy="7.5" r="1" fill={color || "currentColor"} stroke="none" />
  </svg>
);
export const BellIcon = ({ size, color, stroke }: P) => (
  <svg {...base(size, color, stroke)}>
    <path d="M6 9a6 6 0 0 1 12 0c0 4 1.5 5 2 6H4c.5-1 2-2 2-6Z" />
    <path d="M10.5 20a1.8 1.8 0 0 0 3 0" />
  </svg>
);
export const MicIcon = ({ size, color, stroke }: P) => (
  <svg {...base(size, color, stroke)}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M6 11a6 6 0 0 0 12 0M12 17v4" />
  </svg>
);
export const ImageIcon = ({ size, color, stroke }: P) => (
  <svg {...base(size, color, stroke)}>
    <rect x="3" y="4" width="18" height="16" rx="2.5" />
    <circle cx="8.5" cy="9.5" r="1.6" />
    <path d="m4 18 5-5 4 3.5L17 12l3 3" />
  </svg>
);
export const ArrowUpIcon = ({ size, color, stroke }: P) => (
  <svg {...base(size, color, stroke)}>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </svg>
);
export const ChevronDownIcon = ({ size, color, stroke }: P) => (
  <svg {...base(size, color, stroke)}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);
export const ArrowUpRightIcon = ({ size, color, stroke }: P) => (
  <svg {...base(size, color, stroke)}>
    <path d="M7 17 17 7M9 7h8v8" />
  </svg>
);
export const SparkIcon = ({ size, color, stroke }: P) => (
  <svg {...base(size, color, stroke)}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
  </svg>
);
export const LayoutAutoIcon = ({ size, color, stroke }: P) => (
  <svg {...base(size, color, stroke)}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M3 9h18M9 9v11" />
  </svg>
);
export const DocIcon = ({ size, color, stroke }: P) => (
  <svg {...base(size, color, stroke)}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5M8.5 13h7M8.5 16.5h7" />
  </svg>
);
export const BookIcon = ({ size, color, stroke }: P) => (
  <svg {...base(size, color, stroke)}>
    <path d="M4 5a2 2 0 0 1 2-2h6v18H6a2 2 0 0 1-2-2z" />
    <path d="M12 3h6a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6" />
  </svg>
);
export const MegaphoneIcon = ({ size, color, stroke }: P) => (
  <svg {...base(size, color, stroke)}>
    <path d="M3 11v2a1 1 0 0 0 1 1h2l4 4V6L6 10H4a1 1 0 0 0-1 1Z" />
    <path d="M14 8a4 4 0 0 1 0 8M10 18l1 3" />
  </svg>
);
export const CalendarIcon = ({ size, color, stroke }: P) => (
  <svg {...base(size, color, stroke)}>
    <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </svg>
);
export const StarIcon = ({ size = 14, color = "#0b1416" }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="m12 2 2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.8 6.1 20.2l1.2-6.6L2.5 9l6.6-.9z" />
  </svg>
);

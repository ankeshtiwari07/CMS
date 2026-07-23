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
export const LayersIcon = ({ size, color, stroke }: P) => (
  <svg {...base(size, color, stroke)}>
    <path d="M12 2 2 7l10 5 10-5-10-5Z" />
    <path d="m2 12 10 5 10-5" />
    <path d="m2 17 10 5 10-5" />
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
export const PaperclipIcon = ({ size, color, stroke }: P) => (
  <svg {...base(size, color, stroke)}>
    <path d="M21 11.5 12.5 20a5 5 0 0 1-7-7l8-8a3.5 3.5 0 0 1 5 5l-8 8a2 2 0 0 1-3-3l7.5-7.5" />
  </svg>
);
export const ClockIcon = ({ size, color, stroke }: P) => (
  <svg {...base(size, color, stroke)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
export const MonitorIcon = ({ size, color, stroke }: P) => (
  <svg {...base(size, color, stroke)}>
    <rect x="3" y="4" width="18" height="12" rx="2" />
    <path d="M8 20h8M12 16v4" />
  </svg>
);
export const GlobeIcon = ({ size, color, stroke }: P) => (
  <svg {...base(size, color, stroke)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18" />
  </svg>
);
export const MailIcon = ({ size, color, stroke }: P) => (
  <svg {...base(size, color, stroke)}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m4 7 8 6 8-6" />
  </svg>
);
export const TranslateIcon = ({ size, color, stroke }: P) => (
  <svg {...base(size, color, stroke)}>
    <path d="M4 5h7M7.5 5v2c0 3-2 6-4 7M5 11c1.5 1.5 3.5 2.5 5 2.5M12 20l4-9 4 9M13.5 17h5" />
  </svg>
);
export const CodeIcon = ({ size, color, stroke }: P) => (
  <svg {...base(size, color, stroke)}>
    <path d="m9 8-4 4 4 4M15 8l4 4-4 4" />
  </svg>
);
export const CheckIcon = ({ size, color, stroke }: P) => (
  <svg {...base(size, color, stroke)}>
    <path d="m5 12 5 5 9-10" />
  </svg>
);
export const XIcon = ({ size, color, stroke }: P) => (
  <svg {...base(size, color, stroke)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);
export const TrashIcon = ({ size, color, stroke }: P) => (
  <svg {...base(size, color, stroke)}>
    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13M10 11v6M14 11v6" />
  </svg>
);
export const PencilIcon = ({ size, color, stroke }: P) => (
  <svg {...base(size, color, stroke)}>
    <path d="M4 20h4l10-10a2.83 2.83 0 0 0-4-4L4 16z" />
  </svg>
);
export const VideoIcon = ({ size, color, stroke }: P) => (
  <svg {...base(size, color, stroke)}>
    <rect x="3" y="6" width="13" height="12" rx="2" />
    <path d="M16 10l5-3v10l-5-3z" />
  </svg>
);
export const PlayIcon = ({ size, color, stroke }: P) => (
  <svg {...base(size, color, stroke)}>
    <path d="M8 5v14l11-7z" />
  </svg>
);
export const FileIcon = ({ size, color, stroke }: P) => (
  <svg {...base(size, color, stroke)}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
  </svg>
);
export const SquareIcon = ({ size, color, stroke }: P) => (
  <svg {...base(size, color, stroke)}>
    <rect x="5" y="5" width="14" height="14" rx="1.5" />
  </svg>
);
export const PanelLeftIcon = ({ size, color, stroke }: P) => (
  <svg {...base(size, color, stroke)}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M9 4v16" />
  </svg>
);
export const DotsVerticalIcon = ({ size, color, stroke }: P) => (
  <svg {...base(size, color, stroke)}>
    <circle cx="12" cy="5" r="1.4" fill={color || "currentColor"} stroke="none" />
    <circle cx="12" cy="12" r="1.4" fill={color || "currentColor"} stroke="none" />
    <circle cx="12" cy="19" r="1.4" fill={color || "currentColor"} stroke="none" />
  </svg>
);
export const BookmarkIcon = ({ size, color, stroke }: P) => (
  <svg {...base(size, color, stroke)}>
    <path d="M6 4h12v16l-6-4-6 4z" />
  </svg>
);
export const BuildingIcon = ({ size, color, stroke }: P) => (
  <svg {...base(size, color, stroke)}>
    <rect x="5" y="3" width="14" height="18" rx="1.5" />
    <path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 21v-3h4v3" />
  </svg>
);
export const BoxIcon = ({ size, color, stroke }: P) => (
  <svg {...base(size, color, stroke)}>
    <path d="M12 3 4 7v10l8 4 8-4V7z" />
    <path d="m4 7 8 4 8-4M12 11v10" />
  </svg>
);
export const QuestionIcon = ({ size, color, stroke }: P) => (
  <svg {...base(size, color, stroke)}>
    <path d="M5 4h14a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H9l-4 4z" />
    <path d="M9.5 9a2.5 2.5 0 1 1 3 2.5v1M12 15.5h.01" />
  </svg>
);
export const UserCircleIcon = ({ size, color, stroke }: P) => (
  <svg {...base(size, color, stroke)}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="10" r="3" />
    <path d="M6.5 19a6 6 0 0 1 11 0" />
  </svg>
);
export const GalleryIcon = ({ size, color, stroke }: P) => (
  <svg {...base(size, color, stroke)}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <circle cx="8.5" cy="10" r="1.4" />
    <path d="m4 17 5-5 4 3.5L17 12l3 3" />
  </svg>
);
export const StarIcon = ({ size = 14, color = "var(--background)" }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="m12 2 2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.8 6.1 20.2l1.2-6.6L2.5 9l6.6-.9z" />
  </svg>
);

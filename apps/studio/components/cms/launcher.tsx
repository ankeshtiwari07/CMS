"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DocIcon, BookIcon, MegaphoneIcon, CalendarIcon, BoxIcon, BookmarkIcon, QuestionIcon,
  UserCircleIcon, GalleryIcon, MicIcon, BuildingIcon,
} from "@/components/icons";

// Tiles map to the manage route; the 4 core content types open the tabbed form,
// the rest open a single-type form. `type` is the console content-types key.
const TILES = [
  { type: "blog", label: "BLOG", Icon: DocIcon },
  { type: "articles", label: "ARTICLE", Icon: BookIcon },
  { type: "press", label: "PRESS RELEASES", Icon: MegaphoneIcon },
  { type: "events", label: "EVENTS", Icon: CalendarIcon },
  { type: "products", label: "PRODUCTS", Icon: BoxIcon },
  { type: "caseStudies", label: "CASE STUDIES", Icon: BookmarkIcon },
  { type: "faqs", label: "FAQ", Icon: QuestionIcon },
  { type: "leadership", label: "LEADERSHIP PROFILES", Icon: UserCircleIcon },
  { type: "careers", label: "CAREERS", Icon: BuildingIcon },
  { type: "mediaGalleries", label: "MEDIA GALLERIES", Icon: GalleryIcon },
  { type: "campaignMicrosites", label: "CAMPAIGN MICROSITES", Icon: MicIcon },
];

export default function Launcher() {
  const router = useRouter();
  const [hover, setHover] = useState<string | null>(null);
  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "40px 28px 60px" }}>
      <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 700, margin: "0 0 4px" }}>Content Management</h1>
      <p style={{ color: "rgba(255,255,255,0.72)", margin: "0 0 28px", fontSize: 14.5 }}>
        Choose a content type to create and manage.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 18 }}>
        {TILES.map(({ type, label, Icon }) => (
          <button
            key={type}
            onMouseEnter={() => setHover(type)}
            onMouseLeave={() => setHover(null)}
            onClick={() => router.push(`/cms/manage?type=${type}`)}
            style={{
              aspectRatio: "1 / 1",
              border: "1px solid rgba(194,229,75,0.25)",
              borderRadius: 18,
              background: "linear-gradient(150deg, rgba(191,235,200,0.92) 0%, rgba(212,240,150,0.92) 100%)",
              boxShadow: hover === type ? "0 12px 30px rgba(0,0,0,0.35)" : "0 6px 18px rgba(0,0,0,0.25)",
              transform: hover === type ? "translateY(-3px)" : "none",
              transition: "all .15s",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
              color: "#0b1416",
              cursor: "pointer",
              padding: 16,
            }}
          >
            <Icon size={30} color="#0b2a24" />
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textAlign: "center", lineHeight: 1.25 }}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

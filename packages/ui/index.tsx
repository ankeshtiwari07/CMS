import React from "react";
import { studio, cms, shared } from "@humain/design-tokens";

/* ------------------------------------------------------------------ *
 * Minimal Lexical -> React serializer (no heavy deps in the web app). *
 * Handles paragraphs, headings, lists, quotes, links and text marks.  *
 * ------------------------------------------------------------------ */
type LexNode = any;

function textWithMarks(node: LexNode, key: number) {
  let el: React.ReactNode = node.text ?? "";
  const f = node.format ?? 0;
  if (f & 1) el = <strong key={`b${key}`}>{el}</strong>;
  if (f & 2) el = <em key={`i${key}`}>{el}</em>;
  if (f & 8) el = <u key={`u${key}`}>{el}</u>;
  if (f & 4) el = <s key={`s${key}`}>{el}</s>;
  if (f & 16) el = <code key={`c${key}`}>{el}</code>;
  return <React.Fragment key={key}>{el}</React.Fragment>;
}

function renderChildren(children: LexNode[] = []) {
  return children.map((c, i) => renderNode(c, i));
}

function renderNode(node: LexNode, key: number): React.ReactNode {
  if (!node) return null;
  switch (node.type) {
    case "text":
      return textWithMarks(node, key);
    case "linebreak":
      return <br key={key} />;
    case "paragraph":
      return (
        <p key={key} style={{ margin: "0 0 16px", lineHeight: 1.7 }}>
          {renderChildren(node.children)}
        </p>
      );
    case "heading": {
      const Tag = (node.tag || "h2") as keyof React.JSX.IntrinsicElements;
      return (
        <Tag key={key} style={{ margin: "28px 0 12px", lineHeight: 1.25 }}>
          {renderChildren(node.children)}
        </Tag>
      );
    }
    case "quote":
      return (
        <blockquote
          key={key}
          style={{
            borderInlineStart: `3px solid ${studio.accent.teal}`,
            margin: "20px 0",
            padding: "4px 0 4px 16px",
            color: studio.text.muted,
          }}
        >
          {renderChildren(node.children)}
        </blockquote>
      );
    case "list": {
      const Tag = node.listType === "number" ? "ol" : "ul";
      return (
        <Tag key={key} style={{ margin: "0 0 16px", paddingInlineStart: 24, lineHeight: 1.7 }}>
          {renderChildren(node.children)}
        </Tag>
      );
    }
    case "listitem":
      return <li key={key}>{renderChildren(node.children)}</li>;
    case "link": {
      const url = node.fields?.url || node.url || "#";
      return (
        <a key={key} href={url} style={{ color: studio.accent.teal }}>
          {renderChildren(node.children)}
        </a>
      );
    }
    default:
      return node.children ? <React.Fragment key={key}>{renderChildren(node.children)}</React.Fragment> : null;
  }
}

export function RichTextRender({ value }: { value: any }) {
  const root = value?.root;
  if (!root) return null;
  // `hf-richtext` re-enables list markers and paragraph rhythm that Tailwind
  // Preflight (shipped inside @humain/ui/styles.css) strips. See globals.css.
  return <div className="hf-richtext" style={{ color: studio.text.ink }}>{renderChildren(root.children)}</div>;
}

/* ------------------------------------------------------------------ *
 * Block renderers                                                     *
 * ------------------------------------------------------------------ */
type Block = { blockType: string; [k: string]: any };

const section = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  maxWidth: 1080,
  margin: "0 auto",
  padding: `${shared.space[8]}px ${shared.space[6]}px`,
  ...extra,
});

const Hero = (b: Block) => {
  const dark = b.theme === "cms";
  return (
    <section style={{ background: dark ? cms.bg.deepTeal : studio.mint.tint, color: dark ? "#fff" : studio.text.ink }}>
      <div style={section({ padding: `${Math.round(shared.space[8] * 1.6)}px ${shared.space[6]}px` })}>
        <h1 style={{ fontSize: 44, fontWeight: 800, margin: 0, lineHeight: 1.1 }}>{b.heading}</h1>
        {b.subheading && (
          <p style={{ fontSize: 19, marginTop: 14, color: dark ? "rgba(255,255,255,0.8)" : studio.text.muted }}>
            {b.subheading}
          </p>
        )}
        {b.cta?.label && (
          <a
            href={b.cta.href || "#"}
            style={{
              display: "inline-block",
              marginTop: 24,
              padding: "12px 22px",
              borderRadius: shared.radius.pill,
              background: dark ? cms.accent.lime : studio.accent.teal,
              color: dark ? "#0b1416" : "#fff",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            {b.cta.label}
          </a>
        )}
      </div>
    </section>
  );
};

const RichText = (b: Block) => (
  <section style={section()}>
    <RichTextRender value={b.content} />
  </section>
);

const Cards = (b: Block) => (
  <section style={section()}>
    {b.title && <h2 style={{ color: studio.text.ink, marginBottom: 20 }}>{b.title}</h2>}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: shared.space[4] }}>
      {(b.cards ?? []).map((c: any, i: number) => (
        <article key={i} style={{ border: `1px solid ${studio.line.hairline}`, borderRadius: shared.radius.card, padding: shared.space[6] }}>
          <h3 style={{ color: studio.text.ink, marginTop: 0 }}>{c.title}</h3>
          <p style={{ color: studio.text.muted, margin: 0 }}>{c.body}</p>
        </article>
      ))}
    </div>
  </section>
);

const Cta = (b: Block) => (
  <section style={{ background: cms.card.mint }}>
    <div style={section({ textAlign: "center" })}>
      {b.heading && <h2 style={{ color: cms.action.publish, fontSize: 30 }}>{b.heading}</h2>}
      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 16 }}>
        {(b.buttons ?? []).map((btn: any, i: number) => (
          <a
            key={i}
            href={btn.href || "#"}
            style={{
              padding: "12px 22px",
              borderRadius: shared.radius.pill,
              background: btn.style === "secondary" ? cms.action.publish : studio.accent.teal,
              color: "#fff",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            {btn.label}
          </a>
        ))}
      </div>
    </div>
  </section>
);

const Stats = (b: Block) => (
  <section style={section()}>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: shared.space[6], textAlign: "center" }}>
      {(b.stats ?? []).map((s: any, i: number) => (
        <div key={i}>
          <div style={{ fontSize: 40, fontWeight: 800, color: studio.accent.teal }}>{s.value}</div>
          <div style={{ color: studio.text.muted }}>{s.label}</div>
        </div>
      ))}
    </div>
  </section>
);

const Quote = (b: Block) => (
  <section style={section({ textAlign: "center" })}>
    <p style={{ fontSize: 26, fontWeight: 600, color: studio.text.ink, lineHeight: 1.4 }}>&ldquo;{b.quote}&rdquo;</p>
    {b.attribution && <p style={{ color: studio.text.muted }}>— {b.attribution}</p>}
  </section>
);

const Faq = (b: Block) => (
  <section style={section()}>
    {b.title && <h2 style={{ color: studio.text.ink }}>{b.title}</h2>}
    {(b.items ?? []).map((it: any, i: number) => (
      <details key={i} style={{ borderBottom: `1px solid ${studio.line.hairline}`, padding: "14px 0" }}>
        <summary style={{ fontWeight: 600, color: studio.text.ink, cursor: "pointer" }}>{it.question}</summary>
        <div style={{ marginTop: 8 }}>
          <RichTextRender value={it.answer} />
        </div>
      </details>
    ))}
  </section>
);

const Features = (b: Block) => (
  <section style={section()}>
    {b.title && <h2 style={{ color: studio.text.ink, marginBottom: 20 }}>{b.title}</h2>}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: shared.space[6] }}>
      {(b.features ?? []).map((f: any, i: number) => (
        <div key={i}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: studio.mint.light, marginBottom: 12 }} />
          <h3 style={{ margin: "0 0 6px", color: studio.text.ink }}>{f.title}</h3>
          <p style={{ margin: 0, color: studio.text.muted }}>{f.description}</p>
        </div>
      ))}
    </div>
  </section>
);

const Steps = (b: Block) => (
  <section style={section()}>
    {b.title && <h2 style={{ color: studio.text.ink, marginBottom: 20 }}>{b.title}</h2>}
    <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: shared.space[4] }}>
      {(b.steps ?? []).map((s: any, i: number) => (
        <li key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          <span style={{ flexShrink: 0, width: 32, height: 32, borderRadius: "50%", background: studio.accent.teal, color: "#fff", display: "grid", placeItems: "center", fontWeight: 700 }}>
            {i + 1}
          </span>
          <div>
            <h3 style={{ margin: "4px 0 4px", color: studio.text.ink }}>{s.title}</h3>
            <p style={{ margin: 0, color: studio.text.muted }}>{s.body}</p>
          </div>
        </li>
      ))}
    </ol>
  </section>
);

const Logos = (b: Block) => (
  <section style={section({ textAlign: "center" })}>
    {b.title && <p style={{ color: studio.text.muted, textTransform: "uppercase", letterSpacing: "0.1em", fontSize: 13 }}>{b.title}</p>}
    <div style={{ display: "flex", gap: shared.space[8], justifyContent: "center", flexWrap: "wrap", opacity: 0.8 }}>
      {(b.logos ?? []).map((l: any, i: number) => (
        <span key={i} style={{ fontWeight: 700, color: studio.text.muted }}>{l.name}</span>
      ))}
    </div>
  </section>
);

const Banner = (b: Block) => (
  <section style={{ background: studio.accent.teal, color: "#fff" }}>
    <div style={section({ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" })}>
      <span style={{ fontSize: 18, fontWeight: 600 }}>{b.text}</span>
      {b.cta?.label && (
        <a href={b.cta.href || "#"} style={{ padding: "10px 18px", borderRadius: shared.radius.pill, background: "#fff", color: studio.accent.teal, fontWeight: 700, textDecoration: "none" }}>
          {b.cta.label}
        </a>
      )}
    </div>
  </section>
);

const Embed = (b: Block) => {
  const src = b.provider === "youtube" ? String(b.url || "").replace("watch?v=", "embed/") : b.url;
  return (
    <section style={section()}>
      <div style={{ position: "relative", paddingTop: "56.25%", borderRadius: shared.radius.card, overflow: "hidden" }}>
        <iframe src={src} title="embed" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }} allowFullScreen />
      </div>
    </section>
  );
};

const Placeholder = (label: string) => (b: Block) =>
  (
    <section style={section()}>
      <div style={{ border: `1px dashed ${studio.line.hairline}`, borderRadius: shared.radius.card, padding: shared.space[6], color: studio.text.muted }}>
        {label}
        {b.caption ? ` — ${b.caption}` : ""}
      </div>
    </section>
  );

const registry: Record<string, (b: Block) => React.JSX.Element> = {
  hero: Hero,
  richText: RichText,
  cards: Cards,
  cta: Cta,
  stats: Stats,
  quote: Quote,
  faqBlock: Faq,
  features: Features,
  steps: Steps,
  logos: Logos,
  banner: Banner,
  embed: Embed,
  media: Placeholder("Media"),
  gallery: Placeholder("Gallery"),
  pricing: Placeholder("Pricing"),
};

export function RenderBlocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {(blocks ?? []).map((b, i) => {
        const C = registry[b.blockType];
        return C ? <div key={i}>{C(b)}</div> : null;
      })}
    </>
  );
}

import React from "react";
import { studio, shared } from "@humain/design-tokens";

// CMS-agnostic block renderer. Maps blockType -> component via a stable contract.
type Block = { blockType: string; [k: string]: any };

const Hero = (b: Block) => (
  <section style={{ padding: shared.space[8], background: studio.mint.tint, borderRadius: shared.radius.card }}>
    <h1 style={{ color: studio.text.ink, margin: 0 }}>{b.heading}</h1>
    {b.subheading && <p style={{ color: studio.text.muted }}>{b.subheading}</p>}
    {b.cta?.label && <a href={b.cta.href} style={{ display: "inline-block", marginTop: shared.space[4], padding: "10px 18px", borderRadius: shared.radius.pill, background: studio.accent.teal, color: "#fff", textDecoration: "none" }}>{b.cta.label}</a>}
  </section>
);

const RichText = (b: Block) => (
  <div style={{ color: studio.text.ink, lineHeight: 1.6 }}
       dangerouslySetInnerHTML={{ __html: typeof b.content === "string" ? b.content : "" }} />
);

const Cards = (b: Block) => (
  <section>
    {b.title && <h2 style={{ color: studio.text.ink }}>{b.title}</h2>}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: shared.space[4] }}>
      {(b.cards ?? []).map((c: any, i: number) => (
        <article key={i} style={{ border: `1px solid ${studio.line.hairline}`, borderRadius: shared.radius.card, padding: shared.space[4] }}>
          <h3 style={{ color: studio.text.ink }}>{c.title}</h3>
          <p style={{ color: studio.text.muted }}>{c.body}</p>
        </article>
      ))}
    </div>
  </section>
);

const registry: Record<string, (b: Block) => JSX.Element> = {
  hero: Hero, richText: RichText, cards: Cards,
};

export function RenderBlocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        const C = registry[b.blockType];
        return C ? <div key={i} style={{ margin: `${shared.space[6]}px 0` }}>{C(b)}</div> : null;
      })}
    </>
  );
}

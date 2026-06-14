"use client";
import React from "react";

// Lightweight, dependency-free Markdown → React renderer for assistant replies.
// Covers what the agents emit: headings, bold/italic/code, links, ordered &
// unordered lists, blockquotes, fenced code, tables and horizontal rules.
// (No new npm dependency — keeps the frozen-lockfile Docker build clean.)

const codeStyle: React.CSSProperties = {
  background: "var(--mint-pill)", color: "var(--studio-teal-dark)", padding: "1px 5px",
  borderRadius: 5, fontFamily: "var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)", fontSize: "0.88em",
};
const linkStyle: React.CSSProperties = { color: "var(--studio-primary)", fontWeight: 600, textDecoration: "underline" };

function renderInline(text: string, kp: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /(`([^`]+)`)|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(_([^_]+)_)|(\[([^\]]+)\]\(([^)\s]+)\))/;
  let rest = text;
  let i = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(rest))) {
    if (m.index > 0) out.push(rest.slice(0, m.index));
    const k = `${kp}-${i++}`;
    if (m[1]) out.push(<code key={k} style={codeStyle}>{m[2]}</code>);
    else if (m[3]) out.push(<strong key={k}>{m[4]}</strong>);
    else if (m[5]) out.push(<em key={k}>{m[6]}</em>);
    else if (m[7]) out.push(<em key={k}>{m[8]}</em>);
    else if (m[9]) out.push(<a key={k} href={m[11]} target="_blank" rel="noreferrer" style={linkStyle}>{m[10]}</a>);
    rest = rest.slice(m.index + m[0].length);
  }
  if (rest) out.push(rest);
  return out;
}

export default function Markdown({ text }: { text: string }) {
  const lines = String(text || "").replace(/\r\n/g, "\n").split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;
  const k = () => `b${key++}`;

  while (i < lines.length) {
    const line = lines[i];

    // blank
    if (!line.trim()) { i++; continue; }

    // fenced code
    const fence = line.match(/^\s*```(\w*)\s*$/);
    if (fence) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) { buf.push(lines[i]); i++; }
      i++; // closing fence
      blocks.push(
        <pre key={k()} style={{ background: "#0B1416", color: "#E6F2EE", padding: "12px 14px", borderRadius: 10, overflowX: "auto", fontSize: 13, lineHeight: 1.5, margin: "8px 0" }}>
          <code>{buf.join("\n")}</code>
        </pre>,
      );
      continue;
    }

    // heading
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      const sizes = [21, 18, 16, 15, 14, 13];
      blocks.push(
        <div key={k()} style={{ fontSize: sizes[level - 1], fontWeight: 700, color: "var(--ink)", margin: level <= 2 ? "16px 0 6px" : "12px 0 4px", lineHeight: 1.3 }}>
          {renderInline(h[2], k())}
        </div>,
      );
      i++;
      continue;
    }

    // horizontal rule
    if (/^\s*([-*_])\1\1+\s*$/.test(line)) {
      blocks.push(<hr key={k()} style={{ border: "none", borderTop: "1px solid var(--hairline)", margin: "14px 0" }} />);
      i++;
      continue;
    }

    // table: header row + separator row of dashes
    if (/^\s*\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1]) && lines[i + 1].includes("-")) {
      const cells = (row: string) => row.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      const header = cells(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) { rows.push(cells(lines[i])); i++; }
      blocks.push(
        <div key={k()} style={{ overflowX: "auto", margin: "10px 0" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13.5 }}>
            <thead>
              <tr>{header.map((c, j) => <th key={j} style={{ textAlign: "left", padding: "7px 10px", background: "var(--mint-pill)", color: "var(--studio-teal-dark)", border: "1px solid var(--hairline)", fontWeight: 700 }}>{renderInline(c, k())}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => <tr key={ri}>{r.map((c, j) => <td key={j} style={{ padding: "7px 10px", border: "1px solid var(--hairline)", verticalAlign: "top" }}>{renderInline(c, k())}</td>)}</tr>)}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    // blockquote
    if (/^\s*>\s?/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^\s*>\s?/, "")); i++; }
      blocks.push(
        <blockquote key={k()} style={{ borderLeft: "3px solid var(--studio-primary)", background: "var(--mint-pill)", margin: "8px 0", padding: "8px 14px", borderRadius: "0 8px 8px 0", color: "var(--ink)" }}>
          {renderInline(buf.join(" "), k())}
        </blockquote>,
      );
      continue;
    }

    // unordered list
    if (/^\s*[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*[-*+]\s+/, "")); i++; }
      blocks.push(
        <ul key={k()} style={{ margin: "6px 0", paddingLeft: 22, lineHeight: 1.6 }}>
          {items.map((it, j) => <li key={j} style={{ margin: "2px 0" }}>{renderInline(it, `${k()}-${j}`)}</li>)}
        </ul>,
      );
      continue;
    }

    // ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*\d+\.\s+/, "")); i++; }
      blocks.push(
        <ol key={k()} style={{ margin: "6px 0", paddingLeft: 24, lineHeight: 1.6 }}>
          {items.map((it, j) => <li key={j} style={{ margin: "2px 0" }}>{renderInline(it, `${k()}-${j}`)}</li>)}
        </ol>,
      );
      continue;
    }

    // paragraph (gather consecutive plain lines)
    const buf: string[] = [];
    while (
      i < lines.length && lines[i].trim() &&
      !/^\s*```/.test(lines[i]) && !/^(#{1,6})\s/.test(lines[i]) &&
      !/^\s*([-*_])\1\1+\s*$/.test(lines[i]) && !/^\s*[-*+]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) && !/^\s*>\s?/.test(lines[i]) && !/^\s*\|.*\|\s*$/.test(lines[i])
    ) { buf.push(lines[i]); i++; }
    blocks.push(
      <p key={k()} style={{ margin: "6px 0", lineHeight: 1.6 }}>{renderInline(buf.join("\n"), k())}</p>,
    );
  }

  return <div style={{ color: "var(--ink)", fontSize: 15 }}>{blocks}</div>;
}

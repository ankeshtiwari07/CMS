import { readFileSync, writeFileSync } from 'node:fs';
import { marked } from 'marked';
import puppeteer from 'puppeteer';
import { PDFDocument } from 'pdf-lib';

import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));

const SRC = process.env.SRC_MD || `${HERE}/HUMAIN-Create-Studio-PRD.md`;
const OUT = process.env.OUT_PDF || `${HERE}/HUMAIN-Create-Studio-PRD.pdf`;
const DOC_TITLE = process.env.DOC_TITLE || 'Product Requirements Document';
const DOC_FOOT = process.env.DOC_FOOT || 'Product Requirements';
const B = `${HERE}/`;

const HUMAIN_WORDMARK = readFileSync(B + 'humain-wordmark.svg', 'utf8').trim();
const AAVYA_WORDMARK  = readFileSync(B + 'aavya-logo.svg', 'utf8').trim();

// Small, explicitly-coloured logo variants for the running header strip
// (header templates ignore stylesheet classes, so colours/sizes are inlined).
const HUMAIN_HEADER = HUMAIN_WORDMARK.replace('<svg', '<svg height="11"');
const AAVYA_HEADER  = AAVYA_WORDMARK
  .replace('width="122" height="32"', 'width="42" height="11"')
  .replace(/class="fill-navy[^"]*"/g, 'fill="#0A2540"');

let md = readFileSync(SRC, 'utf8');

// Pull mermaid blocks out before markdown parsing so they aren't escaped.
const diagrams = [];
md = md.replace(/```mermaid\n([\s\S]*?)```/g, (_, code) => {
  const i = diagrams.push(code.trim()) - 1;
  return `\n@@MERMAID_${i}@@\n`;
});

let html = marked.parse(md);
html = html.replace(/<p>@@MERMAID_(\d+)@@<\/p>/g, (_, i) =>
  `<div class="mermaid">${diagrams[Number(i)]}</div>`);

// Inject HUMAIN wordmark (customer brand) + co-brand Aavya mark into the banner.
html = html.replace(/<h1>([\s\S]*?)<\/h1>/, (_, t) =>
  `<h1><span class="banner-aavya">${AAVYA_WORDMARK}</span>` +
  `<span class="brandmark">${HUMAIN_WORDMARK}</span>${t}</h1>`);

// Inject "Prepared by Aavya" lockup right before section 1 (cover page).
html = html.replace(/<h2/, (m) =>
  `<div class="prepared-by"><span class="pb-label">Prepared by</span>` +
  `<span class="aavya">${AAVYA_WORDMARK}</span></div>${m}`);

const page = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<style>
  :root{
    --teal:#0B7A75; --teal-d:#0A5C58; --gold:#C8A45C; --ink:#16242F;
    --ink-soft:#3D5160; --line:#E2E8EC; --bg-soft:#F5F8F8; --teal-tint:#EAF3F2;
  }
  *{box-sizing:border-box}
  body{font-family:-apple-system,"Segoe UI",Helvetica,Arial,sans-serif;
    color:var(--ink); font-size:10.5pt; line-height:1.55; margin:0; padding:0;}
  .wrap{padding:0 4mm;}
  /* Cover */
  h1:first-of-type{
    position:relative;
    color:#fff; background:linear-gradient(135deg,var(--teal-d),var(--teal));
    margin:0 -4mm 5mm; padding:24mm 12mm 11mm; font-size:29pt; line-height:1.08;
    letter-spacing:-.5px; border-bottom:6px solid var(--gold);}
  .brandmark{display:block; margin:0 0 9mm;}
  .brandmark svg{height:30px; width:auto; color:#fff;}
  .banner-aavya{position:absolute; top:25mm; right:12mm;}
  .banner-aavya svg{height:22px; width:auto;}
  .banner-aavya svg path{fill:#ffffff !important; opacity:.95;}
  /* Part dividers in the combined deck — each non-cover H1 starts a new page
     as a strong banner header (no blank pages). */
  h1:not(:first-of-type){
    color:#fff; background:linear-gradient(135deg,var(--teal-d),var(--teal));
    margin:0 -4mm 8mm; padding:18mm 14mm; font-size:25pt; font-weight:800; text-align:center;
    letter-spacing:-.3px; border:none; border-bottom:5px solid var(--gold);
    page-break-before:always; page-break-after:avoid;}
  /* The two lines right after the H1 act as subtitle (## then ###) */
  h1:first-of-type + h2, h1:first-of-type + h2 + h3{
    color:var(--teal-d);}
  /* "Prepared by Aavya" lockup on the cover */
  .prepared-by{display:flex; align-items:center; gap:9px; margin:6mm 0 0;
     padding-top:4mm; border-top:1px solid var(--line);}
  .prepared-by .pb-label{font-size:8.5pt; letter-spacing:.4px; text-transform:uppercase;
     color:var(--ink-soft); font-weight:600;}
  .prepared-by .aavya svg{height:24px; width:auto;}
  .prepared-by .aavya svg path{fill:#0A2540 !important;}
  h2{color:var(--teal-d); font-size:15.5pt; margin:8mm 0 2.5mm; padding-bottom:2mm;
     border-bottom:2px solid var(--gold); letter-spacing:-.2px;
     page-break-after:avoid;}
  h3{color:var(--teal); font-size:12pt; margin:5mm 0 1.5mm; page-break-after:avoid;}
  h2 + h3{margin-top:2.5mm;}
  p{margin:0 0 2.5mm;}
  strong{color:var(--ink);}
  a{color:var(--teal); text-decoration:none;}
  ul,ol{margin:0 0 3mm; padding-left:6mm;}
  li{margin:.6mm 0;}
  blockquote{margin:4mm 0; padding:3mm 5mm; background:var(--teal-tint);
     border-left:4px solid var(--teal); color:var(--ink); border-radius:0 4px 4px 0;}
  blockquote p{margin:0;}
  code{background:var(--bg-soft); padding:.5mm 1.5mm; border-radius:3px;
     font-family:"SF Mono",Menlo,monospace; font-size:9pt; color:var(--teal-d);}
  hr{border:none; border-top:1px solid var(--line); margin:7mm 0;}
  table{border-collapse:collapse; width:100%; margin:3mm 0 5mm; font-size:9.3pt;
     page-break-inside:avoid;}
  th{background:var(--teal); color:#fff; text-align:left; padding:2.4mm 3mm;
     font-weight:600; font-size:9pt;}
  td{padding:2.2mm 3mm; border-bottom:1px solid var(--line); vertical-align:top;}
  tr:nth-child(even) td{background:var(--bg-soft);}
  table tr:first-child + tr td, table td:first-child{}
  .mermaid{margin:2mm auto 4mm; text-align:center; page-break-inside:avoid;}
  .mermaid svg{max-width:100%; max-height:172mm; height:auto;}
  img{max-width:100%; max-height:188mm; height:auto; width:auto; display:block;
     margin:3mm auto 2mm; border:1px solid var(--line); border-radius:8px;
     box-shadow:0 1px 6px rgba(11,36,47,.08); page-break-inside:avoid;}
  h3{page-break-after:avoid;}
  /* first table after a divider near top = doc-control table: keep tidy */
</style></head>
<body><div class="wrap">${html}</div>
<script type="module">
  import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
  try{
    mermaid.initialize({
      startOnLoad:false, theme:'base', securityLevel:'loose',
      fontFamily:'-apple-system,Segoe UI,Helvetica,Arial,sans-serif',
      themeVariables:{
        fontSize:'15px',
        primaryColor:'#EAF3F2', primaryBorderColor:'#0B7A75', primaryTextColor:'#16242F',
        lineColor:'#5A7682', secondaryColor:'#FBF4E4', secondaryBorderColor:'#C8A45C',
        tertiaryColor:'#F5F8F8', tertiaryBorderColor:'#9DB4BD',
        clusterBkg:'#F5F8F8', clusterBorder:'#9DB4BD',
        edgeLabelBackground:'#ffffff'
      },
      flowchart:{useMaxWidth:true, htmlLabels:true, curve:'basis', padding:10, nodeSpacing:32, rankSpacing:38}
    });
    await mermaid.run({querySelector:'.mermaid'});
  }catch(e){ document.title='MERMAID_ERR:'+e.message; }
  window.__DONE__=true;
</script></body></html>`;

writeFileSync(`${HERE}/render.html`, page);

const browser = await puppeteer.launch({ headless:'new', args:['--no-sandbox'] });
const pg = await browser.newPage();
await pg.goto(`file://${HERE}/render.html`, { waitUntil:'networkidle0', timeout:60000 });
await pg.waitForFunction('window.__DONE__===true', { timeout:60000 });
const title = await pg.title();
if (title.startsWith('MERMAID_ERR')) { console.error('Mermaid render error:', title); }
await new Promise(r=>setTimeout(r,400));

const HEADER_STRIP = `<div style="width:100%;box-sizing:border-box;padding:6mm 14mm 0;font-family:-apple-system,Segoe UI,sans-serif;">
    <div style="display:flex;align-items:flex-end;justify-content:space-between;border-bottom:1px solid #C8A45C;padding-bottom:3px;">
      <span style="color:#0A5C58;display:inline-flex;align-items:center;">${HUMAIN_HEADER}</span>
      <span style="font-size:6.5pt;letter-spacing:.7px;color:#9DB4BD;text-transform:uppercase;padding-bottom:1px;">${DOC_TITLE}</span>
      <span style="display:inline-flex;align-items:center;">${AAVYA_HEADER}</span>
    </div></div>`;
const FOOTER = `<div style="width:100%;font-size:7.5pt;color:#7A8B95;padding:0 14mm;display:flex;justify-content:space-between;font-family:-apple-system,Segoe UI,sans-serif;">
    <span>HUMAIN Create Studio — ${DOC_FOOT} · Prepared by Aavya · Confidential</span>
    <span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`;
const COMMON = { format:'A4', printBackground:true,
  margin:{ top:'18mm', bottom:'16mm', left:'14mm', right:'14mm' },
  displayHeaderFooter:true, footerTemplate:FOOTER };

// Identical layout/margins in both passes ⇒ pagination matches. Cover (p.1) gets
// no header strip; interior pages (2+) carry the co-brand strip. Merge the two.
const coverPdf    = await pg.pdf({ ...COMMON, pageRanges:'1',  headerTemplate:'<span></span>' });
const interiorPdf = await pg.pdf({ ...COMMON, pageRanges:'2-', headerTemplate:HEADER_STRIP });
await browser.close();

const out = await PDFDocument.create();
for (const buf of [coverPdf, interiorPdf]) {
  const src = await PDFDocument.load(buf);
  const pages = await out.copyPages(src, src.getPageIndices());
  pages.forEach(p => out.addPage(p));
}
writeFileSync(OUT, await out.save());
console.log('PDF written:', OUT, '— pages:', out.getPageCount());

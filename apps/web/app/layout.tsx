// styles.css supersedes tokens.css (same tokens + `.dark` + component styles +
// the compiled utility layer). It also ships Tailwind Preflight, which zeroes
// margins and unstyles headings/lists — globals.css restores typography for
// rendered CMS rich text below it.
import "@humain/ui/styles.css";
import "@humain/design-tokens/bridge.css";
import "./globals.css";

// Root layout is locale-agnostic; the [locale] segment sets lang/dir + fonts.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}

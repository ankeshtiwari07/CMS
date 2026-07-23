import "@humain/foundation/tokens.css";
import "@humain/design-tokens/bridge.css";
import "./globals.css";

// Root layout is locale-agnostic; the [locale] segment sets lang/dir + fonts.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}

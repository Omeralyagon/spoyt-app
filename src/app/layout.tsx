import type { ReactNode } from "react";

// Root layout is a pass-through; the real <html>/<body> live in [locale]/layout
// so that lang/dir can switch per locale (next-intl App Router pattern).
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}

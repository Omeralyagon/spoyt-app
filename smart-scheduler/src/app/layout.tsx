import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";

const heebo = Heebo({
  subsets: ["latin", "hebrew"],
  weight: ["400", "500", "700", "800", "900"],
  variable: "--font-heebo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "המתזמן החכם",
  description:
    "מנהל אישי חכם למורים עצמאיים: מבין את הלו״ז, ההכנסה וזמני הנסיעה שלך וממליץ על החלטות טובות יותר.",
};

export const viewport: Viewport = {
  themeColor: "#f4f5fb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable} suppressHydrationWarning>
      <body
        className="min-h-dvh antialiased"
        style={{ fontFamily: "var(--font-heebo), system-ui, sans-serif" }}
      >
        {children}
      </body>
    </html>
  );
}

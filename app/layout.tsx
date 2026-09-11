import type { Metadata } from "next";
import { AppearanceProvider } from "./_components/appearance-provider";
import { ThemeScript } from "./_components/theme-script";
import { fontVariables } from "./_lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "RielVest | Cambodia Market Intelligence",
    template: "%s | RielVest",
  },
  description:
    "Cambodia-first market data, listed company research and transparent analysis for CSX investors.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // `lang`, the theme preset and the dark class are all set by ThemeScript
    // before paint, so the markup here is only the server-rendered default.
    <html
      lang="en"
      data-theme-preset="default"
      data-scroll-behavior="smooth"
      className={`${fontVariables} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body>
        <AppearanceProvider>{children}</AppearanceProvider>
      </body>
    </html>
  );
}

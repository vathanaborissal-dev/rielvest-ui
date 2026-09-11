import {
  DM_Sans,
  Figtree,
  Inter,
  JetBrains_Mono,
  Kantumruy_Pro,
  Noto_Sans,
  Noto_Sans_Khmer,
  Nunito_Sans,
  Outfit,
  Public_Sans,
  Raleway,
  Roboto,
} from "next/font/google";
import localFont from "next/font/local";

/**
 * Every family the font picker offers, self-hosted by next/font.
 *
 * Two Khmer families are always loaded regardless of the chosen Latin face.
 * None of the Latin families above carry Khmer glyphs, so without them Khmer
 * copy falls back to whatever the browser happens to have and renders with
 * broken vowel positioning — which on this product would be worse than not
 * offering Khmer at all. The Khmer face is appended to every stack, so the
 * chosen font styles the Latin text and Khmer stays correct either way.
 */

const geistSans = localFont({
  src: "../fonts/geist-latin.woff2",
  variable: "--font-geist",
  display: "swap",
});

const geistMono = localFont({
  src: "../fonts/geist-mono-latin.woff2",
  variable: "--font-geist-mono",
  display: "swap",
});

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", display: "swap" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });
const nunitoSans = Nunito_Sans({ subsets: ["latin"], variable: "--font-nunito-sans", display: "swap" });
const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree", display: "swap" });
const raleway = Raleway({ subsets: ["latin"], variable: "--font-raleway", display: "swap" });
const publicSans = Public_Sans({ subsets: ["latin"], variable: "--font-public-sans", display: "swap" });
const notoSans = Noto_Sans({ subsets: ["latin"], variable: "--font-noto-sans", display: "swap" });
const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto",
  display: "swap",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const notoSansKhmer = Noto_Sans_Khmer({
  subsets: ["khmer"],
  variable: "--font-khmer",
  display: "swap",
});
const kantumruyPro = Kantumruy_Pro({
  subsets: ["khmer"],
  variable: "--font-khmer-alt",
  display: "swap",
});

export const fontVariables = [
  geistSans.variable,
  geistMono.variable,
  inter.variable,
  outfit.variable,
  dmSans.variable,
  nunitoSans.variable,
  figtree.variable,
  raleway.variable,
  publicSans.variable,
  notoSans.variable,
  roboto.variable,
  jetbrainsMono.variable,
  notoSansKhmer.variable,
  kantumruyPro.variable,
].join(" ");

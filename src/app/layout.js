import { Montserrat, Playfair_Display, Lato, Instrument_Serif, Bricolage_Grotesque } from "next/font/google";

import "./globals.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Providers from "@/components/Providers";
import { defaultMetadata } from "@/lib/seo";
import { OrganizationJsonLd, WebSiteJsonLd } from "@/components/seo/JsonLd";

export const metadata = defaultMetadata;

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
});

const lato = Lato({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  variable: "--font-lato",
});

// 2hand2go pricing fonts
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-bricolage",
});


export default function RootLayout({ children }) {
  return (
    <html lang="en-DK" className={`${montserrat.className} ${playfair.variable} ${lato.variable} ${instrumentSerif.variable} ${bricolage.variable}`}>
      <body suppressHydrationWarning >
        <OrganizationJsonLd />
        <WebSiteJsonLd />
        <Providers>{children}</Providers>
        <ToastContainer />
      </body>
    </html>
  );
}

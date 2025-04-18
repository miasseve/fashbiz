// changes in this file
// import { Inria_Sans } from "next/font/google";
import { Montserrat } from "next/font/google";

import "./globals.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Providers from "@/components/Providers";

export const metadata = {
  title: {
    template: "%s | Fashbiz",
    default: "Fashbiz",
  },
  description: "A modern ecommerce platform",
};

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});



export default function RootLayout({ children }) {
  return (
    <html lang="en" className={montserrat.className}>
      <body >
        <Providers>{children}</Providers>
        <ToastContainer />
      </body>
    </html>
  );
}

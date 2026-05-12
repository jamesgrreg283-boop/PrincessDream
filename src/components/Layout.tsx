import type { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import FloatingContact from "./FloatingContact";
import StickyMobileCTA from "./StickyMobileCTA";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="relative z-10 flex-1 pb-28 lg:pb-0">{children}</main>
      <Footer />
      <FloatingContact />
      <StickyMobileCTA />
    </div>
  );
}

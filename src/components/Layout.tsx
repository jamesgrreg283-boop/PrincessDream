import type { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import FloatingContact from "./FloatingContact";
import StickyMobileCTA from "./StickyMobileCTA";
import BookingResumeBanner from "./BookingResumeBanner";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <BookingResumeBanner />
      <main className="relative z-10 flex-1 pb-[calc(7.5rem+env(safe-area-inset-bottom,0px))] lg:pb-0">{children}</main>
      <Footer />
      <FloatingContact />
      <StickyMobileCTA />
    </div>
  );
}

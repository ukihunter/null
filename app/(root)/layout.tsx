import React from "react";

import { Header } from "@/features/home/components/header";
import { Footer } from "@/features/home/components/footer";
import { FloatingObjects } from "@/components/floating-objects";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full bg-white dark:bg-black overflow-hidden">
      <FloatingObjects />
      
      {/* Background patterns */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <Header />
      
      <main className="relative z-10 w-full">
        {children}
      </main>
      
      <Footer />
    </div>
  );
}

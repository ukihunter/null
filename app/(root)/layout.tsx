import React from "react";

import { Header } from "@/features/home/components/header";
import { Footer } from "@/features/home/components/footer";
import { cn } from "@/lib/utils";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <div
        className={cn(
          "absolute inset-0",
          "bg-[radial-gradient(circle,rgba(0,0,0,0.2)_2px,transparent_2px)]",
          "dark:bg-[radial-gradient(circle,rgba(255,255,255,0.15)_2px,transparent_2px)]",
          "[background-size:40px_40px]",
          "before:content-[''] before:absolute before:inset-0",
          "before:bg-[linear-gradient(#d4d4d4_1px,transparent_1px),linear-gradient(to_right,#d4d4d4_1px,transparent_1px)]",
          "before:bg-[length:40px_40px]",
          "dark:before:bg-[linear-gradient(#262626_1px,transparent_1px),linear-gradient(to_right,#262626_1px,transparent_1px)]"
        )}
      />

      <div className="pointer-events-none absolute inset-0 bg-white dark:bg-black [mask-image:radial-gradient(circle,transparent_25%,black)]" />

      <main className="z-20 relative w-full pt-0 md:PT-0">{children}</main>
      <Footer />
    </>
  );
}

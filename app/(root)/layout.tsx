import React from "react";

import { Header } from "@/features/home/components/header";
import { Footer } from "@/features/home/components/footer";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="z-20 relative w-full pt-0 md:PT-0">{children}</main>
      <Footer />
    </>
  );
}

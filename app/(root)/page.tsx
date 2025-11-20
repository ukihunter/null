import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="z-20 flex flex-col items-center justify-start min-h-screen py-2 mt-10">
      <div className="flex flex-col justify-center items-center my-5">
        <Image src={"/hero.svg"} alt="Hero Image" width={500} height={500} />

        <h1 className=" z-20 text-6xl mt-5 font-extrabold text-center bg-clip-text text-transparent bg-gradient-to-r from-rose-500 via-red-500 to-purple-500 dark:from-purple-400 dark:via-gray-100 dark:to-purple-400 tracking-tight leading-[1.3] ">
          Null Code Together, Smarter
        </h1>
      </div>

      <p className="mt-2 text-lg text-center text-gray-600 dark:text-gray-400 px-5 py-10 max-w-2xl">
        Null is a powerful collaborative IDE designed to bring developers
        together in real time. With intelligent code assistance, seamless
        debugging, and advanced optimization tools, Null enhances team
        productivity and makes coding as smooth and efficient as possible.
        Build, edit, and run code simultaneously with your team no boundaries,
        no friction, just pure collaboration.
      </p>
      <Link href={"/dashboard"}>
        <Button variant={"default"} className="mb-4" size={"lg"}>
          Get Started
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Button>
      </Link>
    </div>
  );
}

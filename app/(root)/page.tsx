import { Button } from "@/components/ui/button";
import { FloatingObjects } from "@/components/floating-objects";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FeaturesCards } from "@/components/card/fe-card";

export default function Home() {
  return (
    <>
      <FloatingObjects />
      <div className="z-20 flex flex-col items-center justify-start min-h-screen py-2 mt-10">
        <div className="flex flex-col justify-center items-center my-5">
          <Image src={"/hero2.svg"} alt="Hero Image" width={500} height={500} />

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
          <Button variant={"default"} className="mb-40" size={"lg"}>
            Get Started
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
        <h2 className="text-white font-bold text-2xl mr-10 mb-5">
          What we offer{" "}
        </h2>
        <FeaturesCards />
        <section className="max-w-6xl mx-auto py-20 px-6">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why developers choose Null
          </h2>

          <div className="grid md:grid-cols-3 gap-10">
            <div>
              <h3 className="font-semibold text-lg">⚡ Faster collaboration</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Eliminate delays with real-time syncing.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg">🧠 Smart AI assistance</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Get context-aware suggestions instantly.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg">🔒 Secure workspace</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Your code stays private and protected.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

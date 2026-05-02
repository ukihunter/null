"use client";

import { Button } from "@/components/ui/button";
import {
  ArrowUpRight,
  Users2,
  Zap,
  Cpu,
  Layout,
  MessageSquare,
  ShieldCheck,
  MoveDown,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { SiDowndetector } from "react-icons/si";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function Home() {
  return (
    <div className="flex flex-col items-center w-full overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative w-full min-h-[90vh] flex flex-col items-center justify-center pt-20 pb-32 px-6">
        <motion.div
          className="z-20 flex flex-col items-center text-center max-w-4xl mx-auto"
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          <div>
            <div className="flex flex-col justify-center items-center ">
              <Image
                src={"/hero2.svg"}
                alt="Hero Image"
                width={500}
                height={500}
              />
            </div>
          </div>
          <motion.h1
            variants={fadeInUp}
            className="text-6xl md:text-8xl font-black tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-black to-gray-700 dark:from-white dark:to-gray-400 leading-[1.1]"
          >
            Code Together. <br />
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              Smarter.
            </span>
          </motion.h1>
          <motion.p
            variants={fadeInUp}
            className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mb-10 leading-relaxed"
          >
            Null is a high-performance collaborative IDE designed for modern
            teams. Real-time synchronization, AI-powered assistance, and
            zero-latency terminal access.
          </motion.p>
          <motion.div
            variants={fadeInUp}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link href="/dashboard">
              <Button
                size="lg"
                className="h-14 px-8 rounded-2xl text-lg font-semibold bg-white text-black dark:bg-white dark:text-black hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Get Started Free
              </Button>
            </Link>
            {/* </motion.div>
          Scroll Down Indicator
          <motion.div
            className="flex flex-col items-center mt-6 gap-2"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              Scroll to explore
            </p>
            <MoveDown className="w-20 h-20 text-purple-600 dark:text-purple-400" />
          </motion.div> */}
          </motion.div>
        </motion.div>

        {/* GIF Section Header */}
        <div className="mt-32 text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-white dark:bg-black-gradient-to-b from-gray-800 to-gray-500 dark:from-gray-200 dark:to-gray-500 mb-6 leading-tight">
            Experience Real-Time Collaboration
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
            See multiple developers editing the same file simultaneously with
            zero latency. Watch as changes sync instantly across all team
            members.
          </p>
        </div>

        {/* Hero Visual */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="relative mt-1 w-full max-w-6xl mx-auto"
        >
          <div className="relative rounded-3xl overflow-hidden border border-gray-200/50 dark:border-white/10 shadow-2xl bg-white/5 backdrop-blur-3xl">
            <Image
              src="/demo.gif"
              alt="Null IDE Preview"
              width={1200}
              height={800}
              className="w-full h-auto object-cover opacity-90"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-black via-transparent to-transparent opacity-60" />
          </div>

          {/* Decorative elements */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/20 blur-3xl rounded-full" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/20 blur-3xl rounded-full" />
        </motion.div>
      </section>

      {/* Reference Image Feature Grid */}
      <section className="w-full py-32 px-6 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Real-time Collaboration */}
            <div className="bg-[#0c0c0c] border border-zinc-800/50 rounded-2xl p-8 hover:border-purple-500/30 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6 group-hover:bg-purple-500/20 transition-colors">
                <Users2 className="w-5 h-5 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">
                Real-time Collaboration
              </h3>
              <p className="text-zinc-500 leading-relaxed">
                Experience zero-latency multi-cursor editing. Synchronize your
                thoughts with your team instantly.
              </p>
            </div>

            {/* Project Management */}
            <div className="bg-[#0c0c0c] border border-zinc-800/50 rounded-2xl p-8 hover:border-cyan-500/30 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-6 group-hover:bg-cyan-500/20 transition-colors">
                <Layout className="w-5 h-5 text-cyan-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">
                Project Management
              </h3>
              <p className="text-zinc-500 leading-relaxed">
                Integrated kanban boards and task tracking linked directly to
                your commits and pull requests.
              </p>
            </div>

            {/* Voice Call */}
            <div className="bg-[#0c0c0c] border border-zinc-800/50 rounded-2xl p-8 hover:border-emerald-500/30 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 group-hover:bg-emerald-500/20 transition-colors">
                <MessageSquare className="w-5 h-5 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Voice Call</h3>
              <p className="text-zinc-500 leading-relaxed">
                High-fidelity spatial audio built directly into the sidebar for
                seamless team synchronization.
              </p>
            </div>

            {/* Smart AI Assistance */}
            <div className="bg-[#0c0c0c] border border-zinc-800/50 rounded-2xl p-8 hover:border-purple-500/30 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6 group-hover:bg-purple-500/20 transition-colors">
                <Cpu className="w-5 h-5 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">
                Smart AI Assistance
              </h3>
              <p className="text-zinc-500 leading-relaxed">
                Context-aware LLM integration that understands your entire
                codebase, not just the active file.
              </p>
            </div>

            {/* Secure Workspace */}
            <div className="bg-[#0c0c0c] border border-zinc-800/50 rounded-2xl p-8 hover:border-cyan-500/30 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-6 group-hover:bg-cyan-500/20 transition-colors">
                <ShieldCheck className="w-5 h-5 text-cyan-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">
                Secure Workspace
              </h3>
              <p className="text-zinc-500 leading-relaxed">
                Enterprise-grade encryption for all data in transit and at rest.
                Soc-2 compliant by design.
              </p>
            </div>

            {/* Live Preview */}
            <div className="bg-[#0c0c0c] border border-zinc-800/50 rounded-2xl p-8 hover:border-emerald-500/30 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 group-hover:bg-emerald-500/20 transition-colors">
                <Zap className="w-5 h-5 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">
                Live Preview
              </h3>
              <p className="text-zinc-500 leading-relaxed">
                Hot-module replacement that works across languages. See changes
                reflected instantly in the shell.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer is already included in layout */}
    </div>
  );
}

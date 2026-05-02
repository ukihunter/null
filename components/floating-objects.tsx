"use client";

import { motion } from "framer-motion";

// Programming language symbols with their colors
const floatingItems = [
  {
    symbol: "</>",
    name: "HTML",
    color: "from-orange-500 to-red-500",
    x: "20%",
    y: "20%",
  },
  {
    symbol: "{ }",
    name: "CSS",
    color: "from-blue-500 to-cyan-500",
    x: "85%",
    y: "15%",
  },
  {
    symbol: "TS",
    name: "TypeScript",
    color: "from-blue-600 to-blue-400",
    x: "15%",
    y: "70%",
  },
  {
    symbol: "JS",
    name: "JavaScript",
    color: "from-yellow-500 to-yellow-300",
    x: "90%",
    y: "65%",
  },
  {
    symbol: "<>",
    name: "React",
    color: "from-cyan-500 to-blue-500",
    x: "5%",
    y: "40%",
  },
  {
    symbol: "λ",
    name: "Function",
    color: "from-purple-500 to-pink-500",
    x: "92%",
    y: "40%",
  },
  {
    symbol: "{ }",
    name: "JSON",
    color: "from-green-500 to-emerald-500",
    x: "12%",
    y: "85%",
  },
  {
    symbol: "//",
    name: "Comment",
    color: "from-gray-500 to-gray-400",
    x: "88%",
    y: "85%",
  },
];

export function FloatingObjects() {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{
        zIndex: 1,
        height: "100%",
        minHeight: "100vh",
      }}
    >
      {floatingItems.map((item, index) => (
        <motion.div
          key={index}
          className="absolute pointer-events-none"
          style={{
            left: item.x,
            top: item.y,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0.1, 0.3, 0.1],
            scale: [1, 1.05, 1],
            y: [0, -30, 0],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 12 + index * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: index * 0.5,
          }}
        >
          <div className="relative group flex items-center justify-center">
            {/* Soft Glow */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${item.color} rounded-full blur-[60px] opacity-10`}
            />

            {/* Icon Card */}
            <div
              className={`relative w-20 h-20 flex items-center justify-center bg-white/5 dark:bg-zinc-900/20 rounded-[24px] border border-gray-200/10 dark:border-white/5 backdrop-blur-[8px] shadow-2xl`}
            >
              <span className={`text-2xl font-mono font-bold bg-clip-text text-transparent bg-gradient-to-br ${item.color} opacity-80`}>
                {item.symbol}
              </span>
              
              {/* Internal glow */}
              <div className={`absolute inset-0 rounded-[24px] bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

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
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {floatingItems.map((item, index) => (
        <motion.div
          key={index}
          className="absolute pointer-events-auto"
          style={{
            left: item.x,
            top: item.y,
          }}
          initial={{
            opacity: 0,
            scale: 0,
            rotate: 0,
          }}
          animate={{
            opacity: [2.2, 0.4, 1.2],
            scale: [1, 1.1, 1],
            rotate: [0, 360],
            y: [0, -30, 0],
            x: [0, 15, 0],
          }}
          transition={{
            duration: 8 + index * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: index * 0.2,
          }}
          whileHover={{
            scale: 1.3,
            opacity: 1,
            rotate: 380,
            transition: { duration: 0.3 },
          }}
        >
          <div className="relative group cursor-pointer">
            {/* Glow effect */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${item.color} rounded-2xl blur-xl opacity-70 group-hover:blur-1xl group-hover:opacity-100 transition-all duration-300`}
            />

            {/* Main card */}
            <div
              className={`relative w-20 h-20 flex items-center justify-center bg-gradient-to-br ${item.color} rounded-2xl border border-white/20 backdrop-blur-sm shadow-2xl group-hover:shadow-3xl transition-all duration-300`}
            >
              <span className="text-3xl font-bold text-white drop-shadow-lg">
                {item.symbol}
              </span>
            </div>

            {/* Tooltip */}
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              <span className="text-xs font-semibold text-white bg-black/70 px-2 py-1 rounded backdrop-blur-sm">
                {item.name}
              </span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

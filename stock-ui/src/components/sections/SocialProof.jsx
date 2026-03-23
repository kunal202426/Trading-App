import React, { useState } from "react";
import { motion } from "framer-motion";
import BrutalButton from "../ui/BrutalButton";

const cards = [
  {
    title: "Stocks",
    desc: "Build equity positions with live execution context and high-signal market visibility.",
  },
  {
    title: "IPOs",
    desc: "Track issue timelines, evaluate key fundamentals, and act with precision at listing windows.",
  },
  {
    title: "Mutual Funds",
    desc: "Construct disciplined long-term allocations with clarity on risk, cost, and consistency.",
  },
  {
    title: "Futures & Options",
    desc: "Deploy directional and hedged derivative setups with margin-aware decision support.",
  },
  {
    title: "Currency",
    desc: "Capture macro-driven FX moves with responsive execution and structured risk framing.",
  },
  {
    title: "Commodity",
    desc: "Trade metals and energy themes with volatility context and tactical timing confidence.",
  },
  {
    title: "WealthBox",
    desc: "Run rules-based wealth plans through diversified allocation and ongoing portfolio oversight.",
  },
];

const SocialProofCarousel = () => {
  const [index, setIndex] = useState(2);

  const next = () => setIndex((prev) => (prev + 1) % cards.length);
  const prev = () =>
    setIndex((prev) => (prev - 1 + cards.length) % cards.length);

  return (
    <section
      style={{
        position: "relative",
        overflow: "hidden",
        padding: "100px 20px",
        background: "#f5f7ff",
      }}
    >
      {/* 🔲 Moving grid background */}
      <motion.div
        animate={{ x: ["0%", "-50%"] }}
        transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(#dcdfe6 1px, transparent 1px), linear-gradient(90deg, #dcdfe6 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          opacity: 0.4,
          zIndex: 0,
        }}
      />

      {/* content */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: 1200,
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontSize: 12,
            letterSpacing: "0.12em",
            color: "#6b7280",
            marginBottom: 40,
            fontWeight: 700,
          }}
        >
          TRUSTED BY TRADERS
        </p>

        {/* 🎯 CAROUSEL */}
        <div
          style={{
            perspective: 1200,
            height: 420,
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {cards.map((card, i) => {
            const offset = i - index;
            const isAdjacent = offset === -1 || offset === 1;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  x: offset * 200,
                  y: Math.abs(offset) * 20,
                  scale:
                    offset === 0
                      ? 1
                      : Math.abs(offset) === 1
                      ? 0.9
                      : 0.8,
                  rotate: offset * 2,
                  zIndex: 10 - Math.abs(offset),
                  opacity: Math.abs(offset) > 2 ? 0 : 1,
                }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                onClick={() => {
                  if (offset === -1) prev();
                  if (offset === 1) next();
                }}
                role={isAdjacent ? "button" : undefined}
                tabIndex={isAdjacent ? 0 : -1}
                onKeyDown={(event) => {
                  if (!isAdjacent) return;
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    if (offset === -1) prev();
                    if (offset === 1) next();
                  }
                }}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  translateX: "-50%",
                  translateY: "-50%",
                  width: 280,
                  height: 340,
                  borderRadius: 16,
                  background:
                    offset === 0
                      ? "linear-gradient(135deg, #4f46e5, #4338ca)"
                      : "#ffffff",
                  color: offset === 0 ? "#fff" : "#111827",
                  padding: 24,
                  boxShadow:
                    offset === 0
                      ? "0 20px 42px rgba(79,70,229,0.2)"
                      : "0 8px 20px rgba(0,0,0,0.08)",
                  border: "1px solid rgba(0,0,0,0.06)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  willChange: "transform, opacity",
                  cursor: isAdjacent ? "pointer" : "default",
                }}
              >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-start",
                        gap: 12,
                        marginBottom: 10,
                      }}
                    >
    
                    </div>

                    <h3
                      style={{
                        fontSize: 22,
                        fontWeight: 800,
                        marginBottom: 12,
                      }}
                    >
                      {card.title}
                    </h3>

                    <p style={{ fontSize: 14, lineHeight: 1.6 }}>
                      {card.desc}
                    </p>
                  </div>

                  <BrutalButton
                    tone={offset === 0 ? "on-dark" : "default"}
                    style={{ marginTop: 20 }}
                  >
                    Explore
                  </BrutalButton>
              </motion.div>
            );
          })}
        </div>

        {/* arrows */}
        <div style={{ marginTop: 40, display: "flex", gap: 20, justifyContent: "center" }}>
          <button
            onClick={prev}
            style={{
              width: 50,
              height: 50,
              background: "#111",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            ←
          </button>
          <button
            onClick={next}
            style={{
              width: 50,
              height: 50,
              background: "#111",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            →
          </button>
        </div>
      </div>
    </section>
  );
};

export default SocialProofCarousel;
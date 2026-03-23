/**
 * HorizontalShowcase — sticky-scroll side-flip card deck.
 *
 * Cards flip around their vertical center axis (rotateY) as the user
 * scrolls, revealing the next card behind.  The viewport is pinned via
 * direct DOM transform (bypasses React batching for zero-lag pinning).
 */

import React, { useState, useEffect, memo } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';

import img1    from '../../assets/open-account.svg';
import img2    from '../../assets/analysis.svg';
import img3    from '../../assets/research-calls.svg';
import img4    from '../../assets/omni-mobile.avif';

// ─── Card data ────────────────────────────────────────────────────────────────

const CARDS = [
  {
    num: '01', tag: 'Portfolio',
    title: 'Portfolio Command Center',
    body:  'See all holdings, live P&L, and risk metrics in one unified dashboard. Updated tick-by-tick.',
    accent: '#4361ee', color: '#eff3ff', img: img1,
  },
  {
    num: '02', tag: 'Technicals',
    title: 'Deep Analysis Suite',
    body:  'MACD, RSI, Bollinger Bands, ADX, OBV — every indicator you need for high-conviction entries.',
    accent: '#0ea5e9', color: '#f0f9ff', img: img2,
  },
  {
    num: '03', tag: 'AI Engine',
    title: 'AI Signal Feed',
    body:  'Multi-horizon signals from ULTRA_SHORT to POSITIONAL with confidence, target and stop levels.',
    accent: '#6366f1', color: '#eef2ff', img: img3,
  },
  {
    num: '04', tag: 'Simulation',
    title: 'Paper Trading Engine',
    body:  'Practice with virtual capital, simulated slippage, brokerage costs, and a full trade journal.',
    accent: '#10b981', color: '#f0fdf4', img: img4,
  },
  {
    num: '05', tag: 'Macro',
    title: 'Macro Dashboard',
    body:  'India-specific macro indicators: FII/DII flows, sector rotation, GDP, inflation, and more.',
    accent: '#8b5cf6', color: '#faf5ff', img: img1,
  },
  {
    num: '06', tag: 'Patterns',
    title: 'Seasonality Patterns',
    body:  'Historical seasonal analysis for NSE/BSE stocks — know when the odds have been historically in your favour.',
    accent: '#f97316', color: '#fff7ed', img: img2,
  },
];

// ─── CardFace ─────────────────────────────────────────────────────────────────

const CardFace = memo(function CardFace({ card }) {
  const [hovered, setHovered] = useState(false);
  const [isMobileInteraction, setIsMobileInteraction] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mq = window.matchMedia('(hover: none), (pointer: coarse)');
    const updateMode = (event) => {
      const mobileLike = event.matches;
      setIsMobileInteraction(mobileLike);
      if (!mobileLike) setIsMobileOpen(false);
    };

    updateMode(mq);

    if (mq.addEventListener) {
      mq.addEventListener('change', updateMode);
      return () => mq.removeEventListener('change', updateMode);
    }

    mq.addListener(updateMode);
    return () => mq.removeListener(updateMode);
  }, []);

  const expanded = isMobileInteraction ? isMobileOpen : hovered;

  return (
    <div
      onMouseEnter={() => { if (!isMobileInteraction) setHovered(true); }}
      onMouseLeave={() => { if (!isMobileInteraction) setHovered(false); }}
      style={{
        position: 'relative',
        borderRadius: 0,
        background: 'linear-gradient(180deg, #ffffff 0%, #f6f9ff 100%)',
        border: '1px solid #334155',
        overflow: 'hidden',
        minHeight: 'clamp(220px, 22vw, 280px)',
        transform: expanded ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: expanded
          ? `0 0 0 1px ${card.accent}20, 0 10px 24px rgba(15,23,42,0.16), inset 0 1px 0 rgba(255,255,255,0.65)`
          : '0 1px 4px rgba(15,23,42,0.10), inset 0 1px 0 rgba(255,255,255,0.65)',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
      }}
    >
      <img
        src={card.img}
        alt=""
        loading="lazy"
        decoding="async"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: expanded ? 0 : 1,
          transition: 'opacity 300ms ease',
          willChange: 'opacity',
        }}
      />

      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.4) 40%, transparent 75%)',
          opacity: expanded ? 0 : 1,
          transition: 'opacity 300ms ease',
          pointerEvents: 'none',
        }}
      />

      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, #f8fbff 0%, #eaf2ff 100%)',
          opacity: expanded ? 1 : 0,
          transition: 'opacity 300ms ease',
          pointerEvents: 'none',
          willChange: 'opacity',
        }}
      />

      {isMobileInteraction && (
        <button
          type="button"
          aria-label={expanded ? `Hide details for ${card.title}` : `Show details for ${card.title}`}
          onClick={() => setIsMobileOpen((v) => !v)}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            width: 34,
            height: 34,
            borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.55)',
            background: 'rgba(15,23,41,0.45)',
            color: '#ffffff',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
            zIndex: 4,
          }}
        >
          {expanded ? <FiEyeOff size={15} /> : <FiEye size={15} />}
        </button>
      )}

      <div
        style={{
          position: 'absolute',
          left: 18,
          right: 18,
          bottom: 16,
          color: '#ffffff',
          opacity: expanded ? 0 : 1,
          transform: expanded ? 'translateY(10px)' : 'translateY(0)',
          transition: 'opacity 280ms ease-out, transform 280ms ease-out',
          pointerEvents: 'none',
          zIndex: 3,
        }}
      >
        <p style={{
          margin: 0,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#c7d2fe',
          lineHeight: 1,
          marginBottom: 8,
        }}>
          {card.tag}
        </p>
        <p style={{
          margin: 0,
          fontSize: 'clamp(18px, 2.1vw, 22px)',
          fontWeight: 800,
          lineHeight: 1.2,
          letterSpacing: '-0.02em',
        }}>
          {card.title}
        </p>
      </div>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: 18,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          color: '#0f1729',
          opacity: expanded ? 1 : 0,
          transform: expanded ? 'translateY(0)' : 'translateY(10px)',
          transition: 'opacity 300ms ease, transform 300ms ease',
          pointerEvents: expanded ? 'auto' : 'none',
          zIndex: 3,
        }}
      >
        <p style={{
          margin: 0,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: card.accent,
          lineHeight: 1,
          marginBottom: 8,
        }}>
          {card.tag}
        </p>

        <p style={{
          margin: 0,
          fontSize: 'clamp(18px, 2.2vw, 22px)',
          fontWeight: 800,
          color: '#0f1729',
          lineHeight: 1.2,
          letterSpacing: '-0.02em',
          marginBottom: 10,
        }}>
          {card.title}
        </p>

        <p style={{
          margin: 0,
          fontSize: 'clamp(13px, 1.3vw, 14px)',
          color: '#43526a',
          lineHeight: 1.6,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          marginBottom: 14,
        }}>
          {card.body}
        </p>

        <button
          type="button"
          style={{
            border: '1px solid #b9c6dc',
            background: '#f8fbff',
            color: '#0f1729',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            padding: '8px 12px',
            cursor: 'pointer',
            transform: expanded ? 'translateY(0)' : 'translateY(4px)',
            transition: 'transform 220ms ease, opacity 220ms ease',
            width: 'fit-content',
          }}
        >
          Explore
        </button>
      </div>
    </div>
  );
});

// ─── Main component ───────────────────────────────────────────────────────────

export default function HorizontalShowcase() {
  return (
    <>
      <style>{`
        .hs-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0;
          align-items: stretch;
          border: 1px solid #334155;
        }

        @media (min-width: 960px) {
          .hs-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
      `}</style>

      <section
        aria-label="Product showcase"
        style={{
          background: 'linear-gradient(180deg, #f8fafc 0%, #edf3fb 100%)',
          borderTop: '1px solid #d8e1ef',
          padding: 'clamp(22px, 4vw, 36px) clamp(12px, 2.2vw, 20px)',
        }}
      >
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: 'clamp(14px, 2.2vw, 20px)' }}>
          <p style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#4361ee',
            marginBottom: 10,
            lineHeight: 1,
          }}>
            Product Showcase
          </p>
          <h2 style={{
            fontSize: 'clamp(1.35rem, 2.4vw, 2rem)',
            fontWeight: 900,
            color: '#0f1729',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            margin: 0,
          }}>
            Everything you need to <span style={{ color: '#4361ee' }}>trade well</span>
          </h2>
        </header>

        <div
          role="region"
          aria-label="Product features"
          className="hs-grid"
        >
          {CARDS.map((card) => (
            <CardFace key={card.num} card={card} />
          ))}
        </div>
      </div>
      </section>
    </>
  );
}

// src/pages/Landing.jsx

import React, { useRef, useState, useEffect } from 'react';
import { ReactLenis } from 'lenis/react';
import {
  motion,
  useMotionTemplate,
  useScroll,
  useTransform,
  useInView,
  useMotionValue,
  useSpring,
  animate,
} from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import MagneticButton from '../components/MagneticButton';
import { FiArrowRight, FiBarChart2, FiShield, FiTrendingUp, FiZap } from 'react-icons/fi';

import heroImg from '../assets/main.png';
import img1    from '../assets/1.png';
import img2    from '../assets/2.png';
import img3    from '../assets/3.png';
import img4    from '../assets/4.png';

const SECTION_HEIGHT = 1500;

// ─── Color palette ────────────────────────────────────────────────────────────
// bg:        #f0f4f8  (cool light blue-gray)
// surface:   #ffffff
// border:    #dde3ec
// navy:      #0d2340  (primary deep navy)
// accent:    #2563eb  (bright blue for interactive)
// text:      #0d2340
// muted:     #64748b

export default function Landing() {
  const navigate = useNavigate();

  // Inject CSS keyframes for ticker on mount
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes ticker-left  { from { transform: translateX(0) } to { transform: translateX(-50%) } }
      @keyframes ticker-right { from { transform: translateX(-50%) } to { transform: translateX(0) } }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <div style={{ background: '#f0f4f8', color: '#0d2340', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <ReactLenis root options={{ lerp: 0.07 }}>
        <TickerStrip />
        <Hero navigate={navigate} />
        <StatsBar />
        <FeaturesSection />
        <HowItWorks />
        <SignalTerminal />
        <HorizontalShowcase />
        <SocialProof />
        <BigStatement />
        <CTASection navigate={navigate} />
        <Footer />
      </ReactLenis>
    </div>
  );
}

///////////////////////////////////////////////////////////////////////////////
// SECTION A — TICKER STRIP
///////////////////////////////////////////////////////////////////////////////

const tickers = [
  { sym: 'RELIANCE', price: '₹2,847', change: '+1.2%', up: true },
  { sym: 'TCS',      price: '₹3,962', change: '+0.8%', up: true },
  { sym: 'INFY',     price: '₹1,624', change: '-0.4%', up: false },
  { sym: 'HDFC',     price: '₹1,740', change: '+2.1%', up: true },
  { sym: 'WIPRO',    price: '₹482',   change: '-0.9%', up: false },
  { sym: 'ICICIBANK',price: '₹1,218', change: '+1.5%', up: true },
  { sym: 'BAJFINANCE',price:'₹6,930', change: '+0.3%', up: true },
  { sym: 'HCLTECH',  price: '₹1,345', change: '-1.1%', up: false },
  { sym: 'TITAN',    price: '₹3,210', change: '+0.6%', up: true },
  { sym: 'NIFTY50',  price: '₹22,450',change: '+0.7%', up: true },
];

const TickerStrip = () => {
  const TickerItem = ({ sym, price, change, up }) => (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 10,
      padding: '0 32px',
      borderRight: '1px solid #dde3ec',
      whiteSpace: 'nowrap',
    }}>
      <span style={{ fontWeight: 700, fontSize: 13, color: '#0d2340' }}>{sym}</span>
      <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#334155' }}>{price}</span>
      <span style={{
        fontSize: 12, fontWeight: 600,
        color: up ? '#16a34a' : '#dc2626',
        background: up ? '#dcfce7' : '#fee2e2',
        padding: '2px 8px', borderRadius: 100,
      }}>
        {change}
      </span>
    </div>
  );

  const doubled = [...tickers, ...tickers];

  return (
    <div style={{
      background: '#ffffff', borderTop: '1px solid #dde3ec',
      borderBottom: '1px solid #dde3ec',
      overflow: 'hidden', padding: '12px 0',
    }}>
      {/* Row 1 — moves left */}
      <div style={{
        display: 'flex',
        animation: 'ticker-left 28s linear infinite',
        width: 'max-content',
      }}>
        {doubled.map((t, i) => <TickerItem key={i} {...t} />)}
      </div>

      {/* Row 2 — moves right */}
      <div style={{
        display: 'flex', marginTop: 8,
        animation: 'ticker-right 22s linear infinite',
        width: 'max-content',
      }}>
        {[...doubled].reverse().map((t, i) => <TickerItem key={i} {...t} />)}
      </div>
    </div>
  );
};



const Hero = ({ navigate }) => (
  <div style={{ height: `calc(${SECTION_HEIGHT}px + 100vh)`, position: 'relative', width: '100%' }}>
    <HeroCenterImage />
    <HeroTextOverlay navigate={navigate} />
    <ParallaxImages />
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, height: 360,
      background: 'linear-gradient(to bottom, rgba(240,244,248,0) 0%, #f0f4f8 100%)',
      pointerEvents: 'none',
    }} />
  </div>
);

const HeroCenterImage = () => {
  const { scrollY } = useScroll();

  // Clip starts at 15% and expands to 0-100 (full reveal)
  const clip1 = useTransform(scrollY, [0, 1500], [15, 0]);
  const clip2 = useTransform(scrollY, [0, 1500], [85, 100]);
  const clipPath = useMotionTemplate`polygon(${clip1}% ${clip1}%, ${clip2}% ${clip1}%, ${clip2}% ${clip2}%, ${clip1}% ${clip2}%)`;

  const opacity = useTransform(scrollY, [SECTION_HEIGHT, SECTION_HEIGHT + 500], [1, 0]);

  // Start at 75% size so full image is visible — gentle zoom to 85% on scroll
  const backgroundSize = useTransform(scrollY, [0, SECTION_HEIGHT], ['50%', '85%']);

  return (
    <motion.div
      style={{
        position: 'sticky', top: 0,
        height: '100vh', width: '100%',
        clipPath,
        opacity,
        backgroundImage: `url(${heroImg})`,
        backgroundSize,              // controlled zoom — not 'cover'
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
        // Light overlay so text above is readable
        // and image does not feel raw / too vivid
        filter: 'brightness(0.82) saturate(0.95)',
      }}
    />
  );
};

const HeroTextOverlay = ({ navigate }) => {
  const { scrollY } = useScroll();
  const y       = useTransform(scrollY, [0, 600], [0, -100]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);

  return (
    <motion.div
      style={{
        position: 'absolute',
        top: '20vh', left: '50%',
        x: '-50%',
        textAlign: 'center',
        zIndex: 10,
        y, opacity,
        width: '90%', maxWidth: 720,
      }}
    >
      {/* Badge */}
      <motion.span
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        style={{
          display: 'inline-block',
          padding: '6px 20px', borderRadius: 100,
          background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(37,99,235,0.25)',
          fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
          color: '#2563eb', marginBottom: 24,
          textTransform: 'uppercase',
        }}
      >
        India's Intelligent Trading Platform
      </motion.span>

      {/* Heading */}
      <motion.h1
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.7 }}
        style={{
          fontSize: 'clamp(2.8rem, 6vw, 5rem)',
          fontWeight: 900, lineHeight: 1.00,
          color: '#0d2340',
          letterSpacing: '-0.04em',
          marginBottom: 20,
          textShadow: '0 2px 20px rgba(255,255,255,0.5)',
        }}
      >
        Trade Smarter.<br />
        <span style={{ color: '#2563eb' }}>Grow Faster.</span>
      </motion.h1>

      {/* Sub */}
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        style={{
          fontSize: '1.15rem', color: '#000000',
          marginBottom: 40, lineHeight: 1.65,
          textShadow: '0 1px 8px rgba(0, 0, 0, 0.6)',
        }}
      >
        AI-powered equity research, real-time portfolio tracking,
        and market intelligence — built for the modern Indian investor.
      </motion.p>

      {/* Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65, duration: 0.6 }}
        style={{ display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}
      >
        <MagneticButton onClick={() => navigate('/signup')}>
          Get Started Free &nbsp;<FiArrowRight />
        </MagneticButton>

        <MagneticButton onClick={() => navigate('/login')}>
          Log In
        </MagneticButton>
      </motion.div>
    </motion.div>
  );
};

// ─── PARALLAX IMAGES ───────────────────────────────────────────────────────────

const ParallaxImages = () => (
  // Outer wrapper fades out smoothly at bottom before next section
  <div style={{ position: 'relative' }}>
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '200px clamp(16px, 5vw, 48px) 120px' }}>

      {/* Image 1 — left aligned, slow */}
      <ParallaxImg
        src={img1}
        start={-70}
        end={70}
        style={{
          width: '36%',
          borderRadius: 18,
          boxShadow: '0 24px 60px rgba(13,35,64,0.13)',
          marginBottom: 80,           // generous gap below
        }}
      />

      {/* Image 2 — centered, medium */}
      <ParallaxImg
        src={img2}
        start={80}
        end={-80}
        style={{
          width: '58%',
          borderRadius: 18,
          margin: '0 auto 100px',    // extra bottom gap
          display: 'block',
          boxShadow: '0 24px 60px rgba(13,35,64,0.13)',
        }}
      />

      {/* Image 3 — right aligned, FASTER (larger start/end) */}
      <ParallaxImg
        src={img3}
        start={-140}               // was -70 — double speed
        end={140}                  // was 70 — double speed
        style={{
          width: '36%',
          borderRadius: 18,
          marginLeft: 'auto',
          marginBottom: 90,
          boxShadow: '0 24px 60px rgba(13,35,64,0.13)',
        }}
      />

      {/* Image 4 — offset left, slow */}
      <ParallaxImg
        src={img4}
        start={0}
        end={-90}
        style={{
          width: '44%',
          borderRadius: 18,
          marginLeft: 60,
          boxShadow: '0 24px 60px rgba(13,35,64,0.13)',
        }}
      />
    </div>

    {/* Clean fade-out gradient at the bottom of this section */}
    {/* Blends into the background color of the next section */}
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      height: 200,
      background: 'linear-gradient(to bottom, rgba(240,244,248,0) 0%, #f0f4f8 100%)',
      pointerEvents: 'none',
    }} />
  </div>
);

const ParallaxImg = ({ src, start, end, style }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: [`${start}px end`, `end ${end * -1}px`],
  });
  const opacity   = useTransform(scrollYProgress, [0.75, 1], [1, 0]);
  const scale     = useTransform(scrollYProgress, [0.75, 1], [1, 0.88]);
  const y         = useTransform(scrollYProgress, [0, 1], [start, end]);
  const transform = useMotionTemplate`translateY(${y}px) scale(${scale})`;
  return (
    <motion.img src={src} alt="" ref={ref}
      style={{ ...style, transform, opacity, marginBottom: 40 }} />
  );
};

// ─── STATS BAR WITH COUNT-UP ANIMATION ─────────────────────────────────────────

const stats = [
  { label: 'Active Traders', value: 2.4, suffix: 'L+', decimals: 1 },
  { label: 'Daily Volume',   value: 840, suffix: 'Cr', prefix: '₹', decimals: 0 },
  { label: 'Stocks Tracked', value: 5200, suffix: '+', decimals: 0 },
  { label: 'ML Accuracy',    value: 68.4, suffix: '%', decimals: 1 },
];

const AnimatedCounter = ({ value, decimals, prefix = '', suffix = '' }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { duration: 2000 });
  const [displayValue, setDisplayValue] = useState('0');

  useEffect(() => {
    if (inView) {
      animate(motionValue, value, { duration: 2, ease: 'easeOut' });
    }
  }, [inView, value, motionValue]);

  useEffect(() => {
    springValue.on('change', (latest) => {
      const formatted = decimals > 0
        ? latest.toFixed(decimals)
        : Math.floor(latest).toLocaleString();
      setDisplayValue(formatted);
    });
  }, [springValue, decimals]);

  return (
    <span ref={ref}>
      {prefix}{displayValue}{suffix}
    </span>
  );
};

const StatsBar = () => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.7 }}
    style={{
      display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap',
      background: '#ffffff',
      borderTop: '1px solid #dde3ec',
      borderBottom: '1px solid #dde3ec',
      padding: 'clamp(24px, 4vw, 44px) clamp(16px, 5vw, 48px)', gap: 32,
    }}
  >
    {stats.map((s, i) => (
      <motion.div
        key={s.label}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: i * 0.1, duration: 0.5 }}
        style={{ textAlign: 'center' }}
      >
        <div style={{
          fontSize: 'clamp(1.8rem, 3vw, 2.4rem)',
          fontWeight: 900, color: '#0d2340',
          letterSpacing: '-0.03em', lineHeight: 1,
        }}>
          <AnimatedCounter
            value={s.value}
            decimals={s.decimals}
            prefix={s.prefix}
            suffix={s.suffix}
          />
        </div>
        <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500, marginTop: 6 }}>
          {s.label}
        </div>
      </motion.div>
    ))}
  </motion.div>
);

// ─── FEATURES — OUTLINE CARDS WITH FIXED HOVER EFFECT ─────────────────────────

const features = [
  {
    icon: <FiZap size={28} />,
    title: 'AI-Powered Signals',
    desc: '42-feature ML pipeline generating BUY/SELL signals with confidence scores across multiple timeframes.',
    tag: 'Machine Learning',
  },
  {
    icon: <FiTrendingUp size={28} />,
    title: 'Real-Time Portfolio',
    desc: 'Live-linked holdings, P&L tracking, and drawdown analysis updated on every market tick.',
    tag: 'Live Data',
  },
  {
    icon: <FiShield size={28} />,
    title: 'Risk Intelligence',
    desc: 'Dynamic stop-loss, regime detection, and volatility-adjusted position sizing built in.',
    tag: 'Risk Engine',
  },
  {
    icon: <FiBarChart2 size={28} />,
    title: 'Deep Analysis',
    desc: 'Full technical suite: MACD, RSI, BB, ADX, OBV, and India-specific macro indicators.',
    tag: 'Technicals',
  },
];

const OutlineCard = ({ icon, title, desc, tag, index }) => {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.6 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{
        position: 'relative',
        padding: '36px 30px',
        background: '#ffffff',
        borderRadius: 50,
        border: '1.5px solid #dde3ec',
        outline: hovered ? '2.5px solid #000000' : '2.5px solid transparent',
        outlineOffset: '+10px',
        cursor: 'default',
        transition: 'outline-color 1s ease, background 1s ease, box-shadow 0.3s ease',
        boxShadow: hovered
          ? '0 8px 40px rgba(37,99,235,0.08)'
          : '0 2px 12px rgba(13,35,64,0.04)',
        overflow: 'hidden',
      }}
    >
      {/* Icon */}
      <motion.div
        animate={{ y: hovered ? -4 : 0 }}
        transition={{ duration: 0.25 }}
        style={{
          width: 52, height: 52,
          border: `1.5px solid ${hovered ? '#2563eb' : '#dde3ec'}`,
          borderRadius: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 24,
          color: hovered ? '#2563eb' : '#0d2340',
          background: hovered ? '#eff6ff' : 'transparent',
          transition: 'border-color 0.3s, background 0.3s, color 0.3s',
        }}
      >
        {icon}
      </motion.div>

      {/* Tag */}
      <motion.span
        animate={{ opacity: hovered ? 1 : 0.5 }}
        style={{
          display: 'inline-block',
          fontSize: 11, fontWeight: 700,
          letterSpacing: '0.08em', color: '#2563eb',
          textTransform: 'uppercase', marginBottom: 10,
        }}
      >
        {tag}
      </motion.span>

      {/* Title */}
      <h3 style={{
        fontSize: '1.15rem', fontWeight: 700,
        color: '#0d2340', marginBottom: 12, lineHeight: 1.3,
      }}>
        {title}
      </h3>

      {/* Desc */}
      <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.65, margin: 0 }}>
        {desc}
      </p>

      {/* Arrow — slides in on hover, clickable */}
      <motion.div
        animate={{ opacity: hovered ? 1 : 0, x: hovered ? 0 : -8 }}
        transition={{ duration: 0.2 }}
        onClick={() => navigate('/login')}
        style={{
          marginTop: 24,
          display: 'inline-flex', alignItems: 'center',
          gap: 6, fontSize: 13, fontWeight: 600, color: '#2563eb',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        Learn more <FiArrowRight size={14} />
      </motion.div>
    </motion.div>
  );
};

const FeaturesSection = () => (
  <div style={{ padding: 'clamp(60px, 10vw, 100px) clamp(16px, 5vw, 48px)', maxWidth: 1100, margin: '0 auto' }}>
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
      style={{ textAlign: 'center', marginBottom: 64 }}
    >
      <p style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
        color: '#2563eb', marginBottom: 14, textTransform: 'uppercase',
      }}>
        Platform Capabilities
      </p>
      <h2 style={{
        fontSize: 'clamp(2rem, 4vw, 3.2rem)',
        fontWeight: 900, color: '#0d2340',
        letterSpacing: '-0.03em', lineHeight: 1.1,
      }}>
        Built for serious investors
      </h2>
    </motion.div>

    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: 24,
    }}>
      {features.map((f, i) => (
        <OutlineCard key={f.title} {...f} index={i} />
      ))}
    </div>
  </div>
);

///////////////////////////////////////////////////////////////////////////////
// SECTION B — HOW IT WORKS
///////////////////////////////////////////////////////////////////////////////

const HowItWorks = () => {
  const containerRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Each card occupies 1/3 of the scroll range
  const card1Opacity = useTransform(scrollYProgress, [0, 0.15, 0.28, 0.38], [0, 1, 1, 0]);
  const card1Y       = useTransform(scrollYProgress, [0, 0.15, 0.28, 0.38], [60, 0, 0, -40]);
  const card1Scale   = useTransform(scrollYProgress, [0, 0.15, 0.28, 0.38], [0.9, 1, 1, 0.95]);

  const card2Opacity = useTransform(scrollYProgress, [0.3, 0.44, 0.58, 0.68], [0, 1, 1, 0]);
  const card2Y       = useTransform(scrollYProgress, [0.3, 0.44, 0.58, 0.68], [60, 0, 0, -40]);
  const card2Scale   = useTransform(scrollYProgress, [0.3, 0.44, 0.58, 0.68], [0.9, 1, 1, 0.95]);

  const card3Opacity = useTransform(scrollYProgress, [0.62, 0.76, 1], [0, 1, 1]);
  const card3Y       = useTransform(scrollYProgress, [0.62, 0.76, 1], [60, 0, 0]);
  const card3Scale   = useTransform(scrollYProgress, [0.62, 0.76, 1], [0.9, 1, 1]);

  const lineWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  const cardMotion = [
    { opacity: card1Opacity, y: card1Y, scale: card1Scale },
    { opacity: card2Opacity, y: card2Y, scale: card2Scale },
    { opacity: card3Opacity, y: card3Y, scale: card3Scale },
  ];

  const stepData = [
    {
      num: '01',
      label: 'Connect',
      title: 'Connect Your Portfolio',
      body: 'Add your holdings in seconds. YES Securities syncs with your existing positions and computes real-time P&L instantly.',
      detail: 'Supports NSE, BSE. Firestore-powered, real-time sync.',
      icon: <FiBarChart2 size={28} />,
      accent: '#2563eb',
      bg: '#eff6ff',
    },
    {
      num: '02',
      label: 'Signal',
      title: 'Receive AI Signals',
      body: 'Our 42-feature ML engine scans 5,000+ instruments and generates BUY/SELL signals with confidence scores across multiple timeframes.',
      detail: 'ULTRA_SHORT → POSITIONAL. Multi-model ensemble. Live regime detection.',
      icon: <FiZap size={28} />,
      accent: '#7c3aed',
      bg: '#f5f3ff',
    },
    {
      num: '03',
      label: 'Execute',
      title: 'Trade with Confidence',
      body: 'Use Deep Analysis, risk-adjusted position sizing, and stop-loss automation to enter and exit with full conviction.',
      detail: 'Dynamic SL/TP. Volatility-adjusted qty. Full trade journal.',
      icon: <FiTrendingUp size={28} />,
      accent: '#059669',
      bg: '#f0fdf4',
    },
  ];

  return (
    <div ref={containerRef} style={{ height: '300vh', position: 'relative' }}>
      <div style={{
        position: 'sticky', top: 0,
        height: '100vh',
        display: 'flex', flexDirection: 'column',
        background: '#f0f4f8',
        overflow: 'hidden',
      }}>
        {/* Top label */}
        <div style={{
          padding: '48px clamp(20px, 5vw, 64px) 0',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 16,
        }}>
          <div>
            <p style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
              color: '#2563eb', textTransform: 'uppercase', marginBottom: 6,
            }}>
              How It Works
            </p>
            <h2 style={{
              fontSize: 'clamp(1.6rem, 3vw, 2.6rem)',
              fontWeight: 900, color: '#0d2340', letterSpacing: '-0.03em',
              margin: 0,
            }}>
              From signal to execution in 3 steps
            </h2>
          </div>

          {/* Step counter */}
          <div style={{ display: 'flex', gap: 8 }}>
            {stepData.map((s, i) => (
              <motion.div
                key={i}
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: '#ffffff',
                  border: `2px solid ${s.accent}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 800, color: s.accent,
                  opacity: useTransform(
                    scrollYProgress,
                    [i * 0.33, i * 0.33 + 0.15],
                    [0.3, 1]
                  ),
                }}
              >
                {i + 1}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Progress line */}
        <div style={{
          margin: '24px clamp(20px, 5vw, 64px) 0',
          height: 2, background: '#dde3ec',
          borderRadius: 2, overflow: 'hidden',
          position: 'relative',
        }}>
          <motion.div style={{
            position: 'absolute', top: 0, left: 0,
            height: '100%', width: lineWidth,
            background: 'linear-gradient(90deg, #2563eb, #7c3aed, #059669)',
            borderRadius: 2,
          }} />
        </div>

        {/* Cards container — all 3 stacked in same position */}
        <div style={{
          flex: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 clamp(20px, 5vw, 64px)',
          position: 'relative',
        }}>
          {stepData.map((step, i) => (
            <motion.div
              key={i}
              style={{
                position: 'absolute',
                width: '100%', maxWidth: 680,
                opacity: cardMotion[i].opacity,
                y: cardMotion[i].y,
                scale: cardMotion[i].scale,
              }}
            >
              <div style={{
                background: '#ffffff',
                border: `2px solid ${step.accent}22`,
                borderRadius: 28,
                padding: 'clamp(32px, 5vw, 52px) clamp(24px, 4.5vw, 56px)',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: `0 24px 80px ${step.accent}12`,
              }}>
                {/* Large background number */}
                <div style={{
                  position: 'absolute', top: -20, right: 32,
                  fontSize: '10rem', fontWeight: 900,
                  color: step.accent + '08',
                  fontFamily: 'monospace', lineHeight: 1,
                  userSelect: 'none', pointerEvents: 'none',
                }}>
                  {step.num}
                </div>

                {/* Top row: icon + tag */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
                  <div style={{
                    width: 60, height: 60, borderRadius: 16,
                    background: step.bg,
                    border: `1.5px solid ${step.accent}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: step.accent,
                    flexShrink: 0,
                  }}>
                    {step.icon}
                  </div>
                  <div>
                    <span style={{
                      fontSize: 11, fontWeight: 700,
                      letterSpacing: '0.1em', textTransform: 'uppercase',
                      color: step.accent,
                    }}>
                      Step {step.num} — {step.label}
                    </span>
                    <h3 style={{
                      fontSize: 'clamp(1.3rem, 2.5vw, 1.8rem)',
                      fontWeight: 900, color: '#0d2340',
                      margin: '4px 0 0', lineHeight: 1.2,
                    }}>
                      {step.title}
                    </h3>
                  </div>
                </div>

                {/* Body */}
                <p style={{
                  fontSize: '1.05rem', color: '#334155',
                  lineHeight: 1.75, marginBottom: 28,
                }}>
                  {step.body}
                </p>

                {/* Detail chip */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center',
                  gap: 8, padding: '10px 20px',
                  background: step.bg,
                  border: `1px solid ${step.accent}25`,
                  borderRadius: 100,
                  fontSize: 13, color: step.accent, fontWeight: 600,
                }}>
                  <FiZap size={13} />
                  {step.detail}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom scroll hint */}
        <div style={{
          padding: '0 clamp(20px, 5vw, 64px) 32px',
          display: 'flex', justifyContent: 'center',
        }}>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.6 }}
            style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}
          >
            ↓ Scroll through each step
          </motion.div>
        </div>
      </div>
    </div>
  );
};

///////////////////////////////////////////////////////////////////////////////
// SECTION C — LIVE SIGNAL TERMINAL
///////////////////////////////////////////////////////////////////////////////

const terminalLines = [
  { type: 'label',  text: 'YES Securities AI Signal Engine v2.4.1' },
  { type: 'meta',   text: 'Scanning NSE/BSE — 5,247 instruments' },
  { type: 'spacer', text: '' },
  { type: 'signal', text: '▶  RELIANCE.NS   →  BUY    ₹2,847   Conf: 87%   Target: ₹3,010   SL: ₹2,760' },
  { type: 'signal', text: '▶  TCS.NS        →  HOLD   ₹3,962   Conf: 72%   Target: ₹4,100   SL: ₹3,820' },
  { type: 'signal', text: '▶  BAJFINANCE.NS →  BUY    ₹6,930   Conf: 81%   Target: ₹7,250   SL: ₹6,710' },
  { type: 'warn',   text: '⚠  INFY.NS       →  SELL   ₹1,624   Conf: 78%   Target: ₹1,540   SL: ₹1,660' },
  { type: 'signal', text: '▶  HDFCBANK.NS   →  BUY    ₹1,740   Conf: 84%   Target: ₹1,850   SL: ₹1,690' },
  { type: 'spacer', text: '' },
  { type: 'meta',   text: 'Regime: BULL  •  Volatility: MODERATE  •  Next scan in 4m 12s' },
];

const colorMap = {
  label:  '#93c5fd',
  meta:   '#64748b',
  signal: '#4ade80',
  warn:   '#fbbf24',
  spacer: 'transparent',
};

const SignalTerminal = () => (
  <motion.div
    initial={{ opacity: 0, y: 60 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.8 }}
    style={{ padding: 'clamp(60px, 10vw, 100px) clamp(16px, 5vw, 48px)', background: '#f0f4f8' }}
  >
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        style={{ textAlign: 'center', marginBottom: 48 }}
      >
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#2563eb', marginBottom: 14, textTransform: 'uppercase' }}>
          AI Engine Preview
        </p>
        <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 900, color: '#0d2340', letterSpacing: '-0.03em' }}>
          Signals generated in real time
        </h2>
      </motion.div>

      <div style={{
        background: '#0d1117',
        borderRadius: 16,
        border: '1px solid #1e2d3d',
        overflow: 'hidden',
        boxShadow: '0 32px 80px rgba(13,35,64,0.2)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '12px 20px',
          background: '#161b22',
          borderBottom: '1px solid #1e2d3d',
        }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f56' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffbd2e' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#27c93f' }} />
          <span style={{ marginLeft: 12, fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>
            yes-signal-engine — live output
          </span>
          <motion.div
            animate={{ opacity: [1, 0, 1] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
            style={{
              marginLeft: 'auto', width: 8, height: 14,
              background: '#4ade80', borderRadius: 2,
            }}
          />
        </div>

        <div style={{ padding: '24px 28px', fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>
          {terminalLines.map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.3 }}
              style={{
                color: colorMap[line.type],
                marginBottom: line.type === 'spacer' ? 12 : 6,
                lineHeight: 1.6,
                letterSpacing: line.type === 'signal' ? '0.02em' : 0,
              }}
            >
              {line.text || '\u00A0'}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </motion.div>
);

///////////////////////////////////////////////////////////////////////////////
// SECTION D — HORIZONTAL SCROLL SHOWCASE
///////////////////////////////////////////////////////////////////////////////

const showcaseCards = [
  {
    num: '01',
    title: 'Portfolio Command Center',
    body: 'See all holdings, live P&L, and risk metrics in one unified dashboard. Updated tick-by-tick.',
    accent: '#2563eb',
    tag: 'Portfolio',
  },
  {
    num: '02',
    title: 'Deep Analysis Suite',
    body: 'MACD, RSI, Bollinger Bands, ADX, OBV — every indicator you need for high-conviction entries.',
    accent: '#7c3aed',
    tag: 'Technicals',
  },
  {
    num: '03',
    title: 'AI Signal Feed',
    body: 'Multi-horizon signals from ULTRA_SHORT to POSITIONAL with confidence, target, and stop levels.',
    accent: '#0891b2',
    tag: 'AI Engine',
  },
  {
    num: '04',
    title: 'Paper Trading Engine',
    body: 'Practice with virtual capital, simulated slippage, brokerage costs, and a full trade journal.',
    accent: '#059669',
    tag: 'Simulation',
  },
  {
    num: '05',
    title: 'Risk Intelligence',
    body: 'Regime detection, volatility-adjusted sizing, and automatic stop triggers built into every trade.',
    accent: '#dc2626',
    tag: 'Risk Engine',
  },
  {
    num: '06',
    title: 'Macro Dashboard',
    body: 'India-specific macro indicators: FII/DII flows, sector rotation, GDP, inflation, and more.',
    accent: '#d97706',
    tag: 'Macro',
  },
  {
    num: '07',
    title: 'Seasonality Patterns',
    body: 'Historical seasonal analysis for NSE/BSE stocks — know when the odds are historically in your favour.',
    accent: '#be185d',
    tag: 'Patterns',
  },
];

const HorizontalShowcase = () => {
  const containerRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Horizontal movement — wider range for 7 cards
  const x = useTransform(scrollYProgress, [0, 1], ['0%', '-78%']);

  // Border radius morphs variably per scroll position
  const makeBorderRadius = (offset) =>
    useTransform(
      scrollYProgress,
      [0, 0.25, 0.5, 0.75, 1],
      [
        `${16 + offset}px`,
        `${40 + offset * 2}px`,
        `${8 + offset}px`,
        `${60 + offset}px`,
        `${16 + offset}px`,
      ]
    );

  // Generate per-card border radii with different offsets
  const radii = [0, 8, 16, 4, 20, 12, 6].map(makeBorderRadius);

  return (
    // Tall container to give scroll room for 7 cards
    <div ref={containerRef} style={{ height: '450vh', position: 'relative' }}>
      <div style={{
        position: 'sticky', top: 0,
        height: '100vh', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        background: '#ffffff', borderTop: '1px solid #dde3ec',
      }}>
        {/* Header */}
        <div style={{ padding: '0 clamp(20px, 5vw, 64px)', marginBottom: 40 }}>
          <p style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
            color: '#2563eb', textTransform: 'uppercase', marginBottom: 8,
          }}>
            Product Showcase
          </p>
          <h2 style={{
            fontSize: 'clamp(1.8rem, 3vw, 2.8rem)',
            fontWeight: 900, color: '#0d2340', letterSpacing: '-0.03em',
          }}>
            Everything you need to trade well
          </h2>
        </div>

        {/* Sliding cards */}
        <div style={{ overflow: 'hidden', paddingLeft: 'clamp(20px, 5vw, 64px)' }}>
          <motion.div style={{
            x,
            display: 'flex',
            gap: 28,
            width: 'max-content',
            alignItems: 'stretch',
          }}>
            {showcaseCards.map((card, i) => (
              <motion.div
                key={i}
                style={{
                  width: 340,
                  height: 440,        // tall card
                  flexShrink: 0,
                  background: '#f8fafc',
                  border: '1.5px solid #dde3ec',
                  borderRadius: radii[i],  // morphs on scroll
                  padding: '44px 36px',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 8px 32px rgba(13,35,64,0.05)',
                }}
              >
                {/* Left accent bar — also morphs border-radius */}
                <motion.div style={{
                  position: 'absolute', top: 0, left: 0,
                  width: 4, height: '100%',
                  background: card.accent,
                  borderRadius: radii[i],
                }} />

                {/* Top content */}
                <div>
                  {/* Tag chip */}
                  <div style={{
                    display: 'inline-block',
                    padding: '4px 14px', borderRadius: 100,
                    background: card.accent + '18',
                    border: `1px solid ${card.accent}33`,
                    fontSize: 11, fontWeight: 700,
                    color: card.accent, letterSpacing: '0.08em',
                    textTransform: 'uppercase', marginBottom: 20,
                  }}>
                    {card.tag}
                  </div>

                  {/* Big number */}
                  <div style={{
                    fontSize: '5.5rem', fontWeight: 900,
                    color: card.accent + '14',
                    lineHeight: 1, marginBottom: 16,
                    fontFamily: 'monospace', letterSpacing: '-0.04em',
                  }}>
                    {card.num}
                  </div>

                  <h3 style={{
                    fontSize: '1.25rem', fontWeight: 800,
                    color: '#0d2340', marginBottom: 14, lineHeight: 1.25,
                  }}>
                    {card.title}
                  </h3>

                  <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7 }}>
                    {card.body}
                  </p>
                </div>

                {/* Bottom arrow */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontSize: 13, fontWeight: 700, color: card.accent,
                }}>
                  Explore <FiArrowRight size={14} />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Scroll progress dots */}
        <div style={{
          padding: '28px clamp(20px, 5vw, 64px) 0',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          {showcaseCards.map((_, i) => (
            <motion.div
              key={i}
              style={{
                width: 6, height: 6, borderRadius: '50%',
                background: useTransform(
                  scrollYProgress,
                  [i / 7, (i + 1) / 7],
                  ['#dde3ec', '#2563eb']
                ),
              }}
            />
          ))}
          <motion.span
            animate={{ x: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 1.8 }}
            style={{ marginLeft: 12, fontSize: 12, color: '#94a3b8', fontWeight: 500 }}
          >
            Scroll to explore →
          </motion.span>
        </div>
      </div>
    </div>
  );
};

///////////////////////////////////////////////////////////////////////////////
// SECTION E — SOCIAL PROOF BAR
///////////////////////////////////////////////////////////////////////////////

const SocialProof = () => (
  <motion.div
    initial={{ opacity: 0 }}
    whileInView={{ opacity: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.8 }}
    style={{
      background: '#f0f4f8',
      borderTop: '1px solid #dde3ec',
      padding: 'clamp(40px, 6vw, 60px) clamp(16px, 5vw, 48px)',
      textAlign: 'center',
    }}
  >
    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 36 }}>
      Trusted by traders across India
    </p>

    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center', marginBottom: 56 }}>
      {[
        '🔒 SEBI Compliant',
        '⚡ NSE / BSE Live',
        '🧠 42-Feature ML Engine',
        '📊 Real-time P&L',
        '🛡 Secure by Firebase',
        '📱 Mobile Responsive',
      ].map((badge, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.08, duration: 0.4 }}
          style={{
            padding: '10px 20px',
            background: '#ffffff',
            border: '1.5px solid #dde3ec',
            borderRadius: 100,
            fontSize: 13,
            fontWeight: 600,
            color: '#0d2340',
          }}
        >
          {badge}
        </motion.div>
      ))}
    </div>

    <motion.blockquote
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay: 0.2 }}
      style={{
        maxWidth: 680, margin: '0 auto',
        padding: '36px 48px',
        background: '#ffffff',
        border: '1.5px solid #dde3ec',
        borderRadius: 20,
        position: 'relative',
      }}
    >
      <span style={{
        position: 'absolute', top: -20, left: 40,
        fontSize: '5rem', color: '#2563eb',
        lineHeight: 1, fontFamily: 'serif', fontWeight: 900,
        opacity: 0.15,
      }}>
        "
      </span>
      <p style={{ fontSize: '1.1rem', color: '#334155', lineHeight: 1.7, fontStyle: 'italic', margin: 0 }}>
        YES Securities changed how I approach the market. The AI signals are sharp,
        the portfolio view is clean, and the Deep Analysis gives me real conviction before I enter a trade.
      </p>
      <footer style={{ marginTop: 20, fontSize: 13, color: '#64748b', fontWeight: 600 }}>
        — Arjun M., Equity Trader, Mumbai
      </footer>
    </motion.blockquote>
  </motion.div>
);

///////////////////////////////////////////////////////////////////////////////
// SECTION F — BIG BOLD TEXT SECTION
///////////////////////////////////////////////////////////////////////////////

const BigStatement = () => {
  const words = "Every great trade starts with better intelligence.".split(" ");

  return (
    <div style={{
      padding: 'clamp(60px, 10vw, 120px) clamp(16px, 5vw, 48px)',
      background: '#0d2340',
      textAlign: 'center',
    }}>
      <div style={{
        maxWidth: 900, margin: '0 auto',
        display: 'flex', flexWrap: 'wrap',
        gap: '0 14px', justifyContent: 'center',
      }}>
        {words.map((word, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.07, duration: 0.5, ease: 'easeOut' }}
            style={{
              fontSize: 'clamp(2rem, 4.5vw, 4rem)',
              fontWeight: 900,
              color: i % 4 === 2 ? '#60a5fa' : '#f8fafc',
              letterSpacing: '-0.03em',
              lineHeight: 1.2,
              display: 'inline-block',
            }}
          >
            {word}
          </motion.span>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.8, duration: 0.6 }}
        style={{ marginTop: 32, fontSize: '1.1rem', color: '#64748b' }}
      >
        YES Securities — built for India's next generation of investors.
      </motion.p>
    </div>
  );
};

// ─── CTA SECTION — single large rotating magnetic button ──────────────────────

const CTASection = ({ navigate }) => (
  <motion.div
    initial={{ opacity: 0, y: 60 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.8 }}
    style={{
      textAlign: 'center',
      padding: 'clamp(60px, 10vw, 120px) clamp(16px, 5vw, 48px) clamp(80px, 12vw, 140px)',
      background: '#f0f4f8',
    }}
  >
    <p style={{
      fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
      color: '#2563eb', marginBottom: 16, textTransform: 'uppercase',
    }}>
      Start Your Journey
    </p>

    <h2 style={{
      fontSize: 'clamp(2rem, 4.5vw, 3.8rem)',
      fontWeight: 900, color: '#0d2340',
      marginBottom: 16, letterSpacing: '-0.04em', lineHeight: 1.08,
    }}>
      Ready to trade smarter?
    </h2>

    <p style={{
      fontSize: '1.1rem', color: '#64748b',
      maxWidth: 460, margin: '0 auto 72px',
      lineHeight: 1.65,
    }}>
      Join YES Securities and experience AI-driven investing backed by real market intelligence.
    </p>

    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <MagneticButton
        onClick={() => navigate('/signup')}
        rotate={true}
        size="round-large"
      >
        Get<br />Started<br />Free
      </MagneticButton>
    </div>

    <motion.p
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay: 0.4 }}
      style={{ marginTop: 32, fontSize: 13, color: '#94a3b8' }}
    >
      Already have an account?{' '}
      <span
        onClick={() => navigate('/login')}
        style={{ color: '#2563eb', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}
      >
        Log in
      </span>
    </motion.p>
  </motion.div>
);

// ─── FOOTER ────────────────────────────────────────────────────────────────────

const Footer = () => (
  <footer style={{
    background: '#0d2340', color: '#64748b',
    padding: 'clamp(24px, 4vw, 48px)', textAlign: 'center',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 }}>
      <div style={{
        width: 28, height: 28, background: '#2563eb',
        borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
      <img src="src\assets\logo.png"  style={{ width: 25, height: 18 }} />
      </div>
      <span style={{ fontWeight: 800, color: '#f8fafc', fontSize: '1rem', letterSpacing: '-0.01em' }}>
        YES Securities
      </span>
    </div>
    <p style={{ fontSize: 13, color: '#f7f8f9' }}>
      © 2026 YES Securities. (A PROTOTYPE)
    </p>
    <p style={{ fontSize: 18, marginTop: 8, color: '#f4f6f9' }}>
      DEVELOPED BY ___ KUNAL MATHUR 
    </p>
    <p>Full Stack Intern , Bengaluru </p>
  </footer>
);

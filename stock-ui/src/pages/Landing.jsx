// src/pages/Landing.jsx
import React, {
  lazy,
  Suspense,
  useRef,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { ReactLenis } from 'lenis/react';


import {
  motion,
  AnimatePresence,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
  animate,
} from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';

import MagneticButton from '../components/ui/MagneticButton';
import RotatingText   from '../components/ui/RotatingText';
import OmniAnimation  from '../components/sections/animation';
import { FiArrowRight, FiBarChart2, FiShield, FiTrendingUp, FiZap } from 'react-icons/fi';

import '../styles/ticker.css';

import heroImg from '../assets/main.png';
import logo from '../assets/logo.png';

import portfolioAnim from '../assets/lottie/openaccount.json';
import analysisAnim  from '../assets/lottie/exploretools.json';
import tradingAnim   from '../assets/lottie/learnmore.json';

const SignalTerminal     = lazy(() => import(/* webpackChunkName: "s-terminal" */     '../components/sections/SignalTerminal'));
const HorizontalShowcase = lazy(() => import(/* webpackChunkName: "s-showcase" */    '../components/sections/HorizontalShowcase'));
const SocialProof        = lazy(() => import(/* webpackChunkName: "s-social" */      '../components/sections/SocialProof'));
const BigStatement       = lazy(() => import(/* webpackChunkName: "s-bigstatement" */'../components/sections/BigStatement'));
const CTASection         = lazy(() => import(/* webpackChunkName: "s-cta" */         '../components/sections/CTASection'));

const tickers = [
  { sym: 'RELIANCE',   price: '₹2,847',  change: '+1.2%', up: true  },
  { sym: 'TCS',        price: '₹3,962',  change: '+0.8%', up: true  },
  { sym: 'INFY',       price: '₹1,624',  change: '-0.4%', up: false },
  { sym: 'HDFC',       price: '₹1,740',  change: '+2.1%', up: true  },
  { sym: 'WIPRO',      price: '₹482',    change: '-0.9%', up: false },
  { sym: 'ICICIBANK',  price: '₹1,218',  change: '+1.5%', up: true  },
  { sym: 'BAJFINANCE', price: '₹6,930',  change: '+0.3%', up: true  },
  { sym: 'HCLTECH',    price: '₹1,345',  change: '-1.1%', up: false },
  { sym: 'TITAN',      price: '₹3,210',  change: '+0.6%', up: true  },
  { sym: 'NIFTY50',    price: '₹22,450', change: '+0.7%', up: true  },
];

// Pre-compute doubled arrays once rather than inside render
const tickerDoubled  = [...tickers, ...tickers];
const tickerReversed = [...tickerDoubled].reverse();

const stats = [
  { label: 'Active Traders', value: 2.4,  suffix: 'L+', decimals: 1 },
  { label: 'Daily Volume',   value: 840,  suffix: 'Cr', prefix: '₹', decimals: 0 },
  { label: 'Stocks Tracked', value: 5200, suffix: '+',  decimals: 0 },
  { label: 'ML Accuracy',    value: 68.4, suffix: '%',  decimals: 1 },
];

const features = [
  {
    icon: <FiZap size={28} aria-hidden="true" />,
    title: 'AI-Powered Signals',
    desc: '42-feature ML pipeline generating BUY/SELL signals with confidence scores across multiple timeframes.',
    tag: 'Machine Learning',
    cardBg: '#c5ffe49a',
    cardAccent: '#1fbe8c7a',
  },
  {
    icon: <FiTrendingUp size={28} aria-hidden="true" />,
    title: 'Real-Time Portfolio',
    desc: 'Live-linked holdings, P&L tracking, and drawdown analysis updated on every market tick.',
    tag: 'Live Data',
    cardBg: '#fff7eddd',
    cardAccent: '#eac50c',
  },
  {
    icon: <FiShield size={28} aria-hidden="true" />,
    title: 'Risk Intelligence',
    desc: 'Dynamic stop-loss, regime detection, and volatility-adjusted position sizing built in.',
    tag: 'Risk Engine',
    cardBg: '#c5ffe49a',
    cardAccent: '#1fbe8c7a',
  },
  {
    icon: <FiBarChart2 size={28} aria-hidden="true" />,
    title: 'Deep Analysis',
    desc: 'Full technical suite: MACD, RSI, BB, ADX, OBV, and India-specific macro indicators.',
    tag: 'Technicals',
    cardBg: '#fff7eddd',
    cardAccent: '#eac50c',
  },
];

const investingTabs = [
  { id: 'new',         label: 'New'         },
  { id: 'experienced', label: 'Experienced' },
  { id: 'pro',         label: 'Pro'         },
];

const tabContent = {
  new: {
    accent: '#4361ee', bg: '#eff3ff',
    hero: {
      title: 'Open Demat Account & Invest Now',
      body:  'Start investing in 3 clicks with the all-new YES Securities platform.',
      cta:   'Open an Account',
    },
    grid: [
      { title: 'Equity SIP',                  tag: 'Invest',   icon: <FiTrendingUp size={20} aria-hidden="true" /> },
      { title: 'ETFs',                         tag: 'Invest',   icon: <FiBarChart2  size={20} aria-hidden="true" /> },
      { title: 'WealthBox',                    tag: 'Invest',   icon: <FiShield     size={20} aria-hidden="true" /> },
      { title: 'Transparent Pricing',          tag: 'Platform', icon: <FiZap        size={20} aria-hidden="true" /> },
      { title: 'Top Stocks for Beginners',     tag: 'Learn',    icon: <FiBarChart2  size={20} aria-hidden="true" /> },
      { title: 'Discover Your Investor Style', tag: 'Learn',    icon: <FiTrendingUp size={20} aria-hidden="true" /> },
    ],
  },
  experienced: {
    accent: '#7c3aed', bg: '#f5f3ff',
    hero: {
      title: 'Invest with Proper Analysis',
      body:  'Advanced tools and charts to take your financial journey further.',
      cta:   'Explore Tools',
    },
    grid: [
      { title: 'Futures & Options',   tag: 'Trade',    icon: <FiTrendingUp size={20} aria-hidden="true" /> },
      { title: 'ETFs',                tag: 'Invest',   icon: <FiBarChart2  size={20} aria-hidden="true" /> },
      { title: 'Currency Trading',    tag: 'Trade',    icon: <FiZap        size={20} aria-hidden="true" /> },
      { title: 'Explore IPO Journey', tag: 'IPO',      icon: <FiShield     size={20} aria-hidden="true" /> },
      { title: 'Markets Today',       tag: 'Markets',  icon: <FiBarChart2  size={20} aria-hidden="true" /> },
      { title: 'Research Calls',      tag: 'Research', icon: <FiTrendingUp size={20} aria-hidden="true" /> },
    ],
  },
  pro: {
    accent: '#059669', bg: '#f0fdf4',
    hero: {
      title: 'Invest Smarter for the Future',
      body:  'Invest wisely with our advanced tools and relationship-focused wealth creation.',
      cta:   'Learn More',
    },
    grid: [
      { title: 'Derivatives Trading', tag: 'Trade',    icon: <FiZap        size={20} aria-hidden="true" /> },
      { title: 'Commodity Trading',   tag: 'Trade',    icon: <FiBarChart2  size={20} aria-hidden="true" /> },
      { title: 'AIF',                 tag: 'Invest',   icon: <FiShield     size={20} aria-hidden="true" /> },
      { title: 'Wealth Creation',     tag: 'Strategy', icon: <FiTrendingUp size={20} aria-hidden="true" /> },
      { title: 'Trading Journey',     tag: 'Trade',    icon: <FiBarChart2  size={20} aria-hidden="true" /> },
      { title: 'PRO Features',        tag: 'Pro',      icon: <FiZap        size={20} aria-hidden="true" /> },
    ],
  },
};

// ─── Skeleton: height-preserving to prevent CLS while lazy chunk loads ────────
const SectionSkeleton = ({ height = 600 }) => (
  <div
    aria-busy="true"
    aria-label="Loading section…"
    style={{ height, background: '#f5f7ff', width: '100%' }}
  />
);

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function Landing() {
  const navigate = useNavigate();

  return (
    // itemScope+itemType registers this page as a FinancialService in schema.org
    <div
      itemScope
      itemType="https://schema.org/FinancialService"
      style={{ background: '#f5f7ff', color: '#0f1729', fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {/* Skip link — first focusable element, satisfies WCAG 2.4.1 */}
      <a
        href="#main-content"
        style={{
          position: 'absolute', top: '-999px', left: '-999px',
          zIndex: 9999, padding: '8px 16px',
          background: '#4361ee', color: '#ffffff',
          fontWeight: 700, borderRadius: 4, textDecoration: 'none',
        }}
        onFocus={(e)  => { e.currentTarget.style.top = '8px'; e.currentTarget.style.left = '8px'; }}
        onBlur={(e)   => { e.currentTarget.style.top = '-999px'; e.currentTarget.style.left = '-999px'; }}
      >
        Skip to main content
      </a>

      <ReactLenis root options={{ lerp: 0.07 }}>

        {/* Ticker — decorative, aria-hidden */}
        <TickerStrip />

        {/* Hero — OmniAnimation as centerpiece with parallax text rails */}
        <main id="main-content">
          <HeroWithOmni navigate={navigate} />
        </main>

        {/* Stats — restored as standalone section */}
        <StatsBar />

        {/* Near-fold — eagerly rendered */}
        <StepIntoInvesting />

        <FeaturesSection />

        {/* Below-fold — each lazy-loaded into its own JS chunk */}
        <Suspense fallback={<SectionSkeleton height={680} />}>
          <SignalTerminal />
        </Suspense>

        <Suspense fallback={<SectionSkeleton height="580vh" />}>
          <HorizontalShowcase />
        </Suspense>

        <Suspense fallback={<SectionSkeleton height={420} />}>
          <SocialProof />
        </Suspense>

        <Suspense fallback={<SectionSkeleton height={360} />}>
          <BigStatement />
        </Suspense>

        <Suspense fallback={<SectionSkeleton height={560} />}>
          <CTASection />
        </Suspense>

        <Footer />
      </ReactLenis>
    </div>
  );
}

///////////////////////////////////////////////////////////////////////////////
// TICKER STRIP
///////////////////////////////////////////////////////////////////////////////

const TickerItem = React.memo(function TickerItem({ sym, price, change, up }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 10,
      padding: '0 32px',
      borderRight: '1px solid #e0e6f1',
      whiteSpace: 'nowrap',
    }}>
      <span style={{ fontWeight: 700, fontSize: 13, color: '#0f1729' }}>{sym}</span>
      <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#52637a' }}>{price}</span>
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
});

const TickerStrip = () => (
  // role="marquee" + aria-hidden — decorative; screen readers skip it
  <div
    role="marquee"
    aria-hidden="true"
    style={{
      background: '#ffffff',
      borderTop: '1px solid #e0e6f1',
      borderBottom: '1px solid #e0e6f1',
      overflow: 'hidden',
      padding: '12px 0',
    }}
  >
    {/* Row 1 — left scroll, keyframe defined in ticker.css */}
    <div style={{ display: 'flex', animation: 'ticker-left 28s linear infinite', width: 'max-content' }}>
      {tickerDoubled.map((t, i) => <TickerItem key={i} {...t} />)}
    </div>
    {/* Row 2 — right scroll */}
    <div style={{ display: 'flex', marginTop: 8, animation: 'ticker-right 22s linear infinite', width: 'max-content' }}>
      {tickerReversed.map((t, i) => <TickerItem key={i} {...t} />)}
    </div>
  </div>
);

///////////////////////////////////////////////////////////////////////////////
// ANIMATED COUNTER (reused by HeroWithOmni and other sections)
///////////////////////////////////////////////////////////////////////////////

// Fixed: unsubscribe returned and called on cleanup — no listener accumulation
const AnimatedCounter = React.memo(function AnimatedCounter({ value, decimals, prefix = '', suffix = '' }) {
  const ref         = useRef(null);
  const inView      = useInView(ref, { once: true });
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { duration: 2000 });
  const [displayValue, setDisplayValue] = useState('0');

  useEffect(() => {
    if (inView) {
      animate(motionValue, value, { duration: 2, ease: 'easeOut' });
    }
  }, [inView, value, motionValue]);

  useEffect(() => {
    // springValue.on() returns an unsubscribe function — return it for cleanup
    const unsubscribe = springValue.on('change', (latest) => {
      setDisplayValue(
        decimals > 0
          ? latest.toFixed(decimals)
          : Math.floor(latest).toLocaleString()
      );
    });
    return unsubscribe;
  }, [springValue, decimals]);

  return (
    <span
      ref={ref}
      aria-live="polite"
      aria-atomic="true"
      style={{ display: 'inline-block' }}
    >
      {prefix}{displayValue}{suffix}
    </span>
  );
});


const HeroWithOmni = ({ navigate }) => {
  const [sp, setSp] = useState(0);

  const onSignup = useCallback(() => navigate('/signup'), [navigate]);
  const onLogin  = useCallback(() => navigate('/login'),  [navigate]);

  const leftY       = sp * -60;
  const leftOpacity = 1;
  const rightY      = sp * 60;
  const rightOpacity = 1;

  return (
    <>
      <style>{`
        @media (max-width: 1320px) {
          .hero-grid {
            grid-template-columns: 280px minmax(0, 1fr) 260px !important;
            padding: 0 20px !important;
            box-sizing: border-box !important;
          }
          .hero-rail-left { padding-right: 0 !important; padding-left: 0 !important; }
          .hero-rail-right { padding-right: 12px !important; }
        }
        @media (max-width: 1024px) {
          .hero-grid { grid-template-columns: 1fr !important; grid-template-rows: auto 1fr auto; }
          .hero-rail { padding: 24px 16px !important; text-align: center !important; align-items: center !important; }
          .hero-rail-left { order: -1; padding-top: 40px !important; }
          .hero-rail-right { order: 1; padding-bottom: 40px !important; }
        }
        @media (max-width: 600px) {
          .hero-grid > div:nth-child(2) { height: 56vw !important; overflow: hidden !important; }
        }
      `}</style>

      <section
        aria-label="Hero section with market intelligence animation"
        style={{
          height: '100vh',
          position: 'relative',
          overflow: 'hidden',
          background: '#EDF5FB',
        }}
      >

        {/* 3-Column Grid */}
        <div
          className="hero-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(280px, 340px) minmax(0, 1fr) minmax(240px, 320px)',
            height: '100%',
            maxWidth: 1440,
            width: '100%',
            padding: '60px 24px 0',
            boxSizing: 'border-box',
            margin: '0 auto',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {/* LEFT RAIL */}
          <div
            className="hero-rail hero-rail-left"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              alignItems: 'flex-end',
              paddingRight: 0,
              paddingTop: 40,
              textAlign: 'right',
              transform: `translateX(22px) translateY(${leftY}px)`,
              opacity: leftOpacity,
              transition: 'opacity 0.1s ease-out',
              position: 'relative',
              zIndex: 3,
            }}
          >
            {/* Eyebrow badge */}
            <span
              style={{
                display: 'inline-block',
                padding: '6px 20px',
                borderRadius: 100,
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(67,97,238,0.25)',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: '#4361ee',
                marginBottom: 24,
                textTransform: 'uppercase',
              }}
            >
              7.5 lakh+ investors and counting
            </span>

            {/* h1 */}
            <h1
              itemProp="name"
              style={{
                fontSize: 'clamp(2.4rem, 4vw, 4rem)',
                fontWeight: 900,
                lineHeight: 1.05,
                color: '#0f1729',
                letterSpacing: '-0.04em',
                margin: 0,
              }}
            >
              Invest Karo.<br />
              <span style={{ color: '#4361ee' }}>Apne Style Se.</span>
            </h1>

            {/* Subtitle */}
            <p
              itemProp="description"
              style={{
                fontSize: '1.1rem',
                color: '#52637a',
                marginTop: 16,
                marginBottom: 0,
                lineHeight: 1.6,
                maxWidth: 340,
              }}
            >
              Diversify your portfolio with insights from 30+ analysts and a seamless platform for empowered investing.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              maxWidth: 900,
              width: '100%',
              margin: '-80px auto 0',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <OmniAnimation onProgress={setSp} />
          </div>


          <div
            className="hero-rail hero-rail-right"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              gap: 12,
              transform: `translateY(${rightY}px)`,
              opacity: rightOpacity,
              transition: 'opacity 0.1s ease-out',
              position: 'relative',
              zIndex: 3,
            }}
          >
            {/* Animated Logo */}
            <motion.img
              src={logo}
              alt="YES Securities Logo"
              initial={{
                rotate: 0,
                scale: 0.5,
                opacity: 0,
                y: -40
              }}
              animate={{
                rotate: [0, 720, 720, 720],
                scale: [0.5, 1.2, 0.9, 1.05, 1],
                opacity: [0, 1, 1, 1, 1],
                y: [-40, -20, -28, -22, -24]
              }}
              transition={{
                duration: 1.8,
                times: [0, 0.4, 0.6, 0.8, 1],
                ease: [0.34, 1.56, 0.64, 1],
              }}
              style={{
                width: 72,
                height: 72,
                marginBottom: 20,
              }}
            />

            <MagneticButton onClick={onSignup} aria-label="Get started free — create account">
              Get Started Free &nbsp;<FiArrowRight aria-hidden="true" />
            </MagneticButton>

            <MagneticButton onClick={onLogin} aria-label="Log in to your existing account">
              Log In
            </MagneticButton>
          </div>
        </div>
      </section>
    </>
  );
};


const StatsBar = () => (
  <section role="region" aria-label="Platform statistics">
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
      style={{
        maxWidth: 1180,
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: 20,
        padding: 'clamp(10px, 2vw, 18px) clamp(16px, 5vw, 48px)',
      }}
    >
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1, duration: 0.5 }}
          style={{
            textAlign: 'center',
            background: 'linear-gradient(165deg, #0a0a0a 0%, #141414 52%, #070707 100%)',
            border: '1px solid rgba(255,255,255,0.16)',
            borderRadius: 22,
            boxShadow: '0 16px 32px rgba(0,0,0,0.28)',
            padding: '24px 18px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 0,
              left: 14,
              right: 14,
              height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(147,197,253,0.6), transparent)',
            }}
          />
          <div style={{
            fontSize: 'clamp(1.8rem, 3vw, 2.4rem)',
            fontWeight: 900, color: '#ffffff',
            letterSpacing: '-0.03em', lineHeight: 1,
            textShadow: '0 2px 0 rgba(0,0,0,0.35)',
          }}>
            <AnimatedCounter
              value={s.value}
              decimals={s.decimals}
              prefix={s.prefix}
              suffix={s.suffix}
            />
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.72)', fontWeight: 500, marginTop: 6 }}>
            {s.label}
          </div>
        </motion.div>
      ))}
    </motion.div>
  </section>
);





const StepIntoInvesting = () => {
  const [activeTab, setActiveTab] = useState(investingTabs[0].id);
  const navigate = useNavigate();
  const content  = tabContent[activeTab];
  const onCta    = useCallback(() => navigate('/signup'), [navigate]);
  const lottieSize = activeTab === 'new' ? '88%' : '94%';

  return (
    <section
      aria-label="Step into the world of investing"
      style={{
        padding: 'clamp(60px, 10vw, 100px) clamp(16px, 5vw, 48px)',
        background: '#eef1ff',
        borderTop: '1px solid #e0e6f1',
        borderBottom: '1px solid #e0e6f1',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 48 }}
        >
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#4361ee', textTransform: 'uppercase', marginBottom: 12 }}>
            Getting Started
          </p>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, color: '#0f1729', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 36 }}>
            Step Into the World of Investing
          </h2>

          {/* Bubble tab bar — accessible with role="tablist" */}
          <div role="tablist" aria-label="Investor experience level" style={{ display: 'inline-flex', background: '#0f1729', borderRadius: 9999, padding: 8, gap: 6 }}>
            {investingTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={activeTab === tab.id}
                aria-controls={`tabpanel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  position: 'relative', padding: '10px 28px',
                  borderRadius: 9999, border: 'none',
                  background: 'transparent',
                  color: activeTab === tab.id ? '#0f1729' : 'rgba(255,255,255,0.55)',
                  fontWeight: 700, fontSize: 14, cursor: 'pointer',
                  transition: 'color 0.25s ease',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {activeTab === tab.id && (
                  <motion.span
                    layoutId="investing-bubble"
                    aria-hidden="true"
                    style={{ position: 'absolute', inset: 0, borderRadius: 9999, background: '#ffffff', zIndex: 0 }}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.55 }}
                  />
                )}
                <span style={{ position: 'relative', zIndex: 1 }}>{tab.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Tab content */}
        <div style={{ background: '#f0f3ff', border: '1.5px solid #e0e6f1', borderRadius: 32, padding: 'clamp(20px, 3vw, 32px)', overflow: 'hidden' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              id={`tabpanel-${activeTab}`}
              role="tabpanel"
              aria-labelledby={`tab-${activeTab}`}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, alignItems: 'start' }}>

                {/* Hero card */}
                <div style={{ background: content.accent, borderRadius: 22, overflow: 'hidden', display: 'flex', flexDirection: 'row', height: 520 }}>
                  <div style={{ position: 'relative', width: '48%', flexShrink: 0, overflow: 'hidden' }}>
                    <motion.div
                      key={`${activeTab}-lottie`}
                      initial={{ opacity: 0, x: 60 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -60 }}
                      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Lottie
                        key={`anim-${activeTab}`}
                        animationData={
                          activeTab === 'new'
                            ? portfolioAnim
                            : activeTab === 'experienced'
                            ? analysisAnim
                            : tradingAnim
                        }
                        loop={false}
                        autoplay
                        style={{
                          width: lottieSize,
                          height: lottieSize,
                          maxWidth: 420,
                          position: 'relative',
                          zIndex: 1,
                        }}
                      />
                    </motion.div>
                    <div aria-hidden="true" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 60, background: `linear-gradient(to right, transparent, ${content.accent})`, pointerEvents: 'none' }} />
                  </div>

                  <div style={{ flex: 1, padding: '68px 28px 28px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
                    <div aria-hidden="true" style={{ position: 'absolute', bottom: -16, right: 12, fontSize: '5.5rem', fontWeight: 900, color: 'rgba(255,255,255,0.05)', fontFamily: 'monospace', lineHeight: 1, pointerEvents: 'none', userSelect: 'none' }}>
                      {activeTab === 'new' ? '01' : activeTab === 'experienced' ? '02' : '03'}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>
                        {activeTab === 'new' ? 'Start Here' : activeTab === 'experienced' ? 'Level Up' : 'Master Class'}
                      </span>
                      <h3 style={{ fontSize: 'clamp(1rem, 1.5vw, 1.25rem)', fontWeight: 900, color: '#ffffff', lineHeight: 1.25, margin: 0 }}>
                        {content.hero.title}
                      </h3>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.68)', lineHeight: 1.6, margin: 0 }}>
                        {content.hero.body}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={onCta}
                      style={{ alignSelf: 'flex-start', padding: '10px 20px', background: '#ffffff', border: 'none', borderRadius: 9999, fontWeight: 800, fontSize: 12, color: content.accent, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      {content.hero.cta} <FiArrowRight size={13} aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {/* Pill card grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                  {content.grid.map((item, i) => (
                    <PillCard key={item.title + activeTab} item={item} index={i} accent={content.accent} bg={content.bg} />
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
};

const PillCard = React.memo(function PillCard({ item, index, accent, bg }) {
  const navigate  = useNavigate();
  const handleNav = useCallback(() => navigate('/login'), [navigate]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.90, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      whileHover={{ x: -4, y: -4, scale: 1.04, boxShadow: `9px 6px 0px ${accent}` }}
      whileTap={{ x: 0, y: 0, scale: 0.99, boxShadow: 'none' }}
      transition={{ delay: index * 0.02, duration: 0.28, ease: 'easeOut' }}
      onClick={handleNav}
      tabIndex={0}
      role="button"
      aria-label={`${item.title} — ${item.tag}`}
      style={{
        borderRadius: 99999,
        border: `2px dashed ${accent}`,
        background: bg,
        cursor: 'pointer',
        padding: '10px 10px',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', textAlign: 'center', gap: 10,
        minHeight: 160, justifyContent: 'center',
        transition: 'all 0.28s ease-out',
        outline: 'none',
      }}
    >
      <div aria-hidden="true" style={{ width: 42, height: 42, borderRadius: '50%', background: '#ffffff', border: `1.5px solid ${accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent }}>
        {item.icon}
      </div>

      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent }}>
        {item.tag}
      </span>

      <p style={{ fontSize: 13, fontWeight: 700, color: '#0f1729', lineHeight: 1.3, margin: 0 }}>
        {item.title}
      </p>
    </motion.div>
  );
});

///////////////////////////////////////////////////////////////////////////////
// FEATURES SECTION
///////////////////////////////////////////////////////////////////////////////

const OutlineCard = React.memo(function OutlineCard({ icon, title, desc, tag, index, cardBg, cardAccent }) {
  const [hovered, setHovered] = useState(false);
  const navigate    = useNavigate();
  const onLearnMore = useCallback(() => navigate('/login'), [navigate]);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateXRaw = useTransform(mouseY, [-45, 45], [5, -5]);
  const rotateYRaw = useTransform(mouseX, [-45, 45], [-6, 6]);
  const rotateX = useSpring(rotateXRaw, { stiffness: 220, damping: 22, mass: 0.6 });
  const rotateY = useSpring(rotateYRaw, { stiffness: 220, damping: 22, mass: 0.6 });
  const dynamicGlow = useTransform(
    [mouseX, mouseY],
    ([x, y]) => `radial-gradient(240px 170px at ${50 + x * 0.35}% ${35 + y * 0.35}%, ${cardAccent}2d 0%, transparent 70%)`
  );

  const handlePointerMove = useCallback((event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const xPct = (x / rect.width) * 100;
    const yPct = (y / rect.height) * 100;

    mouseX.set(((xPct - 50) / 50) * 45);
    mouseY.set(((yPct - 50) / 50) * 45);
  }, [mouseX, mouseY]);

  const resetPointer = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
    setHovered(false);
  }, [mouseX, mouseY]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      animate={{ y: [0, -2, 0] }}
      viewport={{ once: true }}
      transition={{
        opacity: { delay: index * 0.1, duration: 0.6 },
        y: { delay: index * 0.1, duration: 0.6 },
        default: { duration: 6.4, repeat: Infinity, ease: 'easeInOut', delay: index * 0.25 },
      }}
      whileHover={{ scale: 1.02, y: -8 }}
      whileTap={{ scale: 1.005 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={resetPointer}
      onMouseMove={handlePointerMove}
      style={{
        position: 'relative',
        padding: 'clamp(22px, 3vw, 30px) clamp(20px, 4vw, 36px)',
        backgroundImage: hovered
          ? `linear-gradient(145deg, #ffffff 0%, ${cardBg} 100%)`
          : `linear-gradient(145deg, ${cardBg} 0%, #ffffff 100%)`,
        backgroundSize: '140% 140%',
        backgroundPosition: hovered ? '22% 30%' : '50% 50%',
        borderRadius: 50,

        border: `1.5px solid ${hovered ? cardAccent + '40' : cardAccent + '20'}`,
        outline: hovered ? '2.5px solid #000000' : '2.5px solid transparent',
        outlineOffset: '10px',
        cursor: 'default',
        transition: 'outline-color 0.42s ease, background 0.55s ease, background-position 0.55s ease, box-shadow 0.42s ease, border-color 0.38s ease',
        boxShadow: hovered
          ? `0 26px 58px -28px ${cardAccent}80, 0 12px 24px -16px rgba(15,23,41,0.3)`
          : '0 10px 26px -18px rgba(15,23,41,0.22), 0 2px 8px rgba(15,23,41,0.08)',
        overflow: 'hidden',
        transformStyle: 'preserve-3d',
        willChange: 'transform, box-shadow, background-position',
        maxWidth: 420,
        margin: '0 auto',
      }}
    >
      <motion.div
        aria-hidden="true"
        animate={{ opacity: hovered ? 0.8 : 0.35 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          inset: -2,
          borderRadius: 52,
          background: `radial-gradient(120% 80% at 10% 0%, ${cardAccent}1f 0%, transparent 56%)`,
          pointerEvents: 'none',
        }}
      />

      <motion.div
        aria-hidden="true"
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 50,
          pointerEvents: 'none',
          background: 'radial-gradient(220px 150px at 50% 15%, rgba(255,255,255,0.45), rgba(255,255,255,0) 70%)',
        }}
      />

      <motion.div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 50,
          pointerEvents: 'none',
          opacity: hovered ? 1 : 0,
          background: dynamicGlow,
        }}
      />

      <motion.div style={{ rotateX, rotateY, transformPerspective: 1100, position: 'relative', zIndex: 2 }}>
      <motion.div
        animate={hovered
          ? { y: -4, rotate: -4, scale: 1.06 }
          : { y: [0, -1.5, 0], rotate: [0, -1.5, 0], scale: 1 }
        }
        transition={hovered
          ? { duration: 0.32, ease: 'easeOut' }
          : { duration: 3.5, repeat: Infinity, ease: 'easeInOut' }
        }
        aria-hidden="true"
        style={{
          width: 56,
          height: 56,
          border: `1.5px solid ${hovered ? cardAccent : cardAccent + '40'}`,
          borderRadius: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
          color: cardAccent,
          background: hovered
            ? `linear-gradient(145deg, #ffffff 0%, ${cardAccent}18 100%)`
            : '#ffffff',
          boxShadow: hovered
            ? `0 14px 26px -16px ${cardAccent}88`
            : '0 7px 14px -10px rgba(15,23,41,0.2)',
          transition: 'border-color 0.32s ease, background 0.32s ease, box-shadow 0.32s ease',
          transform: 'translateZ(26px)',
        }}
      >
        {icon}
      </motion.div>

      <motion.span
        animate={{ opacity: hovered ? 1 : 0.74, y: hovered ? -1 : 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{
          display: 'inline-block',
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: '0.14em',
          color: cardAccent,
          textTransform: 'uppercase',
          marginBottom: 10,
          transform: 'translateZ(22px)',
        }}
      >
        {tag}
      </motion.span>

      <h3 style={{ fontSize: 'clamp(1.05rem, 2.2vw, 1.28rem)', fontWeight: 760, color: '#0f1729', marginBottom: 11, lineHeight: 1.25, letterSpacing: '-0.015em', transform: 'translateZ(28px)' }}>
        {title}
      </h3>

      <p style={{ fontSize: 'clamp(0.9rem, 1.4vw, 0.96rem)', color: '#4a5b74', lineHeight: 1.7, margin: 0, maxWidth: 320, transform: 'translateZ(16px)' }}>
        {desc}
      </p>

      <motion.button
        type="button"
        animate={{ opacity: hovered ? 1 : 0.78, x: hovered ? 0 : -5, y: hovered ? 0 : 1 }}
        transition={{ duration: 0.24, ease: 'easeOut' }}
        onClick={onLearnMore}
        aria-label={`Learn more about ${title}`}
        style={{
          marginTop: 22,
          background: 'none',
          border: 'none',
          padding: 0,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 13,
          fontWeight: 700,
          color: cardAccent,
          cursor: 'pointer',
          userSelect: 'none',
          transform: 'translateZ(30px)',
        }}
      >
        Learn more
        <motion.span
          aria-hidden="true"
          animate={{ x: hovered ? 2 : 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          style={{ display: 'inline-flex' }}
        >
          <FiArrowRight size={14} aria-hidden="true" />
        </motion.span>
      </motion.button>
      </motion.div>
    </motion.div>
  );
});

const FeaturesSection = () => (
  <section
    aria-label="Platform capabilities"
    style={{ padding: 'clamp(48px, 7vw, 80px) clamp(16px, 5vw, 48px)', background: '#ffffff', borderTop: '1px solid #e0e6f1', borderBottom: '1px solid #e0e6f1' }}
  >
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
      style={{ textAlign: 'center', marginBottom: 48 }}
    >
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#4361ee', marginBottom: 12, textTransform: 'uppercase' }}>
        Platform Capabilities
      </p>

      <h2 style={{ fontSize: 'clamp(3.6rem, 3vw, 2.4rem)', fontWeight: 900, color: '#0f1729', letterSpacing: '-0.03em', lineHeight: 1.2, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '0 10px', margin: 0 }}>
        <span>Built for serious</span>

        <span style={{minWidth: '280px', display: 'inline-flex', alignItems: 'center', background: '#4361ee', borderRadius: 12, padding: '6px 18px 8px', overflow: 'hidden', fontSize: 'clamp(3.6rem, 3vw, 2.4rem)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.2, color: '#ffffff', verticalAlign: 'middle' }}>
          <RotatingText
            texts={['investors', 'traders', 'analysts']}
            staggerFrom="last"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-120%' }}
            staggerDuration={0.03}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            rotationInterval={2000}
          />
        </span>
      </h2>
    </motion.div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 30 }}>
      {features.map((f, i) => (
        <OutlineCard key={f.title} {...f} index={i} />
      ))}
    </div>
    </div>
  </section>
);

///////////////////////////////////////////////////////////////////////////////
// FOOTER
///////////////////////////////////////////////////////////////////////////////

const Footer = () => (
  <footer
    aria-label="YES Securities site footer"
    style={{ background: '#0f1729', color: '#52637a', padding: 'clamp(24px, 4vw, 48px)', textAlign: 'center' }}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 }}>
      <div style={{ width: 28, height: 28, background: '#4361ee', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img
          src="/src/assets/logo.png"
          alt="YES Securities logo"
          width="25"
          height="18"
          loading="lazy"
          decoding="async"
        />
      </div>
      <span itemProp="name" style={{ fontWeight: 800, color: '#f8fafc', fontSize: '1rem', letterSpacing: '-0.01em' }}>
        YES Securities
      </span>
    </div>
    <p style={{ fontSize: 13, color: '#f7f8f9' }}>© 2026 YES Securities. (A PROTOTYPE)</p>
    <p style={{ fontSize: 18, marginTop: 8, color: '#f4f6f9' }}>DEVELOPED BY ___ KUNAL MATHUR</p>
    <p style={{ color: '#52637a' }}>Full Stack Intern, Bengaluru</p>
  </footer>
);

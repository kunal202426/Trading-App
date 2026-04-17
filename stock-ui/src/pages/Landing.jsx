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
  useReducedMotion,
  animate,
} from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import MagneticButton from '../components/ui/MagneticButton';
import RotatingText   from '../components/ui/RotatingText';
import { FlippingCard } from '../components/ui/flipping-card';
import GlobeAnalytics from '../components/sections/GlobeAnalytics';
import LoadingScreen  from '../components/ui/LoadingScreen';
import { FiArrowRight, FiBarChart2, FiShield, FiTrendingUp, FiZap } from 'react-icons/fi';

import '../styles/ticker.css';

import logo from '../assets/logo.png';
import portfolioAnim from '../assets/lottie/openaccount.json';
import analysisAnim  from '../assets/lottie/exploretools.json';
import tradingAnim   from '../assets/lottie/learnmore.json';

const loadSignalTerminal = () => import(/* webpackChunkName: "s-terminal" */ '../components/sections/SignalTerminal');
const loadHorizontalShowcase = () => import(/* webpackChunkName: "s-showcase" */ '../components/sections/HorizontalShowcase');
const loadSocialProof = () => import(/* webpackChunkName: "s-social" */ '../components/sections/SocialProof');
const loadBigStatement = () => import(/* webpackChunkName: "s-bigstatement" */ '../components/sections/BigStatement');
const loadCTASection = () => import(/* webpackChunkName: "s-cta" */ '../components/sections/CTASection');

const SignalTerminal     = lazy(loadSignalTerminal);
const HorizontalShowcase = lazy(loadHorizontalShowcase);
const SocialProof        = lazy(loadSocialProof);
const BigStatement       = lazy(loadBigStatement);
const CTASection         = lazy(loadCTASection);
const LottiePlayer       = lazy(() => import('lottie-react'));

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

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
    backDescription: 'Get confidence-scored, regime-aware signals built for fast decision loops and cleaner entries.',
    buttonText: 'Explore Signals',
    imageSrc: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=720&h=420&fit=crop',
    imageAlt: 'Analytics dashboard with AI data visualizations',
    tag: 'Machine Learning',
    cardBg: '#c5ffe49a',
    cardAccent: '#1fbe8c',
  },
  {
    icon: <FiTrendingUp size={28} aria-hidden="true" />,
    title: 'Real-Time Portfolio',
    desc: 'Live-linked holdings, P&L tracking, and drawdown analysis updated on every market tick.',
    backDescription: 'Track allocation, gains, drawdowns, and live movements from one portfolio command surface.',
    buttonText: 'View Portfolio',
    imageSrc: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=720&h=420&fit=crop',
    imageAlt: 'Stock market chart on trading screen',
    tag: 'Live Data',
    cardBg: '#fff7eddd',
    cardAccent: '#eab308',
  },
  {
    icon: <FiShield size={28} aria-hidden="true" />,
    title: 'Risk Intelligence',
    desc: 'Dynamic stop-loss, regime detection, and volatility-adjusted position sizing built in.',
    backDescription: 'Protect capital with dynamic risk limits, smarter stop placement, and volatility-tuned sizing.',
    buttonText: 'See Risk Engine',
    imageSrc: 'https://images.unsplash.com/photo-1526378800651-c32d170fe6f8?w=720&h=420&fit=crop',
    imageAlt: 'Cybersecurity and risk protection concept',
    tag: 'Risk Engine',
    cardBg: '#c5ffe49a',
    cardAccent: '#1fbe8c',
  },
  {
    icon: <FiBarChart2 size={28} aria-hidden="true" />,
    title: 'Deep Analysis',
    desc: 'Full technical suite: MACD, RSI, BB, ADX, OBV, and India-specific macro indicators.',
    backDescription: 'Break down every setup with layered technicals, macro context, and actionable dashboard views.',
    buttonText: 'Open Analysis',
    imageSrc: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=720&h=420&fit=crop',
    imageAlt: 'Business intelligence and chart analytics display',
    tag: 'Technicals',
    cardBg: '#fff7eddd',
    cardAccent: '#eab308',
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
  const prefersReducedMotion = useReducedMotion();
  const [showIntroLoader, setShowIntroLoader] = useState(true);
  const [performanceMode, setPerformanceMode] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const lowCpu = typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4;
    const lowMemory = typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 4;

    setPerformanceMode(prefersReducedMotion || coarsePointer || lowCpu || lowMemory);
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (!showIntroLoader) {
      return;
    }

    // Preload below-fold lazy chunks while the loader is visible.
    void Promise.allSettled([
      loadSignalTerminal(),
      loadHorizontalShowcase(),
      loadSocialProof(),
      loadBigStatement(),
      loadCTASection(),
    ]);
  }, [showIntroLoader]);

  const pageContent = (
    <>
      {/* Ticker — decorative, aria-hidden */}
      <TickerStrip />

      {/* Hero — interactive globe with parallax text rails */}
      <main id="main-content">
        <HeroWithOmni navigate={navigate} performanceMode={performanceMode} />
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
    </>
  );

  return (
    // itemScope+itemType registers this page as a FinancialService in schema.org
    <div
      itemScope
      itemType="https://schema.org/FinancialService"
      style={{ background: '#f5f7ff', color: '#0f1729', fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      <AnimatePresence>
        {showIntroLoader && (
          <LoadingScreen
            duration={5000}
            text="Preparing your experience..."
            onLoadComplete={() => setShowIntroLoader(false)}
          />
        )}
      </AnimatePresence>

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

      {!showIntroLoader && (
        performanceMode
          ? pageContent
          : <ReactLenis root options={{ lerp: 0.07 }}>{pageContent}</ReactLenis>
      )}
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


const HeroWithOmni = ({ navigate, performanceMode = false }) => {
  const sectionRef = useRef(null);
  const [sp, setSp] = useState(0);
  const [isSmallScreen, setIsSmallScreen] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 768px)').matches;
  });
  const [needsCompactHeroSpacing, setNeedsCompactHeroSpacing] = useState(() => {
    if (typeof window === 'undefined') return false;

    const isAndroid = /Android/i.test(window.navigator.userAgent || '');
    return isAndroid && window.matchMedia('(max-width: 430px) and (max-height: 940px)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia('(max-width: 768px)');
    const compactMedia = window.matchMedia('(max-width: 430px) and (max-height: 940px)');
    const isAndroid = /Android/i.test(window.navigator.userAgent || '');

    const onChange = () => {
      setIsSmallScreen(media.matches);
      setNeedsCompactHeroSpacing(isAndroid && compactMedia.matches);
    };

    onChange();

    if (media.addEventListener && compactMedia.addEventListener) {
      media.addEventListener('change', onChange);
      compactMedia.addEventListener('change', onChange);
      return () => {
        media.removeEventListener('change', onChange);
        compactMedia.removeEventListener('change', onChange);
      };
    }

    media.addListener(onChange);
    compactMedia.addListener(onChange);
    return () => {
      media.removeListener(onChange);
      compactMedia.removeListener(onChange);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    let rafId = 0;

    const updateProgress = () => {
      const section = sectionRef.current;

      if (!section) {
        return;
      }

      const rect = section.getBoundingClientRect();
      const viewport = window.innerHeight || 1;
      const distance = Math.max(rect.height - viewport, 1);
      const travelled = clamp(-rect.top, 0, distance);
      const nextProgress = clamp(travelled / distance, 0, 1);

      setSp((prev) => (Math.abs(prev - nextProgress) < 0.001 ? prev : nextProgress));
    };

    const scheduleProgressUpdate = () => {
      if (rafId) {
        return;
      }

      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        updateProgress();
      });
    };

    updateProgress();
    window.addEventListener('scroll', scheduleProgressUpdate, { passive: true });
    window.addEventListener('resize', scheduleProgressUpdate);

    return () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }

      window.removeEventListener('scroll', scheduleProgressUpdate);
      window.removeEventListener('resize', scheduleProgressUpdate);
    };
  }, []);

  const onSignup = useCallback(() => navigate('/signup'), [navigate]);
  const onLogin  = useCallback(() => navigate('/login'),  [navigate]);

  const leftY = sp * (isSmallScreen ? -26 : -54);
  const leftOpacity = 1;
  const copySwapProgress = clamp((sp - 0.05) / 0.34, 0, 1);
  const headlineOpacity = clamp(1 - copySwapProgress * 1.18, 0, 1);
  const headlineLift = copySwapProgress * -68;
  const subtitleOpacity = clamp(1 - copySwapProgress * 1.24, 0, 1);
  const subtitleLift = copySwapProgress * -38;
  const globeShiftX = sp * (isSmallScreen ? 20 : 110);
  const globeShiftY = sp * (isSmallScreen ? -8 : -34);
  const globeScale = 1 + sp * 0.42;
  const heroCopyBaseLift = needsCompactHeroSpacing ? 8 : (isSmallScreen ? -10 : -72);
  const headlineDepthProgress = clamp((sp - 0.03) / 0.34, 0, 1);
  const headlineZoomScale = 1 + headlineDepthProgress * (isSmallScreen ? 0.28 : 0.42);
  const headlineDepthZ = headlineDepthProgress * (isSmallScreen ? 52 : 86);
  const headlineDepthBlur = headlineDepthProgress * 3;
  const parallaxFactor = isSmallScreen ? 0.45 : 1;
  const storyParallax = clamp((sp - 0.02) / 0.8, 0, 1) * parallaxFactor;
  const headlineParallaxX = storyParallax * 8;
  const headlineParallaxY = storyParallax * -14;
  const subtitleParallaxX = storyParallax * 6;
  const subtitleParallaxY = storyParallax * -8;
  const scrollCueOpacity = clamp(1 - sp * 10, 0, 1);
  const sectionScrollHeight = isSmallScreen ? '188svh' : '240vh';
  const frameStyle = sp <= 0
    ? { position: 'absolute', top: 0, left: 0, right: 0 }
    : sp >= 1
      ? { position: 'absolute', bottom: 0, left: 0, right: 0 }
      : { position: 'fixed', top: 0, left: 0, right: 0 };

  return (
    <>
      <style>{`
        .hero-scroll-stage {
          position: relative;
        }

        .hero-stage-frame {
          position: absolute;
          left: 0;
          right: 0;
          height: 100vh;
          overflow: hidden;
          background: #EDF5FB;
          display: flex;
          align-items: center;
        }

        .hero-split {
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
          height: 100vh;
          max-width: 1360px;
          width: 100%;
          margin: 0 auto;
          padding: 46px 26px 22px;
          box-sizing: border-box;
          align-items: center;
          gap: clamp(20px, 3.2vw, 42px);
          position: relative;
          z-index: 2;
        }

        @media (max-width: 1240px) {
          .hero-split {
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
            padding: 40px 20px 16px;
          }
        }

        @media (max-width: 1024px) {
          .hero-split {
            grid-template-columns: 1fr;
            align-content: center;
            justify-items: center;
            padding: 30px 18px 24px;
            gap: 20px;
          }
          .hero-copy {
            text-align: center !important;
            align-items: center !important;
          }
          .hero-copy p {
            margin-left: auto;
            margin-right: auto;
          }
        }

        @media (max-width: 768px) {
          .hero-split {
            height: 100svh;
            padding: 24px 14px 18px;
            gap: 10px;
          }

          .hero-stage-frame {
            height: 100svh;
          }

          .hero-copy {
            width: 100%;
            max-width: 420px;
          }

          .hero-story-swap {
            min-height: 278px !important;
          }

          .hero-visual {
            width: 100%;
            max-width: 430px;
          }
        }
      `}</style>

      <section
        ref={sectionRef}
        className="hero-scroll-stage"
        aria-label="Hero section with market intelligence animation"
        style={{
          height: sectionScrollHeight,
          position: 'relative',
        }}
      >
        <div className="hero-stage-frame" style={frameStyle}>
          <div
            className="hero-split"
          >
            <div
              className="hero-copy"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'flex-start',
                textAlign: 'left',
                maxWidth: 620,
                width: '100%',
                paddingTop: needsCompactHeroSpacing ? 24 : (isSmallScreen ? 10 : 0),
                transform: `translate3d(0, ${leftY + heroCopyBaseLift}px, 0)`,
                opacity: leftOpacity,
                transition: 'opacity 0.15s ease-out',
                position: 'relative',
                zIndex: 3,
              }}
            >
              <div
                className="hero-story-swap"
                style={{
                  width: '100%',
                  maxWidth: 600,
                  minHeight: 420,
                  position: 'relative',
                  perspective: '1700px',
                  transformStyle: 'preserve-3d',
                  overflow: 'visible',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: needsCompactHeroSpacing ? 12 : (isSmallScreen ? -2 : -34),
                    left: isSmallScreen ? '50%' : '38%',
                    zIndex: 9,
                    opacity: headlineOpacity,
                    transform: `${isSmallScreen ? 'translateX(-50%) ' : ''}translate3d(${headlineParallaxX * 0.45}px, ${headlineLift * 0.2 + headlineParallaxY * 0.35}px, 0) translateZ(${headlineDepthZ + 100}px) scale(${1 + headlineDepthProgress * (isSmallScreen ? 0.06 : 0.12)})`,
                    transition: 'opacity 0.12s linear, transform 0.12s linear',
                    pointerEvents: 'none',
                    willChange: 'transform, opacity',
                  }}
                >
                  <img
                    src={logo}
                    alt="YES Securities logo"
                    style={{
                      width: needsCompactHeroSpacing ? 34 : (isSmallScreen ? 36 : 48),
                      height: needsCompactHeroSpacing ? 34 : (isSmallScreen ? 36 : 48),
                      objectFit: 'contain',
                      display: 'block',
                      filter: 'drop-shadow(0 8px 18px rgba(15, 23, 41, 0.18))',
                    }}
                  />
                </div>

                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 3,
                    opacity: headlineOpacity,
                    transform: `translate3d(${headlineParallaxX}px, ${headlineLift + headlineParallaxY}px, 0) translateZ(${headlineDepthZ}px) scale(${headlineZoomScale})`,
                    transition: 'opacity 0.12s linear, transform 0.12s linear',
                    pointerEvents: headlineOpacity > 0.2 ? 'auto' : 'none',
                    filter: `blur(${headlineDepthBlur}px)`,
                    transformStyle: 'preserve-3d',
                    willChange: 'transform, opacity, filter',
                  }}
                >
                  <h1
                    itemProp="name"
                    style={{
                      fontSize: 'clamp(2.75rem, 5.45vw, 5.45rem)',
                      fontWeight: 900,
                      lineHeight: 1,
                      color: '#0f1729',
                      letterSpacing: '-0.045em',
                      margin: needsCompactHeroSpacing ? '44px 0 0' : (isSmallScreen ? '18px 0 0' : '24px 0 0'),
                      width: '100%',
                      maxWidth: 600,
                      marginInline: isSmallScreen ? 'auto' : 0,
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        display: 'block',
                        whiteSpace: 'nowrap',
                        textAlign: isSmallScreen ? 'center' : 'left',
                        lineHeight: 1.01,
                        letterSpacing: isSmallScreen ? '-0.04em' : '-0.045em',
                        fontSize: isSmallScreen
                          ? 'clamp(2.8rem,5.5vw,4.9rem)'
                          : 'clamp(3.1rem,6.4vw,6.4rem)',
                      }}
                    >
                      Invest Karo.
                    </span>

                    <span
                      aria-hidden="true"
                      style={{
                        display: 'block',
                        whiteSpace: 'nowrap',
                        textAlign: isSmallScreen ? 'center' : 'left',
                        lineHeight: 1.01,
                        letterSpacing: isSmallScreen ? '-0.04em' : '-0.045em',
                        fontSize: isSmallScreen
                          ? 'clamp(2.45rem,4.8vw,4.2rem)'
                          : 'clamp(2.75rem,5.5vw,5.35rem)',
                        color: '#4361ee',
                        marginTop: 2,
                      }}
                    >
                      Apne Style Se.
                    </span>

                    <span style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }}>
                      Invest Karo. Apne Style Se.
                    </span>
                  </h1>

                  <p
                    itemProp="description"
                    style={{
                      fontSize: '1.14rem',
                      color: '#52637a',
                      marginTop: 14,
                      marginBottom: 0,
                      lineHeight: 1.52,
                      maxWidth: 520,
                      opacity: subtitleOpacity,
                      transform: `translate3d(${subtitleParallaxX}px, ${subtitleLift + subtitleParallaxY}px, 0)`,
                      transition: 'opacity 0.12s linear, transform 0.12s linear',
                    }}
                  >
                    Diversify your portfolio with insights from 30+ analysts and a seamless platform for empowered investing.
                  </p>
                </div>

              </div>

              {isSmallScreen && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    alignItems: 'stretch',
                    gap: 8,
                    width: '100%',
                    maxWidth: 360,
                    marginTop: 12,
                    marginInline: 'auto',
                    position: 'relative',
                    zIndex: 4,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <MagneticButton
                      onClick={onSignup}
                      aria-label="Get started free - create account"
                      width="100%"
                      height={48}
                      padding="12px 10px"
                      fontSize="0.94rem"
                    >
                      Get Started
                    </MagneticButton>
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <MagneticButton
                      onClick={onLogin}
                      aria-label="Log in to your existing account"
                      width="100%"
                      height={48}
                      padding="12px 10px"
                      fontSize="0.94rem"
                    >
                      Log In
                    </MagneticButton>
                  </div>
                </div>
              )}
            </div>

            <div
              className="hero-visual"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isSmallScreen ? 'center' : 'flex-end',
                justifyContent: 'flex-end',
                maxWidth: 720,
                width: '100%',
                margin: '0 0 0 auto',
                position: 'relative',
                zIndex: 1,
                gap: isSmallScreen ? 0 : 14,
              }}
            >
              <div
                style={{
                  display: isSmallScreen ? 'none' : 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  alignItems: 'stretch',
                  justifyContent: 'center',
                  gap: 10,
                  width: '100%',
                  maxWidth: 420,
                  zIndex: 3,
                  marginBottom: 12,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <MagneticButton
                    onClick={onSignup}
                    aria-label="Get started free - create account"
                    width="100%"
                    height={isSmallScreen ? 48 : 52}
                    padding={isSmallScreen ? '12px 10px' : '12px 12px'}
                    fontSize={isSmallScreen ? '0.94rem' : '1rem'}
                  >
                    Get Started
                  </MagneticButton>
                </div>

                <div style={{ minWidth: 0 }}>
                  <MagneticButton
                    onClick={onLogin}
                    aria-label="Log in to your existing account"
                    width="100%"
                    height={isSmallScreen ? 48 : 52}
                    padding={isSmallScreen ? '12px 10px' : '12px 12px'}
                    fontSize={isSmallScreen ? '0.94rem' : '1rem'}
                  >
                    Log In
                  </MagneticButton>
                </div>
              </div>

              <div
                style={{
                  transform: `translate3d(${globeShiftX}px, ${globeShiftY}px, 0) scale(${globeScale})`,
                  transformOrigin: '55% 50%',
                  width: '100%',
                  display: 'flex',
                  justifyContent: isSmallScreen ? 'center' : 'flex-end',
                }}
              >
                <GlobeAnalytics
                  speed={performanceMode ? 0.0052 : 0.0072}
                  scrollProgress={sp}
                  isActive={sp < 0.995}
                  performanceMode={performanceMode}
                />
              </div>
            </div>
          </div>

          <div
            style={{
              position: 'absolute',
              left: '50%',
              bottom: isSmallScreen ? 68 : 86,
              transform: 'translateX(-50%)',
              opacity: scrollCueOpacity,
              pointerEvents: 'none',
              zIndex: 7,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
            aria-hidden="true"
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#52637a',
              }}
            >
              Scroll
            </span>
            <div
              style={{
                width: 24,
                height: 38,
                borderRadius: 999,
                border: '1.5px solid rgba(82, 99, 122, 0.5)',
                display: 'flex',
                justifyContent: 'center',
                paddingTop: 6,
              }}
            >
              <motion.span
                style={{
                  width: 4,
                  height: 8,
                  borderRadius: 999,
                  background: '#4361ee',
                  display: 'block',
                }}
                animate={{ y: [0, 11, 0], opacity: [0.45, 1, 0.45] }}
                transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
              />
            </div>
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
                      <Suspense
                        fallback={
                          <div
                            aria-hidden="true"
                            style={{
                              width: lottieSize,
                              height: lottieSize,
                              maxWidth: 420,
                              borderRadius: '50%',
                              background: 'radial-gradient(circle, rgba(255,255,255,0.28), rgba(255,255,255,0))',
                            }}
                          />
                        }
                      >
                        <LottiePlayer
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
                      </Suspense>
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

const OutlineCard = React.memo(function OutlineCard({
  icon,
  title,
  desc,
  tag,
  index,
  cardBg,
  cardAccent,
  imageSrc,
  imageAlt,
  backDescription,
  buttonText,
}) {
  const navigate = useNavigate();
  const onLearnMore = useCallback(() => navigate('/login'), [navigate]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 34 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55, delay: index * 0.09 }}
      style={{ display: 'flex', justifyContent: 'center' }}
    >
      <FlippingCard
        width={240}
        height={360}
        className="border-[1.5px] border-[#e0e6f1] shadow-[0_12px_30px_-20px_rgba(15,23,41,0.35)]"
        frontContent={(
          <div
            className="flex h-full w-full flex-col rounded-[inherit] p-4"
            style={{ background: `linear-gradient(160deg, #ffffff 0%, ${cardBg} 100%)` }}
          >
            <img
              src={imageSrc}
              alt={imageAlt}
              className="h-[132px] w-full rounded-md object-cover"
              loading="lazy"
              decoding="async"
            />

            <div className="mt-3 flex-1">
              <div
                className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-[10px] border"
                style={{ borderColor: `${cardAccent}55`, color: cardAccent, background: '#ffffff' }}
                aria-hidden="true"
              >
                {icon}
              </div>

              <p
                className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em]"
                style={{ color: cardAccent }}
              >
                {tag}
              </p>

              <h3 className="text-[1.04rem] font-semibold leading-[1.25] text-[#0f1729]">{title}</h3>
              <p className="mt-2 text-[0.9rem] leading-[1.62] text-[#4a5b74]">{desc}</p>
            </div>
          </div>
        )}
        backContent={(
          <div
            className="flex h-full w-full flex-col items-center justify-center rounded-[inherit] p-6 text-center"
            style={{ background: `linear-gradient(160deg, #ffffff 0%, ${cardBg} 100%)` }}
          >
            <p
              className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em]"
              style={{ color: cardAccent }}
            >
              {tag}
            </p>

            <h3 className="text-[1rem] font-semibold text-[#0f1729]">{title}</h3>
            <p className="mt-3 text-[0.93rem] leading-[1.65] text-[#4a5b74]">{backDescription}</p>

            <button
              type="button"
              onClick={onLearnMore}
              aria-label={`Learn more about ${title}`}
              className="mt-5 inline-flex h-9 items-center justify-center gap-1 rounded-md px-4 text-[13px] font-semibold text-white transition-transform duration-200 hover:-translate-y-[1px]"
              style={{ background: cardAccent }}
            >
              {buttonText}
              <FiArrowRight size={14} aria-hidden="true" />
            </button>
          </div>
        )}
      />
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

    <div className="grid grid-cols-1 justify-items-center gap-6 sm:grid-cols-2 lg:grid-cols-4">
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

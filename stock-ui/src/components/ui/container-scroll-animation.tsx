import React, { type ReactNode, useEffect, useRef, useState } from 'react';
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'framer-motion';

interface ContainerScrollRenderState {
  isSettled: boolean;
  isInMiddle: boolean;
}

type ContainerScrollChildren = ReactNode | ((state: ContainerScrollRenderState) => ReactNode);

interface ContainerScrollProps {
  titleComponent: ReactNode;
  children: ContainerScrollChildren;
  className?: string;
}

interface HeaderProps {
  translateY: MotionValue<number>;
  opacity: MotionValue<number>;
  titleComponent: ReactNode;
}

interface DeviceCardProps {
  rotateX: MotionValue<number>;
  translateY: MotionValue<number>;
  scale: MotionValue<number>;
  opacity: MotionValue<number>;
  groundShadowOpacity: MotionValue<number>;
  children: ReactNode;
}

interface DeviceFrameProps {
  children: ReactNode;
  groundShadowOpacity: MotionValue<number>;
}

export function ContainerScroll({ titleComponent, children, className = '' }: ContainerScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);
  const [isSettled, setIsSettled] = useState(false);
  const [isInMiddle, setIsInMiddle] = useState(false);
  const settledRef = useRef(false);
  const middleRef = useRef(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 92%', 'end 20%'],
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const settleAt = prefersReducedMotion ? 1 : (isMobile ? 0.84 : 0.88);
  const settleTrigger = prefersReducedMotion ? 0 : (settleAt * 0.92);
  const middleTriggerStart = prefersReducedMotion ? 0 : (isMobile ? 0.44 : 0.48);

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    if (!settledRef.current && latest >= settleTrigger) {
      settledRef.current = true;
      setIsSettled(true);
    }

    if (!middleRef.current && latest >= middleTriggerStart) {
      middleRef.current = true;
      setIsInMiddle(true);
    }
  });

  const rotateX = useTransform(
    scrollYProgress,
    [0, settleAt],
    prefersReducedMotion ? [0, 0] : (isMobile ? [20, 0] : [42, 0])
  );

  const translateY = useTransform(
    scrollYProgress,
    [0, settleAt],
    prefersReducedMotion ? [0, 0] : (isMobile ? [-12, 42] : [-32, 150])
  );

  const scale = useTransform(
    scrollYProgress,
    [0, settleAt],
    prefersReducedMotion
      ? [1, 1]
      : (isMobile ? [0.9, 1] : [0.84, 1])
  );

  const deviceOpacity = useTransform(
    scrollYProgress,
    [0, settleAt],
    prefersReducedMotion ? [1, 1] : [0.68, 1]
  );

  const titleTranslateY = useTransform(
    scrollYProgress,
    [0, settleAt],
    prefersReducedMotion ? [0, 0] : (isMobile ? [12, -22] : [22, -46])
  );

  const titleOpacity = useTransform(
    scrollYProgress,
    [0, 0.18, 0.4, 1],
    prefersReducedMotion ? [1, 1, 1, 1] : [0.44, 0.72, 0.96, 1]
  );

  const groundShadowOpacity = useTransform(
    scrollYProgress,
    [0, settleAt],
    prefersReducedMotion ? [0.24, 0.24] : [0.46, 0.22]
  );

  const content = typeof children === 'function'
    ? children({ isSettled, isInMiddle })
    : children;

  return (
    <div
      ref={containerRef}
      className={`relative flex h-[40rem] items-start justify-center px-3 py-0 sm:h-[45rem] md:h-[52rem] md:px-8 md:py-1 ${className}`}
    >
      <div className="relative w-full max-w-[1280px] px-1 sm:px-4" style={{ perspective: isMobile ? '1400px' : '1900px' }}>
        <Header
          translateY={titleTranslateY}
          opacity={titleOpacity}
          titleComponent={titleComponent}
        />
        <DeviceCard
          rotateX={rotateX}
          translateY={translateY}
          scale={scale}
          opacity={deviceOpacity}
          groundShadowOpacity={groundShadowOpacity}
        >
          {content}
        </DeviceCard>
      </div>
    </div>
  );
}

function Header({ translateY, opacity, titleComponent }: HeaderProps) {
  return (
    <motion.div
      style={{ translateY, opacity }}
      className="relative z-10 mx-auto max-w-5xl px-4 text-center -mb-2 sm:-mb-3 md:-mb-4"
    >
      {titleComponent}
    </motion.div>
  );
}

function DeviceCard({
  rotateX,
  translateY,
  scale,
  opacity,
  groundShadowOpacity,
  children,
}: DeviceCardProps) {
  return (
    <motion.div
      style={{
        rotateX,
        y: translateY,
        scale,
        opacity,
        transformStyle: 'preserve-3d',
        transformOrigin: '50% 100%',
      }}
      className="relative z-20 mx-auto mt-0 w-full max-w-[1140px] transform-gpu will-change-transform"
    >
      <DeviceFrame
        groundShadowOpacity={groundShadowOpacity}
      >
        {children}
      </DeviceFrame>
    </motion.div>
  );
}

function DeviceFrame({ children, groundShadowOpacity }: DeviceFrameProps) {
  return (
    <div className="relative">
      <motion.div
        aria-hidden="true"
        style={{
          opacity: groundShadowOpacity,
        }}
        className="pointer-events-none absolute left-1/2 top-[76%] h-[92px] w-[90%] -translate-x-1/2 rounded-full bg-[#0f172a] blur-[42px]"
      />

      <div
        style={{
          position: 'relative',
          borderRadius: 'clamp(30px, 3.5vw, 54px)',
          border: '1px solid rgba(58, 70, 90, 0.58)',
          background: 'linear-gradient(160deg, #2a3140 0%, #161c27 54%, #111723 100%)',
          padding: 'clamp(10px, 1.35vw, 15px)',
          boxShadow: '0 24px 50px rgba(2, 8, 20, 0.34), inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -26px 44px rgba(0,0,0,0.3)',
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 'clamp(9px, 1.1vw, 13px)',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'clamp(86px, 10vw, 124px)',
            height: 'clamp(7px, 0.7vw, 10px)',
            borderRadius: 999,
            background: '#090f18',
            boxShadow: '0 0 0 1px rgba(148, 163, 184, 0.25)',
          }}
        />

        <div
          style={{
            position: 'relative',
            borderRadius: 'clamp(24px, 2.8vw, 42px)',
            border: '1px solid rgba(62, 78, 103, 0.48)',
            background: '#080d14',
            padding: 'clamp(7px, 0.95vw, 12px)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -18px 30px rgba(0,0,0,0.28)',
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 0,
              left: '14%',
              right: '14%',
              height: '33%',
              borderRadius: 'inherit',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.17), rgba(255,255,255,0))',
              opacity: 0.52,
              pointerEvents: 'none',
            }}
          />

          <div
            style={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 'clamp(18px, 2vw, 30px)',
              border: '1px solid rgba(39, 50, 71, 0.92)',
              background: '#050913',
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

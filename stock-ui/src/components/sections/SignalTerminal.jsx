import React, { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ContainerScroll } from '../ui/container-scroll-animation';

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

const SignalTerminalScreen = ({ typingActive }) => {
  const prefersReducedMotion = useReducedMotion();
  const lastTypedLineIndex = useMemo(() => {
    for (let index = terminalLines.length - 1; index >= 0; index -= 1) {
      if (terminalLines[index].type !== 'spacer') {
        return index;
      }
    }

    return -1;
  }, []);

  const lastTypedLineText = lastTypedLineIndex >= 0 ? terminalLines[lastTypedLineIndex].text : '';

  const [typedLastLineLength, setTypedLastLineLength] = useState(
    prefersReducedMotion ? lastTypedLineText.length : 0
  );
  const [hasTypedOnce, setHasTypedOnce] = useState(prefersReducedMotion);

  useEffect(() => {
    if (prefersReducedMotion) {
      setTypedLastLineLength(lastTypedLineText.length);
      setHasTypedOnce(true);
      return;
    }

    if (!typingActive || hasTypedOnce) {
      return;
    }

    setHasTypedOnce(true);
    setTypedLastLineLength(0);
    let charIndex = 0;

    const intervalId = window.setInterval(() => {
      charIndex = Math.min(charIndex + 1, lastTypedLineText.length);
      setTypedLastLineLength(charIndex);

      if (charIndex >= lastTypedLineText.length) {
        window.clearInterval(intervalId);
      }
    }, 26);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [hasTypedOnce, lastTypedLineText, prefersReducedMotion, typingActive]);

  const isTypingInProgress = hasTypedOnce && typedLastLineLength < lastTypedLineText.length;

  return (
    <div
      style={{
        width: '100%',
        background: '#070d18',
        borderRadius: 'clamp(14px, 1.9vw, 24px)',
        border: '1px solid rgba(33, 49, 76, 0.94)',
        overflow: 'hidden',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: 'clamp(10px, 1.2vw, 14px) clamp(14px, 1.9vw, 22px)',
          background: '#111827',
          borderBottom: '1px solid rgba(40, 58, 86, 0.86)',
        }}
      >
        <div aria-hidden="true" style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f56' }} />
        <div aria-hidden="true" style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffbd2e' }} />
        <div aria-hidden="true" style={{ width: 12, height: 12, borderRadius: '50%', background: '#27c93f' }} />
        <span style={{ marginLeft: 12, fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>
          yes-signal-engine — live output
        </span>
        <motion.div
          animate={prefersReducedMotion ? { opacity: 1 } : { opacity: [1, 0, 1] }}
          transition={prefersReducedMotion ? { duration: 0.1 } : { repeat: Infinity, duration: 1.2 }}
          aria-hidden="true"
          style={{ marginLeft: 'auto', width: 8, height: 14, background: '#4ade80', borderRadius: 2 }}
        />
      </div>

      <div
        role="log"
        aria-label="AI signal engine output"
        style={{
          padding: 'clamp(18px, 2.3vw, 28px)',
          minHeight: 'clamp(250px, 29vw, 360px)',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 'clamp(11px, 1.14vw, 18px)',
        }}
      >
        {terminalLines.map((line, i) => (
          <div
            key={line.type + '-' + i}
            style={{
              color: colorMap[line.type],
              marginBottom: line.type === 'spacer' ? 12 : 6,
              lineHeight: 1.6,
              letterSpacing: line.type === 'signal' ? '0.02em' : 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {line.type === 'spacer' && '\u00A0'}
            {line.type !== 'spacer' && i !== lastTypedLineIndex && line.text}
            {line.type !== 'spacer' && i === lastTypedLineIndex && line.text.slice(0, typedLastLineLength)}
            {line.type !== 'spacer' && i === lastTypedLineIndex && isTypingInProgress && (
              <motion.span
                animate={prefersReducedMotion ? { opacity: 1 } : { opacity: [1, 0, 1] }}
                transition={prefersReducedMotion ? { duration: 0.1 } : { repeat: Infinity, duration: 0.8 }}
                aria-hidden="true"
              >
                ▋
              </motion.span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const SignalTerminal = () => (
  <section
    aria-label="AI Signal Engine Preview"
    style={{ padding: 'clamp(4px, 1vw, 12px) clamp(16px, 5vw, 48px)', background: '#f5f7ff' }}
  >
    <ContainerScroll
      titleComponent={(
        <div style={{ textAlign: 'center' }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: '#4361ee',
              marginBottom: 14,
              textTransform: 'uppercase',
            }}
          >
            AI Engine Preview
          </p>
          <h2
            style={{
              fontSize: 'clamp(2.3rem, 4.9vw, 4rem)',
              fontWeight: 900,
              color: '#0f1729',
              letterSpacing: '-0.03em',
              marginTop: '0.56em',
              marginBottom: 4,
              lineHeight: 1.02,
            }}
          >
            Signals generated in real time
          </h2>
        </div>
      )}
    >
      {({ isInMiddle }) => <SignalTerminalScreen typingActive={isInMiddle} />}
    </ContainerScroll>
  </section>
);

export default SignalTerminal;

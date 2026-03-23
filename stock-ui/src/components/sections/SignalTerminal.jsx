import React from 'react';
import { motion } from 'framer-motion';

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
  <section
    aria-label="AI Signal Engine Preview"
    style={{ padding: 'clamp(60px, 10vw, 100px) clamp(16px, 5vw, 48px)', background: '#f5f7ff' }}
  >
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
    >
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: 48 }}
        >
          <p style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
            color: '#4361ee', marginBottom: 14, textTransform: 'uppercase',
          }}>
            AI Engine Preview
          </p>
          <h2 style={{
            fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
            fontWeight: 900, color: '#0f1729', letterSpacing: '-0.03em',
          }}>
            Signals generated in real time
          </h2>
        </motion.div>

        {/* Terminal window */}
        <div style={{
          background: '#0d1117',
          borderRadius: 16,
          border: '1px solid #1e2d3d',
          overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(13,35,64,0.2)',
        }}>
          {/* Title bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 20px',
            background: '#161b22',
            borderBottom: '1px solid #1e2d3d',
          }}>
            <div aria-hidden="true" style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f56' }} />
            <div aria-hidden="true" style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffbd2e' }} />
            <div aria-hidden="true" style={{ width: 12, height: 12, borderRadius: '50%', background: '#27c93f' }} />
            <span style={{ marginLeft: 12, fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>
              yes-signal-engine — live output
            </span>
            <motion.div
              animate={{ opacity: [1, 0, 1] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              aria-hidden="true"
              style={{ marginLeft: 'auto', width: 8, height: 14, background: '#4ade80', borderRadius: 2 }}
            />
          </div>

          {/* Terminal output */}
          <div
            role="log"
            aria-label="AI signal engine output"
            style={{ padding: '24px 28px', fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}
          >
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
  </section>
);

export default SignalTerminal;

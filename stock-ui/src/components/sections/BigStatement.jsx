import React from 'react';
import { motion } from 'framer-motion';

const words = "Every great trade starts with better intelligence.".split(" ");

const BigStatement = () => (
  <section
    aria-label="Mission statement"
    style={{
      padding: 'clamp(60px, 10vw, 120px) clamp(16px, 5vw, 48px)',
      background: '#0b1929',
      textAlign: 'center',
    }}
  >
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
      style={{ marginTop: 32, fontSize: '1.1rem', color: '#8b99af' }}
    >
      YES Securities — built for India's next generation of investors.
    </motion.p>
  </section>
);

export default BigStatement;

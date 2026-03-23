import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import MagneticButton from '../ui/MagneticButton';

const CTASection = () => {
  const navigate = useNavigate();
  const goSignup = useCallback(() => navigate('/signup'), [navigate]);
  const goLogin  = useCallback(() => navigate('/login'),  [navigate]);

  return (
    <section
      aria-label="Call to action: Get started"
      style={{
        textAlign: 'center',
        padding: 'clamp(60px, 10vw, 120px) clamp(16px, 5vw, 48px) clamp(80px, 12vw, 140px)',
        background: 'linear-gradient(150deg, #eef1ff 0%, #f5f7ff 60%, #f9f6ff 100%)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <p style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
          color: '#4361ee', marginBottom: 16, textTransform: 'uppercase',
        }}>
          Start Your Journey
        </p>

        <h2 style={{
          fontSize: 'clamp(2rem, 4.5vw, 3.8rem)',
          fontWeight: 900, color: '#0f1729',
          marginBottom: 16, letterSpacing: '-0.04em', lineHeight: 1.08,
        }}>
          Ready to trade smarter?
        </h2>

        <p style={{
          fontSize: '1.1rem', color: '#52637a',
          maxWidth: 460, margin: '0 auto 72px',
          lineHeight: 1.65,
        }}>
          Join YES Securities and experience AI-driven investing backed by real market intelligence.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <MagneticButton
            onClick={goSignup}
            aria-label="Get started free — sign up"
            rotate
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
          style={{ marginTop: 32, fontSize: 13, color: '#8b99af' }}
        >
          Already have an account?{' '}
          <button
            type="button"
            onClick={goLogin}
            style={{
              background: 'none', border: 'none', padding: 0,
              color: '#4361ee', cursor: 'pointer',
              fontWeight: 600, fontSize: 13,
              textDecoration: 'underline',
            }}
          >
            Log in
          </button>
        </motion.p>
      </motion.div>
    </section>
  );
};

export default CTASection;

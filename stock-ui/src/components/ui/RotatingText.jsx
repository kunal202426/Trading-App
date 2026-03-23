import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const RotatingText = React.memo(function RotatingText({
  texts = [],
  mainClassName = '',
  splitLevelClassName = '',
  staggerFrom = 'first',
  initial,
  animate,
  exit,
  staggerDuration = 0.025,
  transition,
  rotationInterval = 2000,
  style = {},
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % texts.length);
    }, rotationInterval);
    return () => clearInterval(id);
  }, [texts.length, rotationInterval]);

  const word = texts[index];
  const letters = word.split('');

  const getDelay = (i) => {
    if (staggerFrom === 'last') return (letters.length - 1 - i) * staggerDuration;
    if (staggerFrom === 'center') {
      const center = (letters.length - 1) / 2;
      return Math.abs(i - center) * staggerDuration;
    }
    return i * staggerDuration;
  };

  return (
    // aria-live="polite" + aria-atomic="true" so screen readers announce full word on change
    <span
      className={mainClassName}
      style={{ display: 'inline-flex', ...style }}
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={word}
          style={{ display: 'inline-flex' }}
        >
          {letters.map((char, i) => (
            <span
              key={i}
              className={splitLevelClassName}
              style={{ display: 'inline-block', overflow: 'hidden', paddingBottom: 2 }}
            >
              <motion.span
                style={{ display: 'inline-block' }}
                initial={initial}
                animate={animate}
                exit={exit}
                transition={{ ...transition, delay: getDelay(i) }}
              >
                {char === ' ' ? '\u00A0' : char}
              </motion.span>
            </span>
          ))}
        </motion.span>
      </AnimatePresence>
    </span>
  );
});

export default RotatingText;

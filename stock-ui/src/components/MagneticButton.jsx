import { useRef, useState } from 'react';
import { motion } from 'framer-motion';

const MagneticButton = ({
  children,
  onClick,
  rotate = false,        // if true, button rotates continuously
  size = 'normal',       // 'normal' | 'round-large'
}) => {
  const ref = useRef(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const handleMouse = (e) => {
    const rect = ref.current.getBoundingClientRect();
    setPos({
      x: e.clientX - (rect.left + rect.width  / 2),
      y: e.clientY - (rect.top  + rect.height / 2),
    });
  };

  const reset = () => setPos({ x: 0, y: 0 });

  const isRound = size === 'round-large';

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x: pos.x * 0.35, y: pos.y * 0.35 }}
      transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}
      style={{ display: 'inline-block', position: 'relative' }}
    >
      <motion.button
        onClick={onClick}
        animate={rotate ? { rotate: 360 } : {}}
        transition={rotate ? { repeat: Infinity, duration: 10, ease: 'linear' } : {}}
        whileHover={{ scale: 1.06 }}
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isRound ? 0 : 10,
          width:  isRound ? 180 : 'auto',
          height: isRound ? 180 : 'auto',
          padding: isRound ? 0 : '15px 40px',
          fontSize: isRound ? '0.85rem' : '1rem',
          fontWeight: 700,
          letterSpacing: '0.06em',
          color: '#ffffff',
          background: '#0f172a',
          border: 'none',
          borderRadius: isRound ? '50%' : '100px',
          cursor: 'pointer',
          overflow: 'hidden',
          textTransform: isRound ? 'uppercase' : 'none',
          lineHeight: isRound ? 1.3 : 1,
        }}
      >
        {/* Inner text moves slightly against magnet */}
        <motion.span
          animate={{
            x: pos.x * 0.15,
            y: pos.y * 0.15,
            rotate: rotate ? -360 : 0,
          }}
          transition={rotate
            ? { rotate: { repeat: Infinity, duration: 10, ease: 'linear' }, x: { type: 'spring', stiffness: 150, damping: 15 }, y: { type: 'spring', stiffness: 150, damping: 15 } }
            : { type: 'spring', stiffness: 150, damping: 15 }
          }
          style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}
        >
          {children}
        </motion.span>
      </motion.button>
    </motion.div>
  );
};

export default MagneticButton;

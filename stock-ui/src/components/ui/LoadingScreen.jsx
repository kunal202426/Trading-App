import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { HashLoader } from 'react-spinners'

export default function LoadingScreen({
  onLoadComplete,
  duration = 5000,
  text = 'Loading portfolio...',
}) {
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    let exitTimer

    const timer = setTimeout(() => {
      setIsComplete(true)
      exitTimer = setTimeout(() => {
        onLoadComplete?.()
      }, 400)
    }, duration)

    return () => {
      clearTimeout(timer)
      if (exitTimer) clearTimeout(exitTimer)
    }
  }, [duration, onLoadComplete])

  if (isComplete) return null

  return (
    <motion.div
      exit={{
        opacity: 0,
        transition: { duration: 0.4 },
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F5F0E8',
      }}
    >
      <HashLoader color="#E8570C" size={50} speedMultiplier={1.2} />

      <p
        style={{
          color: '#9B8B70',
          marginTop: 32,
          fontSize: 14,
          letterSpacing: '0.04em',
        }}
      >
        {text}
      </p>
    </motion.div>
  )
}

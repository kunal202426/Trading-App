import { useState, useCallback } from 'react'
import { TOUR_STEPS, markTourDone, hasDoneTour } from './tourSteps'

const MANDATORY_TOUR = true

export function useTour(autoStart = true) {
  const [active, setActive] = useState(autoStart && !hasDoneTour())
  const [stepIdx, setStepIdx] = useState(0)
  const [exiting, setExiting] = useState(false)

  const currentStep = TOUR_STEPS[stepIdx]
  const isFirst = stepIdx === 0
  const isLast = stepIdx === TOUR_STEPS.length - 1
  const progress = ((stepIdx + 1) / TOUR_STEPS.length) * 100

  const animate = (cb: () => void) => {
    setExiting(true)
    setTimeout(() => {
      cb()
      setExiting(false)
    }, 180)
  }

  const complete = useCallback(
    () => animate(() => {
      setActive(false)
      markTourDone()
    }),
    []
  )

  const skip = useCallback(
    () => {
      if (!MANDATORY_TOUR) {
        complete()
      }
    },
    [complete]
  )
  const next = useCallback(
    () => (isLast ? complete() : animate(() => setStepIdx(i => i + 1))),
    [isLast, complete]
  )
  const prev = useCallback(
    () => !isFirst && animate(() => setStepIdx(i => i - 1)),
    [isFirst]
  )
  const restart = useCallback(() => {
    setStepIdx(0)
    setExiting(false)
    setActive(true)
  }, [])

  return {
    active,
    currentStep,
    stepIdx,
    totalSteps: TOUR_STEPS.length,
    isFirst,
    isLast,
    canSkip: !MANDATORY_TOUR,
    progress,
    exiting,
    next,
    prev,
    skip,
    restart,
  }
}

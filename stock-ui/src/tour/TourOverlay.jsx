import React, { useState, useEffect } from 'react'
import { useTour } from './useTour'

const SPOT_PAD = 12

const getViewportSize = () => {
  const vv = window.visualViewport
  return {
    w: Math.round(vv?.width || window.innerWidth),
    h: Math.round(vv?.height || window.innerHeight),
  }
}

export function TourOverlay({ tour, pathKey }) {
  const localTour = useTour(false)
  const {
    active,
    currentStep,
    stepIdx,
    totalSteps,
    isFirst,
    isLast,
    canSkip,
    progress,
    exiting,
    next,
    prev,
    skip,
  } = tour || localTour

  const [spot, setSpot] = useState(null)
  const [ttPos, setTtPos] = useState({ top: 0, left: 0 })
  const [arrowSide, setArrowSide] = useState(null)
  const [viewport, setViewport] = useState(getViewportSize)

  const isNarrow = viewport.w < 560
  const tooltipW = Math.max(260, Math.min(360, viewport.w - 24))

  useEffect(() => {
    const onResize = () => setViewport(getViewportSize())

    window.addEventListener('resize', onResize)
    window.visualViewport?.addEventListener('resize', onResize)
    window.visualViewport?.addEventListener('scroll', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      window.visualViewport?.removeEventListener('resize', onResize)
      window.visualViewport?.removeEventListener('scroll', onResize)
    }
  }, [])

  useEffect(() => {
    if (!active) return

    const html = document.documentElement
    const body = document.body
    const prevHtmlOverscroll = html.style.overscrollBehavior
    const prevBodyOverscroll = body.style.overscrollBehavior

    html.style.overscrollBehavior = 'none'
    body.style.overscrollBehavior = 'none'

    return () => {
      html.style.overscrollBehavior = prevHtmlOverscroll
      body.style.overscrollBehavior = prevBodyOverscroll
    }
  }, [active])

  useEffect(() => {
    if (!active) return
    if (currentStep.target === 'center') {
      setSpot(null)
      setArrowSide(null)
      return
    }

    const el = document.querySelector(currentStep.target)
    if (!el) {
      setSpot(null)
      setArrowSide(null)
      return
    }

    let rafA = 0
    let rafB = 0
    let settleTimer = 0

    const measure = () => {
      const { w: vw, h: vh } = getViewportSize()
      const r = el.getBoundingClientRect()
      const spotPad = isNarrow ? 6 : SPOT_PAD

      const spotLeft = Math.max(6, r.left - spotPad)
      const spotTop = Math.max(6, r.top - spotPad)
      const spotRight = Math.min(vw - 6, r.right + spotPad)
      const spotBottom = Math.min(vh - 6, r.bottom + spotPad)

      setSpot({
        top: spotTop,
        left: spotLeft,
        w: Math.max(0, spotRight - spotLeft),
        h: Math.max(0, spotBottom - spotTop),
      })

      const th = isNarrow ? Math.min(380, vh - 24) : vh < 720 ? 360 : 300
      let top = 0
      let left = 0

      if (isNarrow) {
        const belowTop = r.bottom + spotPad + 12
        const aboveTop = r.top - th - 12
        top = belowTop + th <= vh - 12 || aboveTop < 12 ? belowTop : aboveTop
        left = r.left + r.width / 2 - tooltipW / 2
        setArrowSide(null)
      } else {
        switch (currentStep.placement) {
          case 'right':
            top = r.top + r.height / 2 - th / 2
            left = r.right + spotPad + 16
            setArrowSide('left')
            break
          case 'left':
            top = r.top + r.height / 2 - th / 2
            left = r.left - tooltipW - 16
            setArrowSide('right')
            break
          case 'bottom':
            top = r.bottom + spotPad + 16
            left = r.left + r.width / 2 - tooltipW / 2
            setArrowSide('top')
            break
          case 'top':
            top = r.top - th - 16
            left = r.left + r.width / 2 - tooltipW / 2
            setArrowSide('bottom')
            break
          default:
            top = r.bottom + spotPad + 16
            left = r.left + r.width / 2 - tooltipW / 2
            setArrowSide('top')
        }
      }

      setTtPos({
        top: Math.max(12, Math.min(top, vh - th - 12)),
        left: Math.max(12, Math.min(left, vw - tooltipW - 12)),
      })
    }

    const maybeScrollTargetIntoView = () => {
      const { h: vh } = getViewportSize()
      const r = el.getBoundingClientRect()
      const outOfView = r.top < 16 || r.bottom > vh - 16
      if (!outOfView) return

      el.scrollIntoView({
        behavior: isNarrow ? 'auto' : 'smooth',
        block: isNarrow ? 'center' : 'nearest',
        inline: 'nearest',
      })
    }

    maybeScrollTargetIntoView()
    rafA = window.requestAnimationFrame(() => {
      rafB = window.requestAnimationFrame(measure)
    })
    settleTimer = window.setTimeout(measure, isNarrow ? 80 : 220)

    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    window.visualViewport?.addEventListener('resize', measure)
    window.visualViewport?.addEventListener('scroll', measure)

    return () => {
      window.cancelAnimationFrame(rafA)
      window.cancelAnimationFrame(rafB)
      window.clearTimeout(settleTimer)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
      window.visualViewport?.removeEventListener('resize', measure)
      window.visualViewport?.removeEventListener('scroll', measure)
    }
  }, [currentStep, active, stepIdx, pathKey, isNarrow, tooltipW])

  if (!active) return null

  const centered = currentStep.target === 'center'

  const ARROW_BORDERS = {
    left: {
      width: '8px 8px 8px 0',
      color: 'transparent rgba(255, 255, 255, 0.95) transparent transparent',
    },
    right: {
      width: '8px 0 8px 8px',
      color: 'transparent transparent transparent rgba(255, 255, 255, 0.95)',
    },
    top: {
      width: '0 8px 8px 8px',
      color: 'transparent transparent rgba(255, 255, 255, 0.95) transparent',
    },
    bottom: {
      width: '8px 8px 0 8px',
      color: 'rgba(255, 255, 255, 0.95) transparent transparent transparent',
    },
  }

  return (
    <>
      {/* BACKDROP + SPOTLIGHT */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9000,
          pointerEvents: 'all',
          touchAction: 'none',
          userSelect: 'none',
        }}
        onMouseDown={e => e.preventDefault()}
        onClick={e => e.preventDefault()}
        onWheel={e => e.preventDefault()}
        onTouchMove={e => e.preventDefault()}
      >
        {spot ? (
          <svg
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
            }}
          >
            <defs>
              <mask id="tour-mask">
                <rect width="100%" height="100%" fill="white" />
                <rect
                  x={spot.left}
                  y={spot.top}
                  width={spot.w}
                  height={spot.h}
                  rx={10}
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="rgba(15, 23, 42, 0.55)"
              mask="url(#tour-mask)"
            />
            <rect
              x={spot.left}
              y={spot.top}
              width={spot.w}
              height={spot.h}
              rx={10}
              fill="none"
              stroke="#4361ee"
              strokeWidth="2"
              style={{
                filter: 'drop-shadow(0 0 12px rgba(67, 97, 238, 0.4))',
              }}
            />
          </svg>
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(3px)',
            }}
          />
        )}

        <div style={{ position: 'absolute', inset: 0, background: 'transparent' }} />
      </div>

      {/* TOOLTIP CARD */}
      <div
        style={{
          position: 'fixed',
          zIndex: 9001,
          width: tooltipW,
          maxWidth: 'calc(100vw - 24px)',
          maxHeight: 'calc(100vh - 24px)',
          overflowY: 'auto',
          ...(centered
            ? {
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) scale(${exiting ? 0.95 : 1})`,
              }
            : {
                top: ttPos.top,
                left: ttPos.left,
                transform: `scale(${exiting ? 0.95 : 1}) translateY(${
                  exiting ? '6px' : '0'
                })`,
              }),
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(16px) saturate(200%)',
          border: '1px solid rgba(67, 97, 238, 0.2)',
          borderRadius: isNarrow ? 14 : 16,
          boxShadow:
            '0 20px 60px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(67, 97, 238, 0.1)',
          padding: isNarrow ? '16px 14px 14px' : '20px 20px 16px',
          color: '#0f1729',
          fontFamily: '"Inter", "Roboto", sans-serif',
          opacity: exiting ? 0 : 1,
          transition: 'opacity 0.18s ease, transform 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
          pointerEvents: 'all',
        }}
      >
        {/* Arrow pointer */}
        {arrowSide && !centered && !isNarrow && (() => {
          const pos = {
            left: { left: -8, top: '50%', transform: 'translateY(-50%)' },
            right: { right: -8, top: '50%', transform: 'translateY(-50%)' },
            top: { top: -8, left: '50%', transform: 'translateX(-50%)' },
            bottom: {
              bottom: -8,
              left: '50%',
              transform: 'translateX(-50%)',
            },
          }[arrowSide]

          return (
            <div
              style={{
                position: 'absolute',
                ...pos,
                width: 0,
                height: 0,
                borderStyle: 'solid',
                borderWidth: ARROW_BORDERS[arrowSide].width,
                borderColor: ARROW_BORDERS[arrowSide].color,
              }}
            />
          )
        })()}

        {/* Progress bar */}
        <div
          style={{
            height: 2,
            borderRadius: 99,
            background: 'rgba(67, 97, 238, 0.15)',
            marginBottom: 14,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              borderRadius: 99,
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #4361ee, #5575f7)',
              transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        </div>

        {/* Category label */}
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#4361ee',
            marginBottom: 8,
          }}
        >
          {currentStep.category} · {stepIdx + 1} / {totalSteps}
        </div>

        {/* Icon + Title */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 10,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              flexShrink: 0,
              background: 'rgba(67, 97, 238, 0.12)',
              border: '1px solid rgba(67, 97, 238, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
            }}
          >
            {currentStep.icon}
          </div>
          <h3
            style={{
              fontSize: isNarrow ? 14 : 15,
              fontWeight: 700,
              margin: 0,
              color: '#0f1729',
              lineHeight: 1.3,
            }}
          >
            {currentStep.title}
          </h3>
        </div>

        {/* Description */}
        <p
          style={{
            fontSize: isNarrow ? 12 : 12.5,
            lineHeight: 1.65,
            margin: '0 0 10px',
            color: 'rgba(15, 23, 42, 0.75)',
          }}
        >
          {currentStep.description}
        </p>

        {/* Increases / Decreases */}
        {(currentStep.increases || currentStep.decreases) && (
          <div
            style={{
              background: 'rgba(67, 97, 238, 0.04)',
              border: '1px solid rgba(67, 97, 238, 0.1)',
              borderRadius: 10,
              padding: '9px 11px',
              marginBottom: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            {currentStep.increases && (
              <div
                style={{
                  display: 'flex',
                  gap: 7,
                  alignItems: 'flex-start',
                }}
              >
                <span style={{ fontSize: 12 }}>📈</span>
                <span
                  style={{
                    fontSize: 11,
                    lineHeight: 1.5,
                    color: 'rgba(22, 163, 74, 0.85)',
                  }}
                >
                  {currentStep.increases}
                </span>
              </div>
            )}
            {currentStep.decreases && (
              <div
                style={{
                  display: 'flex',
                  gap: 7,
                  alignItems: 'flex-start',
                }}
              >
                <span style={{ fontSize: 12 }}>📉</span>
                <span
                  style={{
                    fontSize: 11,
                    lineHeight: 1.5,
                    color: 'rgba(220, 38, 38, 0.85)',
                  }}
                >
                  {currentStep.decreases}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Tip */}
        {currentStep.tip && (
          <div
            style={{
              display: 'flex',
              gap: 7,
              alignItems: 'flex-start',
              marginBottom: 12,
              padding: '8px 10px',
              background: 'rgba(217, 119, 6, 0.08)',
              border: '1px solid rgba(217, 119, 6, 0.15)',
              borderRadius: 8,
            }}
          >
            <span style={{ fontSize: 12 }}>💡</span>
            <span
              style={{
                fontSize: 11,
                lineHeight: 1.5,
                color: 'rgba(180, 83, 9, 0.85)',
              }}
            >
              {currentStep.tip}
            </span>
          </div>
        )}

        {/* Navigation buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: isNarrow ? 'wrap' : 'nowrap',
          }}
        >
          {canSkip ? (
            <button
              onClick={skip}
              style={{
                fontSize: 11,
                color: 'rgba(82, 99, 122, 0.6)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '6px 0',
                marginRight: 'auto',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#526378')}
              onMouseLeave={e =>
                (e.currentTarget.style.color = 'rgba(82, 99, 122, 0.6)')
              }
            >
              Skip tour
            </button>
          ) : (
            <span
              style={{
                fontSize: 11,
                color: '#52637a',
                marginRight: 'auto',
                fontWeight: 600,
              }}
            >
              Guided tour required
            </span>
          )}

          {!isFirst && (
            <button
              onClick={prev}
              style={{
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                color: 'rgba(15, 23, 42, 0.6)',
                background: 'rgba(67, 97, 238, 0.08)',
                border: '1px solid rgba(67, 97, 238, 0.15)',
                borderRadius: 8,
                padding: '7px 14px',
                transition: 'all 0.15s',
                flex: isNarrow ? '1 1 0' : '0 0 auto',
              }}
              onMouseEnter={e =>
                (e.currentTarget.style.background = 'rgba(67, 97, 238, 0.12)')
              }
              onMouseLeave={e =>
                (e.currentTarget.style.background = 'rgba(67, 97, 238, 0.08)')
              }
            >
              ← Back
            </button>
          )}

          <button
            onClick={next}
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#fff',
              background: 'linear-gradient(135deg, #4361ee, #3850d6)',
              border: 'none',
              borderRadius: 8,
              padding: '7px 18px',
              cursor: 'pointer',
              boxShadow: '0 2px 12px rgba(67, 97, 238, 0.3)',
              transition: 'all 0.15s',
              flex: isNarrow ? '1 1 0' : '0 0 auto',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(67, 97, 238, 0.4)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 12px rgba(67, 97, 238, 0.3)'
            }}
          >
            {isLast ? '✅ Got it!' : 'Next →'}
          </button>
        </div>
      </div>

      {/* Keyboard hint */}
      <div
        style={{
          position: 'fixed',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9002,
          fontSize: 10,
          color: 'rgba(82, 99, 122, 0.45)',
          pointerEvents: 'none',
          letterSpacing: '0.05em',
        }}
      >
        {canSkip ? '→ Next · ← Back · Esc Skip' : '→ Next · ← Back'}
      </div>
    </>
  )
}

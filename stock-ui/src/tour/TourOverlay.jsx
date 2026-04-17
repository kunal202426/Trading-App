import React, { useState, useEffect } from 'react'
import { useTour } from './useTour'

const SPOT_PAD = 12

const TOUR_THEME = {
  overlay: 'rgba(15, 23, 42, 0.58)',
  surface: '#ffffff',
  surfaceBorder: '#dbe3f2',
  surfaceAlt: '#f8fbff',
  text: '#0f1729',
  textMuted: '#64748b',
  primary: '#4361ee',
  primarySoft: 'rgba(67, 97, 238, 0.1)',
  primarySoftHover: 'rgba(67, 97, 238, 0.16)',
  primaryBorder: 'rgba(67, 97, 238, 0.24)',
  brand: '#4361ee',
  brandStrong: '#3b82f6',
  brandShadow: 'rgba(67, 97, 238, 0.36)',
  success: '#15803d',
  danger: '#b91c1c',
  tipBg: 'rgba(59, 130, 246, 0.1)',
  tipBorder: 'rgba(59, 130, 246, 0.26)',
  tipText: '#1d4ed8',
}

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

    let rafA = 0
    let rafB = 0
    let settleTimer = 0
    let retryTimer = 0
    let navSettleTimer = 0
    let retryCount = 0
    let disposed = false
    let targetEl = null

    const measure = () => {
      if (disposed) return

      if (!targetEl || !targetEl.isConnected) {
        targetEl = document.querySelector(currentStep.target)
      }

      if (!targetEl) {
        setSpot(null)
        setArrowSide(null)
        return
      }

      const { w: vw, h: vh } = getViewportSize()
      const r = targetEl.getBoundingClientRect()
      const spotPad = isNarrow ? 6 : SPOT_PAD
      const isNavigationPanelStep = currentStep.id === 'navigation-panel'
      const edgeInset = isNavigationPanelStep ? 0 : 6

      const navPanelRight = Math.min(
        vw,
        Math.max(r.right, targetEl.offsetWidth || 0)
      )
      const focusRect = isNavigationPanelStep
        ? {
            top: 0,
            left: 0,
            right: navPanelRight,
            bottom: vh,
            width: navPanelRight,
            height: vh,
          }
        : r

      const spotlightPad = isNavigationPanelStep ? 0 : spotPad

      const spotLeft = Math.max(edgeInset, focusRect.left - spotlightPad)
      const spotTop = Math.max(edgeInset, focusRect.top - spotlightPad)
      const spotRight = Math.min(vw - edgeInset, focusRect.right + spotlightPad)
      const spotBottom = Math.min(vh - edgeInset, focusRect.bottom + spotlightPad)

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
        const belowTop = focusRect.bottom + spotPad + 12
        const aboveTop = focusRect.top - th - 12
        top = belowTop + th <= vh - 12 || aboveTop < 12 ? belowTop : aboveTop
        left = focusRect.left + focusRect.width / 2 - tooltipW / 2
        setArrowSide(null)
      } else {
        switch (currentStep.placement) {
          case 'right':
            top = focusRect.top + focusRect.height / 2 - th / 2
            left = focusRect.right + spotPad + 16
            setArrowSide('left')
            break
          case 'left':
            top = focusRect.top + focusRect.height / 2 - th / 2
            left = focusRect.left - tooltipW - 16
            setArrowSide('right')
            break
          case 'bottom':
            top = focusRect.bottom + spotPad + 16
            left = focusRect.left + focusRect.width / 2 - tooltipW / 2
            setArrowSide('top')
            break
          case 'top':
            top = focusRect.top - th - 16
            left = focusRect.left + focusRect.width / 2 - tooltipW / 2
            setArrowSide('bottom')
            break
          default:
            top = focusRect.bottom + spotPad + 16
            left = focusRect.left + focusRect.width / 2 - tooltipW / 2
            setArrowSide('top')
        }
      }

      setTtPos({
        top: Math.max(12, Math.min(top, vh - th - 12)),
        left: Math.max(12, Math.min(left, vw - tooltipW - 12)),
      })
    }

    const maybeScrollTargetIntoView = () => {
      if (!targetEl) return

      const { h: vh } = getViewportSize()
      const r = targetEl.getBoundingClientRect()
      const outOfView = r.top < 16 || r.bottom > vh - 16
      if (!outOfView) return

      targetEl.scrollIntoView({
        behavior: isNarrow ? 'auto' : 'smooth',
        block: isNarrow ? 'center' : 'nearest',
        inline: 'nearest',
      })
    }

    const scheduleInitialMeasure = () => {
      rafA = window.requestAnimationFrame(() => {
        rafB = window.requestAnimationFrame(measure)
      })
      settleTimer = window.setTimeout(measure, isNarrow ? 120 : 320)

      if (currentStep.id === 'navigation-panel') {
        navSettleTimer = window.setTimeout(measure, 640)
      }
    }

    const findTargetWithRetry = () => {
      if (disposed) return

      targetEl = document.querySelector(currentStep.target)
      if (targetEl) {
        maybeScrollTargetIntoView()
        scheduleInitialMeasure()
        return
      }

      setSpot(null)
      setArrowSide(null)

      if (retryCount >= 35) return
      retryCount += 1
      retryTimer = window.setTimeout(findTargetWithRetry, 120)
    }

    findTargetWithRetry()

    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    window.visualViewport?.addEventListener('resize', measure)
    window.visualViewport?.addEventListener('scroll', measure)

    return () => {
      disposed = true
      window.cancelAnimationFrame(rafA)
      window.cancelAnimationFrame(rafB)
      window.clearTimeout(settleTimer)
      window.clearTimeout(navSettleTimer)
      window.clearTimeout(retryTimer)
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
      color: `transparent ${TOUR_THEME.surface} transparent transparent`,
    },
    right: {
      width: '8px 0 8px 8px',
      color: `transparent transparent transparent ${TOUR_THEME.surface}`,
    },
    top: {
      width: '0 8px 8px 8px',
      color: `transparent transparent ${TOUR_THEME.surface} transparent`,
    },
    bottom: {
      width: '8px 8px 0 8px',
      color: `${TOUR_THEME.surface} transparent transparent transparent`,
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
              fill={TOUR_THEME.overlay}
              mask="url(#tour-mask)"
            />
            <rect
              x={spot.left}
              y={spot.top}
              width={spot.w}
              height={spot.h}
              rx={10}
              fill="none"
              stroke={TOUR_THEME.primary}
              strokeWidth="2"
              style={{
                filter: `drop-shadow(0 0 12px ${TOUR_THEME.primaryBorder})`,
              }}
            />
          </svg>
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: TOUR_THEME.overlay,
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
          background: TOUR_THEME.surface,
          backgroundImage:
            'linear-gradient(180deg, rgba(248, 251, 255, 0.95) 0%, rgba(255, 255, 255, 1) 36%)',
          border: `1px solid ${TOUR_THEME.surfaceBorder}`,
          borderRadius: isNarrow ? 12 : 16,
          boxShadow: '0 18px 46px rgba(15, 23, 42, 0.16)',
          padding: isNarrow ? '16px 14px 14px' : '20px 20px 18px',
          color: TOUR_THEME.text,
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
            height: 3,
            borderRadius: 99,
            background: TOUR_THEME.primarySoft,
            marginBottom: 16,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              borderRadius: 99,
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${TOUR_THEME.primary}, ${TOUR_THEME.brand})`,
              transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        </div>

        {/* Category label */}
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.11em',
            textTransform: 'uppercase',
            color: TOUR_THEME.primary,
            marginBottom: 10,
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
              width: 38,
              height: 38,
              borderRadius: 12,
              flexShrink: 0,
              background: TOUR_THEME.primarySoft,
              border: `1px solid ${TOUR_THEME.primaryBorder}`,
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
              fontSize: isNarrow ? 15 : 17,
              fontWeight: 700,
              margin: 0,
              color: TOUR_THEME.text,
              lineHeight: 1.3,
            }}
          >
            {currentStep.title}
          </h3>
        </div>

        {/* Description */}
        <p
          style={{
            fontSize: isNarrow ? 13 : 13.5,
            lineHeight: 1.62,
            margin: '0 0 12px',
            color: TOUR_THEME.textMuted,
          }}
        >
          {currentStep.description}
        </p>

        {/* Increases / Decreases */}
        {(currentStep.increases || currentStep.decreases) && (
          <div
            style={{
              background: TOUR_THEME.surfaceAlt,
              border: `1px solid ${TOUR_THEME.surfaceBorder}`,
              borderRadius: 12,
              padding: '10px 12px',
              marginBottom: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 7,
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
                    fontSize: 11.5,
                    lineHeight: 1.5,
                    color: TOUR_THEME.success,
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
                    fontSize: 11.5,
                    lineHeight: 1.5,
                    color: TOUR_THEME.danger,
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
              padding: '9px 11px',
              background: TOUR_THEME.tipBg,
              border: `1px solid ${TOUR_THEME.tipBorder}`,
              borderRadius: 10,
            }}
          >
            <span style={{ fontSize: 12 }}>💡</span>
            <span
              style={{
                fontSize: 11.5,
                lineHeight: 1.5,
                color: TOUR_THEME.tipText,
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
                fontSize: 11.5,
                color: TOUR_THEME.textMuted,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '6px 0',
                marginRight: 'auto',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = TOUR_THEME.textMuted)}
              onMouseLeave={e => (e.currentTarget.style.color = TOUR_THEME.textMuted)}
            >
              Skip tour
            </button>
          ) : (
            <span
              style={{
                fontSize: 11.5,
                color: TOUR_THEME.textMuted,
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
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
                color: TOUR_THEME.text,
                background: TOUR_THEME.primarySoft,
                border: `1px solid ${TOUR_THEME.primaryBorder}`,
                borderRadius: 10,
                padding: '8px 14px',
                transition: 'all 0.15s',
                flex: isNarrow ? '1 1 0' : '0 0 auto',
              }}
              onMouseEnter={e =>
                (e.currentTarget.style.background = TOUR_THEME.primarySoftHover)
              }
              onMouseLeave={e =>
                (e.currentTarget.style.background = TOUR_THEME.primarySoft)
              }
            >
              ← Back
            </button>
          )}

          <button
            onClick={next}
            style={{
              fontSize: 12.5,
              fontWeight: 700,
              color: '#fff',
              background: `linear-gradient(135deg, ${TOUR_THEME.brand}, ${TOUR_THEME.brandStrong})`,
              border: 'none',
              borderRadius: 10,
              padding: '8px 18px',
              cursor: 'pointer',
              boxShadow: `0 4px 16px ${TOUR_THEME.brandShadow}`,
              transition: 'all 0.15s',
              flex: isNarrow ? '1 1 0' : '0 0 auto',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 8px 22px rgba(67, 97, 238, 0.4)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = `0 4px 16px ${TOUR_THEME.brandShadow}`
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
          color: 'rgba(82, 99, 122, 0.72)',
          pointerEvents: 'none',
          letterSpacing: '0.05em',
        }}
      >
        {canSkip ? '→ Next · ← Back · Esc Skip' : '→ Next · ← Back'}
      </div>
    </>
  )
}

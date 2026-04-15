import React, { useEffect, useMemo, useRef, useState } from 'react';
import createGlobe from 'cobe';
import '../../styles/GlobeAnalytics.css';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const DEG = Math.PI / 180;
const MAX_STOCK_DOTS = 28;

const STOCK_SYMBOLS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'AMD',
  'NFLX', 'ORCL', 'CRM', 'INTC', 'QCOM', 'ADBE', 'AVGO', 'TXN',
  'PYPL', 'SHOP', 'UBER', 'ABNB', 'SNOW', 'COIN', 'PLTR', 'PANW',
  'ASML', 'SAP', 'SONY', 'BABA', 'TCEHY', 'PDD', 'NIO', 'BYD',
  'RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'NESTLE', 'SHEL', 'BP', 'RIO',
  'BHP', 'V', 'MA', 'JPM', 'GS', 'MS', 'BAC', 'C',
  'WMT', 'COST', 'HD', 'NKE', 'SBUX', 'MCD', 'KO', 'PEP',
  'XOM', 'CVX', 'CAT', 'GE', 'BA', 'LMT', 'DIS', 'IBM'
];

const LAND_COORDINATES = [
  [37.77, -122.42],
  [40.71, -74.01],
  [47.61, -122.33],
  [30.27, -97.74],
  [25.76, -80.19],
  [41.88, -87.63],
  [51.51, -0.13],
  [48.86, 2.35],
  [52.52, 13.41],
  [40.42, -3.7],
  [45.46, 9.19],
  [55.75, 37.62],
  [59.33, 18.07],
  [52.37, 4.9],
  [41.01, 28.98],
  [30.04, 31.24],
  [6.52, 3.38],
  [-26.2, 28.04],
  [19.08, 72.88],
  [28.61, 77.21],
  [12.97, 77.59],
  [23.81, 90.41],
  [13.75, 100.5],
  [1.35, 103.82],
  [3.14, 101.69],
  [14.6, 120.98],
  [35.68, 139.65],
  [34.69, 135.5],
  [37.57, 126.98],
  [39.9, 116.4],
  [31.23, 121.47],
  [22.32, 114.17],
  [-33.87, 151.21],
  [-37.81, 144.96],
  [-36.85, 174.76],
  [-23.55, -46.63],
  [-22.91, -43.17],
  [-34.6, -58.38],
  [-12.05, -77.04],
  [4.71, -74.07],
  [19.43, -99.13],
  [43.65, -79.38]
];

const buildStockModel = () => {
  const stockPool = STOCK_SYMBOLS.slice(0, MAX_STOCK_DOTS);

  return stockPool.map((symbol, index) => {
    const point = LAND_COORDINATES[index % LAND_COORDINATES.length];
    const basePrice = 35 + ((index * 37) % 460) + ((index % 8) * 0.71);
    const baseChange = ((index % 13) - 6) * 0.32;

    return {
      id: `${symbol}-${index}`,
      symbol,
      location: [point[0], point[1]],
      basePrice: Number(basePrice.toFixed(2)),
      price: Number(basePrice.toFixed(2)),
      change: Number(baseChange.toFixed(1)),
      phase: index * 0.37,
      volatility: 0.7 + (index % 5) * 0.15
    };
  });
};

const normalizeStocks = (stocks) => {
  return stocks.slice(0, MAX_STOCK_DOTS).map((stock, index) => {
    const basePrice = typeof stock.basePrice === 'number' ? stock.basePrice : stock.price;

    return {
      ...stock,
      id: stock.id || `${stock.symbol || 'STK'}-${index}`,
      symbol: stock.symbol || `STK${index + 1}`,
      basePrice: Number((basePrice ?? 100).toFixed(2)),
      price: Number((stock.price ?? basePrice ?? 100).toFixed(2)),
      change: Number((stock.change ?? 0).toFixed(1)),
      phase: typeof stock.phase === 'number' ? stock.phase : index * 0.37,
      volatility: typeof stock.volatility === 'number' ? stock.volatility : (0.7 + (index % 5) * 0.15)
    };
  });
};

const simulateStockTick = (stock, nowSeconds) => {
  const waveA = Math.sin(nowSeconds * 0.31 + stock.phase) * (stock.volatility * 2.25);
  const waveB = Math.cos(nowSeconds * 0.17 + stock.phase * 1.7) * (stock.volatility * 1.35);
  const waveC = Math.sin(nowSeconds * 0.08 + stock.phase * 0.8) * 0.45;
  const nextPrice = clamp(stock.basePrice + waveA + waveB + waveC, 5, 5000);
  const nextChange = clamp(((nextPrice - stock.basePrice) / stock.basePrice) * 100, -15, 15);

  return {
    price: Number(nextPrice.toFixed(2)),
    change: Number(nextChange.toFixed(1))
  };
};

const DEFAULT_STOCKS = buildStockModel();

const toGlobeMarkers = (stocks) => {
  return stocks.map((stock) => ({
    location: stock.location,
    size: 0.024 + Math.min(0.016, Math.abs(stock.change) * 0.0017)
  }));
};

const pickDisplayChips = (points, globeSize, isDragging) => {
  const maxChips = clamp(Math.round(globeSize / 150), 3, isDragging ? 4 : 6);
  const minDistance = globeSize < 460 ? 56 : 68;
  const selected = [];

  for (const point of points) {
    if (point.opacity < 0.38 || point.scale < 0.75) {
      continue;
    }

    const overlaps = selected.some((item) => {
      const dx = item.x - point.x;
      const dy = item.y - point.y;
      return (dx * dx + dy * dy) < (minDistance * minDistance);
    });

    if (overlaps) {
      continue;
    }

    selected.push(point);

    if (selected.length >= maxChips) {
      break;
    }
  }

  return selected;
};

const projectMarker = (stock, phi, theta, size) => {
  const lat = stock.location[0] * DEG;
  const lon = stock.location[1] * DEG;

  const cosLat = Math.cos(lat);
  const x = cosLat * Math.cos(lon);
  const y = Math.sin(lat);
  const z = cosLat * Math.sin(lon);

  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);
  const xRot = x * cosPhi + z * sinPhi;
  const zRot = -x * sinPhi + z * cosPhi;

  const cosTheta = Math.cos(theta);
  const sinTheta = Math.sin(theta);
  const yRot = y * cosTheta - zRot * sinTheta;
  const zFinal = y * sinTheta + zRot * cosTheta;

  if (zFinal <= 0.02) {
    return null;
  }

  const depth = clamp((zFinal - 0.02) / 0.98, 0, 1);
  const radius = size * 0.475;

  return {
    id: stock.id,
    symbol: stock.symbol,
    price: stock.price,
    change: stock.change,
    x: size / 2 + xRot * radius,
    y: size / 2 - yRot * radius,
    opacity: 0.2 + depth * 0.8,
    scale: 0.68 + depth * 0.35,
    isUp: stock.change >= 0
  };
};

function GlobeAnalytics({ markers = DEFAULT_STOCKS, className = '', speed = 0.003, scrollProgress = 0, isActive = true }) {
  const canvasRef = useRef(null);
  const shellRef = useRef(null);
  const globeRef = useRef(null);
  const sizeRef = useRef(0);
  const renderSizeRef = useRef(0);
  const phiRef = useRef(0);
  const thetaRef = useRef(0.2);
  const scaleRef = useRef(1);
  const scrollMotionRef = useRef({ phiNudge: 0 });
  const animationIdRef = useRef(0);
  const lastLabelUpdateRef = useRef(0);
  const lastFrameTimeRef = useRef(0);
  const pointerStartRef = useRef(null);
  const dragOffsetRef = useRef({ phi: 0, theta: 0 });
  const manualOffsetRef = useRef({ phi: 0, theta: 0 });
  const isDraggingRef = useRef(false);
  const scrollProgressRef = useRef(clamp(scrollProgress, 0, 1));
  const lastProgressRef = useRef(scrollProgressRef.current);
  const isActiveRef = useRef(isActive);

  const [stocks, setStocks] = useState(() => normalizeStocks(markers));
  const stocksRef = useRef(normalizeStocks(markers));
  const [labelPoints, setLabelPoints] = useState([]);

  useEffect(() => {
    const normalized = normalizeStocks(markers);
    setStocks(normalized);
    stocksRef.current = normalized;
  }, [markers]);

  useEffect(() => {
    scrollProgressRef.current = clamp(scrollProgress, 0, 1);
  }, [scrollProgress]);

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const nowSeconds = Date.now() / 1000;

      setStocks((prev) => {
        return prev.map((stock) => {
          return {
            ...stock,
            ...simulateStockTick(stock, nowSeconds)
          };
        });
      });
    }, 1600);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const handlePointerDown = (event) => {
    if (!canvasRef.current) {
      return;
    }

    pointerStartRef.current = { x: event.clientX, y: event.clientY };
    dragOffsetRef.current = { phi: 0, theta: 0 };
    isDraggingRef.current = true;
    canvasRef.current.style.cursor = 'grabbing';

    if (typeof event.currentTarget.setPointerCapture === 'function') {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  };

  const handlePointerMove = (event) => {
    if (!isDraggingRef.current || !pointerStartRef.current) {
      return;
    }

    const dx = event.clientX - pointerStartRef.current.x;
    const dy = event.clientY - pointerStartRef.current.y;

    dragOffsetRef.current = {
      phi: dx / 260,
      theta: clamp(dy / 360, -0.85, 0.85)
    };
  };

  const handlePointerUp = (event) => {
    if (!isDraggingRef.current) {
      return;
    }

    manualOffsetRef.current.phi += dragOffsetRef.current.phi;
    manualOffsetRef.current.theta = clamp(
      manualOffsetRef.current.theta + dragOffsetRef.current.theta,
      -0.82,
      0.82
    );

    dragOffsetRef.current = { phi: 0, theta: 0 };
    pointerStartRef.current = null;
    isDraggingRef.current = false;

    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'grab';
    }

    if (event && typeof event.currentTarget.releasePointerCapture === 'function') {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    }
  };

  useEffect(() => {
    if (!canvasRef.current || !shellRef.current) {
      return undefined;
    }

    const canvas = canvasRef.current;
    const shell = shellRef.current;
    let resizeObserver = null;

    const updateSize = () => {
      sizeRef.current = shell.offsetWidth || 0;
      const qualityScale = window.innerWidth < 900 ? 1.05 : 1.25;
      renderSizeRef.current = Math.max(280, Math.round(sizeRef.current * qualityScale));

      if (globeRef.current && sizeRef.current > 0) {
        globeRef.current.update({
          width: renderSizeRef.current,
          height: renderSizeRef.current
        });
      }
    };

    const initGlobe = () => {
      if (globeRef.current || sizeRef.current <= 0) {
        return;
      }

      globeRef.current = createGlobe(canvas, {
        devicePixelRatio: 1,
        width: renderSizeRef.current,
        height: renderSizeRef.current,
        phi: 0,
        theta: 0.2,
        dark: 0,
        diffuse: 1.2,
        mapSamples: 6400,
        mapBrightness: 2.4,
        baseColor: [0.95, 0.97, 1],
        markerColor: [0.19, 0.5, 0.91],
        glowColor: [1, 1, 1],
        markerElevation: 0.02,
        markers: toGlobeMarkers(stocksRef.current),
        arcs: []
      });

      canvas.style.opacity = '1';
      canvas.style.cursor = 'grab';
    };

    const animate = (timestamp) => {
      const globe = globeRef.current;
      const currentSize = sizeRef.current;

      const frameGap = isActiveRef.current ? 22 : 130;

      if (timestamp - lastFrameTimeRef.current < frameGap) {
        animationIdRef.current = window.requestAnimationFrame(animate);
        return;
      }

      lastFrameTimeRef.current = timestamp;

      if (!isActiveRef.current && !isDraggingRef.current) {
        animationIdRef.current = window.requestAnimationFrame(animate);
        return;
      }

      if (globe && currentSize > 0) {
        const scrollMotion = scrollMotionRef.current;
        const progress = scrollProgressRef.current;
        const progressDelta = progress - lastProgressRef.current;
        lastProgressRef.current = progress;

        if (!isDraggingRef.current) {
          phiRef.current += speed + progress * 0.03;
        }

        scrollMotion.phiNudge += progressDelta * 1.2;
        phiRef.current += scrollMotion.phiNudge;
        scrollMotion.phiNudge *= 0.8;

        const progressThetaTarget = clamp(0.24 - progress * 0.34, -0.24, 0.34);
        const progressScaleTarget = 1 + progress * 0.42;

        thetaRef.current += (progressThetaTarget - thetaRef.current) * 0.16;
        scaleRef.current += (progressScaleTarget - scaleRef.current) * 0.18;

        const currentPhi = phiRef.current + manualOffsetRef.current.phi + dragOffsetRef.current.phi;
        const currentTheta = clamp(
          thetaRef.current + manualOffsetRef.current.theta + dragOffsetRef.current.theta,
          -0.82,
          0.82
        );

        globe.update({
          phi: currentPhi,
          theta: currentTheta,
          scale: scaleRef.current
        });

        if (timestamp - lastLabelUpdateRef.current > (isDraggingRef.current ? 90 : 120)) {
          const projected = stocksRef.current
            .map((stock) => projectMarker(stock, currentPhi, currentTheta, currentSize))
            .filter(Boolean)
            .sort((a, b) => b.scale - a.scale);

          setLabelPoints(pickDisplayChips(projected, currentSize, isDraggingRef.current));
          lastLabelUpdateRef.current = timestamp;
        }
      }

      animationIdRef.current = window.requestAnimationFrame(animate);
    };

    updateSize();
    initGlobe();
    animationIdRef.current = window.requestAnimationFrame(animate);

    resizeObserver = new ResizeObserver(() => {
      updateSize();
      initGlobe();
    });

    resizeObserver.observe(shell);

    return () => {
      if (animationIdRef.current) {
        window.cancelAnimationFrame(animationIdRef.current);
      }

      if (resizeObserver) {
        resizeObserver.disconnect();
      }

      if (globeRef.current) {
        globeRef.current.destroy();
        globeRef.current = null;
      }
    };
  }, [speed]);

  useEffect(() => {
    stocksRef.current = stocks;

    if (globeRef.current) {
      globeRef.current.update({
        markers: toGlobeMarkers(stocks)
      });
    }
  }, [stocks]);

  const markerLabels = useMemo(() => {
    return labelPoints.map((point) => {
      return {
        ...point,
        changeLabel: `${point.isUp ? '+' : ''}${point.change.toFixed(1)}%`
      };
    });
  }, [labelPoints]);

  const classes = className ? `globe-analytics ${className}` : 'globe-analytics';

  return (
    <div className={classes}>
      <div className="globe-analytics-shell" ref={shellRef}>
        <canvas
          ref={canvasRef}
          className="globe-analytics-canvas"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
          aria-label="Interactive stock globe"
          role="img"
        />

        <div className="globe-marker-layer">
          {markerLabels.map((point) => {
            return (
              <div
                className={`globe-stock-chip marker-chip ${point.isUp ? 'is-up' : 'is-down'}`}
                key={point.id}
                style={{
                  left: `${point.x}px`,
                  top: `${point.y}px`,
                  opacity: point.opacity,
                  transform: `translate(-50%, -115%) scale(${point.scale})`
                }}
              >
                <span className="stock-symbol">{point.symbol}</span>
                <span className="stock-change">{point.changeLabel}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default GlobeAnalytics;

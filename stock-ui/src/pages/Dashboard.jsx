import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  Box, Button, Card, CardContent, Typography, TextField,
  CircularProgress, Chip, LinearProgress, Skeleton, InputAdornment,
  List, ListItemButton, ListItemText,
  IconButton, Dialog, DialogTitle, DialogContent, Tooltip, Grid, Paper, Stack,
  Drawer, useMediaQuery, useTheme,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ShieldIcon from '@mui/icons-material/Shield';
import AddIcon from '@mui/icons-material/Add';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import BarChartIcon from '@mui/icons-material/BarChart';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CloseIcon from '@mui/icons-material/Close';
import ViewListIcon from '@mui/icons-material/ViewList';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip as ReTooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';

const API = import.meta.env.VITE_API_URL || '';
import TroubleshootIcon from '@mui/icons-material/Troubleshoot';
const signalColors = { 1: '#16a34a', 0: '#d97706', [-1]: '#dc2626' };
const signalLabels = { 1: 'BUY', 0: 'HOLD', [-1]: 'SELL' };

const glowStyles = {
  BUY:  { border: '2px solid #16a34a', boxShadow: '0 0 24px rgba(22,163,74,0.18)' },
  SELL: { border: '2px solid #dc2626', boxShadow: '0 0 24px rgba(220,38,38,0.18)' },
  HOLD: { border: '2px solid #d97706', boxShadow: '0 0 16px rgba(217,119,6,0.12)' },
};

const cardSx = {
  bgcolor: '#ffffff', borderRadius: 3,
  boxShadow: '0 2px 12px rgba(15,23,42,0.08)',
  border: '1px solid #e5e7eb',
};

// ── Animated number counter ──
function CountUp({ value, prefix = '', decimals = 2, duration = 800 }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef();
  useEffect(() => {
    const start = performance.now();
    const step = (ts) => {
      const t = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(value * eased);
      if (t < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [value, duration]);
  return <span>{prefix}{display.toFixed(decimals)}</span>;
}

// ── Page entry variants ──
const pageEntry = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const slideDown = {
  hidden: { opacity: 0, y: -30 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 180, damping: 20 } },
};
const slideUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 160, damping: 20 } },
};

// ─────────────────────────────────────────────────────
// WATCHLIST (Left Panel)
// ─────────────────────────────────────────────────────
function Watchlist({ symbols, activeSymbol, onSelect, onAdd, onRemove, flash }) {
  const [newSym, setNewSym] = useState('');
  const handleAdd = () => {
    const s = newSym.trim().toUpperCase();
    if (s && !symbols.includes(s)) { onAdd(s); setNewSym(''); }
  };

  return (
    <Card sx={{ ...cardSx, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ pb: 0 }}>
        <Typography sx={{
          fontSize: 12, fontWeight: 700, letterSpacing: 2,
          textTransform: 'uppercase', color: '#1976d2', mb: 1,
        }}>
          Watchlist
        </Typography>
      </CardContent>

      <List dense sx={{ flex: 1, overflowY: 'auto', px: 1 }}>
        {symbols.map((sym, i) => (
          <motion.div
            key={sym}
            animate={flash ? {
              backgroundColor: ['rgba(25,118,210,0)', 'rgba(25,118,210,0.12)', 'rgba(25,118,210,0)'],
            } : {}}
            transition={flash ? { delay: i * 0.05, duration: 0.4 } : {}}
          >
            <ListItemButton
              selected={sym === activeSymbol}
              onClick={() => onSelect(sym)}
              sx={{
                borderRadius: 2, mb: 0.5,
                borderLeft: sym === activeSymbol ? '4px solid #1976d2' : '4px solid transparent',
                bgcolor: sym === activeSymbol ? 'rgba(25,118,210,0.06)' : 'transparent',
                transition: 'all 0.25s ease',
                '&:hover': {
                  bgcolor: 'rgba(25,118,210,0.05)',
                  borderLeftColor: '#1976d2',
                  borderLeftWidth: '4px',
                },
              }}
            >
              <ListItemText
                primary={sym}
                primaryTypographyProps={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}
              />
              <Tooltip title={symbols.length === 1 ? 'At least one symbol is required' : 'Remove from watchlist'}>
                <span>
                  <IconButton
                    size="small"
                    disabled={symbols.length === 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove?.(sym);
                    }}
                    sx={{
                      color: '#94a3b8',
                      p: 0.5,
                      '&:hover': { color: '#dc2626', bgcolor: 'rgba(220,38,38,0.08)' },
                    }}
                  >
                    <CloseIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </span>
              </Tooltip>
            </ListItemButton>
          </motion.div>
        ))}
      </List>

      <Box sx={{ px: 2, pb: 2 }}>
        <TextField
          size="small" fullWidth placeholder="Add symbol"
          value={newSym}
          onChange={(e) => setNewSym(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <AddIcon sx={{ cursor: 'pointer', color: '#1976d2', fontSize: 20 }} onClick={handleAdd} />
              </InputAdornment>
            ),
            sx: { fontSize: 13, height: 36 },
          }}
        />
      </Box>
    </Card>
  );
}

// ─────────────────────────────────────────────────────
// PRICE CHART
// ─────────────────────────────────────────────────────
function PriceChart({ chartData, isUp }) {
  if (!chartData || chartData.length === 0) {
    return (
      <Box sx={{
        height: { xs: 220, sm: 300, md: 360 }, display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '1px dashed #d1d5db', borderRadius: 2, bgcolor: '#fafafa',
      }}>
        <Typography sx={{ color: '#94a3b8' }}>No chart data available</Typography>
      </Box>
    );
  }

  const color = isUp ? '#16a34a' : '#dc2626';
  const interval = Math.max(1, Math.floor(chartData.length / 5));

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <Box sx={{
        bgcolor: '#0f172a', color: '#fff', px: 1.5, py: 1, borderRadius: 1.5,
        fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      }}>
        <div style={{ fontWeight: 600, marginBottom: 2 }}>{label}</div>
        <div style={{ fontFamily: '"JetBrains Mono", monospace' }}>
          ₹{payload[0].value.toFixed(2)}
        </div>
      </Box>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, clipPath: 'inset(0 100% 0 0)' }}
      animate={{ opacity: 1, clipPath: 'inset(0 0% 0 0)' }}
      transition={{ duration: 1, ease: 'easeOut' }}
    >
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.12} />
              <stop offset="100%" stopColor={color} stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickLine={false} axisLine={{ stroke: '#e5e7eb' }}
            interval={interval}
          />
          <YAxis
            domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickLine={false} axisLine={false}
            tickFormatter={(v) => `₹${v}`} width={65}
          />
          <ReTooltip content={<CustomTooltip />} />
          <Area
            type="monotone" dataKey="price" stroke={color} strokeWidth={2}
            fill="url(#areaGrad)" dot={false}
            activeDot={{ r: 4, fill: color, stroke: '#fff', strokeWidth: 2 }}
            animationDuration={800} animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────
// METRIC BOX
// ─────────────────────────────────────────────────────
function MetricBox({ label, value, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 200 }}
      style={{ flex: 1 }}
    >
      <Card sx={{ ...cardSx, textAlign: 'center', py: 1.5, px: 1 }}>
        <Typography sx={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>
          {label}
        </Typography>
        <Typography sx={{ fontSize: 15, fontWeight: 700, color: '#0f172a', fontFamily: '"JetBrains Mono", monospace', mt: 0.25 }}>
          {value}
        </Typography>
      </Card>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────
// SIGNAL CARD (Right panel)
// ─────────────────────────────────────────────────────
function SignalCard({ prediction, onOpenAnalysis, onOpenFundamentals, currentSymbol }) {
  const label = signalLabels[prediction.signal];
  const color = signalColors[prediction.signal];
  const glow = glowStyles[label];

  const buyRipple = prediction.signal === 1 ? {
    animate: { scale: [1, 1.6, 1], opacity: [0.3, 0, 0.3] },
    transition: { repeat: Infinity, duration: 2, ease: 'easeInOut' },
  } : {};

  const sellShake = prediction.signal === -1 ? {
    animate: { x: [-3, 3, -3, 3, 0] },
    transition: { repeat: Infinity, duration: 0.5, repeatDelay: 3 },
  } : {};

  const holdPulse = prediction.signal === 0 ? {
    animate: { borderColor: ['rgba(217,119,6,0.3)', 'rgba(217,119,6,0.8)', 'rgba(217,119,6,0.3)'] },
    transition: { repeat: Infinity, duration: 2.5, ease: 'easeInOut' },
  } : {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: prediction.signal === 1 ? 1.02 : 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    >
      <Card
        component={motion.div}
        {...holdPulse}
        {...sellShake}
        sx={{ ...cardSx, ...glow, textAlign: 'center', py: 1, position: 'relative', overflow: 'hidden' }}
      >
        {/* BUY green ripple */}
        {prediction.signal === 1 && (
          <motion.div
            {...buyRipple}
            style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%,-50%)',
              width: 140, height: 140, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(22,163,74,0.12) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
        )}
        <CardContent sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography sx={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: '#94a3b8', textTransform: 'uppercase' }}>
              Signal
            </Typography>
            <Tooltip title="Quick fundamentals">
              <IconButton
                size="small"
                onClick={(e) => onOpenFundamentals?.(e)}
                disabled={!currentSymbol}
                sx={{
                  color: currentSymbol ? '#64748b' : '#9ca3af',
                  bgcolor: '#f8fafc',
                  border: '1px solid #e5e7eb',
                  width: 28,
                  height: 28,
                  '&:hover': {
                    bgcolor: '#eef2ff',
                    color: '#1d4ed8',
                  },
                }}
              >
                <OpenInNewIcon fontSize="small" sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Box>
          <IconButton
            onClick={onOpenAnalysis}
            disabled={!currentSymbol}
            sx={{
              color: currentSymbol ? '#1976d2' : '#9ca3af',
            }}
          >
            <TroubleshootIcon />
          </IconButton>
          <Typography sx={{
            fontSize: '2.2rem', fontWeight: 900, color, my: 0.5,
            textShadow: `0 0 20px ${color}40`,
          }}>
            {label}
          </Typography>
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress variant="determinate" value={100} size={56} thickness={4}
              sx={{ color: '#f3f4f6', position: 'absolute' }} />
            <CircularProgress variant="determinate" value={prediction.confidence * 100}
              size={56} thickness={4} sx={{ color }} />
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography sx={{ fontWeight: 800, color, fontSize: 13, fontFamily: '"JetBrains Mono", monospace' }}>
                <CountUp value={prediction.confidence * 100} decimals={0} duration={800} />%
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────
// PRICE TARGET CARD
// ─────────────────────────────────────────────────────
function PriceTargetCard({ prediction }) {
  const isDown = prediction.signal === -1;
  const moveColor = isDown ? '#dc2626' : '#16a34a';
  const pct = prediction.last_price > 0
    ? (((prediction.primary_target - prediction.last_price) / prediction.last_price) * 100).toFixed(2)
    : '0.00';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 220, damping: 20, delay: 0.15 }}
    >
      <Card sx={cardSx}>
        <CardContent sx={{ py: 2 }}>
          <Typography sx={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: '#94a3b8', textTransform: 'uppercase' }}>
            Price Target
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
            <Box sx={{
              width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              bgcolor: isDown ? 'rgba(220,38,38,0.08)' : 'rgba(22,163,74,0.08)',
            }}>
              {isDown ? <TrendingDownIcon sx={{ color: moveColor, fontSize: 18 }} />
                      : <TrendingUpIcon sx={{ color: moveColor, fontSize: 18 }} />}
            </Box>
            <Typography sx={{ fontWeight: 700, color: moveColor, fontSize: 18, fontFamily: '"JetBrains Mono", monospace' }}>
              <CountUp value={prediction.primary_target} prefix="₹" duration={800} />
            </Typography>
            <Chip label={`${Number(pct) > 0 ? '+' : ''}${pct}%`} size="small"
              sx={{ bgcolor: isDown ? 'rgba(220,38,38,0.08)' : 'rgba(22,163,74,0.08)', color: moveColor, fontWeight: 700, fontSize: 11 }} />
          </Box>
          {prediction.primary_stop != null && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5 }}>
              <ShieldIcon sx={{ color: '#d97706', fontSize: 18 }} />
              <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>Stop:</Typography>
              <Typography sx={{ fontWeight: 700, color: '#d97706', fontSize: 14, fontFamily: '"JetBrains Mono", monospace' }}>
                <CountUp value={prediction.primary_stop} prefix="₹" duration={800} />
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────
// REGIME CARD
// ─────────────────────────────────────────────────────
function RegimeCard({ regime }) {
  const config = {
    'Calm':     { color: '#16a34a', pulse: false },
    'Elevated': { color: '#d97706', pulse: true },
    'Crisis':   { color: '#dc2626', pulse: true },
  };
  const c = config[regime] || config['Calm'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 220, damping: 20, delay: 0.3 }}
    >
      <Card sx={cardSx}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
          <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {c.pulse && (
              <motion.div
                animate={{ scale: [1, 2.2, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ repeat: Infinity, duration: 1.6 }}
                style={{
                  position: 'absolute', width: 24, height: 24, borderRadius: '50%',
                  background: `radial-gradient(circle, ${c.color}40 0%, transparent 70%)`,
                }}
              />
            )}
            <FiberManualRecordIcon sx={{ fontSize: 14, color: c.color, filter: `drop-shadow(0 0 4px ${c.color})` }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: '#94a3b8', textTransform: 'uppercase' }}>
              Regime
            </Typography>
            <Typography sx={{ fontSize: 18, fontWeight: 800, color: c.color }}>
              {regime}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────
// HORIZON MATRIX
// ─────────────────────────────────────────────────────
function HorizonMatrix({ horizonSignals={} }) {
  const horizons = Object.entries(horizonSignals);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 220, damping: 20, delay: 0.45 }}
    >
      <Card sx={cardSx}>
        <CardContent sx={{ py: 2 }}>
          <Typography sx={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: '#94a3b8', textTransform: 'uppercase', mb: 1.5 }}>
            Horizon Matrix
          </Typography>
          {horizons.map(([key, data], i) => {
            const sig = data.signal || 0;
            const sc = signalColors[sig];
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.08, type: 'spring', stiffness: 200 }}
              >
                <Box sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  py: 1, borderBottom: i < horizons.length - 1 ? '1px solid #f3f4f6' : 'none',
                }}>
                  <Typography sx={{ fontSize: 11, color: '#94a3b8', width: 64, flexShrink: 0, fontWeight: 500 }}>
                    {data.horizon_label || key}
                  </Typography>
                  <Chip label={signalLabels[sig]} size="small"
                    sx={{
                      bgcolor: `${sc}14`, color: sc, fontWeight: 700,
                      fontSize: 10, height: 22, minWidth: 50, border: `1px solid ${sc}30`,
                    }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <LinearProgress variant="determinate" value={(data.confidence || 0) * 100}
                      sx={{
                        height: 4, borderRadius: 2, bgcolor: '#f3f4f6',
                        '& .MuiLinearProgress-bar': { bgcolor: sc, borderRadius: 2 },
                      }}
                    />
                  </Box>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: sc, fontFamily: '"JetBrains Mono", monospace', width: 72, textAlign: 'right' }}>
                    {data.target_price != null ? `₹${data.target_price}` : '—'}
                  </Typography>
                </Box>
              </motion.div>
            );
          })}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ═════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═════════════════════════════════════════════════════
const DEFAULT_WATCHLIST = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK'];

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [symbol, setSymbol] = useState('RELIANCE');
  const [currentSymbol, setCurrentSymbol] = useState('');
  const [watchlist, setWatchlist] = useState(DEFAULT_WATCHLIST);
  const [prediction, setPrediction] = useState(null);
  const [predLoading, setPredLoading] = useState(false);
  const [predError, setPredError] = useState('');
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [flashWatchlist, setFlashWatchlist] = useState(false);
  const [chartKey, setChartKey] = useState(0);
  const [watchlistDrawerOpen, setWatchlistDrawerOpen] = useState(false);


  useEffect(() => {
    if (location.state?.symbol) {
      setSymbol(location.state.symbol);
      setPrediction(null);
    }
  }, [location.state]);

  
  const [fundamentalOpen, setFundamentalOpen] = useState(false);
  const [fundamentalLoading, setFundamentalLoading] = useState(false);
  const [fundamentalData, setFundamentalData] = useState(null);
  const [fundamentalSymbol, setFundamentalSymbol] = useState('');
  const [fundamentalError, setFundamentalError] = useState('');


  useEffect(() => {
    let cancelled = false;
    const fetchChart = async () => {
      setLoading(true);
      setStockData(null);
      try {
        const res = await axios.get(`${API}/chart/${symbol}`);
        if (cancelled) return;
        const data = res.data;
        const points = (data.candles || []).map((c) => ({
          date: c.date,
          price: c.close,
          open: c.open,
          high: c.high,
          low: c.low,
          volume: c.volume,
        }));
        setStockData({
          points,
          latest: data.latest,
          change: data.change,
          changePct: data.changePct,
          high52w: data.high52w,
          low52w: data.low52w,
        });
        setChartKey((k) => k + 1);
      } catch {
        setStockData({ points: [], latest: 0, change: 0, changePct: 0 });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchChart();
    return () => { cancelled = true; };
  }, [symbol]);

  const handleAnalyse = async () => {
    setPredLoading(true);
    setPredError('');
    setPrediction(null);
    setFlashWatchlist(true);
    setTimeout(() => setFlashWatchlist(false), 500);

    try {
      const [chartRes, predRes] = await Promise.all([
        axios.get(`${API}/chart/${symbol}`),
        axios.get(`${API}/predict/${symbol}`),
      ]);

      const chartData = chartRes.data;
      const points = (chartData.candles || []).map((c) => ({
        date: c.date,
        price: c.close,
        open: c.open,
        high: c.high,
        low: c.low,
        volume: c.volume,
      }));
      setStockData({
        points,
        latest: chartData.latest,
        change: chartData.change,
        changePct: chartData.changePct,
        high52w: chartData.high52w,
        low52w: chartData.low52w,
      });
      setChartKey((k) => k + 1);
      setPrediction(predRes.data);
      setCurrentSymbol(symbol);
    } catch (e) {
      setPredError(e.response?.data?.detail || 'Analysis failed.');
    } finally {
      setPredLoading(false);
    }
  };

  const points = stockData?.points || [];
  const lastPoint = points.length > 0 ? points[points.length - 1] : null;
  const isUp = (stockData?.changePct || 0) >= 0;
  const fmtVol = (v) => v >= 1e7 ? `${(v / 1e7).toFixed(2)} Cr`
    : v >= 1e5 ? `${(v / 1e5).toFixed(2)} L` : (v || 0).toLocaleString('en-IN');


  const handleOpenAnalysis = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    const symbol = String(currentSymbol || '').trim();

    if (!symbol) {
      console.warn('Deep Analysis navigation blocked: currentSymbol missing');
      return;
    }

    console.log('Navigating to analysis:', symbol);
    navigate(`/analysis/${encodeURIComponent(symbol)}`, {
      state: {
        from: location.pathname,
        fromLabel: 'Dashboard',
      },
    });
  };

  const handleRemoveFromWatchlist = (symToRemove) => {
    setWatchlist((prev) => {
      if (prev.length === 1) return prev;
      const next = prev.filter((sym) => sym !== symToRemove);

      if (symbol === symToRemove) {
        setSymbol(next[0] || '');
        setPrediction(null);
      }
      if (currentSymbol === symToRemove) {
        setCurrentSymbol('');
      }

      return next;
    });
  };

  const handleOpenFundamentals = async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    const cleanSymbol = String(currentSymbol || '').trim();
    if (!cleanSymbol) return;

    setFundamentalOpen(true);
    setFundamentalLoading(true);
    setFundamentalData(null);
    setFundamentalSymbol(cleanSymbol);
    setFundamentalError('');

    try {
      const url = `${API}/fundamentals/${encodeURIComponent(cleanSymbol)}`;
      console.log('Fetching fundamentals from:', url);

      const res = await fetch(url);
      console.log('Fundamentals status:', res.status);

      if (!res.ok) {
        throw new Error(`Fundamentals HTTP ${res.status}`);
      }

      const data = await res.json();
      console.log('Fundamentals payload:', data);

      setFundamentalData(data);
      setFundamentalError('');
    } catch (err) {
      console.error('Failed to load fundamentals', err);
      setFundamentalData(null);
      setFundamentalError(err?.message || 'Failed to load fundamentals');
    } finally {
      setFundamentalLoading(false);
    }
  };

  return (
    <motion.div variants={pageEntry} initial="hidden" animate="show">
      <Box sx={{ display: 'flex', flex: 1, gap: { xs: 1.5, sm: 2, md: 2 }, p: { xs: 1.5, sm: 2, md: 2 }, minHeight: 'calc(100vh - 90px)', flexDirection: { xs: 'column', md: 'row' }, overflowX: 'hidden' }}>

        {/* ═══ LEFT PANEL — Watchlist ═══ */}
        <Box
          component={motion.div}
          variants={slideUp}
          sx={{ display: { xs: 'none', md: 'flex' }, flexShrink: 0, width: 220 }}
        >
            <Watchlist
              symbols={watchlist}
              activeSymbol={symbol}
              onSelect={(s) => { setSymbol(s); setPrediction(null); }}
              onAdd={(s) => setWatchlist((prev) => [...prev, s])}
              onRemove={handleRemoveFromWatchlist}
              flash={flashWatchlist}
            />
        </Box>

        {/* ═══ CENTER PANEL — Chart ═══ */}
        <motion.div variants={slideUp} style={{ flex: 1, minWidth: 0 }}>
          <Card sx={{ ...cardSx, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

              {/* Mobile: Watchlist toggle */}
              {isMobile && (
                <Box sx={{ mb: 1.5 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<ViewListIcon />}
                    onClick={() => setWatchlistDrawerOpen(true)}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', borderColor: '#1976d2', color: '#1976d2' }}
                  >
                    Watchlist
                  </Button>
                </Box>
              )}

              {/* Header */}
              <motion.div variants={slideDown}>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: { xs: 1, sm: 1.5 }, mb: { xs: 1.5, md: 2 }, flexWrap: 'wrap' }}>
                  <Typography sx={{ fontSize: { xs: '1.3rem', sm: '1.6rem', md: '1.75rem' }, fontWeight: 800, color: '#0f172a' }}>
                    {symbol}
                  </Typography>
                  {stockData && stockData.latest > 0 && (
                    <>
                      <Typography sx={{ fontSize: { xs: '1.1rem', sm: '1.4rem', md: '1.75rem' }, fontWeight: 700, color: '#0f172a', fontFamily: '"JetBrains Mono", monospace' }}>
                        <CountUp value={stockData.latest} prefix="₹" duration={800} />
                      </Typography>
                      <Typography sx={{ fontSize: { xs: '0.85rem', sm: '1rem', md: '0.95rem' }, fontWeight: 600, color: isUp ? '#16a34a' : '#dc2626' }}>
                        {isUp ? '+' : ''}{stockData.change} ({isUp ? '+' : ''}{stockData.changePct}%)
                      </Typography>
                    </>
                  )}
                </Box>
              </motion.div>

              {/* Chart */}
              <Box sx={{ flex: 1 }}>
                <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.div
                      key="skeleton"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ repeat: 3, duration: 0.6 }}
                      exit={{ opacity: 0 }}
                    >
                      <Skeleton variant="rounded" height={320} sx={{ borderRadius: 2, bgcolor: '#f3f4f6' }} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key={`chart-${chartKey}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <PriceChart chartData={points} isUp={isUp} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Box>

              {/* Metric boxes */}
              {lastPoint && (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: { xs: 1, sm: 1.5 }, mt: { xs: 1.5, md: 2 } }}>
                  <MetricBox label="Open" value={`₹${lastPoint.open}`} delay={0} />
                  <MetricBox label="High" value={`₹${lastPoint.high}`} delay={0.05} />
                  <MetricBox label="Low" value={`₹${lastPoint.low}`} delay={0.1} />
                  <MetricBox label="Volume" value={fmtVol(lastPoint.volume)} delay={0.15} />
                </Box>
              )}

              {/* Deep Analysis Button */}
              {currentSymbol && (
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<BarChartIcon />}
                    onClick={handleOpenAnalysis}
                    disabled={!currentSymbol}
                    sx={{
                      background: 'linear-gradient(135deg, #1976d2, #0d47a1)',
                      borderRadius: 3,
                      px: 4,
                      py: 1.5,
                      fontWeight: 700,
                      fontSize: '1rem',
                      boxShadow: '0 4px 20px rgba(25,118,210,0.4)',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 28px rgba(25,118,210,0.5)',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Deep Analysis &rarr;
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ═══ RIGHT PANEL — Prediction ═══ */}
        <Box
          component={motion.div}
          variants={slideUp}
          sx={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '12px', width: { xs: '100%', md: 320 } }}
        >

          {/* Analyse button */}
          <Button
            variant="contained" fullWidth onClick={handleAnalyse} disabled={predLoading}
            sx={{
              height: 48, fontWeight: 700, fontSize: 15,
              background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
              boxShadow: '0 4px 16px rgba(25,118,210,0.25)',
              color: '#fff',
              '&:hover': {
                background: 'linear-gradient(135deg, #1e88e5 0%, #1976d2 100%)',
                boxShadow: '0 6px 24px rgba(25,118,210,0.35)',
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            {predLoading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : `ANALYSE ${symbol}`}
          </Button>

          {/* Error */}
          <AnimatePresence>
            {predError && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)' }}>
                  <Typography sx={{ color: '#dc2626', fontSize: 13 }}>{predError}</Typography>
                </Box>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Loading skeletons */}
          {predLoading && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {[140, 100, 80].map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                >
                  <Skeleton variant="rounded" height={h} sx={{ borderRadius: 3, bgcolor: '#f3f4f6' }} />
                </motion.div>
              ))}
            </Box>
          )}

          {/* Prediction cards — staggered from bottom */}
          <AnimatePresence>
            
            {prediction && !predLoading && (
              <motion.div
                key={prediction.symbol + prediction.timestamp}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                <SignalCard prediction={prediction} onOpenAnalysis={handleOpenAnalysis} onOpenFundamentals={handleOpenFundamentals} currentSymbol={currentSymbol} />
                <PriceTargetCard prediction={prediction} />
                <RegimeCard regime={prediction.regime} />
                <HorizonMatrix horizonSignals={prediction.horizon_signals} />
              </motion.div>
              
            )}
            
          </AnimatePresence>

          {/* Empty state */}
          {!prediction && !predLoading && !predError && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              style={{ flex: 1, display: 'flex' }}
            >
              <Card sx={{
                ...cardSx, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px dashed #d1d5db',
              }}>
                <Typography sx={{ color: '#94a3b8', fontSize: 14, textAlign: 'center', px: 3 }}>
                  Click <b>ANALYSE</b> to predict {symbol}
                </Typography>
              </Card>
            </motion.div>
          )}
        </Box>

      </Box>

      {/* ═══ FUNDAMENTALS OVERLAY DIALOG ═══ */}
      <Dialog
        open={fundamentalOpen}
        onClose={() => setFundamentalOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #e5e7eb',
            pb: 1.5,
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {fundamentalSymbol} Quick Fundamentals
            </Typography>
            <Typography variant="body2" sx={{ color: '#6b7280' }}>
              Compact snapshot for traders
            </Typography>
          </Box>

          <IconButton onClick={() => setFundamentalOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 2.5, bgcolor: '#f8fafc' }}>
          {fundamentalLoading ? (
            <Box sx={{ py: 5, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress size={28} />
            </Box>
          ) : fundamentalData ? (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #e5e7eb', bgcolor: '#fff' }}>
                  <Typography variant="caption" sx={{ color: '#6b7280' }}>Market Cap</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    {fundamentalData.market_cap || '—'}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={6}>
                <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #e5e7eb', bgcolor: '#fff' }}>
                  <Typography variant="caption" sx={{ color: '#6b7280' }}>P/E</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    {fundamentalData.pe_ratio ?? '—'}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={6}>
                <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #e5e7eb', bgcolor: '#fff' }}>
                  <Typography variant="caption" sx={{ color: '#6b7280' }}>ROE</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    {fundamentalData.roe ?? '—'}%
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={6}>
                <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #e5e7eb', bgcolor: '#fff' }}>
                  <Typography variant="caption" sx={{ color: '#6b7280' }}>Debt / Equity</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    {fundamentalData.debt_to_equity ?? '—'}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={6}>
                <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #e5e7eb', bgcolor: '#fff' }}>
                  <Typography variant="caption" sx={{ color: '#6b7280' }}>EPS Growth</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    {fundamentalData.eps_growth ?? '—'}%
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={6}>
                <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #e5e7eb', bgcolor: '#fff' }}>
                  <Typography variant="caption" sx={{ color: '#6b7280' }}>Dividend Yield</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    {fundamentalData.dividend_yield ?? '—'}%
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip size="small" label={`Sector: ${fundamentalData.sector || '—'}`} />
                  <Chip size="small" label={`52W High: ${fundamentalData.high_52w || '—'}`} />
                  <Chip size="small" label={`52W Low: ${fundamentalData.low_52w || '—'}`} />
                </Stack>
              </Grid>
            </Grid>
          ) : (
            <Box sx={{ py: 3 }}>
              <Typography variant="body2" sx={{ color: '#dc2626', fontWeight: 600 }}>
                Fundamentals unavailable right now
              </Typography>
              <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mt: 0.5 }}>
                {fundamentalError || 'No response from backend endpoint.'}
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ MOBILE WATCHLIST DRAWER ═══ */}
      <Drawer
        anchor="left"
        open={watchlistDrawerOpen}
        onClose={() => setWatchlistDrawerOpen(false)}
        sx={{ display: { md: 'none' }, '& .MuiDrawer-paper': { width: 260, p: 0 } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, pt: 1.5, pb: 0.5 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#1976d2' }}>
            Watchlist
          </Typography>
          <IconButton size="small" onClick={() => setWatchlistDrawerOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <Watchlist
          symbols={watchlist}
          activeSymbol={symbol}
          onSelect={(s) => { setSymbol(s); setPrediction(null); setWatchlistDrawerOpen(false); }}
          onAdd={(s) => setWatchlist((prev) => [...prev, s])}
          onRemove={handleRemoveFromWatchlist}
          flash={flashWatchlist}
        />
      </Drawer>

    </motion.div>
  );
}

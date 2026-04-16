import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  ComposedChart, Area, Line, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Cell,
} from 'recharts';
import {
  Box, Typography, Chip, IconButton,
  Tabs, Tab, Divider, LinearProgress, Paper, Grid, Stack,
} from '@mui/material';
import { HashLoader } from 'react-spinners';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import NewsMarquee from '../components/features/NewsMarquee';

const API = import.meta.env.VITE_API_URL || '';

const signalColor = (s) => s === 1 ? '#16a34a' : s === -1 ? '#dc2626' : '#d97706';
const signalLabel = (s) => s === 1 ? 'BUY' : s === -1 ? 'SELL' : 'HOLD';

// ═══════════════════════════════════════════════════════
export default function DeepAnalysis() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [candles, setCandles] = useState([]);
  const [meta, setMeta] = useState(null);
  const [predData, setPredData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [overlays, setOverlays] = useState(['bb']);

  // ── Back navigation handler ──
  const backPath = location.state?.from || null;
  const backLabel = location.state?.fromLabel || 'Back';

  const handleBack = () => {
    if (backPath) {
      navigate(backPath, { replace: true });
      return;
    }

    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
      return;
    }

    navigate('/portfolio', { replace: true });
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      axios.get(`${API}/chart/${symbol}`),
      axios.get(`${API}/predict/${symbol}`),
    ]).then(([chartRes, predRes]) => {
      setCandles(chartRes.data.candles || []);
      setMeta(chartRes.data);
      setPredData(predRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [symbol]);

  const toggleOverlay = useCallback((key) => {
    setOverlays((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }, []);

  const isUp = meta && meta.changePct >= 0;
  const priceColor = isUp ? '#16a34a' : '#dc2626';
  const ind = predData?.indicators || {};
  const fmtVol = (v) => v >= 1e7 ? `${(v / 1e7).toFixed(2)} Cr` : v >= 1e5 ? `${(v / 1e5).toFixed(1)}L` : (v || 0).toLocaleString('en-IN');

  //Custom Tooltip
  const ChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    if (!d) return null;
    return (
      <Box sx={{
        background: '#ffffff', color: '#0f172a',
        border: '1px solid #e5e7eb', borderRadius: 2,
        p: 1.5, minWidth: 180, fontSize: 12, lineHeight: 1.8,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      }}>
        <Typography sx={{ fontSize: 11, color: '#64748b', mb: 0.5 }}>{label}</Typography>
        <Box>Close: <b style={{ color: priceColor }}>₹{d.close?.toLocaleString('en-IN')}</b></Box>
        <Box>Open: ₹{d.open?.toLocaleString('en-IN')}</Box>
        <Box>High: ₹{d.high?.toLocaleString('en-IN')}</Box>
        <Box>Low: ₹{d.low?.toLocaleString('en-IN')}</Box>
        {overlays.includes('bb') && d.bb_upper && (<>
          <Divider sx={{ my: 0.5, borderColor: '#e5e7eb' }} />
          <Box sx={{ color: '#6366f1' }}>
            BB Upper: ₹{d.bb_upper?.toLocaleString('en-IN')}<br />
            BB Mid: ₹{d.bb_mid?.toLocaleString('en-IN')}<br />
            BB Lower: ₹{d.bb_lower?.toLocaleString('en-IN')}
          </Box>
        </>)}
        {overlays.includes('rsi') && d.rsi && (
          <Box sx={{ color: '#f59e0b', mt: 0.5 }}>RSI: {d.rsi}</Box>
        )}
      </Box>
    );
  };

  
  if (loading) {
    return (
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', flexDirection: 'column', gap: 2, bgcolor: '#f3f4f6',
      }}>
        <HashLoader color="#4361EE" size={46} speedMultiplier={1.2} />
        <Typography sx={{ color: '#64748b' }}>Loading {symbol} analysis...</Typography>
      </Box>
    );
  }

  const chartMargin = { top: 10, right: 40, left: 0, bottom: 0 };
  const priceH = 380;
  const lastCandle = candles.length > 0 ? candles[candles.length - 1] : null;

  //Overlay toggle config
  const overlayOpts = [
    { key: 'bb', label: 'BB Bands', color: '#6366f1' },
    { key: 'rsi', label: 'RSI', color: '#f59e0b' },
    { key: 'macd', label: 'MACD', color: '#3b82f6' },
    { key: 'volume', label: 'Volume', color: '#22c55e' },
  ];

  //Horizon entries
  const horizons = predData ? Object.entries(predData.horizon_signals || {}) : [];

  
  const sigCounts = { buy: 0, hold: 0, sell: 0 };
  horizons.forEach(([, d]) => {
    if (d.signal === 1) sigCounts.buy++;
    else if (d.signal === -1) sigCounts.sell++;
    else sigCounts.hold++;
  });

  //Card style shorthand
  const card = { bgcolor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 2 };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <Box sx={{ bgcolor: '#f3f4f6', minHeight: '100vh' }}>

        {/* ═══ HEADER ═══ */}
        <Paper elevation={1} sx={{
          display: 'flex', alignItems: 'center', px: { xs: 1.5, sm: 2, md: 3 }, py: { xs: 1.5, sm: 2 }, gap: { xs: 1, sm: 2 },
          borderRadius: 0, flexWrap: 'wrap', bgcolor: '#ffffff',
        }}>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <IconButton
              onClick={handleBack}
              size="small"
              sx={{
                bgcolor: '#ffffff',
                border: '1px solid #e5e7eb',
                '&:hover': { bgcolor: '#f8fafc' },
              }}
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500, fontSize: { xs: '0.75rem', sm: '0.85rem' } }}>
              {backLabel}
            </Typography>
          </Stack>
          <Typography sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem', md: '1.75rem' }, fontWeight: 800, color: '#0f172a' }}>{symbol}</Typography>
          <Chip label="NSE" size="small" sx={{ bgcolor: '#f1f5f9', color: '#64748b', fontWeight: 600, fontSize: { xs: '0.65rem', sm: '0.75rem' } }} />
          <Box sx={{ flex: 1 }} />
          {meta && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 3 }} sx={{ width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: { xs: 1, sm: 1.5 } }}>
                <Typography sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem', md: '1.75rem' }, fontWeight: 700, color: '#0f172a', fontFamily: '"JetBrains Mono", monospace' }}>
                  ₹{meta.latest?.toLocaleString('en-IN')}
                </Typography>
                <Chip
                  icon={isUp ? <TrendingUpIcon sx={{ fontSize: 14, color: '#16a34a !important' }} /> : <TrendingDownIcon sx={{ fontSize: 14, color: '#dc2626 !important' }} />}
                  label={`${meta.changePct >= 0 ? '+' : ''}${meta.changePct}%`}
                  size="small"
                  sx={{ bgcolor: isUp ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)', color: priceColor, fontWeight: 700, fontSize: { xs: '0.75rem', sm: '0.85rem' }, border: 'none' }}
                />
              </Box>
              <Stack direction="row" spacing={{ xs: 1.5, sm: 3 }} sx={{ display: { xs: 'none', sm: 'flex' } }}>
                {[
                  { label: '52W High', value: `₹${meta.high52w?.toLocaleString('en-IN')}` },
                  { label: '52W Low', value: `₹${meta.low52w?.toLocaleString('en-IN')}` },
                  { label: 'Volume', value: lastCandle ? fmtVol(lastCandle.volume) : '—' },
                ].map((s) => (
                  <Box key={s.label} sx={{ textAlign: 'right' }}>
                    <Typography sx={{ fontSize: 9, color: '#94a3b8', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>{s.label}</Typography>
                    <Typography sx={{ fontSize: { xs: '0.85rem', sm: '0.95rem', md: '1rem' }, color: '#334155', fontFamily: '"JetBrains Mono", monospace', fontWeight: 600 }}>{s.value}</Typography>
                  </Box>
                ))}
              </Stack>
            </Stack>
          )}
        </Paper>

        {/* ═══ TABS ═══ */}
        <Box sx={{ borderBottom: '1px solid #e5e7eb', bgcolor: '#ffffff', overflowX: 'auto' }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile sx={{
            px: { xs: 1.5, sm: 2, md: 3 },
            '& .MuiTab-root': { color: '#64748b', textTransform: 'none', fontWeight: 600, fontSize: { xs: '0.8rem', sm: '0.9rem', md: '0.95rem' } },
            '& .Mui-selected': { color: '#0f172a' },
            '& .MuiTabs-indicator': { backgroundColor: '#1976d2' },
          }}>
            <Tab label="Price & Technicals" />
            <Tab label="ML Insights" />
            <Tab label="Risk & Regime" />
            <Tab label="News & Sentiment" />
          </Tabs>
        </Box>

        {/* ═══ TAB 0 — PRICE & TECHNICALS ═══ */}
        {activeTab === 0 && (
          <Box sx={{ px: { xs: 1.5, sm: 2, md: 3 }, pt: { xs: 1.5, sm: 2 }, pb: { xs: 2, md: 3 } }}>
            <Box id="analysis-overlay-controls" sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 }, mb: { xs: 1.5, md: 2 }, flexWrap: 'wrap' }}>
              <Typography sx={{ fontSize: { xs: '0.8rem', sm: '0.85rem', md: '0.9rem' }, color: '#64748b', mr: { xs: 0.5, sm: 1 } }}>Overlays:</Typography>
              {overlayOpts.map((o) => {
                const active = overlays.includes(o.key);
                return (
                  <Chip key={o.key} label={o.label} size="small" onClick={() => toggleOverlay(o.key)}
                    sx={active
                      ? { bgcolor: o.color, color: '#fff', fontWeight: 600, fontSize: { xs: '0.65rem', sm: '0.75rem' }, border: 'none', cursor: 'pointer' }
                      : { borderColor: '#cbd5e1', color: '#64748b', fontWeight: 600, fontSize: { xs: '0.65rem', sm: '0.75rem' }, cursor: 'pointer', bgcolor: 'transparent' }
                    }
                    variant={active ? 'filled' : 'outlined'}
                  />
                );
              })}
            </Box>

            
            <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, mb: { xs: 1.5, md: 2 }, borderRadius: 2, bgcolor: '#ffffff', border: '1px solid #e5e7eb' }} id="analysis-chart-container">
              <Typography variant="subtitle2" sx={{ color: '#0f172a', mb: 1, fontSize: { xs: '0.9rem', sm: '1rem' } }}>Price & Bands</Typography>
              <Box sx={{ height: { xs: 260, sm: 340, md: 420 } }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={candles} margin={chartMargin}>
                  <defs>
                    <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={priceColor} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={priceColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#e5e7eb" strokeDasharray="0" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false}
                    interval={Math.max(1, Math.floor(candles.length / 6))} tickFormatter={(d) => d?.slice(5)} />
                  <YAxis orientation="right" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false}
                    domain={['auto', 'auto']} tickFormatter={(v) => `₹${v.toLocaleString('en-IN')}`} width={60} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area dataKey="close" name="Price" stroke={priceColor} strokeWidth={2}
                    fill="url(#pg)" dot={false} animationDuration={1000} />
                  {overlays.includes('bb') && (<>
                    <Line dataKey="bb_upper" name="BB Upper" stroke="#6366f1" strokeWidth={1} strokeDasharray="4 2" dot={false} animationDuration={0} />
                    <Line dataKey="bb_mid" name="BB Mid" stroke="#818cf8" strokeWidth={1} strokeDasharray="2 2" dot={false} animationDuration={0} />
                    <Line dataKey="bb_lower" name="BB Lower" stroke="#6366f1" strokeWidth={1} strokeDasharray="4 2" dot={false} animationDuration={0} />
                  </>)}
                  </ComposedChart>
                </ResponsiveContainer>
              </Box>
            </Paper>

            
            {overlays.includes('rsi') && (
              <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 2, bgcolor: '#ffffff', border: '1px solid #e5e7eb' }}>
                <Typography variant="subtitle2" sx={{ color: '#f59e0b', mb: 1 }}>RSI (14)</Typography>
                <ResponsiveContainer width="100%" height={130}>
                  <ComposedChart data={candles} margin={chartMargin}>
                    <CartesianGrid stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="date" hide />
                    <YAxis orientation="right" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }}
                      tickLine={false} axisLine={false} ticks={[0, 30, 50, 70, 100]} width={60} />
                    <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1} />
                    <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="3 3" strokeWidth={1} />
                    <ReferenceLine y={50} stroke="#cbd5e1" strokeDasharray="2 2" strokeWidth={1} />
                    <Area dataKey="rsi" stroke="#f59e0b" fill="rgba(245,158,11,0.08)" strokeWidth={1.5} dot={false} animationDuration={0} />
                    <Tooltip content={({ active, payload }) =>
                      active && payload?.length ? (
                        <Box sx={{ background: '#ffffff', color: '#0f172a', border: '1px solid #e5e7eb', borderRadius: 1, p: 1, fontSize: 11, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                          RSI: <b style={{ color: '#f59e0b' }}>{payload[0]?.value}</b>
                        </Box>
                      ) : null
                    } />
                  </ComposedChart>
                </ResponsiveContainer>
              </Paper>
            )}

            
            {overlays.includes('macd') && (
              <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 2, bgcolor: '#ffffff', border: '1px solid #e5e7eb' }}>
                <Typography variant="subtitle2" sx={{ color: '#3b82f6', mb: 1 }}>MACD (12, 26, 9)</Typography>
                <ResponsiveContainer width="100%" height={130}>
                  <ComposedChart data={candles} margin={chartMargin}>
                    <CartesianGrid stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="date" hide />
                    <YAxis orientation="right" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false}
                      tickFormatter={(v) => v?.toFixed(0)} width={60} />
                    <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1} />
                    <Bar dataKey="macd_hist" animationDuration={0}>
                      {candles.map((c, i) => (
                        <Cell key={i} fill={(c.macd_hist ?? 0) >= 0 ? 'rgba(34,197,94,0.6)' : 'rgba(239,68,68,0.6)'} />
                      ))}
                    </Bar>
                    <Line dataKey="macd_line" stroke="#3b82f6" strokeWidth={1.5} dot={false} animationDuration={0} />
                    <Line dataKey="macd_signal" stroke="#f97316" strokeWidth={1.5} dot={false} animationDuration={0} />
                    <Tooltip content={({ active, payload }) =>
                      active && payload?.length ? (
                        <Box sx={{ background: '#ffffff', color: '#0f172a', border: '1px solid #e5e7eb', borderRadius: 1, p: 1, fontSize: 11, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                          MACD: <b style={{ color: '#3b82f6' }}>{payload.find((p) => p.dataKey === 'macd_line')?.value?.toFixed(2)}</b><br />
                          Signal: <b style={{ color: '#f97316' }}>{payload.find((p) => p.dataKey === 'macd_signal')?.value?.toFixed(2)}</b><br />
                          Hist: <b>{payload.find((p) => p.dataKey === 'macd_hist')?.value?.toFixed(2)}</b>
                        </Box>
                      ) : null
                    } />
                  </ComposedChart>
                </ResponsiveContainer>
              </Paper>
            )}

            
            {overlays.includes('volume') && (
              <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 2, bgcolor: '#ffffff', border: '1px solid #e5e7eb' }}>
                <Typography variant="subtitle2" sx={{ color: '#22c55e', mb: 1 }}>Volume</Typography>
                <ResponsiveContainer width="100%" height={100}>
                  <ComposedChart data={candles} margin={chartMargin}>
                    <XAxis dataKey="date" hide />
                    <YAxis orientation="right" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false}
                      tickFormatter={(v) => `${(v / 100000).toFixed(0)}L`} width={60} />
                    <Bar dataKey="volume" animationDuration={0}>
                      {candles.map((c, i) => (
                        <Cell key={i} fill={(c.close ?? 0) >= (c.open ?? 0) ? 'rgba(34,197,94,0.5)' : 'rgba(239,68,68,0.5)'} />
                      ))}
                    </Bar>
                  </ComposedChart>
                </ResponsiveContainer>
              </Paper>
            )}
          </Box>
        )}

        {/* ═══ TAB 1 — ML INSIGHTS ═══ */}
        {activeTab === 1 && predData && (
          <Box sx={{ px: { xs: 1.5, sm: 2, md: 3 }, py: { xs: 2, md: 3 } }}>

            
            <Box sx={{ ...card, p: { xs: 2, sm: 2.5, md: 3 }, mb: 3, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: { xs: 2, md: 3 } }}>
              
              <Box>
                <Typography sx={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: '#64748b', textTransform: 'uppercase', mb: 1 }}>Overall Signal</Typography>
                <Chip label={signalLabel(predData.signal)} sx={{
                  bgcolor: `${signalColor(predData.signal)}20`, color: signalColor(predData.signal),
                  fontWeight: 800, fontSize: 18, height: 40, px: 2, border: `2px solid ${signalColor(predData.signal)}`,
                }} />
                <Box sx={{ mt: 1.5 }}>
                  <Typography sx={{ fontSize: 11, color: '#64748b', mb: 0.5 }}>Confidence: {((predData.confidence ?? 0) * 100).toFixed(0)}%</Typography>
                  <LinearProgress variant="determinate" value={(predData.confidence ?? 0) * 100}
                    sx={{ height: 6, borderRadius: 3, bgcolor: '#e5e7eb', '& .MuiLinearProgress-bar': { bgcolor: signalColor(predData.signal), borderRadius: 3 } }} />
                </Box>
                <Typography sx={{ fontSize: 10, color: '#94a3b8', mt: 1 }}>Generated: {predData.timestamp}</Typography>
              </Box>
            
              <Box>
                <Typography sx={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: '#64748b', textTransform: 'uppercase', mb: 1 }}>Primary Target</Typography>
                <Typography sx={{ fontSize: 24, fontWeight: 800, color: '#0f172a', fontFamily: '"JetBrains Mono", monospace' }}>
                  ₹{predData.primary_target?.toLocaleString('en-IN')}
                </Typography>
                <Typography sx={{ fontSize: 11, color: '#64748b', mt: 0.5 }}>{predData.primary_horizon_label}</Typography>
                <Typography sx={{ fontSize: 11, color: '#d97706', mt: 0.5 }}>Stop Loss: ₹{predData.primary_stop?.toLocaleString('en-IN')}</Typography>
                <Typography sx={{ fontSize: 11, color: '#64748b', mt: 0.5 }}>
                  R/R Ratio: {(() => {
                    const reward = Math.abs((predData.primary_target ?? 0) - (meta?.latest ?? 0));
                    const risk = Math.abs((meta?.latest ?? 0) - (predData.primary_stop ?? 0));
                    return risk > 0 ? (reward / risk).toFixed(2) + 'x' : '—';
                  })()}
                </Typography>
              </Box>
             
              <Box>
                <Typography sx={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: '#64748b', textTransform: 'uppercase', mb: 1 }}>Market Regime</Typography>
                {(() => {
                  const r = predData.regime || 'Calm';
                  const rc = r === 'Calm' ? '#3b82f6' : r === 'Crisis' ? '#dc2626' : '#16a34a';
                  return <Chip label={r} sx={{ bgcolor: `${rc}15`, color: rc, fontWeight: 700, fontSize: 14, height: 32, border: `1px solid ${rc}` }} />;
                })()}
                <Typography sx={{ fontSize: 11, color: '#64748b', mt: 1.5 }}>India VIX: <b style={{ color: '#0f172a' }}>{ind.india_vix ?? '—'}</b></Typography>
                <Typography sx={{ fontSize: 11, color: '#64748b', mt: 0.5 }}>PCR Index: <b style={{ color: '#0f172a' }}>{ind.pcr_index ?? '—'}</b></Typography>
              </Box>
            </Box>

            
            <Typography sx={{ fontSize: 13, fontWeight: 800, color: '#0f172a', mb: 1.5 }}>Horizon Matrix</Typography>
            <Box id="analysis-signals-grid" sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
              {horizons.map(([key, data]) => {
                const sc = signalColor(data.signal ?? 0);
                return (
                  <Box key={key} sx={{
                    ...card, p: 2, flex: { xs: '1 1 calc(50% - 12px)', sm: 1 }, minWidth: { xs: 120, sm: 'auto' },
                    borderTop: `3px solid ${sc}`, textAlign: 'center',
                  }}>
                    <Typography sx={{ fontSize: 10, color: '#64748b', fontWeight: 600, mb: 1 }}>{data.horizon_label || key}</Typography>
                    <Chip label={signalLabel(data.signal ?? 0)} size="small" sx={{
                      bgcolor: `${sc}20`, color: sc, fontWeight: 700, fontSize: 12, height: 28, mb: 1, border: `1px solid ${sc}`,
                    }} />
                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: sc, fontFamily: '"JetBrains Mono", monospace' }}>
                      T: ₹{data.target_price ?? '—'}
                    </Typography>
                    {data.stop_loss != null && (
                      <Typography sx={{ fontSize: 10, color: '#94a3b8', mt: 0.25 }}>SL: ₹{data.stop_loss}</Typography>
                    )}
                  </Box>
                );
              })}
            </Box>

            
            <Box sx={{ mb: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Feature Intelligence Panel
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#6b7280' }}>
                    17 indicators across 4 signal groups — computed live from 42-feature ML pipeline
                  </Typography>
                </Box>
                <Chip label="42 Features Active" size="small"
                  sx={{ bgcolor: '#eff6ff', color: '#1d4ed8', fontWeight: 600 }} />
              </Stack>
            </Box>

          
            <Grid container spacing={2} sx={{ mb: 3 }}>

              
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid #e5e7eb', bgcolor: '#fff', height: '100%', boxShadow: 'none', outline: 'none' }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#f59e0b' }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Momentum</Typography>
                    {(() => {
                      const score = (
                        ((ind.rsi||50) < 30 ? 2 : (ind.rsi||50) > 70 ? -1 : 0) +
                        ((ind.mfi||50) < 20 ? 2 : (ind.mfi||50) > 80 ? -1 : 0) +
                        ((ind.momentum_20||0) > 0 ? 1 : -1) +
                        ((ind.momentum_50||0) > 0 ? 1 : -1)
                      );
                      const lbl = score >= 2 ? 'Oversold' : score <= -2 ? 'Overbought' : 'Neutral';
                      const clr = score >= 2 ? '#16a34a' : score <= -2 ? '#dc2626' : '#6b7280';
                      return <Chip size="small" label={lbl} sx={{ height: 22, fontSize: 11, fontWeight: 700, bgcolor: `${clr}18`, color: clr, border: `1px solid ${clr}40` }} />;
                    })()}
                  </Stack>

                  <Stack spacing={1.5}>
                  
                    <Box>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>RSI (14)</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: (ind.rsi||50) < 30 ? '#16a34a' : (ind.rsi||50) > 70 ? '#dc2626' : '#111827' }}>
                          {(ind.rsi||0).toFixed(1)}
                          {(ind.rsi||50) < 30 ? ' · Oversold' : (ind.rsi||50) > 70 ? ' · Overbought' : ' · Neutral'}
                        </Typography>
                      </Stack>
                      <Box sx={{ position: 'relative', height: 6, bgcolor: '#f1f5f9', borderRadius: 999 }}>
                        <Box sx={{ position: 'absolute', left: 0, top: 0, width: `${ind.rsi || 0}%`, height: '100%', borderRadius: 999, bgcolor: (ind.rsi||50) < 30 ? '#16a34a' : (ind.rsi||50) > 70 ? '#dc2626' : '#f59e0b', transition: 'width 0.8s ease' }} />
                        <Box sx={{ position: 'absolute', left: '30%', top: 0, bottom: 0, width: '1px', bgcolor: '#e2e8f0', zIndex: 1 }} />
                        <Box sx={{ position: 'absolute', left: '70%', top: 0, bottom: 0, width: '1px', bgcolor: '#e2e8f0', zIndex: 1 }} />
                      </Box>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: 10 }}>0</Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: 10 }}>30</Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: 10 }}>70</Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: 10 }}>100</Typography>
                      </Stack>
                    </Box>

                   
                    <Box>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>MFI (Money Flow)</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: (ind.mfi||50) < 20 ? '#16a34a' : (ind.mfi||50) > 80 ? '#dc2626' : '#111827' }}>
                          {(ind.mfi||0).toFixed(1)}
                          {(ind.mfi||50) < 20 ? ' · Oversold' : (ind.mfi||50) > 80 ? ' · Overbought' : ' · Neutral'}
                        </Typography>
                      </Stack>
                      <LinearProgress variant="determinate" value={ind.mfi || 0}
                        sx={{ height: 6, borderRadius: 999, bgcolor: '#f1f5f9',
                          '& .MuiLinearProgress-bar': { bgcolor: (ind.mfi||50) < 20 ? '#16a34a' : (ind.mfi||50) > 80 ? '#dc2626' : '#f59e0b', borderRadius: 999 },
                          '&.MuiLinearProgress-root': { backgroundColor: '#f1f5f9' }
                        }} />
                    </Box>

                    
                    <Stack direction="row" spacing={1.5}>
                      <Box sx={{ flex: 1, p: 1, bgcolor: '#f8fafc', borderRadius: 1.5, border: '1px solid #e5e7eb' }}>
                        <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>Mom 20d</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: (ind.momentum_20 || 0) > 0 ? '#16a34a' : '#dc2626' }}>
                          {((ind.momentum_20 || 0) * 100).toFixed(2)}%
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1, p: 1, bgcolor: '#f8fafc', borderRadius: 1.5, border: '1px solid #e5e7eb' }}>
                        <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>Mom 50d</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: (ind.momentum_50 || 0) > 0 ? '#16a34a' : '#dc2626' }}>
                          {((ind.momentum_50 || 0) * 100).toFixed(2)}%
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1, p: 1, bgcolor: '#f8fafc', borderRadius: 1.5, border: '1px solid #e5e7eb' }}>
                        <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>Fear/Greed</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: (ind.fear_greed||50) < 30 ? '#dc2626' : (ind.fear_greed||50) > 70 ? '#16a34a' : '#f59e0b' }}>
                          {(ind.fear_greed||0).toFixed(0)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Stack>
                </Paper>
              </Grid>

            
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid #e5e7eb', bgcolor: '#fff', height: '100%', boxShadow: 'none', outline: 'none' }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#6366f1' }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Volatility & Bands</Typography>
                    {(() => {
                      const bw = ind.bb_bandwidth || 0;
                      const vix = ind.india_vix || 15;
                      const lbl = vix > 25 || bw > 0.3 ? 'High Vol' : vix < 15 && bw < 0.15 ? 'Low Vol' : 'Normal';
                      const clr = vix > 25 || bw > 0.3 ? '#dc2626' : vix < 15 && bw < 0.15 ? '#16a34a' : '#6366f1';
                      return <Chip size="small" label={lbl} sx={{ height: 22, fontSize: 11, fontWeight: 700, bgcolor: `${clr}18`, color: clr, border: `1px solid ${clr}40` }} />;
                    })()}
                  </Stack>

                  <Stack spacing={1.5}>
               
                    <Box>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>BB %B (Position in Bands)</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: (ind.bb_pct_b||0.5) < 0.2 ? '#16a34a' : (ind.bb_pct_b||0.5) > 0.8 ? '#dc2626' : '#6366f1' }}>
                          {((ind.bb_pct_b||0) * 100).toFixed(1)}%
                          {(ind.bb_pct_b||0.5) < 0.2 ? ' · Near Lower' : (ind.bb_pct_b||0.5) > 0.8 ? ' · Near Upper' : ' · Mid'}
                        </Typography>
                      </Stack>
                      <Box sx={{ position: 'relative', height: 6, bgcolor: '#f1f5f9', borderRadius: 999 }}>
                        <Box sx={{ position: 'absolute', left: 0, top: 0, width: `${(ind.bb_pct_b||0)*100}%`, height: '100%', borderRadius: 999, bgcolor: (ind.bb_pct_b||0.5) < 0.2 ? '#16a34a' : (ind.bb_pct_b||0.5) > 0.8 ? '#dc2626' : '#6366f1', transition: 'width 0.8s ease' }} />
                      </Box>
                      <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: 10 }}>
                        Bandwidth: {(ind.bb_bandwidth||0).toFixed(3)} — wider = more volatile
                      </Typography>
                    </Box>

                   
                    <Stack direction="row" spacing={1.5}>
                      <Box sx={{ flex: 1, p: 1, bgcolor: '#f8fafc', borderRadius: 1.5, border: '1px solid #e5e7eb' }}>
                        <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>Hist Vol 20d</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: (ind.hvol_20d||0) > 0.3 ? '#dc2626' : (ind.hvol_20d||0) > 0.18 ? '#f59e0b' : '#16a34a' }}>
                          {((ind.hvol_20d||0) * 100).toFixed(1)}%
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: 10 }}>
                          {(ind.hvol_20d||0) > 0.3 ? 'Elevated' : (ind.hvol_20d||0) > 0.18 ? 'Normal' : 'Low'}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1, p: 1, bgcolor: '#f8fafc', borderRadius: 1.5, border: '1px solid #e5e7eb' }}>
                        <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>India VIX</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: (ind.india_vix||15) > 25 ? '#dc2626' : (ind.india_vix||15) > 18 ? '#f59e0b' : '#16a34a' }}>
                          {(ind.india_vix||0).toFixed(1)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: 10 }}>
                          {(ind.india_vix||15) > 25 ? 'Fear Zone' : (ind.india_vix||15) > 18 ? 'Watch' : 'Calm'}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1, p: 1, bgcolor: '#f8fafc', borderRadius: 1.5, border: '1px solid #e5e7eb' }}>
                        <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>ATR (14)</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {'\u20B9'}{(ind.atr||0).toFixed(2)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: 10 }}>Daily range est.</Typography>
                      </Box>
                    </Stack>
                  </Stack>
                </Paper>
              </Grid>

              
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid #e5e7eb', bgcolor: '#fff', height: '100%', boxShadow: 'none', outline: 'none' }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#3b82f6' }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Trend & Direction</Typography>
                    {(() => {
                      const hist = ind.macd_hist || 0;
                      const adx = ind.adx || 0;
                      let lbl, clr;
                      if (adx > 25 && hist > 0) { lbl = 'Strong Bull'; clr = '#16a34a'; }
                      else if (adx > 25 && hist < 0) { lbl = 'Strong Bear'; clr = '#dc2626'; }
                      else if (adx < 20) { lbl = 'No Trend'; clr = '#6b7280'; }
                      else { lbl = hist > 0 ? 'Mild Bull' : 'Mild Bear'; clr = hist > 0 ? '#22c55e' : '#f97316'; }
                      return <Chip size="small" label={lbl} sx={{ height: 22, fontSize: 11, fontWeight: 700, bgcolor: `${clr}18`, color: clr, border: `1px solid ${clr}40` }} />;
                    })()}
                  </Stack>

                  <Stack spacing={1.5}>
                    
                    <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 1.5, border: '1px solid #e5e7eb' }}>
                      <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600, mb: 1, display: 'block' }}>MACD (12, 26, 9)</Typography>
                      <Stack spacing={0.5}>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="caption" sx={{ color: '#3b82f6' }}>MACD Line</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#111827' }}>{(ind.macd||0).toFixed(2)}</Typography>
                        </Stack>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="caption" sx={{ color: '#f97316' }}>Signal Line</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#111827' }}>{(ind.macd_signal||0).toFixed(2)}</Typography>
                        </Stack>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="caption" sx={{ color: '#6b7280' }}>Histogram</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: (ind.macd_hist||0) > 0 ? '#16a34a' : '#dc2626' }}>
                            {(ind.macd_hist||0) > 0 ? '\u25B2' : '\u25BC'} {(ind.macd_hist||0).toFixed(3)}
                            {(ind.macd_hist||0) > 0 ? ' Bullish cross' : ' Bearish cross'}
                          </Typography>
                        </Stack>
                      </Stack>
                    </Box>

                    
                    <Box>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>ADX (Trend Strength)</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: (ind.adx||0) > 40 ? '#dc2626' : (ind.adx||0) > 25 ? '#f97316' : (ind.adx||0) > 15 ? '#3b82f6' : '#6b7280' }}>
                          {(ind.adx||0).toFixed(1)} —{' '}
                          {(ind.adx||0) < 15 ? 'Weak' : (ind.adx||0) < 25 ? 'Developing' : (ind.adx||0) < 40 ? 'Strong' : 'Very Strong'}
                        </Typography>
                      </Stack>
                      <LinearProgress variant="determinate" value={Math.min(ind.adx||0, 60) / 60 * 100}
                        sx={{ height: 6, borderRadius: 999, bgcolor: '#f1f5f9',
                          '& .MuiLinearProgress-bar': { bgcolor: (ind.adx||0) > 40 ? '#dc2626' : (ind.adx||0) > 25 ? '#f97316' : '#3b82f6', borderRadius: 999 },
                          '&.MuiLinearProgress-root': { backgroundColor: '#f1f5f9' }
                        }} />
                      <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: 10 }}>
                        {'>'}25 = Trending | {'<'}20 = Ranging | {'>'}40 = Strong
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>

              {/* ── GROUP 4: MARKET REGIME & FLOW ── */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid #e5e7eb', bgcolor: '#fff', height: '100%', boxShadow: 'none', outline: 'none' }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10b981' }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Market Regime & Flow</Typography>
                    {(() => {
                      const pcr = ind.pcr_index || 1;
                      const obv = ind.obv_zscore || 0;
                      const lbl = pcr > 1.2 && obv > 0.5 ? 'Bull Flow' : pcr < 0.8 && obv < -0.5 ? 'Bear Flow' : 'Mixed';
                      const clr = pcr > 1.2 && obv > 0.5 ? '#16a34a' : pcr < 0.8 && obv < -0.5 ? '#dc2626' : '#6b7280';
                      return <Chip size="small" label={lbl} sx={{ height: 22, fontSize: 11, fontWeight: 700, bgcolor: `${clr}18`, color: clr, border: `1px solid ${clr}40` }} />;
                    })()}
                  </Stack>

                  <Stack spacing={1.5}>
                    {/* OBV Z-score */}
                    <Box>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>OBV Z-Score (Volume Pressure)</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: (ind.obv_zscore||0) > 1 ? '#16a34a' : (ind.obv_zscore||0) < -1 ? '#dc2626' : '#6b7280' }}>
                          {(ind.obv_zscore||0).toFixed(2)}
                          {(ind.obv_zscore||0) > 1 ? ' · Buying pressure' : (ind.obv_zscore||0) < -1 ? ' · Selling pressure' : ' · Neutral'}
                        </Typography>
                      </Stack>
                      <Box sx={{ position: 'relative', height: 6, bgcolor: '#f1f5f9', borderRadius: 999 }}>
                        <Box sx={{ position: 'absolute', left: '50%', top: 0, width: `${Math.abs(ind.obv_zscore||0) * 10}%`, maxWidth: '50%', height: '100%', borderRadius: 999, transform: (ind.obv_zscore||0) > 0 ? 'none' : 'translateX(-100%)', bgcolor: (ind.obv_zscore||0) > 0 ? '#16a34a' : '#dc2626', transition: 'width 0.8s ease' }} />
                        <Box sx={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '1px', bgcolor: '#e2e8f0', zIndex: 1 }} />
                      </Box>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: 10 }}>Sell</Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: 10 }}>Neutral</Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: 10 }}>Buy</Typography>
                      </Stack>
                    </Box>

                    {/* PCR + Regime Score */}
                    <Stack direction="row" spacing={1.5}>
                      <Box sx={{ flex: 1, p: 1.5, bgcolor: '#f8fafc', borderRadius: 1.5, border: '1px solid #e5e7eb' }}>
                        <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>PCR Index</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: (ind.pcr_index||1) > 1.2 ? '#16a34a' : (ind.pcr_index||1) < 0.8 ? '#dc2626' : '#6b7280' }}>
                          {(ind.pcr_index||0).toFixed(2)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: 10 }}>
                          {(ind.pcr_index||1) > 1.2 ? 'Put heavy \u2192 Bullish reversal' : (ind.pcr_index||1) < 0.8 ? 'Call heavy \u2192 Bearish signal' : 'Balanced options flow'}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1, p: 1.5, bgcolor: '#f8fafc', borderRadius: 1.5, border: '1px solid #e5e7eb' }}>
                        <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>Regime Score</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: (ind.regime_score||0) > 0.6 ? '#dc2626' : (ind.regime_score||0) > 0.3 ? '#f59e0b' : '#16a34a' }}>
                          {((ind.regime_score||0) * 10).toFixed(1)}/10
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: 10 }}>
                          {(ind.regime_score||0) > 0.6 ? 'Stress/Volatile' : (ind.regime_score||0) > 0.3 ? 'Moderate tension' : 'Stable regime'}
                        </Typography>
                      </Box>
                    </Stack>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>

            {/* ── ML PIPELINE SUMMARY ── */}
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #e5e7eb', bgcolor: '#ffffff', boxShadow: 'none', outline: 'none' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>
                  Pipeline: 8 Feature Families
                </Typography>
                {[
                  { label: 'Price/Vol', color: '#3b82f6' },
                  { label: 'Momentum', color: '#f59e0b' },
                  { label: 'Volatility', color: '#6366f1' },
                  { label: 'Trend', color: '#3b82f6' },
                  { label: 'Mkt Regime', color: '#10b981' },
                  { label: 'Macro', color: '#f97316' },
                  { label: 'Sentiment', color: '#8b5cf6' },
                  { label: 'Options Flow', color: '#06b6d4' },
                ].map((f) => (
                  <Chip key={f.label} size="small" label={f.label}
                    sx={{ height: 22, fontSize: 11, bgcolor: `${f.color}12`, color: f.color, border: `1px solid ${f.color}30` }} />
                ))}
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  42 computed features {'\u2192'} ensemble model signal
                </Typography>
              </Stack>
            </Paper>
          </Box>
        )}

        {/* ═══ TAB 2 — RISK & REGIME ═══ */}
        {activeTab === 2 && predData && meta && (
          <Box sx={{ px: { xs: 1.5, sm: 2, md: 3 }, py: { xs: 2, md: 3 } }}>

            {/* ROW 1 — KPI boxes */}
            <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
              {(() => {
                const current = meta.latest ?? 0;
                const target = predData.primary_target ?? 0;
                const stop = predData.primary_stop ?? 0;
                const upside = current > 0 ? ((target - current) / current * 100).toFixed(2) : '0';
                const downside = current > 0 ? ((current - stop) / current * 100).toFixed(2) : '0';
                const reward = Math.abs(target - current);
                const risk = Math.abs(current - stop);
                const rr = risk > 0 ? (reward / risk).toFixed(2) : '—';
                const rrColor = rr !== '—' && Number(rr) > 2 ? '#22c55e' : rr !== '—' && Number(rr) > 1 ? '#f97316' : '#ef4444';
                return [
                  { label: 'Current Price', value: `₹${current.toLocaleString('en-IN')}`, sub: null, color: '#0f172a' },
                  { label: 'Primary Target', value: `₹${target.toLocaleString('en-IN')}`, sub: `${Number(upside) > 0 ? '+' : ''}${upside}% upside`, color: '#22c55e' },
                  { label: 'Stop Loss', value: `₹${stop.toLocaleString('en-IN')}`, sub: `${downside}% downside`, color: '#d97706' },
                  { label: 'Risk/Reward', value: rr !== '—' ? `1:${rr}` : '—', sub: null, color: rrColor },
                ].map((kpi) => (
                  <Box key={kpi.label} sx={{ ...card, p: { xs: 1.5, sm: 2, md: 2.5 }, flex: { xs: '1 1 calc(50% - 12px)', sm: 1 }, textAlign: 'center', minWidth: { xs: 120, sm: 'auto' } }}>
                    <Typography sx={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: '#94a3b8', textTransform: 'uppercase', mb: 1 }}>{kpi.label}</Typography>
                    <Typography sx={{ fontSize: 20, fontWeight: 800, color: kpi.color, fontFamily: '"JetBrains Mono", monospace' }}>{kpi.value}</Typography>
                    {kpi.sub && <Typography sx={{ fontSize: 10, color: '#64748b', mt: 0.5 }}>{kpi.sub}</Typography>}
                  </Box>
                ));
              })()}
            </Box>

            {/* ROW 2 — Horizon Risk Table */}
            <Typography sx={{ fontSize: 13, fontWeight: 800, color: '#0f172a', mb: 1 }}>All 5 Horizon Risk Table</Typography>
            <Box sx={{ ...card, overflow: 'hidden', mb: 3, overflowX: 'auto' }}>
              {/* Header */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 0.8fr 1fr 1fr 0.8fr 1fr', bgcolor: '#f8fafc', px: 2, py: 1, borderBottom: '1px solid #e5e7eb', minWidth: 600 }}>
                {['Horizon', 'Signal', 'Target', 'Stop Loss', 'R/R', 'Confidence'].map((h) => (
                  <Typography key={h} sx={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: 1, textTransform: 'uppercase' }}>{h}</Typography>
                ))}
              </Box>
              {/* Rows */}
              {horizons.map(([key, data], idx) => {
                const sc = signalColor(data.signal ?? 0);
                const target = data.target_price ?? 0;
                const stop = data.stop_loss ?? 0;
                const current = meta.latest ?? 0;
                const reward = Math.abs(target - current);
                const risk = Math.abs(current - stop);
                const rr = risk > 0 ? (reward / risk).toFixed(2) : '—';
                return (
                  <Box key={key} sx={{
                    display: 'grid', gridTemplateColumns: '1fr 0.8fr 1fr 1fr 0.8fr 1fr', minWidth: 600,
                    px: 2, py: 1.5, borderLeft: `4px solid ${sc}`,
                    bgcolor: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                    alignItems: 'center',
                    borderBottom: idx < horizons.length - 1 ? '1px solid #f1f5f9' : 'none',
                  }}>
                    <Typography sx={{ fontSize: 11, color: '#334155', fontWeight: 600 }}>{data.horizon_label || key}</Typography>
                    <Chip label={signalLabel(data.signal ?? 0)} size="small" sx={{ bgcolor: `${sc}15`, color: sc, fontWeight: 700, fontSize: 10, height: 22, border: `1px solid ${sc}`, width: 'fit-content' }} />
                    <Typography sx={{ fontSize: 11, color: '#0f172a', fontFamily: '"JetBrains Mono", monospace' }}>₹{target.toLocaleString('en-IN')}</Typography>
                    <Typography sx={{ fontSize: 11, color: '#d97706', fontFamily: '"JetBrains Mono", monospace' }}>{stop ? `₹${stop.toLocaleString('en-IN')}` : '—'}</Typography>
                    <Typography sx={{ fontSize: 11, color: '#64748b', fontFamily: '"JetBrains Mono", monospace' }}>{rr !== '—' ? `1:${rr}` : '—'}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress variant="determinate" value={(data.confidence ?? 0) * 100}
                        sx={{ flex: 1, height: 4, borderRadius: 2, bgcolor: '#e5e7eb', '& .MuiLinearProgress-bar': { bgcolor: sc, borderRadius: 2 } }} />
                      <Typography sx={{ fontSize: 10, color: '#64748b', fontFamily: '"JetBrains Mono", monospace', minWidth: 30 }}>
                        {((data.confidence ?? 0) * 100).toFixed(0)}%
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>

            {/* ROW 3 — Volatility / VIX / Regime Panel */}
            <Typography sx={{ fontSize: 13, fontWeight: 800, color: '#0f172a', mb: 1 }}>Volatility & Regime</Typography>
            <Box sx={{ ...card, p: { xs: 1.5, sm: 2, md: 2.5 } }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: { xs: 2, md: 3 } }}>
                {/* Historical Volatility */}
                <Box>
                  <Typography sx={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: '#64748b', textTransform: 'uppercase', mb: 0.5 }}>HVol 20D</Typography>
                  <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#0f172a', fontFamily: '"JetBrains Mono", monospace' }}>
                    {((ind.hvol_20d ?? 0) * 100).toFixed(2)}%
                  </Typography>
                  <Box sx={{ width: '100%', height: 5, borderRadius: 3, bgcolor: '#e5e7eb', mt: 1 }}>
                    <Box sx={{
                      width: `${Math.min(100, (ind.hvol_20d ?? 0) * 250)}%`, height: '100%', borderRadius: 3,
                      bgcolor: (ind.hvol_20d ?? 0) < 0.15 ? '#22c55e' : (ind.hvol_20d ?? 0) < 0.3 ? '#f97316' : '#ef4444',
                    }} />
                  </Box>
                  <Typography sx={{ fontSize: 9, color: '#94a3b8', mt: 0.5 }}>
                    {(ind.hvol_20d ?? 0) < 0.15 ? 'Low volatility' : (ind.hvol_20d ?? 0) < 0.3 ? 'Moderate volatility' : 'High volatility'}
                  </Typography>
                </Box>

                {/* India VIX */}
                <Box>
                  <Typography sx={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: '#64748b', textTransform: 'uppercase', mb: 0.5 }}>India VIX</Typography>
                  <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#0f172a', fontFamily: '"JetBrains Mono", monospace' }}>
                    {(ind.india_vix ?? 0).toFixed(1)}
                  </Typography>
                  <Box sx={{ width: '100%', height: 5, borderRadius: 3, bgcolor: '#e5e7eb', mt: 1 }}>
                    <Box sx={{
                      width: `${Math.min(100, (ind.india_vix ?? 0) * 2.5)}%`, height: '100%', borderRadius: 3,
                      bgcolor: (ind.india_vix ?? 0) < 15 ? '#22c55e' : (ind.india_vix ?? 0) < 22 ? '#f97316' : '#ef4444',
                    }} />
                  </Box>
                  <Typography sx={{ fontSize: 9, color: '#94a3b8', mt: 0.5 }}>
                    {(ind.india_vix ?? 0) < 15 ? 'Market calm' : (ind.india_vix ?? 0) < 22 ? 'Moderate fear' : 'Elevated fear'}
                  </Typography>
                </Box>

                {/* Regime Score */}
                <Box>
                  <Typography sx={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: '#64748b', textTransform: 'uppercase', mb: 0.5 }}>Regime Score</Typography>
                  {(() => {
                    const score = ind.regime_score ?? 0;
                    const cfg = score < 3 ? { c: '#22c55e', l: 'Stable' } : score < 6 ? { c: '#f97316', l: 'Transitional' } : { c: '#ef4444', l: 'Stressed' };
                    return (<>
                      <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#0f172a', fontFamily: '"JetBrains Mono", monospace' }}>
                        {score.toFixed(2)}
                      </Typography>
                      <Box sx={{ width: '100%', height: 5, borderRadius: 3, bgcolor: '#e5e7eb', mt: 1 }}>
                        <Box sx={{ width: `${Math.min(100, score * 10)}%`, height: '100%', borderRadius: 3, bgcolor: cfg.c }} />
                      </Box>
                      <Chip label={cfg.l} size="small" sx={{ bgcolor: `${cfg.c}15`, color: cfg.c, fontWeight: 700, fontSize: 9, height: 18, mt: 0.5, border: `1px solid ${cfg.c}` }} />
                    </>);
                  })()}
                </Box>
              </Box>
            </Box>
          </Box>
        )}

        {/* ═══ TAB 3 — NEWS & SENTIMENT ═══ */}
        {activeTab === 3 && (
          <Box sx={{ px: { xs: 2, md: 3 }, py: 3, overflow: 'hidden', maxWidth: '100%' }}>

            {/* SECTION A — Symbol Header */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
                {symbol} — News & Sentiment
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Macro news, qualitative sentiment and upcoming events.
              </Typography>
            </Box>

            {/* SECTION B+C — Sentiment + Event Radar (left) | Headlines (right) */}
            <Box sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: 3,
              overflow: 'hidden',
              width: '100%',
              alignItems: 'flex-start',
              mb: 4,
            }}>
              {/* LEFT — fixed 340px, does not grow */}
              <Box sx={{ width: { xs: '100%', md: 340 }, flexShrink: 0 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                  Sentiment Summary
                </Typography>
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid #e5e7eb', bgcolor: '#ffffff', mb: 3 }}>
                  <Stack spacing={2}>
                    {(() => {
                      const sentColor = (v) => v > 0.3 ? '#16a34a' : v > 0.05 ? '#22c55e' : v > -0.05 ? '#6b7280' : v > -0.3 ? '#f97316' : '#dc2626';
                      const sentLabel = (v) => v > 0.3 ? 'Strong Bullish' : v > 0.05 ? 'Bullish' : v > -0.05 ? 'Neutral' : v > -0.3 ? 'Bearish' : 'Strong Bearish';
                      return [
                        { label: 'Global Macro', value: 0.1 },
                        { label: 'India Equities', value: 0.2 },
                        { label: `${symbol} Narrative`, value: -0.15 },
                      ].map((row) => (
                        <Box key={row.label}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                            <Typography variant="body2" sx={{ color: '#334155', fontWeight: 500 }}>{row.label}</Typography>
                            <Chip label={sentLabel(row.value)} size="small" sx={{ height: 22, fontSize: 11, fontWeight: 600, bgcolor: `${sentColor(row.value)}15`, color: sentColor(row.value) }} />
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={50 + row.value * 50}
                            sx={{
                              height: 6, borderRadius: 999, bgcolor: '#e5e7eb',
                              '& .MuiLinearProgress-bar': { backgroundColor: sentColor(row.value), borderRadius: 999 },
                            }}
                          />
                        </Box>
                      ));
                    })()}
                  </Stack>
                </Paper>

                {/* Event Radar — moved into left column */}
                <Typography sx={{ fontSize: 13, fontWeight: 800, color: '#0f172a', mb: 0.5 }}>Event Radar (Next 30–60 days)</Typography>
                <Typography variant="body2" sx={{ color: '#64748b', mb: 1.5 }}>
                  Macro releases and scheduled events that can move this name.
                </Typography>
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid #e5e7eb', bgcolor: '#ffffff' }}>
                  <Stack spacing={1.5} divider={<Divider sx={{ borderColor: '#f1f5f9' }} />}>
                    {[
                      { date: '15 Mar', label: 'US Fed Meeting (FOMC)', type: 'Central Bank', riskLevel: 'High' },
                      { date: '28 Mar', label: 'India CPI Inflation Data', type: 'Macro', riskLevel: 'Medium' },
                      { date: '10 Apr', label: `${symbol} Q4 Earnings`, type: 'Earnings', riskLevel: 'High' },
                      { date: '22 Apr', label: 'RBI Monetary Policy Review', type: 'Central Bank', riskLevel: 'Medium' },
                    ].map((evt, i) => {
                      const riskColor = evt.riskLevel === 'High' ? '#dc2626' : evt.riskLevel === 'Medium' ? '#d97706' : '#16a34a';
                      const typeColor = evt.type === 'Earnings' ? '#7c3aed' : evt.type === 'Central Bank' ? '#0369a1' : '#2563eb';
                      return (
                        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box sx={{
                            minWidth: 56, textAlign: 'center', py: 0.75, px: 1,
                            borderRadius: 1.5, bgcolor: '#f1f5f9',
                          }}>
                            <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>{evt.date}</Typography>
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>{evt.label}</Typography>
                            <Typography variant="caption" sx={{ color: typeColor }}>{evt.type}</Typography>
                          </Box>
                          <Chip label={evt.riskLevel} size="small" sx={{
                            height: 22, fontSize: 11, fontWeight: 600,
                            bgcolor: `${riskColor}15`, color: riskColor, border: `1px solid ${riskColor}30`,
                          }} />
                        </Box>
                      );
                    })}
                  </Stack>
                </Paper>
              </Box>

              {/* RIGHT — takes remaining space */}
              <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Top Headlines
                </Typography>
                <Typography variant="caption" sx={{ color: '#6b7280', mb: 1.5, display: 'block' }}>
                  Hover to pause &bull; Drag to scroll
                </Typography>
                <NewsMarquee symbol={symbol} />
              </Box>
            </Box>

          </Box>
        )}

      </Box>
    </motion.div>
  );
}

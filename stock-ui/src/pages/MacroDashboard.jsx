import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Chip,
  Stack,
  Divider,
  LinearProgress,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { HashLoader } from 'react-spinners';
import PublicIcon from '@mui/icons-material/Public';
import InsightsIcon from '@mui/icons-material/Insights';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PsychologyIcon from '@mui/icons-material/Psychology';
import TodayIcon from '@mui/icons-material/Today';
import ShowChartIcon from '@mui/icons-material/ShowChart';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

const API = import.meta.env.VITE_API_URL || '';

// No free public data source exists for these three yet — shown as
// explicitly illustrative rather than presented as live figures.
const ILLUSTRATIVE_RISK = { creditSpread: 1.3, liquidityScore: 7.2 };

const HORIZON_TO_PERIOD = { '1M': '1mo', '3M': '3mo', '6M': '6mo' };

const MacroDashboard = () => {
  const [horizon, setHorizon] = useState('3M');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    axios.get(`${API}/macro/overview`, { params: { horizon: HORIZON_TO_PERIOD[horizon] }, timeout: 20000 })
      .then((res) => { if (!cancelled) setData(res.data); })
      .catch(() => { if (!cancelled) setError('Could not load macro data. Backend may be offline or waking up.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [horizon]);

  const sentimentColor = (s) => {
    if (s == null) return '#94a3b8';
    if (s > 0.3) return '#16a34a';
    if (s > 0.05) return '#22c55e';
    if (s > -0.05) return '#6b7280';
    if (s > -0.3) return '#f97316';
    return '#dc2626';
  };
  const sentimentLabel = (s) => {
    if (s == null) return 'No signal yet';
    if (s > 0.3) return 'Strong Bullish';
    if (s > 0.05) return 'Bullish';
    if (s > -0.05) return 'Neutral';
    if (s > -0.3) return 'Bearish';
    return 'Strong Bearish';
  };

  const indexSeries = data?.index_series || [];
  const seasonalityBars = data?.seasonality || [];
  const indiaVix = data?.vix?.india;
  const globalVix = data?.vix?.global;
  const hotspots = data?.hotspots || [];
  const hotspotsAvailable = Boolean(data?.hotspots_available);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7ff', py: { xs: 2, md: 3 }, px: { xs: 1.5, sm: 2, md: 4 } }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a' }}>
            Market & Macro Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: '#6b7280' }}>
            Global indices, VIX, sentiment and seasonality — real data, not a mockup.
          </Typography>
        </Box>
        <Chip
          icon={<PublicIcon />}
          label="Live"
          sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 600 }}
        />
      </Box>

      {error && (
        <Box sx={{ mb: 2.5, p: 1.5, borderRadius: 2, border: '1px solid #fecaca', bgcolor: '#fee2e2', color: '#b91c1c', fontSize: '0.85rem' }}>
          {error}
        </Box>
      )}

      {loading && !data ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <HashLoader color="#4361EE" size={44} speedMultiplier={1.15} />
        </Box>
      ) : (
      <Grid container spacing={2.5}>
        {/* ── LEFT: Market Snapshot ───────────────── */}
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ p: 2.5, mb: 2.5, borderRadius: 2, border: '1px solid #e0e6f1', bgcolor: '#ffffff' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <ShowChartIcon fontSize="small" sx={{ color: '#4361ee' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Global Index Performance
                </Typography>
              </Stack>
              <ToggleButtonGroup
                size="small"
                value={horizon}
                exclusive
                onChange={(_, v) => v && setHorizon(v)}
              >
                <ToggleButton value="1M">1M</ToggleButton>
                <ToggleButton value="3M">3M</ToggleButton>
                <ToggleButton value="6M">6M</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <Typography variant="caption" sx={{ color: '#6b7280' }}>
              Normalized to 100 at the start of the window — real NIFTY 50 / S&amp;P 500 / EuroStoxx 50 closes
            </Typography>

            <Box sx={{ height: 260, mt: 1.5 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={indexSeries} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                    interval={Math.max(1, Math.floor(indexSeries.length / 6))}
                    tickFormatter={(d) => d?.slice(5)}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickFormatter={(v) => v.toFixed(0)}
                    width={36}
                    domain={['auto', 'auto']}
                  />
                  <RechartsTooltip contentStyle={{ borderRadius: 8, borderColor: '#e5e7eb', fontSize: 12 }} />
                  <Line type="monotone" dataKey="nifty" name="NIFTY 50" stroke="#4361ee" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="spx" name="S&P 500" stroke="#16a34a" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="eurostoxx" name="EuroStoxx" stroke="#f97316" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>

          {/* Seasonality */}
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid #e0e6f1', bgcolor: '#ffffff' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
              <TodayIcon fontSize="small" sx={{ color: '#16a34a' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                NIFTY Seasonal Pattern
              </Typography>
            </Stack>
            <Typography variant="caption" sx={{ color: '#6b7280' }}>
              Avg monthly return and % of positive years per calendar month
              {seasonalityBars[0]?.years ? ` — ${seasonalityBars[0].years} years of real history` : ''}.
            </Typography>
            <Box sx={{ height: 220, mt: 1.5 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={seasonalityBars} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} tickFormatter={(v) => `${v.toFixed(1)}%`} width={40} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} tickFormatter={(v) => `${v}%`} width={40} />
                  <RechartsTooltip
                    contentStyle={{ borderRadius: 8, borderColor: '#e5e7eb', fontSize: 12 }}
                    formatter={(value, name) => name === 'avg' ? [`${value.toFixed(2)}%`, 'Avg Return'] : [`${value}%`, 'Win Rate']}
                  />
                  <Bar yAxisId="left" dataKey="avg" name="Avg Return" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                    {seasonalityBars.map((d, i) => (
                      <Cell key={i} fill={d.avg >= 0 ? 'rgba(22,163,74,0.8)' : 'rgba(220,38,38,0.8)'} />
                    ))}
                  </Bar>
                  <Line yAxisId="right" type="monotone" dataKey="winRate" name="% Positive Years" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* ── RIGHT: Macro Risk & Sentiment ───────────── */}
        <Grid item xs={12} md={4}>
          {/* Macro risk block */}
          <Paper elevation={0} sx={{ p: 2.5, mb: 2.5, borderRadius: 2, border: '1px solid #e0e6f1', bgcolor: '#ffffff' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
              <WarningAmberIcon fontSize="small" sx={{ color: '#ea580c' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Macro & Volatility Risk
              </Typography>
            </Stack>

            <Stack spacing={1.5}>
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" sx={{ color: '#4b5563' }}>India VIX</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: '"JetBrains Mono", monospace' }}>
                    {indiaVix != null ? indiaVix.toFixed(1) : '—'}
                  </Typography>
                </Stack>
                <LinearProgress variant="determinate" value={indiaVix != null ? Math.min(indiaVix * 3, 100) : 0}
                  sx={{ height: 4, borderRadius: 999, '& .MuiLinearProgress-bar': { backgroundColor: indiaVix != null && indiaVix > 22 ? '#dc2626' : indiaVix != null && indiaVix > 15 ? '#f59e0b' : '#16a34a' } }} />
                <Typography variant="caption" sx={{ color: '#6b7280' }}>
                  {indiaVix == null ? 'Unavailable right now.' : indiaVix < 15
                    ? 'Market calm; carry trades comfortable.'
                    : indiaVix < 22
                    ? 'Volatility picking up; position sizing matters.'
                    : 'High vol regime — expect wider intraday swings.'}
                </Typography>
              </Stack>

              <Divider />

              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" sx={{ color: '#4b5563' }}>Global VIX (CBOE)</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: '"JetBrains Mono", monospace' }}>
                    {globalVix != null ? globalVix.toFixed(1) : '—'}
                  </Typography>
                </Stack>
                <LinearProgress variant="determinate" value={globalVix != null ? Math.min(globalVix * 3, 100) : 0}
                  sx={{ height: 4, borderRadius: 999, '& .MuiLinearProgress-bar': { backgroundColor: globalVix != null && globalVix > 25 ? '#dc2626' : globalVix != null && globalVix > 18 ? '#f59e0b' : '#16a34a' } }} />
              </Stack>

              <Divider />

              <Box>
                <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.5 }}>
                  <Typography variant="caption" sx={{ color: '#6b7280' }}>Liquidity &amp; Credit</Typography>
                  <Chip label="Illustrative" size="small" sx={{ height: 16, fontSize: 9, fontWeight: 700, bgcolor: '#fef9c3', color: '#854d0e', border: '1px solid #fde68a' }} />
                </Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" sx={{ color: '#4b5563' }}>Spread {ILLUSTRATIVE_RISK.creditSpread.toFixed(1)}%</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={Math.min(ILLUSTRATIVE_RISK.liquidityScore * 10, 100)} sx={{ height: 4, borderRadius: 999 }} />
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  No free real-time source for credit spreads yet — example values only.
                </Typography>
              </Box>
            </Stack>
          </Paper>

          {/* Sentiment block */}
          <Paper elevation={0} sx={{ p: 2.5, mb: 2.5, borderRadius: 2, border: '1px solid #e0e6f1', bgcolor: '#ffffff' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
              <PsychologyIcon fontSize="small" sx={{ color: '#6366f1' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Sentiment Snapshot</Typography>
            </Stack>

            <Stack spacing={1.5}>
              {[
                { label: 'Global Equities', value: data?.sentiment?.global },
                { label: 'India Equities', value: data?.sentiment?.india },
              ].map((row) => (
                <Box key={row.label}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" sx={{ color: '#4b5563' }}>{row.label}</Typography>
                    <Chip size="small" label={sentimentLabel(row.value)}
                      sx={{ height: 22, bgcolor: `${sentimentColor(row.value)}22`, color: sentimentColor(row.value), fontSize: 11 }} />
                  </Stack>
                  <LinearProgress variant="determinate" value={row.value != null ? 50 + row.value * 50 : 50}
                    sx={{ mt: 0.5, height: 6, borderRadius: 999, '& .MuiLinearProgress-bar': { backgroundColor: sentimentColor(row.value) } }} />
                </Box>
              ))}
              {!hotspotsAvailable && (
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  Sentiment needs the AI news service configured — showing "No signal yet" until it is.
                </Typography>
              )}
            </Stack>
          </Paper>

          {/* Geopolitical hotspots */}
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid #e0e6f1', bgcolor: '#ffffff' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
              <InsightsIcon fontSize="small" sx={{ color: '#0f766e' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Geopolitical Hotspots</Typography>
            </Stack>

            {!hotspotsAvailable ? (
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                AI news service not configured — hotspots unavailable.
              </Typography>
            ) : hotspots.length === 0 ? (
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>No hotspots surfaced right now.</Typography>
            ) : (
              <Stack spacing={1.5}>
                {hotspots.map((g) => {
                  const color = g.level === 'High' ? '#dc2626' : g.level === 'Medium' ? '#f97316' : '#16a34a';
                  return (
                    <Box key={g.region} sx={{ p: 1.5, borderRadius: 1.5, border: '1px solid #e0e6f1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{g.region}</Typography>
                        <Typography variant="caption" sx={{ color: '#6b7280' }}>{g.label}</Typography>
                      </Box>
                      <Chip size="small" label={g.level} sx={{ height: 22, bgcolor: `${color}11`, color, fontWeight: 600 }} />
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>
      )}
    </Box>
  );
};

export default MacroDashboard;

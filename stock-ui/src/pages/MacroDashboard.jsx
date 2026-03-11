import React, { useState } from 'react';
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

const MacroDashboard = () => {
  // ───────────────────── MOCK DATA ─────────────────────
  const [horizon, setHorizon] = useState('1M');

  const indexSeries = [
    { date: 'Jan', nifty: 100, spx: 100, eurostoxx: 100 },
    { date: 'Feb', nifty: 103, spx: 102, eurostoxx: 101 },
    { date: 'Mar', nifty: 107, spx: 104, eurostoxx: 103 },
    { date: 'Apr', nifty: 110, spx: 106, eurostoxx: 103 },
    { date: 'May', nifty: 108, spx: 105, eurostoxx: 102 },
    { date: 'Jun', nifty: 112, spx: 107, eurostoxx: 104 },
  ];

  const riskMetrics = {
    indiaVix: 17.4,
    globalVix: 16.1,
    creditSpread: 1.3,
    geoRisk: 6.5,
    liquidityScore: 7.2,
  };

  const sentimentData = {
    global: 0.2,
    india: 0.1,
    sectorIT: -0.3,
  };

  const geoHotspots = [
    {
      region: 'Middle East',
      label: 'Energy & crude sensitive',
      level: 'High',
      color: '#dc2626',
    },
    {
      region: 'US Elections',
      label: 'Policy & rates uncertainty',
      level: 'Medium',
      color: '#f97316',
    },
    {
      region: 'India',
      label: 'Stable macro, local flows strong',
      level: 'Low',
      color: '#16a34a',
    },
  ];

  const seasonalityBars = [
    { month: 'Jan', avg: 1.2, winRate: 58 },
    { month: 'Feb', avg: 0.4, winRate: 51 },
    { month: 'Mar', avg: -0.8, winRate: 45 },
    { month: 'Apr', avg: 2.1, winRate: 63 },
    { month: 'May', avg: -0.5, winRate: 48 },
    { month: 'Jun', avg: 0.7, winRate: 52 },
  ];

  const sentimentColor = (s) => {
    if (s > 0.3) return '#16a34a';
    if (s > 0.05) return '#22c55e';
    if (s > -0.05) return '#6b7280';
    if (s > -0.3) return '#f97316';
    return '#dc2626';
  };

  const riskLevelLabel = (v) => {
    if (v < 3) return 'Low';
    if (v < 6) return 'Moderate';
    if (v < 8) return 'Elevated';
    return 'High';
  };

  // ───────────────────── LAYOUT ─────────────────────
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f3f4f6', py: { xs: 2, md: 3 }, px: { xs: 1.5, sm: 2, md: 4 } }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a' }}>
            Market & Macro Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: '#6b7280' }}>
            Global indices, macro risk, sentiment and seasonality — one view.
          </Typography>
        </Box>
        <Chip
          icon={<PublicIcon />}
          label="Global View (Beta)"
          sx={{ bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 600 }}
        />
      </Box>

      <Grid container spacing={2.5}>
        {/* ── LEFT: Market Snapshot ───────────────── */}
        <Grid item xs={12} md={8}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              mb: 2.5,
              borderRadius: 2,
              border: '1px solid #e5e7eb',
              bgcolor: '#ffffff',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <ShowChartIcon fontSize="small" sx={{ color: '#2563eb' }} />
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
              Normalized to 100 — compare NIFTY vs S&P 500 vs EuroStoxx
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
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickFormatter={(v) => v.toFixed(0)}
                    width={36}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      borderRadius: 8,
                      borderColor: '#e5e7eb',
                      fontSize: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="nifty"
                    name="NIFTY 50"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="spx"
                    name="S&P 500"
                    stroke="#16a34a"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="eurostoxx"
                    name="EuroStoxx"
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>

          {/* Seasonality teaser */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 2,
              border: '1px solid #e5e7eb',
              bgcolor: '#ffffff',
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
              <TodayIcon fontSize="small" sx={{ color: '#16a34a' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                NIFTY Seasonal Pattern (Teaser)
              </Typography>
            </Stack>
            <Typography variant="caption" sx={{ color: '#6b7280' }}>
              Avg monthly return and % of positive months (dummy data for now).
            </Typography>
            <Box sx={{ height: 220, mt: 1.5 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={seasonalityBars} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickFormatter={(v) => `${v.toFixed(1)}%`}
                    width={40}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickFormatter={(v) => `${v}%`}
                    width={40}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      borderRadius: 8,
                      borderColor: '#e5e7eb',
                      fontSize: 12,
                    }}
                    formatter={(value, name) =>
                      name === 'avg'
                        ? [`${value.toFixed(2)}%`, 'Avg Return']
                        : [`${value}%`, 'Win Rate']
                    }
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="avg"
                    name="Avg Return"
                    radius={[4, 4, 0, 0]}
                  >
                    {seasonalityBars.map((d, i) => (
                      <Cell
                        key={i}
                        fill={d.avg >= 0 ? 'rgba(22,163,74,0.8)' : 'rgba(220,38,38,0.8)'}
                      />
                    ))}
                  </Bar>
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="winRate"
                    name="% Positive Months"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* ── RIGHT: Macro Risk & Sentiment ───────────── */}
        <Grid item xs={12} md={4}>
          {/* Macro risk block */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              mb: 2.5,
              borderRadius: 2,
              border: '1px solid #e5e7eb',
              bgcolor: '#ffffff',
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
              <WarningAmberIcon fontSize="small" sx={{ color: '#ea580c' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Macro & Geopolitical Risk
              </Typography>
            </Stack>

            <Stack spacing={1.5}>
              <Box>
                <Typography variant="caption" sx={{ color: '#6b7280' }}>
                  Geopolitical risk index (0–10)
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {riskMetrics.geoRisk.toFixed(1)}
                  </Typography>
                  <Chip
                    size="small"
                    label={riskLevelLabel(riskMetrics.geoRisk)}
                    sx={{
                      height: 22,
                      bgcolor:
                        riskMetrics.geoRisk < 3
                          ? '#dcfce7'
                          : riskMetrics.geoRisk < 6
                          ? '#fef9c3'
                          : '#fee2e2',
                      color:
                        riskMetrics.geoRisk < 3
                          ? '#15803d'
                          : riskMetrics.geoRisk < 6
                          ? '#92400e'
                          : '#b91c1c',
                    }}
                  />
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={(riskMetrics.geoRisk / 10) * 100}
                  sx={{
                    mt: 0.5,
                    height: 6,
                    borderRadius: 999,
                    '& .MuiLinearProgress-bar': {
                      backgroundColor:
                        riskMetrics.geoRisk < 3
                          ? '#22c55e'
                          : riskMetrics.geoRisk < 6
                          ? '#f59e0b'
                          : '#ef4444',
                    },
                  }}
                />
              </Box>

              <Divider />

              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" sx={{ color: '#4b5563' }}>
                    India VIX
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {riskMetrics.indiaVix.toFixed(1)}
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(riskMetrics.indiaVix * 3, 100)}
                  sx={{ height: 4, borderRadius: 999 }}
                />
                <Typography variant="caption" sx={{ color: '#6b7280' }}>
                  {riskMetrics.indiaVix < 15
                    ? 'Market calm; carry trades comfortable.'
                    : riskMetrics.indiaVix < 22
                    ? 'Volatility picking up; position sizing matters.'
                    : 'High vol regime — expect wider intraday swings.'}
                </Typography>
              </Stack>

              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" sx={{ color: '#4b5563' }}>
                    Global VIX proxy
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {riskMetrics.globalVix.toFixed(1)}
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(riskMetrics.globalVix * 3, 100)}
                  sx={{ height: 4, borderRadius: 999 }}
                />
              </Stack>

              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" sx={{ color: '#4b5563' }}>
                    Liquidity & Credit
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Spread {riskMetrics.creditSpread.toFixed(1)}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(riskMetrics.liquidityScore * 10, 100)}
                  sx={{ height: 4, borderRadius: 999 }}
                />
                <Typography variant="caption" sx={{ color: '#6b7280' }}>
                  Lower spreads & higher liquidity score = healthier funding backdrop.
                </Typography>
              </Stack>
            </Stack>
          </Paper>

          {/* Sentiment block */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              mb: 2.5,
              borderRadius: 2,
              border: '1px solid #e5e7eb',
              bgcolor: '#ffffff',
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
              <PsychologyIcon fontSize="small" sx={{ color: '#6366f1' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Sentiment Snapshot
              </Typography>
            </Stack>

            <Stack spacing={1.5}>
              {[
                { label: 'Global Equities', value: sentimentData.global },
                { label: 'India Equities', value: sentimentData.india },
                { label: 'Indian IT Sector', value: sentimentData.sectorIT },
              ].map((row) => (
                <Box key={row.label}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" sx={{ color: '#4b5563' }}>
                      {row.label}
                    </Typography>
                    <Chip
                      size="small"
                      label={
                        row.value > 0.3
                          ? 'Strong Bullish'
                          : row.value > 0.05
                          ? 'Bullish'
                          : row.value > -0.05
                          ? 'Neutral'
                          : row.value > -0.3
                          ? 'Bearish'
                          : 'Strong Bearish'
                      }
                      sx={{
                        height: 22,
                        bgcolor: `${sentimentColor(row.value)}22`,
                        color: sentimentColor(row.value),
                        fontSize: 11,
                      }}
                    />
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={50 + row.value * 50}
                    sx={{
                      mt: 0.5,
                      height: 6,
                      borderRadius: 999,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: sentimentColor(row.value),
                      },
                    }}
                  />
                </Box>
              ))}
            </Stack>
          </Paper>

          {/* Geopolitical hotspots */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 2,
              border: '1px solid #e5e7eb',
              bgcolor: '#ffffff',
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
              <InsightsIcon fontSize="small" sx={{ color: '#0f766e' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Geopolitical Hotspots (Qualitative)
              </Typography>
            </Stack>

            <Stack spacing={1.5}>
              {geoHotspots.map((g) => (
                <Box
                  key={g.region}
                  sx={{
                    p: 1.5,
                    borderRadius: 1.5,
                    border: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {g.region}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#6b7280' }}>
                      {g.label}
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    label={g.level}
                    sx={{
                      height: 22,
                      bgcolor: `${g.color}11`,
                      color: g.color,
                      fontWeight: 600,
                    }}
                  />
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MacroDashboard;

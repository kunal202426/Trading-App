import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Stack,
  IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TodayIcon from '@mui/icons-material/Today';
import InsightsIcon from '@mui/icons-material/Insights';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const Seasonality = () => {
  const { symbol } = useParams();
  const navigate = useNavigate();

  // Mock monthly stats for now
  const monthly = [
    { month: 'Jan', avgReturn: 1.4, winRate: 62 },
    { month: 'Feb', avgReturn: 0.3, winRate: 51 },
    { month: 'Mar', avgReturn: -1.2, winRate: 42 },
    { month: 'Apr', avgReturn: 2.1, winRate: 68 },
    { month: 'May', avgReturn: -0.7, winRate: 46 },
    { month: 'Jun', avgReturn: 0.5, winRate: 52 },
    { month: 'Jul', avgReturn: 1.8, winRate: 60 },
    { month: 'Aug', avgReturn: 0.2, winRate: 49 },
    { month: 'Sep', avgReturn: -1.5, winRate: 40 },
    { month: 'Oct', avgReturn: 1.1, winRate: 56 },
    { month: 'Nov', avgReturn: 1.9, winRate: 64 },
    { month: 'Dec', avgReturn: 0.9, winRate: 55 },
  ];

  const bestMonth = monthly.reduce((a, b) => (b.avgReturn > a.avgReturn ? b : a), monthly[0]);
  const worstMonth = monthly.reduce((a, b) => (b.avgReturn < a.avgReturn ? b : a), monthly[0]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f3f4f6', py: { xs: 2, md: 3 }, px: { xs: 1.5, sm: 2, md: 4 } }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <IconButton
            size="small"
            onClick={() => navigate(-1)}
            sx={{ bgcolor: '#ffffff', border: '1px solid #e5e7eb' }}
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a' }}>
              {symbol} Seasonality
            </Typography>
            <Typography variant="body2" sx={{ color: '#6b7280' }}>
              Historical monthly behaviour — average returns and hit-rates.
            </Typography>
          </Box>
        </Stack>
        <Chip
          icon={<TodayIcon />}
          label="Multi-year history (mock)"
          sx={{ bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 600 }}
        />
      </Box>

      <Grid container spacing={2.5}>
        {/* Chart */}
        <Grid item xs={12} md={8}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 2,
              border: '1px solid #e5e7eb',
              bgcolor: '#ffffff',
              mb: 2.5,
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
              Monthly pattern
            </Typography>
            <Typography variant="caption" sx={{ color: '#6b7280' }}>
              Bars: average monthly return. Line: % of years with positive return.
            </Typography>
            <Box sx={{ height: 280, mt: 1.5 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                      name === 'avgReturn'
                        ? [`${value.toFixed(2)}%`, 'Avg Return']
                        : [`${value}%`, 'Win Rate']
                    }
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="avgReturn"
                    name="Avg Return"
                    radius={[4, 4, 0, 0]}
                  >
                    {monthly.map((d, i) => (
                      <Cell
                        key={i}
                        fill={d.avgReturn >= 0 ? 'rgba(22,163,74,0.8)' : 'rgba(220,38,38,0.8)'}
                      />
                    ))}
                  </Bar>
                  <Bar
                    yAxisId="right"
                    dataKey="winRate"
                    name="Win Rate"
                    barSize={2}
                    fill="#0ea5e9"
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Insights */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 2,
              border: '1px solid #e5e7eb',
              bgcolor: '#ffffff',
              mb: 2.5,
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
              <InsightsIcon fontSize="small" sx={{ color: '#4f46e5' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                High-level insights
              </Typography>
            </Stack>

            <Stack spacing={1.5}>
              <Box>
                <Typography variant="caption" sx={{ color: '#6b7280' }}>
                  Historically strongest month
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {bestMonth.month} — {bestMonth.avgReturn.toFixed(1)}% avg,{' '}
                  {bestMonth.winRate}% positive
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#6b7280' }}>
                  Historically weakest month
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {worstMonth.month} — {worstMonth.avgReturn.toFixed(1)}% avg,{' '}
                  {worstMonth.winRate}% positive
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#6b7280' }}>
                  Use-case
                </Typography>
                <Typography variant="body2" sx={{ color: '#4b5563' }}>
                  Seasonality should never be used alone, but combined with regime and ML signals
                  it can help tilt risk up or down in historically favourable windows.
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Seasonality;

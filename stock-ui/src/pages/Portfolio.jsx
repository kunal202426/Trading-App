import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

import {
  Box, Button, Typography, Paper,
  Grid, Stack, Chip, IconButton, Tooltip,
} from "@mui/material";
import { HashLoader } from "react-spinners";
import RefreshIcon from "@mui/icons-material/Refresh";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import { motion } from "framer-motion";
import {
  collection, onSnapshot, query, orderBy,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { useAppStore } from "../store/useAppStore";
import HoverDevCard from "../components/ui/HoverDevCard";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as ReTooltip, ResponsiveContainer,
} from "recharts";
const API = import.meta.env.VITE_API_URL || '';
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

// ── Brand tokens (matches the marketing site's design system) ──
const T = {
  bg: '#f5f7ff',
  surface: '#ffffff',
  accent: '#4361ee',
  accentSoft: '#eef1ff',
  text1: '#0f1729',
  text2: '#52637a',
  border: '#e0e6f1',
  profit: '#16a34a',
  profitSoft: '#dcfce7',
  loss: '#dc2626',
  lossSoft: '#fee2e2',
  warn: '#a16207',
  warnSoft: '#fef9c3',
};

const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function toDate(ts) {
  if (!ts) return null;
  if (typeof ts.toDate === "function") return ts.toDate();
  return new Date(ts);
}

// Merge raw buy transactions into one holding per symbol with a real
// weighted-average cost — buying the same stock twice used to render as two
// separate cards with two separate "buy prices".
function aggregateHoldings(positions) {
  const bySymbol = new Map();
  for (const p of positions) {
    const h = bySymbol.get(p.symbol) || { symbol: p.symbol, quantity: 0, invested: 0, lots: 0, transactions: [] };
    h.quantity += p.quantity;
    h.invested += p.buyPrice * p.quantity;
    h.lots += 1;
    h.transactions.push(p);
    bySymbol.set(p.symbol, h);
  }
  return [...bySymbol.values()].map((h) => ({ ...h, avgBuyPrice: h.quantity ? h.invested / h.quantity : 0 }));
}

// A real historical portfolio value curve — built from actual daily closes
// (via /chart/{symbol}) and actual acquisition dates, not synthetic data.
// A position only contributes to a given date once it was actually bought.
function buildEquityCurve(positions, historicalData) {
  const dateSet = new Set();
  Object.values(historicalData).forEach((candles) => candles.forEach((c) => dateSet.add(c.date)));
  const dates = [...dateSet].sort();
  if (!dates.length) return [];

  const priceLookup = {};
  Object.entries(historicalData).forEach(([sym, candles]) => {
    const byDate = new Map(candles.map((c) => [c.date, c.close]));
    const map = {};
    let last = null;
    dates.forEach((d) => {
      if (byDate.has(d)) last = byDate.get(d);
      map[d] = last;
    });
    priceLookup[sym] = map;
  });

  return dates
    .map((d) => {
      const dateObj = new Date(d);
      let value = 0;
      positions.forEach((p) => {
        const acquiredAt = toDate(p.createdAt);
        if (acquiredAt && acquiredAt > dateObj) return;
        const price = priceLookup[p.symbol]?.[d];
        if (price != null) value += price * p.quantity;
      });
      return { date: d, value };
    })
    .filter((pt) => pt.value > 0);
}

function Sparkline({ candles, isUp }) {
  const data = (candles || []).slice(-30).map((c) => ({ v: c.close }));
  const color = isUp ? T.profit : T.loss;
  if (data.length < 2) return <Box sx={{ width: 84, height: 32 }} />;
  return (
    <Box sx={{ width: 84, height: 32 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#spark-${color})`} dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
}

function StatCard({ label, value, color, icon }) {
  return (
    <Paper elevation={0} sx={{
      p: { xs: 1.5, sm: 2, md: 2.5 }, borderRadius: 3, border: `1px solid ${T.border}`, bgcolor: T.surface,
      transition: "box-shadow 0.2s, transform 0.2s",
      "&:hover": { boxShadow: `0 8px 24px ${T.accent}14`, transform: 'translateY(-2px)' },
    }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
        <Box>
          <Typography variant="caption" sx={{ color: T.text2, fontWeight: 600, fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>{label}</Typography>
          <Typography variant="h6" sx={{ color: color || T.text1, fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, fontSize: { xs: '0.9rem', sm: '1.1rem', md: '1.25rem' } }}>
            {value}
          </Typography>
        </Box>
        {icon && <Box sx={{ fontSize: { xs: '1.2rem', md: '1.5rem' } }}>{icon}</Box>}
      </Stack>
    </Paper>
  );
}

export default function Portfolio() {
  const { user }                      = useAuth();
  const navigate                      = useNavigate();
  const [positions, setPositions]     = useState([]);
  const [livePrices, setLivePrices]   = useState({});
  const [historicalData, setHistoricalData] = useState({});
  const [loading, setLoading]         = useState(false);
  const [loadingPos, setLoadingPos]   = useState(true);
  const [priceErr, setPriceErr]       = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  // Real-time Firestore listener
  useEffect(() => {
    if (!user) return;
    const ref = collection(db, "users", user.uid, "transactions");
    const q   = query(ref, orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPositions(data);
      setLoadingPos(false);
    });
    return () => unsub();
  }, [user]);

  // Fetch live prices per symbol using /chart/{symbol}. Reads through a
  // short-TTL shared cache first — a symbol just fetched by Dashboard (or by
  // this same call for another holding of the same stock) doesn't trigger a
  // redundant network round-trip. `force` (manual refresh) bypasses it.
  const fetchLivePrices = useCallback(async (posList, force = false) => {
    const list = posList || positions;
    if (!list.length) return;
    setLoading(true);
    setPriceErr("");
    try {
      const { getCachedPrice, setCachedPrice } = useAppStore.getState();
      const symbols = [...new Set(list.map((p) => p.symbol))];
      const priceMap = {};
      const toFetch = [];

      symbols.forEach((sym) => {
        const cached = !force ? getCachedPrice(sym) : null;
        if (cached != null) {
          priceMap[sym] = { currentPrice: cached };
        } else {
          toFetch.push(sym);
        }
      });

      if (toFetch.length) {
        const results = await Promise.allSettled(
          toFetch.map((sym) => axios.get(`${API}/chart/${sym}`, { timeout: 10000 }))
        );
        results.forEach((r, i) => {
          const sym = toFetch[i];
          if (r.status === "fulfilled" && r.value?.data?.latest) {
            priceMap[sym] = { currentPrice: r.value.data.latest };
            setCachedPrice(sym, r.value.data.latest);
          }
        });
      }

      setLivePrices(priceMap);
      setLastUpdated(new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" }));
    } catch (e) {
      setPriceErr("Could not fetch live prices. Backend may be offline.");
    } finally {
      setLoading(false);
    }
  }, [positions]);

  useEffect(() => {
    if (positions.length) fetchLivePrices(positions);
  }, [positions.length]);

  // Full daily candle history per symbol — powers the equity curve and the
  // per-holding sparklines. Fetched once per distinct symbol set, separate
  // from the lightweight scalar-price refresh above.
  const symbolKey = useMemo(() => [...new Set(positions.map((p) => p.symbol))].sort().join(","), [positions]);
  useEffect(() => {
    if (!symbolKey) return;
    const symbols = symbolKey.split(",");
    let cancelled = false;
    Promise.allSettled(symbols.map((sym) => axios.get(`${API}/chart/${sym}`, { timeout: 10000 })))
      .then((results) => {
        if (cancelled) return;
        const map = {};
        results.forEach((r, i) => {
          if (r.status === "fulfilled" && r.value?.data?.candles) {
            map[symbols[i]] = r.value.data.candles;
          }
        });
        setHistoricalData(map);
      });
    return () => { cancelled = true; };
  }, [symbolKey]);

  const holdings = useMemo(() => aggregateHoldings(positions), [positions]);

  const enriched = holdings.map((h) => {
    const candles = historicalData[h.symbol];
    const fallback = candles?.length ? candles[candles.length - 1].close : h.avgBuyPrice;
    return {
      ...h,
      currentPrice: livePrices[h.symbol]?.currentPrice ?? fallback,
      isLive: Boolean(livePrices[h.symbol]),
      candles,
    };
  });

  function computeMetrics(h) {
    const invested     = h.avgBuyPrice * h.quantity;
    const currentValue = h.currentPrice * h.quantity;
    const profit       = currentValue - invested;
    const returnPct    = invested ? (profit / invested) * 100 : 0;
    return { invested, currentValue, profit, returnPct };
  }

  const totals = enriched.reduce(
    (acc, h) => {
      const m = computeMetrics(h);
      acc.invested += m.invested;
      acc.current  += m.currentValue;
      acc.profit   += m.profit;
      return acc;
    },
    { invested: 0, current: 0, profit: 0 }
  );
  const overallReturn = totals.invested > 0 ? (totals.profit / totals.invested) * 100 : 0;
  const allocationData = enriched.map((h) => [h.symbol, h.currentPrice * h.quantity]);

  const equityCurve = useMemo(
    () => buildEquityCurve(positions, historicalData),
    [positions, historicalData]
  );

  const chartOptions = {
    chart: { type: "pie", backgroundColor: 'transparent' },
    title: { text: null },
    tooltip: { pointFormat: "<b>{point.percentage:.1f}%</b>" },
    colors: ['#4361ee', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899', '#14b8a6'],
    plotOptions: {
      pie: {
        innerSize: '62%',
        allowPointSelect: true,
        cursor: "pointer",
        borderWidth: 2,
        borderColor: T.surface,
        dataLabels: { enabled: true, format: "{point.name}", style: { fontSize: '11px' } },
      },
    },
    series: [{ type: "pie", name: "Allocation", data: allocationData }],
    credits: { enabled: false },
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <Box sx={{ bgcolor: T.bg, minHeight: '100vh', px: { xs: 1.5, sm: 2, md: 3, lg: 4 }, py: { xs: 2, sm: 3, md: 4 }, maxWidth: 1400, mx: 'auto', boxSizing: 'border-box', overflowX: 'hidden' }}>

        {/* Header */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={{ xs: 1.5, sm: 2 }}
          sx={{ mb: { xs: 2, md: 3 } }}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: T.text1, fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' } }}>
              Portfolio
            </Typography>
            <Typography variant="body2" sx={{ color: T.text2, fontSize: { xs: '0.75rem', sm: '0.85rem' } }}>
              {user?.displayName || user?.email} &middot; Real-time P&L
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 1 }} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <Tooltip title="Refresh live prices">
              <span>
                <IconButton
                  onClick={() => fetchLivePrices(undefined, true)}
                  disabled={loading || !positions.length}
                  size="small"
                  sx={{ color: T.accent }}
                >
                  {loading ? <HashLoader color={T.accent} size={14} speedMultiplier={1.1} /> : <RefreshIcon />}
                </IconButton>
              </span>
            </Tooltip>
            <Button
              id="portfolio-transactions-btn"
              component={Link}
              to="/transactions"
              variant="contained"
              size="small"
              sx={{ textTransform: 'none', fontWeight: 600, width: { xs: '100%', sm: 'auto' }, bgcolor: T.accent, '&:hover': { bgcolor: '#3651d4' } }}
            >
              Add / View Transactions
            </Button>
          </Stack>
        </Stack>

        {lastUpdated && (
          <Typography variant="caption" sx={{ color: '#94a3b8', mb: { xs: 1.5, md: 2 }, display: "block", fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
            Live prices last updated: {lastUpdated}
          </Typography>
        )}

        {priceErr && (
          <Box sx={{ mb: { xs: 1.5, md: 2 }, p: { xs: 1, sm: 1.5 }, borderRadius: 2, border: `1px solid ${T.loss}40`, bgcolor: T.lossSoft, color: '#b91c1c', fontSize: { xs: '0.75rem', sm: '0.85rem' } }}>
            {priceErr}
          </Box>
        )}

        <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }} sx={{ mb: { xs: 2, md: 3 } }} id="portfolio-stats-container">
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <StatCard label="Invested Amount" value={`₹${fmt(totals.invested)}`} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <StatCard label="Current Value" value={`₹${fmt(totals.current)}`} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <StatCard
              label="Total P&L"
              value={`${totals.profit >= 0 ? "+" : ""}₹${fmt(Math.abs(totals.profit))} (${overallReturn.toFixed(2)}%)`}
              color={totals.profit >= 0 ? T.profit : T.loss}
              icon={totals.profit >= 0
                ? <TrendingUpIcon sx={{ color: T.profit, fontSize: 28 }} />
                : <TrendingDownIcon sx={{ color: T.loss, fontSize: 28 }} />
              }
            />
          </Grid>
        </Grid>

        {/* Portfolio value over time — real daily closes × real position timeline */}
        {equityCurve.length > 1 && (
          <Paper elevation={0} sx={{ p: { xs: 2, sm: 2.5, md: 3 }, borderRadius: 3, border: `1px solid ${T.border}`, bgcolor: T.surface, mb: { xs: 2, md: 3 } }}>
            <Typography sx={{ fontWeight: 700, mb: 1.5, fontSize: { xs: '0.95rem', sm: '1rem', md: '1.1rem' }, color: T.text1 }}>
              Portfolio Value Over Time
            </Typography>
            <Box sx={{ height: { xs: 180, sm: 220, md: 260 } }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={equityCurve} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={T.accent} stopOpacity={0.18} />
                      <stop offset="95%" stopColor={T.accent} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={T.border} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={{ stroke: T.border }}
                    interval={Math.max(1, Math.floor(equityCurve.length / 6))} tickFormatter={(d) => d?.slice(5)} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false}
                    domain={['auto', 'auto']} tickFormatter={(v) => `₹${fmt(v)}`} width={80} />
                  <ReTooltip
                    formatter={(v) => [`₹${fmt(v)}`, 'Value']}
                    contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }}
                  />
                  <Area type="monotone" dataKey="value" stroke={T.accent} strokeWidth={2} fill="url(#equityGrad)" dot={false} animationDuration={600} />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        )}

        <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
        <Grid size={{ xs: 12, lg: 8 }} id="portfolio-holdings-list">

        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: T.text1, mb: { xs: 1, md: 1.5 }, fontSize: { xs: '0.95rem', sm: '1.1rem', md: '1.25rem' } }}>
          Holdings ({enriched.length})
        </Typography>

        {loadingPos ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
            <HashLoader color={T.accent} size={40} speedMultiplier={1.15} />
          </Box>
        ) : enriched.length === 0 ? (
          <Paper elevation={0} sx={{ p: 4, borderRadius: 3, textAlign: "center", color: T.text2, border: `1px solid ${T.border}` }}>
            No holdings yet. Add transactions to get started.
          </Paper>
        ) : (
          <Grid container spacing={{ xs: 1, sm: 2 }}>
            {enriched.map((h) => {
              const m = computeMetrics(h);
              const isUp = m.profit >= 0;
              return (
                <Grid size={{ xs: 12, md: 6 }} key={h.symbol}>
                  <HoverDevCard onClick={() => navigate(`/analysis/${h.symbol}`)}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: { xs: 1.5, sm: 2, md: 2.5 }, borderRadius: 3, bgcolor: T.surface,
                      border: `1px solid ${T.border}`,
                      borderLeft: `4px solid ${isUp ? T.profit : T.loss}`,
                      cursor: 'pointer',
                      transition: 'box-shadow 0.2s, transform 0.2s',
                      '&:hover': { boxShadow: `0 6px 20px ${T.accent}14`, transform: 'translateY(-1px)' },
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={{ xs: 1, sm: 1.5 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap">
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: T.text1, fontSize: { xs: '0.95rem', sm: '1rem', md: '1.1rem' } }}>
                            {h.symbol}
                          </Typography>
                          <Chip
                            label={h.isLive ? "LIVE" : "STATIC"}
                            size="small"
                            sx={{
                              fontSize: { xs: '0.65rem', sm: '0.7rem' }, height: { xs: 18, sm: 20 }, fontWeight: 600,
                              bgcolor: h.isLive ? T.profitSoft : T.warnSoft,
                              color: h.isLive ? T.profit : T.warn,
                            }}
                          />
                          {h.lots > 1 && (
                            <Chip
                              label={`${h.lots} lots`}
                              size="small"
                              sx={{ fontSize: { xs: '0.6rem', sm: '0.65rem' }, height: { xs: 18, sm: 20 }, fontWeight: 600, bgcolor: T.accentSoft, color: T.accent }}
                            />
                          )}
                        </Stack>
                        <Typography variant="caption" sx={{ color: T.text2, fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
                          Qty: {h.quantity} &middot; Avg Buy: ₹{fmt(h.avgBuyPrice)}
                        </Typography>
                        <Box sx={{ mt: 0.5 }}>
                          <Typography variant="body2" sx={{ fontFamily: '"JetBrains Mono", monospace', color: '#334155', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                            Current: ₹{fmt(h.currentPrice)}
                          </Typography>
                          <Typography variant="caption" sx={{ color: T.text2, fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                            Invested: ₹{fmt(m.invested)} →   Value: ₹{fmt(m.currentValue)}
                          </Typography>
                        </Box>
                      </Box>

                      <Stack alignItems="flex-end" spacing={0.75} sx={{ flexShrink: 0 }}>
                        <Sparkline candles={h.candles} isUp={isUp} />
                        <Box sx={{ textAlign: "right" }}>
                          <Typography variant="subtitle1" sx={{
                            fontFamily: '"JetBrains Mono", monospace', fontWeight: 700,
                            color: isUp ? T.profit : T.loss,
                            fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' }
                          }}>
                            {isUp ? "+" : ""}₹{fmt(Math.abs(m.profit))}
                          </Typography>
                          <Typography variant="caption" sx={{
                            fontFamily: '"JetBrains Mono", monospace',
                            color: m.returnPct >= 0 ? T.profit : T.loss,
                            fontSize: { xs: '0.65rem', sm: '0.75rem' }
                          }}>
                            {m.returnPct >= 0 ? "+" : ""}{m.returnPct.toFixed(2)}%
                          </Typography>
                        </Box>
                      </Stack>
                    </Stack>
                  </Paper>
                  </HoverDevCard>
                </Grid>
              );
            })}
          </Grid>
        )}
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }} id="portfolio-allocation-chart">
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 2.5, md: 3 },
              borderRadius: 3,
              border: `1px solid ${T.border}`,
              bgcolor: T.surface,
              height: { xs: 'auto', md: 550 },
            }}
          >
            <Typography sx={{ fontWeight: 700, mb: 2, fontSize: { xs: '0.95rem', sm: '1rem', md: '1.1rem' }, color: T.text1 }}>
              Portfolio Allocation
            </Typography>

            {allocationData.length > 0 && (
              <HighchartsReact highcharts={Highcharts} options={chartOptions} />
            )}
          </Paper>
        </Grid>
        </Grid>
      </Box>
    </motion.div>
  );
}

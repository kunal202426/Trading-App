import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

import {
  Box, Button, Typography, Paper,
  Grid, Stack, Chip, IconButton, Tooltip, CircularProgress,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import { motion } from "framer-motion";
import {
  collection, onSnapshot, query, orderBy,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import TiltCard from "../components/ui/TiltCard";
import HoverDevCard from "../components/ui/HoverDevCard";
const API = import.meta.env.VITE_API_URL || '';
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import HC_3D from "highcharts/highcharts-3d";
import { grey } from "@mui/material/colors";

if (typeof HC_3D === "function") {
  HC_3D(Highcharts);
}
function computeMetrics(pos) {
  const invested     = pos.buyPrice * pos.quantity;
  const currentValue = pos.currentPrice * pos.quantity;
  const profit       = currentValue - invested;
  const returnPct    = invested ? (profit / invested) * 100 : 0;
  return { invested, currentValue, profit, returnPct };
}

const fmt = (n) => Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function StatCard({ label, value, color, icon }) {
  return (
    <TiltCard>
      <Paper elevation={0} sx={{
        p: { xs: 1.5, sm: 2, md: 2.5 }, borderRadius: { xs: 2, md: 2 }, border: '1px solid #3780c0', bgcolor: '#ffffff',
        transition: "box-shadow 0.2s",
          "&:hover": {
            boxShadow: "0 8px 20px rgba(0, 0, 0, 0.08)",
          },
      }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
          <Box>
            <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600, fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>{label}</Typography>
            <Typography variant="h6" sx={{ color: color || '#0f172a', fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, fontSize: { xs: '0.9rem', sm: '1.1rem', md: '1.25rem' } }}>
              {value}
            </Typography>
          </Box>
          {icon && <Box sx={{ fontSize: { xs: '1.2rem', md: '1.5rem' } }}>{icon}</Box>}
        </Stack>
      </Paper>
    </TiltCard>
  );
}

export default function Portfolio() {
  const { user }                      = useAuth();
  const navigate                      = useNavigate();
  const [positions, setPositions]     = useState([]);
  const [livePrices, setLivePrices]   = useState({});
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

  // Fetch live prices per symbol using /chart/{symbol}
  const fetchLivePrices = useCallback(async (posList) => {
    const list = posList || positions;
    if (!list.length) return;
    setLoading(true);
    setPriceErr("");
    try {
      const symbols = [...new Set(list.map((p) => p.symbol))];
      const results = await Promise.allSettled(
        symbols.map((sym) => axios.get(`${API}/chart/${sym}`, { timeout: 10000 }))
      );
      const priceMap = {};
      results.forEach((r, i) => {
        if (r.status === "fulfilled" && r.value?.data?.latest) {
          priceMap[symbols[i]] = { currentPrice: r.value.data.latest };
        }
      });
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

  const enriched = positions.map((p) => ({
    ...p,
    currentPrice: livePrices[p.symbol]?.currentPrice ?? p.buyPrice,
    isLive: Boolean(livePrices[p.symbol]),
  }));

  const totals = enriched.reduce(
    (acc, p) => {
      const m = computeMetrics(p);
      acc.invested += m.invested;
      acc.current  += m.currentValue;
      acc.profit   += m.profit;
      return acc;
    },
    { invested: 0, current: 0, profit: 0 }
  );
  const overallReturn = totals.invested > 0 ? (totals.profit / totals.invested) * 100 : 0;
  const allocationData = enriched.map((p) => [
  p.symbol,
  p.currentPrice * p.quantity
]);

const chartOptions = {
  chart: {
    type: "pie",
    options3d: {
      enabled: true,
      alpha: 45,
      beta: 0
    }
  },

  title: {
    text: null
  },

  tooltip: {
    pointFormat: "<b>{point.percentage:.1f}%</b>"
  },

  plotOptions: {
    pie: {
      allowPointSelect: true,
      cursor: "pointer",
      depth: 35,
      dataLabels: {
        enabled: true,
        format: "{point.name}"
      }
    }
  },

  series: [
    {
      type: "pie",
      name: "Allocation",
      data: allocationData
    }
  ]
};

const COLORS = ["#6366f1","#22c55e","#f59e0b","#ef4444","#3b82f6","#06b6d4"];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <Box sx={{ bgcolor: '#ffffff', minHeight: '100vh', px: { xs: 1.5, sm: 2, md: 3, lg: 4 }, py: { xs: 2, sm: 3, md: 4 }, maxWidth: 1400, mx: 'auto', borderRadius: { xs: 2, md: 5 }, boxSizing: 'border-box', overflowX: 'hidden' }}>

        {/* Header */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={{ xs: 1.5, sm: 2 }}
          sx={{ mb: { xs: 2, md: 3 } }}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' } }}>
              Portfolio
            </Typography>
            <Typography variant="body2" sx={{ color: '#6b7280', fontSize: { xs: '0.75rem', sm: '0.85rem' } }}>
              {user?.displayName || user?.email} &middot; Real-time P&L
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 1 }} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <Tooltip title="Refresh live prices">
              <span>
                <IconButton
                  onClick={() => fetchLivePrices()}
                  disabled={loading || !positions.length}
                  size="small"
                  sx={{ color: '#1976d2' }}
                >
                  {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
                </IconButton>
              </span>
            </Tooltip>
            <Button
              id="portfolio-transactions-btn"
              component={Link}
              to="/transactions"
              variant="contained"
              size="small"
              sx={{ textTransform: 'none', fontWeight: 600, width: { xs: '100%', sm: 'auto' } }}
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
          <Box sx={{ mb: { xs: 1.5, md: 2 }, p: { xs: 1, sm: 1.5 }, borderRadius: 2, border: "1px solid #fecaca", bgcolor: "#fee2e2", color: "#b91c1c", fontSize: { xs: '0.75rem', sm: '0.85rem' } }}>
            {priceErr}
          </Box>
        )}

        
        <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }} sx={{ mb: { xs: 3, md: 4 } }} id="portfolio-stats-container">
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
              color={totals.profit >= 0 ? "#16a34a" : "#dc2626"}
              icon={totals.profit >= 0
                ? <TrendingUpIcon sx={{ color: '#16a34a', fontSize: 28 }} />
                : <TrendingDownIcon sx={{ color: '#dc2626', fontSize: 28 }} />
              }
            />
          </Grid>
        </Grid>
        
        <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
        <Grid size={{ xs: 12, lg: 8 }} id="portfolio-holdings-list">
        
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', mb: { xs: 1, md: 1.5 }, fontSize: { xs: '0.95rem', sm: '1.1rem', md: '1.25rem' } }}>
          Holdings ({enriched.length})
        </Typography>

        {loadingPos ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
            <CircularProgress sx={{ color: '#1976d2' }} />
          </Box>
        ) : enriched.length === 0 ? (
          <Paper elevation={0} sx={{ p: 4, borderRadius: 2, textAlign: "center", color: '#6b7280', border: '1px solid #e5e7eb' }}>
            No holdings yet. Add transactions to get started.
          </Paper>
        ) : (
          <Grid container spacing={{ xs: 1, sm: 2 }}>
            {enriched.map((p) => {
              const m = computeMetrics(p);
              return (
                <Grid size={{ xs: 12, md: 6 }} key={p.id}>
                  <HoverDevCard onClick={() => navigate(`/analysis/${p.symbol}`)}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: { xs: 1.5, sm: 2, md: 2.5 }, borderRadius: 2, bgcolor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderLeft: `4px solid ${m.profit >= 0 ? "#16a34a" : "#dc2626"}`,
                      cursor: 'pointer',
                      transition: 'box-shadow 0.2s',
                      '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.06)' },
                    }}
                    
                  >


                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={{ xs: 1, sm: 1.5 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', fontSize: { xs: '0.95rem', sm: '1rem', md: '1.1rem' } }}>
                            {p.symbol}
                          </Typography>
                          <Chip
                            label={p.isLive ? "LIVE" : "STATIC"}
                            size="small"
                            sx={{
                              fontSize: { xs: '0.65rem', sm: '0.7rem' }, height: { xs: 18, sm: 20 }, fontWeight: 600,
                              bgcolor: p.isLive ? '#dcfce7' : '#fef9c3',
                              color: p.isLive ? '#16a34a' : '#a16207',
                            }}
                          />
                        </Stack>
                        <Typography variant="caption" sx={{ color: '#6b7280', fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
                          Qty: {p.quantity} &middot; Buy: ₹{fmt(p.buyPrice)}
                        </Typography>
                        <Box sx={{ mt: 0.5 }}>
                          <Typography variant="body2" sx={{ fontFamily: '"JetBrains Mono", monospace', color: '#334155', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                            Current: ₹{fmt(p.currentPrice)}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#6b7280', fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                            Invested: ₹{fmt(m.invested)} →   Value: ₹{fmt(m.currentValue)}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                        <Typography variant="subtitle1" sx={{
                          fontFamily: '"JetBrains Mono", monospace', fontWeight: 700,
                          color: m.profit >= 0 ? "#16a34a" : "#dc2626",
                          fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' }
                        }}>
                          {m.profit >= 0 ? "+" : ""}₹{fmt(Math.abs(m.profit))}
                        </Typography>
                        <Typography variant="caption" sx={{
                          fontFamily: '"JetBrains Mono", monospace',
                          color: m.returnPct >= 0 ? "#16a34a" : "#dc2626",
                          fontSize: { xs: '0.65rem', sm: '0.75rem' }
                        }}>
                          {m.returnPct >= 0 ? "+" : ""}{m.returnPct.toFixed(2)}%
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                  </HoverDevCard>
                </Grid>
              );
            })}
          </Grid>
        )}
        </Grid>
        
        <Grid sx={{borderColor: "black"}}size={{ xs: 12, lg: 4}} id="portfolio-allocation-chart">
          
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 2.5, md: 3 },
              borderRadius: 2,
              border: "1px solid #e5e7eb",
              height: { xs: 'auto', md: 550 },
            }}
          >
            <Typography sx={{ fontWeight: 700, mb: 2, fontSize: { xs: '0.95rem', sm: '1rem', md: '1.1rem' } }}>
              Portfolio Allocation
            </Typography>

            <HighchartsReact
              highcharts={Highcharts}
              options={chartOptions}
            />

          </Paper>
          
        </Grid>
        </Grid>
        </Box>
        
      
      
    </motion.div>
  );
}

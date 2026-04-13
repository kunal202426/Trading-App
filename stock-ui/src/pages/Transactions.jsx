import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Box, Button, TextField,
  Typography, Paper, Grid, Stack, Chip, CircularProgress,
} from "@mui/material";
import { motion } from "framer-motion";
import {
  collection, addDoc, deleteDoc,
  doc, onSnapshot, serverTimestamp, query, orderBy,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";

export default function Transactions() {
  const { user }                    = useAuth();
  const [symbol, setSymbol]         = useState("");
  const [buyPrice, setBuyPrice]     = useState("");
  const [quantity, setQuantity]     = useState("");
  const [error, setError]           = useState("");
  const [saving, setSaving]         = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx]   = useState(true);

  // Real-time listener
  useEffect(() => {
    if (!user) return;
    const ref = collection(db, "users", user.uid, "transactions");
    const q   = query(ref, orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTransactions(data);
      setLoadingTx(false);
    });
    return () => unsub();
  }, [user]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");
    if (!symbol.trim()) { setError("Symbol is required."); return; }
    if (!buyPrice || isNaN(buyPrice) || Number(buyPrice) <= 0) {
      setError("Enter a valid buy price."); return;
    }
    if (!quantity || isNaN(quantity) || Number(quantity) <= 0) {
      setError("Enter a valid quantity."); return;
    }
    setSaving(true);
    try {
      const ref = collection(db, "users", user.uid, "transactions");
      await addDoc(ref, {
        symbol:    symbol.trim().toUpperCase(),
        buyPrice:  Number(buyPrice),
        quantity:  Number(quantity),
        createdAt: serverTimestamp(),
      });
      setSymbol("");
      setBuyPrice("");
      setQuantity("");
    } catch (err) {
      setError("Failed to save. Check your connection.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "users", user.uid, "transactions", id));
    } catch {
      setError("Failed to delete transaction.");
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <Box sx={{ bgcolor: '#f3f4f6', minHeight: '100vh', px: { xs: 1.5, sm: 2, md: 3, lg: 4 }, py: { xs: 2, sm: 3, md: 4 }, maxWidth: 900, mx: 'auto', boxSizing: 'border-box', overflowX: 'hidden' }}>

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
              Transactions
            </Typography>
            <Typography variant="body2" sx={{ color: '#6b7280', fontSize: { xs: '0.75rem', sm: '0.85rem' } }}>
              Logged in as: <strong>{user?.displayName || user?.email}</strong>
            </Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 1 }} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            <Button component={Link} to="/portfolio" variant="outlined" size="small" sx={{ textTransform: 'none', fontWeight: 600, width: { xs: '100%', sm: 'auto' } }}>
              Back to Portfolio
            </Button>
          </Stack>
        </Stack>

        {/* Add form */}
        <Paper elevation={0} sx={{ p: { xs: 2, sm: 2.5, md: 3 }, borderRadius: 2, border: '1px solid #e5e7eb', bgcolor: '#ffffff', mb: { xs: 2, md: 3 } }} id="transactions-form">
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: '#0f172a', fontSize: { xs: '0.95rem', sm: '1rem', md: '1.1rem' } }}>
            Add Transaction
          </Typography>

          <Box component="form" onSubmit={handleAdd}>
            <Grid container spacing={{ xs: 1.5, sm: 2 }}>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  label="Symbol"
                  placeholder="e.g. TCS"
                  fullWidth
                  size="small"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  inputProps={{ style: { textTransform: "uppercase" } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  label="Buy Price (₹)"
                  type="number"
                  fullWidth
                  size="small"
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(e.target.value)}
                  inputProps={{ min: 0, step: "0.01" }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  label="Quantity"
                  type="number"
                  fullWidth
                  size="small"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  inputProps={{ min: 1, step: 1 }}
                />
              </Grid>
            </Grid>

            {error && (
              <Box sx={{ mt: 2, p: { xs: 1, sm: 1.5 }, borderRadius: 2, border: "1px solid #fecaca", bgcolor: "#fee2e2", color: "#b91c1c", fontSize: { xs: '0.75rem', sm: '0.85rem' } }}>
                {error}
              </Box>
            )}

            <Button
              type="submit" variant="contained" size="small" sx={{ mt: 2, textTransform: 'none', fontWeight: 600, width: { xs: '100%', sm: 'auto' } }}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={16} /> : null}
            >
              {saving ? "Saving..." : "Add Transaction"}
            </Button>
          </Box>
        </Paper>

        {/* List */}
        <Box id="transactions-list-section">
          <Typography variant="subtitle1" sx={{ mb: { xs: 1, md: 1.5 }, fontWeight: 700, color: '#0f172a', fontSize: { xs: '0.95rem', sm: '1.05rem', md: '1.15rem' } }}>
            All Holdings ({transactions.length})
          </Typography>

          {loadingTx ? (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
              <CircularProgress sx={{ color: '#1976d2' }} />
            </Box>
          ) : transactions.length === 0 ? (
            <Paper elevation={0} sx={{ p: 4, borderRadius: 2, textAlign: "center", color: '#6b7280', border: '1px solid #e5e7eb' }}>
              No transactions yet. Add your first holding above.
            </Paper>
          ) : (
            <Stack spacing={{ xs: 1, sm: 1.5 }}>
              {transactions.map((t) => (
                <Paper key={t.id} elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2, border: '1px solid #e5e7eb', bgcolor: '#ffffff' }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={{ xs: 1, sm: 2 }}>
                    <Stack direction="row" spacing={{ xs: 1, sm: 2 }} alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ width: '100%', overflowX: 'auto' }}>
                      <Typography variant="subtitle2" sx={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, color: '#0f172a', fontSize: { xs: '0.85rem', sm: '0.95rem' } }}>
                        {t.symbol}
                      </Typography>
                      <Chip label="BUY" size="small" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' }, height: { xs: 18, sm: 20 }, fontWeight: 600, bgcolor: '#dcfce7', color: '#16a34a' }} />
                      <Typography variant="caption" sx={{ color: '#6b7280', fontSize: { xs: '0.65rem', sm: '0.75rem' }, whiteSpace: 'nowrap', overflow: 'auto' }}>
                        Buy: ₹{Number(t.buyPrice).toLocaleString('en-IN')} &middot; Qty: {t.quantity} &middot; Total: ₹{(t.buyPrice * t.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Typography>
                    </Stack>
                    <Button
                      size="small" variant="outlined" color="error"
                      onClick={() => handleDelete(t.id)}
                      sx={{ textTransform: 'none', fontWeight: 600, width: { xs: '100%', sm: 'auto' } }}
                    >
                      Remove
                    </Button>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </Box>
      </Box>
    </motion.div>
  );
}

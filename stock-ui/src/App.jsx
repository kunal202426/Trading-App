import { useState } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  Box, CircularProgress, Drawer, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Toolbar, Divider, Typography,
} from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PublicIcon from "@mui/icons-material/Public";
import { AnimatePresence } from "framer-motion";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Navbar from "./components/layout/Navbar.jsx";
import Dashboard from "./pages/Dashboard.jsx";

import Portfolio from "./pages/Portfolio.jsx";
import ModelHealth from "./pages/ModelHealth.jsx";
import DeepAnalysis from "./pages/DeepAnalysis.jsx";
import MacroDashboard from "./pages/MacroDashboard";
import Seasonality from "./pages/Seasonality";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Transactions from "./pages/Transactions";
import Landing from "./pages/Landing";

const ProtectedRoute = ({ children }) => {
  const { user, authLoading } = useAuth();
  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', bgcolor: '#f3f4f6' }}>
        <CircularProgress size={48} sx={{ color: '#1976d2' }} />
      </Box>
    );
  }
  return user ? children : <Navigate to="/" replace />;
};

const NAV_ITEMS = [
  { label: "Portfolio",          icon: <AccountBalanceWalletIcon />, path: "/portfolio" },
  { label: "Transactions",      icon: <ReceiptLongIcon />,          path: "/transactions" },
  { divider: true },
  { label: "YISIL AI Dashboard", icon: <DashboardIcon />,            path: "/dashboard" },
  { label: "Macro / Regime",    icon: <PublicIcon />,                path: "/macro" },
];

function AppRoutes() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [navSymbol, setNavSymbol] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavSearch = () => {
    if (navSymbol.trim()) {
      navigate("/dashboard", { state: { symbol: navSymbol.trim().toUpperCase() } });
      setNavSymbol('');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  const isAuthPage = ["/login", "/signup", "/"].includes(location.pathname);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Mobile-only drawer (hamburger menu) */}
      {user && !isAuthPage && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: { xs: 260, sm: 300 },
              boxSizing: 'border-box',
              bgcolor: '#ffffff',
            },
          }}
        >
          <Toolbar sx={{ justifyContent: 'center' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#94a3b8', letterSpacing: '.1em', fontSize: 11 }}>
              NAVIGATION
            </Typography>
          </Toolbar>
          <Box sx={{ overflow: 'auto' }}>
            <List sx={{ px: 1 }}>
              {NAV_ITEMS.map((item, i) =>
                item.divider ? (
                  <Divider key={`d-${i}`} sx={{ my: 1, borderColor: '#e5e7eb' }} />
                ) : (
                  <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      selected={location.pathname === item.path || (item.path === '/analysis' && location.pathname.startsWith('/analysis'))}
                      onClick={() => { navigate(item.path); setMobileOpen(false); }}
                      sx={{
                        borderRadius: 2,
                        '&.Mui-selected': { bgcolor: '#eff6ff', color: '#1976d2' },
                        '&.Mui-selected .MuiListItemIcon-root': { color: '#1976d2' },
                        '&:hover': { bgcolor: '#f8fafc' },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 36, color: '#64748b' }}>{item.icon}</ListItemIcon>
                      <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 13, fontWeight: 600 }} />
                    </ListItemButton>
                  </ListItem>
                )
              )}
            </List>
          </Box>
        </Drawer>
      )}

      {/* Navbar */}
      {user && !isAuthPage && (
        <Navbar
          symbol={navSymbol}
          onSymbolChange={setNavSymbol}
          onSearch={handleNavSearch}
          onLogout={handleLogout}
          onMenuToggle={() => setMobileOpen(true)}
        />
      )}

      {/* Page content */}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected routes */}
          <Route path="/portfolio" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
          <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          
          <Route path="/analysis/:symbol" element={<ProtectedRoute><DeepAnalysis /></ProtectedRoute>} />
          <Route path="/health" element={<ProtectedRoute><ModelHealth /></ProtectedRoute>} />
          <Route path="/macro" element={<ProtectedRoute><MacroDashboard /></ProtectedRoute>} />
          <Route path="/seasonality/:symbol" element={<ProtectedRoute><Seasonality /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/portfolio" replace />} />
        </Routes>
      </AnimatePresence>
    </Box>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

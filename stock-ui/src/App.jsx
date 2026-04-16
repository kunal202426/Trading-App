import { useState, useEffect, lazy, Suspense } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  Box, Drawer, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Toolbar, Divider, Typography,
  Grid,
} from "@mui/material";
import { HashLoader } from "react-spinners";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PublicIcon from "@mui/icons-material/Public";
import { AnimatePresence } from "framer-motion";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { TourOverlay } from "./tour/TourOverlay";
import { useTour } from "./tour/useTour";
import { TOUR_LOGIN_TRIGGER_KEY, hasDoneTour, clearQueuedTour } from "./tour/tourSteps";
import Navbar from "./components/layout/Navbar.jsx";

const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const Portfolio = lazy(() => import("./pages/Portfolio.jsx"));
const ModelHealth = lazy(() => import("./pages/ModelHealth.jsx"));
const DeepAnalysis = lazy(() => import("./pages/DeepAnalysis.jsx"));
const MacroDashboard = lazy(() => import("./pages/MacroDashboard"));
const Seasonality = lazy(() => import("./pages/Seasonality"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Transactions = lazy(() => import("./pages/Transactions"));
const Landing = lazy(() => import("./pages/Landing"));

const RouteLoader = () => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      bgcolor: "#f3f4f6",
    }}
  >
    <HashLoader color="#4361EE" size={44} speedMultiplier={1.05} />
  </Box>
);

const ProtectedRoute = ({ children }) => {
  const { user, authLoading } = useAuth();
  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', bgcolor: '#f3f4f6' }}>
        <HashLoader color="#4361EE" size={46} speedMultiplier={1.2} />
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
  const tour = useTour(false);

  // Keyboard shortcuts for tour
  useEffect(() => {
    if (!tour.active) return;
    const fn = (e) => {
      if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        tour.next();
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        tour.prev();
      }
      if (tour.canSkip && e.key === "Escape") {
        e.preventDefault();
        tour.skip();
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [tour.active, tour.canSkip, tour.next, tour.prev, tour.skip]);

  // Keep tour steps on the correct page.
  useEffect(() => {
    if (!tour.active) return;
    const stepRoute = tour.currentStep?.route;
    if (!stepRoute || location.pathname === stepRoute) return;
    navigate(stepRoute, { replace: true });
  }, [tour.active, tour.currentStep?.route, location.pathname, navigate]);

  // Auto-open drawer while introducing navigation.
  useEffect(() => {
    if (!tour.active) return;
    setMobileOpen(tour.currentStep?.id === "navigation-panel");
  }, [tour.active, tour.currentStep?.id]);

  const handleNavSearch = () => {
    if (navSymbol.trim()) {
      navigate("/dashboard", { state: { symbol: navSymbol.trim().toUpperCase() } });
      setNavSymbol('');
    }
  };

  const handleLogout = async () => {
    clearQueuedTour();
    await logout();
    navigate("/", { replace: true });
  };

  const handleRestartTour = () => {
    tour.restart();
    navigate("/portfolio", { replace: true });
  };

  const isAuthPage = ["/login", "/signup", "/"].includes(location.pathname);
  const isTourNavStep = tour.active && tour.currentStep?.id === "navigation-panel";

  // Start onboarding after login queue, and also auto-start on first portfolio entry.
  useEffect(() => {
    if (!user || tour.active) return;

    const queued = sessionStorage.getItem(TOUR_LOGIN_TRIGGER_KEY) === "1";
    const shouldAutoStartOnPortfolio = !hasDoneTour() && location.pathname === "/portfolio";

    if (!queued && !shouldAutoStartOnPortfolio) return;

    if (queued) {
      clearQueuedTour();
    }

    tour.restart();
  }, [user, tour.active, tour.restart, location.pathname]);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Mobile-only drawer (hamburger menu) */}
      {user && !isAuthPage && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          PaperProps={{ id: "app-navigation-panel" }}
          sx={{
            '& .MuiDrawer-paper': {
              width: { xs: isTourNavStep ? 286 : 260, sm: isTourNavStep ? 324 : 300 },
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
          onRestartTour={handleRestartTour}
        />
      )}

      {/* Page content */}
      <AnimatePresence mode="wait">
        <Suspense fallback={<RouteLoader />}>
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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AnimatePresence>

      {/* Tour Overlay - only show for authenticated users on protected pages */}
      {user && !isAuthPage && <TourOverlay tour={tour} pathKey={location.pathname} />}
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

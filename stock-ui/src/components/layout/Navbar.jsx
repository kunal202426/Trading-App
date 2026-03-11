import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar, Toolbar, Box, Typography, IconButton, Badge, Button,
  Menu, MenuItem, InputBase, useMediaQuery, useTheme, Divider,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircle from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PublicIcon from '@mui/icons-material/Public';
import { motion } from 'framer-motion';
import logo from '../../assets/logo.png';

export default function Navbar({ symbol, onSymbolChange, onSearch, onLogout, onMenuToggle }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // ── Live IST clock ──
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const istTime = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false });
  const istDate = now.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric',
  });

  // ── Profile menu ──
  const [profileAnchor, setProfileAnchor] = useState(null);
  const profileOpen = Boolean(profileAnchor);

  // ── Mobile menu ──
  const [mobileAnchor, setMobileAnchor] = useState(null);
  const mobileOpen = Boolean(mobileAnchor);

  // ── Search focus glow ──
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <motion.div
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 180, damping: 22 }}
    >
      <AppBar
        position="static"
        elevation={0}
        sx={{
          bgcolor: '#ffffff',
          borderRadius: { xs: 0, md: '12px' },
          m: { xs: 0, md: '12px' },
          width: { xs: '100%', md: 'calc(100% - 24px)' },
          boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', gap: 1, minHeight: { xs: 56, md: 64 } }}>

          {/* ── LEFT: Menu + Logo + Brand ── */}
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', userSelect: 'none' }}
            onClick={() => navigate('/dashboard')}
          >
            <IconButton size="small" sx={{ color: '#0f172a' }} onClick={(e) => { e.stopPropagation(); onMenuToggle?.(); }}>
              <MenuIcon />
            </IconButton>
            <Box
              component="img"
              src={logo}
              alt="Logo"
              sx={{ height: 32, display: { xs: 'none', sm: 'block' } }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <Typography
              sx={{
                letterSpacing: '.3em',
                fontSize: { xs: '0.8rem', sm: '0.95rem', md: '1rem' },
                fontWeight: 700,
                color: '#0f172a',
                whiteSpace: 'nowrap',
              }}
            >
              YISIL AI
            </Typography>
          </Box>

          {/* ── CENTER: Search ── */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              borderRadius: '50px',
              bgcolor: searchFocused ? 'rgba(25,118,210,0.08)' : 'rgba(25,118,210,0.05)',
              px: 2,
              transition: 'all 0.25s ease',
              boxShadow: searchFocused ? '0 0 0 3px rgba(25,118,210,0.25)' : 'none',
              '&:hover': { bgcolor: 'rgba(25,118,210,0.12)' },
              flex: { xs: 1, md: 'none' },
              mx: { xs: 1, md: 0 },
            }}
          >
            <SearchIcon
              sx={{ color: '#1976d2', fontSize: 20, mr: 1, cursor: 'pointer' }}
              onClick={() => onSearch?.()}
            />
            <InputBase
              placeholder="Search NSE Symbol..."
              value={symbol || ''}
              onChange={(e) => onSymbolChange?.(e.target.value.toUpperCase())}
              onKeyDown={(e) => { if (e.key === 'Enter') onSearch?.(); }}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              sx={{
                color: '#0f172a',
                fontSize: '0.875rem',
                width: { xs: '100%', md: '22ch' },
                '& ::placeholder': { color: '#94a3b8', opacity: 1 },
              }}
            />
          </Box>

          {/* ── RIGHT: Desktop ── */}
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Macro / Regime nav */}
              <Button
                size="small"
                variant="text"
                onClick={() => navigate('/macro')}
                startIcon={<PublicIcon fontSize="small" />}
                sx={{ color: '#64748b', textTransform: 'none', fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.85rem', md: '0.9rem' }, whiteSpace: 'nowrap' }}
              >
                Macro / Regime
              </Button>

              {/* Live clock */}
              <Box sx={{ textAlign: 'right', mr: 1, display: { xs: 'none', lg: 'block' } }}>
                <Typography sx={{
                  fontFamily: '"JetBrains Mono", monospace', color: '#1976d2',
                  fontSize: { xs: '0.8rem', md: '0.95rem' }, fontWeight: 600, lineHeight: 1.2,
                }}>
                  {istTime}
                </Typography>
                <Typography sx={{
                  fontFamily: '"JetBrains Mono", monospace', color: '#94a3b8',
                  fontSize: { xs: '0.6rem', md: '0.65rem' },
                }}>
                  {istDate} IST
                </Typography>
              </Box>

              {/* Notifications */}
              <IconButton sx={{ color: '#64748b' }}>
                <Badge badgeContent={0} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>

              {/* Profile */}
              <IconButton
                sx={{ color: '#64748b' }}
                onClick={(e) => setProfileAnchor(e.currentTarget)}
              >
                <AccountCircle />
              </IconButton>
              <Menu
                anchorEl={profileAnchor}
                open={profileOpen}
                onClose={() => setProfileAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{
                  sx: { mt: 1, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
                }}
              >
                <MenuItem onClick={() => setProfileAnchor(null)}>Profile</MenuItem>
                <MenuItem onClick={() => setProfileAnchor(null)}>My Account</MenuItem>
                <MenuItem onClick={() => { setProfileAnchor(null); onLogout?.(); }}>Logout</MenuItem>
              </Menu>

              {/* Logout */}
              <IconButton sx={{ color: '#64748b' }} onClick={() => onLogout?.()}>
                <LogoutIcon />
              </IconButton>
            </Box>
          )}

          {/* ── RIGHT: Mobile ── */}
          {isMobile && (
            <>
              <IconButton sx={{ color: '#64748b' }} onClick={(e) => setMobileAnchor(e.currentTarget)}>
                <MoreVertIcon />
              </IconButton>
              <Menu
                anchorEl={mobileAnchor}
                open={mobileOpen}
                onClose={() => setMobileAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{
                  sx: { mt: 1, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
                }}
              >
                <MenuItem onClick={() => { navigate('/dashboard'); setMobileAnchor(null); }}>Dashboard</MenuItem>
                <MenuItem onClick={() => { navigate('/portfolio'); setMobileAnchor(null); }}>Portfolio</MenuItem>
                <MenuItem onClick={() => { navigate('/macro'); setMobileAnchor(null); }}>Macro / Regime</MenuItem>
                <Divider />
                <MenuItem onClick={() => setMobileAnchor(null)} sx={{ gap: 1 }}>
                  <AccountCircle fontSize="small" sx={{ color: '#64748b' }} /> Profile
                </MenuItem>
                <MenuItem onClick={() => { setMobileAnchor(null); onLogout?.(); }} sx={{ gap: 1, color: '#dc2626' }}>
                  <LogoutIcon fontSize="small" /> Logout
                </MenuItem>
              </Menu>
            </>
          )}

        </Toolbar>
      </AppBar>
    </motion.div>
  );
}

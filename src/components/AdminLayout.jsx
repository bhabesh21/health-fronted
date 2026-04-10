import { useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  ButtonBase,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  InputBase,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Toolbar,
  Typography,
  useMediaQuery
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import NotificationsIcon from "@mui/icons-material/Notifications";
import DashboardIcon from "@mui/icons-material/Dashboard";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import PeopleIcon from "@mui/icons-material/People";
import EventIcon from "@mui/icons-material/Event";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import AssessmentIcon from "@mui/icons-material/Assessment";
import SettingsIcon from "@mui/icons-material/Settings";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";
import { AUTH_KEY } from "./RequireAuth.jsx";
import hospitalLogo from "../assets/hospital-logo.svg";

const drawerWidth = 260;

export default function AdminLayout() {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState(null);
  const [search, setSearch] = useState("");

  const profileOpen = Boolean(profileAnchorEl);
  const notifOpen = Boolean(notifAnchorEl);

  const menuItems = useMemo(
    () => [
      { label: "Dashboard", to: "/dashboard", icon: <DashboardIcon /> },
      { label: "Doctors", to: "/doctors", icon: <LocalHospitalIcon /> },
      { label: "Patients", to: "/patients", icon: <PeopleIcon /> },
      { label: "Appointments", to: "/appointments", icon: <EventIcon /> },
      { label: "Billing", to: "/billing", icon: <ReceiptLongIcon /> },
      { label: "Reports", to: "/reports", icon: <AssessmentIcon /> },
      { label: "Settings", to: "/settings", icon: <SettingsIcon /> }
    ],
    []
  );

  const notifications = useMemo(
    () => [
      { id: 1, title: "New appointment request", meta: "2 minutes ago" },
      { id: 2, title: "Payment received (INV-9012)", meta: "1 hour ago" },
      { id: 3, title: "Doctor profile updated", meta: "Today" }
    ],
    []
  );

  function handleToggleMobile() {
    setMobileOpen((open) => !open);
  }

  function handleOpenProfile(event) {
    setProfileAnchorEl(event.currentTarget);
  }

  function handleCloseProfile() {
    setProfileAnchorEl(null);
  }

  function handleOpenNotif(event) {
    setNotifAnchorEl(event.currentTarget);
  }

  function handleCloseNotif() {
    setNotifAnchorEl(null);
  }

  function handleLogout() {
    try {
      localStorage.removeItem(AUTH_KEY);
    } finally {
      handleCloseProfile();
      navigate("/login", { replace: true });
    }
  }

  const drawerContent = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Toolbar sx={{ px: 2, gap: 1.25 }}>
        <Box
          component="img"
          src={hospitalLogo}
          alt="HealthSync"
          sx={{ width: 34, height: 34, flex: "0 0 auto" }}
        />
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" noWrap component="div" sx={{ lineHeight: 1.1 }}>
            HealthSync
          </Typography>
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
            Admin Console
          </Typography>
        </Box>
      </Toolbar>
      <Divider sx={{ borderColor: "rgba(255,255,255,0.12)" }} />
      <List sx={{ px: 1 }}>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.to}
            component={NavLink}
            to={item.to}
            onClick={!isMdUp ? () => setMobileOpen(false) : undefined}
            sx={{
              position: "relative",
              borderRadius: 1.25,
              my: 0.75,
              color: "rgba(255,255,255,0.85)",
              "& .MuiListItemIcon-root": { color: "rgba(255,255,255,0.75)" },
              "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
              "&.active": {
                bgcolor: "rgba(255,255,255,0.12)",
                color: "#fff",
                "& .MuiListItemIcon-root": { color: "#fff" },
                "&::before": {
                  content: '""',
                  position: "absolute",
                  left: 6,
                  top: 8,
                  bottom: 8,
                  width: 4,
                  borderRadius: 999,
                  background: "linear-gradient(180deg, #60a5fa 0%, #a78bfa 100%)"
                }
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 42 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
      <Box sx={{ flex: 1 }} />
      <Divider sx={{ borderColor: "rgba(255,255,255,0.12)" }} />
      <Box sx={{ p: 2, color: "rgba(255,255,255,0.6)", fontSize: 12 }}>
        © {new Date().getFullYear()} HealthSync
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <CssBaseline />

      <AppBar
        position="fixed"
        color="transparent"
        elevation={0}
        sx={{
          backdropFilter: "blur(10px)",
          bgcolor: "rgba(255,255,255,0.85)",
          borderBottom: "1px solid",
          borderColor: "divider",
          zIndex: (t) => t.zIndex.drawer + 1
        }}
      >
        <Toolbar sx={{ gap: 1.25 }}>
          {!isMdUp && (
            <IconButton
              color="inherit"
              aria-label="open sidebar"
              edge="start"
              onClick={handleToggleMobile}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box component="img" src={hospitalLogo} alt="HealthSync" sx={{ width: 28, height: 28 }} />
            <Typography variant="h6" component="div">
              HealthSync
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Paper
            elevation={0}
            sx={{
              display: { xs: "none", md: "flex" },
              alignItems: "center",
              gap: 1,
              px: 1.25,
              py: 0.5,
              borderRadius: 999,
              bgcolor: "rgba(0,0,0,0.04)",
              border: "1px solid rgba(0,0,0,0.06)",
              minWidth: 320
            }}
          >
            <SearchIcon sx={{ color: "text.secondary" }} />
            <InputBase
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patients, doctors, invoices…"
              sx={{ flex: 1, fontSize: 14 }}
              inputProps={{ "aria-label": "search" }}
            />
          </Paper>

          <IconButton
            onClick={handleOpenNotif}
            aria-controls={notifOpen ? "notif-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={notifOpen ? "true" : undefined}
            sx={{
              ml: { xs: 0, md: 0.5 },
              bgcolor: "rgba(0,0,0,0.04)",
              border: "1px solid rgba(0,0,0,0.06)",
              "&:hover": { bgcolor: "rgba(0,0,0,0.06)" }
            }}
          >
            <Badge badgeContent={notifications.length} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          <Menu
            id="notif-menu"
            anchorEl={notifAnchorEl}
            open={notifOpen}
            onClose={handleCloseNotif}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            PaperProps={{
              sx: {
                mt: 1,
                minWidth: 320,
                borderRadius: 2,
                overflow: "hidden"
              }
            }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography sx={{ fontWeight: 800, lineHeight: 1.1 }}>Notifications</Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                You have {notifications.length} new updates
              </Typography>
            </Box>
            <Divider />
            {notifications.map((n) => (
              <MenuItem
                key={n.id}
                onClick={() => {
                  handleCloseNotif();
                  navigate("/appointments");
                }}
                sx={{ py: 1.25 }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: 14 }} noWrap>
                    {n.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {n.meta}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Menu>

          <ButtonBase
            onClick={handleOpenProfile}
            aria-controls={profileOpen ? "profile-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={profileOpen ? "true" : undefined}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 1,
              py: 0.5,
              borderRadius: 999,
              bgcolor: "rgba(0,0,0,0.04)",
              border: "1px solid rgba(0,0,0,0.06)",
              transition: "all 120ms ease",
              "&:hover": {
                bgcolor: "rgba(0,0,0,0.06)"
              }
            }}
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>A</Avatar>
            <Box sx={{ textAlign: "left", display: { xs: "none", sm: "block" } }}>
              <Typography sx={{ fontSize: 13, lineHeight: 1.1, fontWeight: 700 }}>
                Admin
              </Typography>
              <Typography sx={{ fontSize: 12, lineHeight: 1.1, color: "text.secondary" }}>
                Administrator
              </Typography>
            </Box>
          </ButtonBase>

          <Menu
            id="profile-menu"
            anchorEl={profileAnchorEl}
            open={profileOpen}
            onClose={handleCloseProfile}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            PaperProps={{
              sx: {
                mt: 1,
                minWidth: 220,
                borderRadius: 2,
                overflow: "hidden"
              }
            }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography sx={{ fontWeight: 800, lineHeight: 1.1 }}>Admin</Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                admin@healthsync.local
              </Typography>
            </Box>
            <Divider />
            <MenuItem
              onClick={() => {
                handleCloseProfile();
                navigate("/settings");
              }}
            >
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleCloseProfile();
                navigate("/settings");
              }}
            >
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              Settings
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
              <ListItemIcon sx={{ color: "error.main" }}>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="sidebar"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleToggleMobile}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              borderRight: 0,
              background: "linear-gradient(180deg, #0b1220 0%, #0f1b35 100%)",
              color: "#fff"
            }
          }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              borderRight: 0,
              background: "linear-gradient(180deg, #0b1220 0%, #0f1b35 100%)",
              color: "#fff"
            }
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          bgcolor: "#f7f8fa"
        }}
      >
        <Toolbar />
        <Box className="container-fluid py-3">
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

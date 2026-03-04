// Update client/src/App.tsx
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useOutlet } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, CircularProgress, Box } from '@mui/material';
import theme from './theme/theme';
import { Preferences } from '@capacitor/preferences';
import { AnimatePresence } from 'framer-motion';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './queryClient';
import PageTransition from './components/PageTransition';
import { syncManager } from './utils/syncManager';

// Import Pages
import AppLayout from './components/AppLayout';
import Home from './pages/Home';
import AddCow from './pages/AddCow';
import SearchCow from './pages/SearchCow';
import CowProfile from './pages/CowProfile';
import MyCows from './pages/MyCows';
import UserProfile from './pages/UserProfile';
import Onboarding from './pages/Onboarding';
import Register from './pages/Register';
import Login from './pages/Login';
import OfflineSync from './pages/OfflineSync';

const AnimatedOutlet = () => {
  const location = useLocation();
  const outlet = useOutlet();

  return (
    <AnimatePresence mode="wait">
      <PageTransition key={location.pathname}>
        {outlet}
      </PageTransition>
    </AnimatePresence>
  );
};

const MainLayout = ({ isFirstLaunch, isAuthenticated }: { isFirstLaunch: boolean; isAuthenticated: boolean }) => {
  if (isFirstLaunch) return <Navigate to="/onboarding" replace />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <AppLayout>
      <AnimatedOutlet />
    </AppLayout>
  );
};

const AnimatedRoutes: React.FC<{ isFirstLaunch: boolean; isAuthenticated: boolean }> = ({ isFirstLaunch, isAuthenticated }) => {
  const location = useLocation();
  const isMainRoute = ['/', '/home', '/add-cow', '/search', '/my-cows', '/user-profile', '/offline-sync'].includes(location.pathname) || location.pathname.startsWith('/profile/');

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={isMainRoute ? 'main' : location.pathname}>
        {/* Onboarding & Registration Routes */}
        <Route path="/onboarding" element={<PageTransition>{isFirstLaunch ? <Onboarding /> : <Navigate to="/" replace />}</PageTransition>} />
        <Route path="/register" element={<PageTransition>{isAuthenticated ? <Navigate to="/" replace /> : <Register />}</PageTransition>} />
        <Route path="/login" element={<PageTransition>{isAuthenticated ? <Navigate to="/" replace /> : <Login />}</PageTransition>} />

        {/* Main App Routes (Guarded & Wrapped in Layout) */}
        <Route element={<PageTransition><MainLayout isFirstLaunch={isFirstLaunch} isAuthenticated={isAuthenticated} /></PageTransition>}>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="/add-cow" element={<AddCow />} />
          <Route path="/search" element={<SearchCow />} />
          <Route path="/profile/:id" element={<CowProfile />} />
          <Route path="/my-cows" element={<MyCows />} />
          <Route path="/user-profile" element={<UserProfile />} />
          <Route path="/offline-sync" element={<OfflineSync />} />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AnimatePresence>
  );
};

const App: React.FC = () => {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAppState = async () => {
      // Check onboarding
      const { value: introValue } = await Preferences.get({ key: 'hasSeenIntro' });
      setIsFirstLaunch(introValue !== 'true');

      // Check auth token
      const { value: tokenValue } = await Preferences.get({ key: 'jwt_token' });
      setIsAuthenticated(!!tokenValue);
    };
    checkAppState();

    window.addEventListener('auth-change', checkAppState);

    // Background sync on app load & when online
    syncManager.syncAll();
    const handleOnline = () => syncManager.syncAll();
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('auth-change', checkAppState);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // Show a loading spinner while checking local storage
  if (isFirstLaunch === null || isAuthenticated === null) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'primary.main' }}>
        <CircularProgress color="inherit" />
      </Box>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <AnimatedRoutes isFirstLaunch={isFirstLaunch} isAuthenticated={isAuthenticated} />
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
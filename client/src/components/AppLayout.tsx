import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    AppBar, Toolbar, Typography, Box, IconButton, BottomNavigation,
    BottomNavigationAction, Paper, Avatar, Stack
} from '@mui/material';
import {
    Home as HomeIcon, Search as SearchIcon, Pets as CowIcon,
    Person as ProfileIcon, Menu as MenuIcon, Notifications as AlertIcon,
    CloudSync as CloudSyncIcon
} from '@mui/icons-material';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { syncManager } from '../utils/syncManager';
import { Badge } from '@mui/material';
import BrandingFooter from './BrandingFooter';

interface AppLayoutProps {
    children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
    const [pendingCount, setPendingCount] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();
    const mainRef = useRef<HTMLDivElement>(null);

    // Scroll to top of main container on route change
    useEffect(() => {
        if (mainRef.current) {
            mainRef.current.scrollTo(0, 0);
        }
    }, [location.pathname]);

    // Map current URL to BottomNavigation value
    let navValue = 0;
    if (location.pathname.startsWith('/my-cows')) navValue = 1;
    else if (location.pathname.startsWith('/search')) navValue = 2;
    else if (location.pathname.startsWith('/alerts')) navValue = 3;
    else if (location.pathname.startsWith('/user-profile')) navValue = 4;
    else navValue = 0; // Default to Home for '/' or unrecognized routes

    useEffect(() => {
        // Poll localforage occasionally to keep indicator updated (in a real app, use Context or Redux)
        const checkSyncs = async () => {
            const cows = await syncManager.getPendingCows();
            setPendingCount(cows.length);
        };
        checkSyncs();
        const interval = setInterval(checkSyncs, 10000);

        // Upload when coming online
        const handleOnline = async () => {
            const result = await syncManager.syncAll();
            if (result.success && result.syncedCount > 0) {
                setPendingCount(0);
            }
        };

        window.addEventListener('online', handleOnline);
        return () => {
            clearInterval(interval);
            window.removeEventListener('online', handleOnline);
        };
    }, []);

    // 1. Setup Status Bar Appearance on Mount
    useEffect(() => {
        if (Capacitor.isNativePlatform()) {
            StatusBar.setStyle({ style: Style.Dark }); // White text icons
            StatusBar.setBackgroundColor({ color: '#2E7D32' }); // Match your App Bar Green
            StatusBar.setOverlaysWebView({ overlay: false }); // Pushes app DOWN so it doesn't overlap
        }
    }, []);

    const handleNavClick = (path: string) => {
        if (location.pathname === '/add-cow') {
            const confirmLeave = window.confirm('You are currently registering a new cow. If you leave, your progress will be lost. Are you sure you want to exit?');
            if (confirmLeave) {
                navigate(path);
            }
        } else {
            navigate(path);
        }
    };

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            overflow: 'hidden',
            // CRITICAL FIX: Safe Area for Top (Status Bar) & Bottom (Home Bar)
            pt: 'env(safe-area-inset-top)',
            pb: 'env(safe-area-inset-bottom)',
            bgcolor: 'primary.main' // Fills the status bar area with green
        }}>

            {/* 2. TOP APP BAR */}
            <AppBar position="static" elevation={0} sx={{ zIndex: 1100 }}>
                <Toolbar>
                    <IconButton edge="start" color="inherit" sx={{ mr: 2 }}>
                        <MenuIcon />
                    </IconButton>

                    <Stack direction="row" alignItems="center" sx={{ flexGrow: 1, gap: 1.5 }}>
                        <Box sx={{
                            bgcolor: 'white',
                            borderRadius: '50%',
                            p: 0.25,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 44,
                            height: 44
                        }}>
                            <Box
                                component="img"
                                src="/logo.png"
                                alt="Mo Pashu Logo"
                                sx={{ width: 40, height: 40, objectFit: 'contain' }}
                            />
                        </Box>
                        <Stack direction="column">
                            <Typography variant="h6" sx={{ lineHeight: 1.2 }}>Mo Pashu</Typography>
                            <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                'My Herd Manager'
                            </Typography>
                        </Stack>
                    </Stack>

                    <IconButton color="inherit" sx={{ mr: 1 }} onClick={() => handleNavClick('/offline-sync')}>
                        <Badge badgeContent={pendingCount} color="error">
                            <CloudSyncIcon />
                        </Badge>
                    </IconButton>

                    <Avatar
                        //src={ }
                        sx={{ width: 32, height: 32, border: '2px solid rgba(255,255,255,0.8)' }}
                    />
                </Toolbar >
            </AppBar >

            {/* 3. MAIN CONTENT (Scrollable) */}
            <Box
                component="main"
                ref={mainRef}
                sx={{
                    flexGrow: 1,
                    overflowY: 'auto',
                    bgcolor: 'background.default',
                    // Add extra padding at bottom so content isn't hidden behind Bottom Nav
                    pb: 8,
                    // Rounded corners at top to look like a modern "Sheet"
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <Box sx={{ flexGrow: 1, flexShrink: 0 }}>
                    {children}
                </Box>
                <BrandingFooter sx={{ mb: 2 }} />
            </Box >

            {/* 4. BOTTOM NAVIGATION */}
            < Paper
                sx={{
                    position: 'fixed',
                    bottom: 0, left: 0, right: 0,
                    zIndex: 1200, borderRadius: 0,
                    // CRITICAL: Push up from bottom home bar
                    pb: 'env(safe-area-inset-bottom)',
                    bgcolor: 'white'
                }}
                elevation={10}
            >
                <BottomNavigation
                    showLabels
                    value={navValue}
                >
                    <BottomNavigationAction value={0} label="Home" onClick={() => handleNavClick('/')} icon={<HomeIcon />} />
                    <BottomNavigationAction value={1} label="My Cows" onClick={() => handleNavClick('/my-cows')} icon={<CowIcon />} />

                    <BottomNavigationAction
                        value={2}
                        label="Search"
                        onClick={() => handleNavClick('/search')}
                        icon={
                            <Box sx={{
                                bgcolor: navValue === 2 ? 'primary.dark' : 'primary.main',
                                color: 'white',
                                p: 1.5,
                                borderRadius: '16px',
                                mt: -2,
                                border: '3px solid white',
                                boxShadow: navValue === 2
                                    ? '0px 6px 16px rgba(46, 125, 50, 0.4)'
                                    : '0px 4px 10px rgba(0,0,0,0.2)',
                                transition: 'all 0.2s ease-in-out',
                                transform: navValue === 2 ? 'scale(1.05)' : 'scale(1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <SearchIcon fontSize="medium" />
                            </Box>
                        }
                    />

                    <BottomNavigationAction value={3} label="Alerts" onClick={() => alert('Alerts coming soon!')} icon={<AlertIcon />} />
                    <BottomNavigationAction value={4} label="Profile" onClick={() => handleNavClick('/user-profile')} icon={<ProfileIcon />} />
                </BottomNavigation>
            </Paper >
        </Box >
    );
};

export default AppLayout;
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import NeuralNetworkSplash from "@/components/NeuralNetworkSplash";
import Layout from "@/components/layout/Layout";
import HomePage from "@/pages/HomePage";
import AboutPage from "@/pages/AboutPage";
import CommitteePage from "@/pages/CommitteePage";
import ExamPage from "@/pages/ExamPage";
import SeminarPage from "@/pages/SeminarPage";
import EventsPage from "@/pages/EventsPage";
import DonatePage from "@/pages/DonatePage";
import LoginPage from "@/pages/LoginPage";
import NotFoundPage from "@/pages/NotFoundPage";

// Admin imports
import { AdminLayout } from "@/components/admin/AdminLayout";
import AdminLoginPage from "@/pages/admin/AdminLoginPage";
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import AdminProfilePage from "@/pages/admin/AdminProfilePage";
import AdminMembersPage from "@/pages/admin/AdminMembersPage";
import AdminAnnouncementsPage from "@/pages/admin/AdminAnnouncementsPage";
import AdminAuditPage from "@/pages/admin/AdminAuditPage";
import AdminSettingsPage from "@/pages/admin/AdminSettingsPage";
import AdminPermissionsPage from "@/pages/admin/AdminPermissionsPage";
import AdminEventsPage from "@/pages/admin/AdminEventsPage";
import FinanceSubmitPage from "@/pages/admin/finance/FinanceSubmitPage";
import FinanceVerifyPage from "@/pages/admin/finance/FinanceVerifyPage";
import FinanceLedgerPage from "@/pages/admin/finance/FinanceLedgerPage";

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    // Apply dark theme immediately to prevent flash
    document.documentElement.classList.add('dark');
    
    // Check if splash was already shown this session
    const hasSeenSplash = sessionStorage.getItem('ausdav-splash-shown');
    
    if (hasSeenSplash) {
      setShowSplash(false);
      setAppReady(true);
    }
  }, []);

  const handleSplashComplete = () => {
    setAppReady(true);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            
            {showSplash && <NeuralNetworkSplash onComplete={handleSplashComplete} />}
            
            {appReady && (
              <BrowserRouter>
                <Routes>
                  {/* Public routes with Layout */}
                  <Route element={<Layout><HomePage /></Layout>} path="/" />
                  <Route element={<Layout><AboutPage /></Layout>} path="/about" />
                  <Route element={<Layout><CommitteePage /></Layout>} path="/committee" />
                  <Route element={<Layout><ExamPage /></Layout>} path="/exam" />
                  <Route element={<Layout><SeminarPage /></Layout>} path="/seminar" />
                  <Route element={<Layout><EventsPage /></Layout>} path="/events" />
                  <Route element={<Layout><DonatePage /></Layout>} path="/donate" />
                  <Route element={<Layout><LoginPage /></Layout>} path="/login" />
                  
                  {/* Admin login redirects to unified login */}
                  <Route path="/admin/login" element={<Navigate to="/login" replace />} />
                  <Route path="/admin" element={
                    <AdminAuthProvider>
                      <AdminLayout />
                    </AdminAuthProvider>
                  }>
                    <Route index element={<AdminDashboardPage />} />
                    <Route path="dashboard" element={<AdminDashboardPage />} />
                    <Route path="profile" element={<AdminProfilePage />} />
                    <Route path="members" element={<AdminMembersPage />} />
                    <Route path="events" element={<AdminEventsPage />} />
                    <Route path="announcements" element={<AdminAnnouncementsPage />} />
                    <Route path="permissions" element={<AdminPermissionsPage />} />
                    <Route path="audit" element={<AdminAuditPage />} />
                    <Route path="settings" element={<AdminSettingsPage />} />
                    <Route path="finance/submit" element={<FinanceSubmitPage />} />
                    <Route path="finance/verify" element={<FinanceVerifyPage />} />
                    <Route path="finance/ledger" element={<FinanceLedgerPage />} />
                  </Route>
                  
                  {/* 404 */}
                  <Route path="*" element={<Layout><NotFoundPage /></Layout>} />
                </Routes>
              </BrowserRouter>
            )}
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;

import { useState } from 'react';
import { SplashScreen } from '@/components/SplashScreen';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { ChatInterface } from '@/components/ChatInterface';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { MobileStatusBar } from '@/components/MobileStatusBar';
import { OfflineBanner } from '@/components/OfflineBanner';

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  const handleMenuClick = () => {
    setSidebarOpen(true);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Offline Banner */}
      <OfflineBanner />
      
      {/* Mobile Status Bar for PWA */}
      <MobileStatusBar />
      
      {/* Header - only show on mobile or when needed */}
      <div className="lg:hidden">
        <Header onMenuClick={handleMenuClick} />
      </div>
      
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} />
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:pt-0 pt-16">
        <ChatInterface />
      </main>

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  );
};

export default Index;

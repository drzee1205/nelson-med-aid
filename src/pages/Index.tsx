import { useState } from 'react';
import { SplashScreen } from '@/components/SplashScreen';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { ChatInterface } from '@/components/ChatInterface';

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header onMenuClick={handleMenuClick} />
      
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} />
      
      {/* Main Content */}
      <main className="pt-16 min-h-screen flex items-center justify-center">
        <ChatInterface />
      </main>
    </div>
  );
};

export default Index;

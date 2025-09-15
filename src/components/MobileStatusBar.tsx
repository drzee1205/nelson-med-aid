import { useEffect, useState } from 'react';
import { Wifi, WifiOff, Battery, Signal } from 'lucide-react';

export const MobileStatusBar = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Battery API (if supported)
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
        
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      });
    }

    // Time updates
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(timeInterval);
    };
  }, []);

  // Only show in standalone PWA mode
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                      (window.navigator as any).standalone ||
                      document.referrer.includes('android-app://');

  if (!isStandalone) return null;

  return (
    <div className="flex justify-between items-center px-4 py-1 bg-background border-b border-border/20 text-xs">
      {/* Left side - Time */}
      <div className="font-medium text-foreground">
        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>

      {/* Right side - Status indicators */}
      <div className="flex items-center gap-1 text-muted-foreground">
        {/* Network status */}
        {isOnline ? (
          <Signal className="w-3 h-3" />
        ) : (
          <WifiOff className="w-3 h-3 text-destructive" />
        )}

        {/* Wifi */}
        <Wifi className={`w-3 h-3 ${isOnline ? '' : 'text-muted-foreground/50'}`} />

        {/* Battery */}
        {batteryLevel !== null && (
          <div className="flex items-center gap-0.5">
            <Battery className={`w-3 h-3 ${batteryLevel < 20 ? 'text-destructive' : ''}`} />
            <span className="text-[10px]">{batteryLevel}%</span>
          </div>
        )}
      </div>
    </div>
  );
};
import { useState } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWA } from '@/hooks/usePWA';

export const PWAInstallPrompt = () => {
  const [dismissed, setDismissed] = useState(false);
  const { isInstallable, isInstalled, isStandalone, installApp } = usePWA();

  // Don't show if already installed, not installable, or dismissed
  if (!isInstallable || isInstalled || isStandalone || dismissed) {
    return null;
  }

  const handleInstall = async () => {
    const success = await installApp();
    if (!success) {
      setDismissed(true);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm">
      <div className="bg-background border border-border rounded-xl shadow-lg p-4 backdrop-blur-sm bg-background/95">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-foreground">
              Install Nelson-GPT
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
              Add to your home screen for faster access to pediatric medical guidance
            </p>
            
            <div className="flex gap-2 mt-3">
              <Button 
                size="sm" 
                onClick={handleInstall}
                className="flex-1 h-8 text-xs"
              >
                <Download className="w-3 h-3 mr-1" />
                Install
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setDismissed(true)}
                className="h-8 w-8 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
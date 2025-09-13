import { useState, useEffect } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [displayText, setDisplayText] = useState('');
  const [showSubheading, setShowSubheading] = useState(false);
  const [showFooter, setShowFooter] = useState(false);
  
  const titleText = 'Nelson-GPT';
  const subheadingText = 'Smart Pediatric Assistant';
  const footerText = 'Powered by Nelson Textbook of Pediatrics';

  useEffect(() => {
    let timeoutIds: NodeJS.Timeout[] = [];
    
    // Typewriter effect for title
    titleText.split('').forEach((char, index) => {
      const timeoutId = setTimeout(() => {
        setDisplayText(prev => prev + char);
      }, index * 100);
      timeoutIds.push(timeoutId);
    });

    // Show subheading after title is complete
    const subheadingTimeout = setTimeout(() => {
      setShowSubheading(true);
    }, titleText.length * 100 + 300);
    timeoutIds.push(subheadingTimeout);

    // Show footer after subheading
    const footerTimeout = setTimeout(() => {
      setShowFooter(true);
    }, titleText.length * 100 + 800);
    timeoutIds.push(footerTimeout);

    // Complete splash screen
    const completeTimeout = setTimeout(() => {
      onComplete();
    }, titleText.length * 100 + 1500);
    timeoutIds.push(completeTimeout);

    return () => {
      timeoutIds.forEach(clearTimeout);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
      <div className="text-center space-y-6 fade-in">
        {/* Main Title */}
        <div className="space-y-2">
          <h1 className="text-5xl font-bold text-foreground tracking-tight">
            {displayText}
            <span className="animate-pulse text-accent ml-1">|</span>
          </h1>
          
          {/* Subheading */}
          {showSubheading && (
            <p className="text-xl text-muted-foreground font-medium slide-up">
              {subheadingText}
            </p>
          )}
        </div>

        {/* Medical Symbol */}
        <div className="flex justify-center bounce-in">
          <div className="w-16 h-16 bg-medical-primary rounded-full flex items-center justify-center">
            <svg 
              className="w-8 h-8 text-medical-primary-foreground" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M12 2C13.1 2 14 2.9 14 4V8H18C19.1 8 20 8.9 20 10V14C20 15.1 19.1 16 18 16H14V20C14 21.1 13.1 22 12 22H12C10.9 22 10 21.1 10 20V16H6C4.9 16 4 15.1 4 14V10C4 8.9 4.9 8 6 8H10V4C10 2.9 10.9 2 12 2Z"/>
            </svg>
          </div>
        </div>

        {/* Footer */}
        {showFooter && (
          <p className="text-sm text-muted-foreground font-medium slide-up">
            {footerText}
          </p>
        )}
      </div>
    </div>
  );
};
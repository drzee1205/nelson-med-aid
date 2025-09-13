import { Menu, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header = ({ onMenuClick }: HeaderProps) => {
  return (
    <header className="fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-md border-b z-40">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Hamburger Menu */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="rounded-full w-10 h-10 hover:bg-secondary"
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Logo/Title - Hidden on small screens, shown on larger */}
        <div className="hidden md:block">
          <h1 className="text-lg font-semibold text-foreground">Nelson-GPT</h1>
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            className="text-sm font-medium hover:bg-secondary"
          >
            Sign In
          </Button>
          <Button 
            className="text-sm font-medium btn-medical-primary"
          >
            Sign Up
          </Button>
        </div>
      </div>
    </header>
  );
};
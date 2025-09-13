import { useState } from 'react';
import { X, Plus, Clock, Settings, User, BookOpen, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const [chatHistory] = useState([
    { id: 1, title: "Pediatric fever evaluation", time: "2 hours ago" },
    { id: 2, title: "Asthma management guidelines", time: "1 day ago" },
    { id: 3, title: "Developmental milestones", time: "3 days ago" },
  ]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 transition-opacity"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={`fixed top-0 left-0 h-full w-80 bg-background border-r z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-foreground">Nelson-GPT</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full w-8 h-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex flex-col h-full">
          {/* New Chat Button */}
          <div className="p-4">
            <Button className="w-full justify-start btn-medical-primary">
              <Plus className="w-4 h-4 mr-2" />
              New Chat
            </Button>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto px-4">
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Recent Chats
              </h3>
              {chatHistory.map((chat) => (
                <button
                  key={chat.id}
                  className="w-full text-left p-3 rounded-lg hover:bg-secondary transition-colors group"
                >
                  <div className="flex items-start space-x-3">
                    <Clock className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {chat.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {chat.time}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <Separator className="mx-4" />

          {/* Navigation Menu */}
          <div className="p-4 space-y-1">
            <Button 
              variant="ghost" 
              className="w-full justify-start hover:bg-secondary"
            >
              <BookOpen className="w-4 h-4 mr-3" />
              Medical References
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start hover:bg-secondary"
            >
              <Settings className="w-4 h-4 mr-3" />
              Settings
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start hover:bg-secondary"
            >
              <User className="w-4 h-4 mr-3" />
              Profile
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start hover:bg-secondary"
            >
              <AlertCircle className="w-4 h-4 mr-3" />
              About
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
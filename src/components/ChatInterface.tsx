import { useState } from 'react';
import { Send, Paperclip, Globe, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export const ChatInterface = () => {
  const [message, setMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      // Handle message submission
      console.log('Sending message:', message);
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="chat-container">
      {/* Main Wordmark */}
      <div className="text-center mb-12 fade-in">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2 tracking-tight">
          Nelson-GPT
        </h1>
        <p className="text-lg text-muted-foreground font-medium">
          powered by Nelson Book 📖 of Pediatrics
        </p>
      </div>

      {/* Suggested Prompts */}
      <div className="mb-8 fade-in">
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          {[
            "Fever in a 2-year-old",
            "Asthma management",
            "Growth chart interpretation",
            "Vaccine schedule"
          ].map((prompt, index) => (
            <Button
              key={index}
              variant="outline"
              className="text-sm hover:bg-secondary transition-colors"
              onClick={() => setMessage(prompt)}
            >
              {prompt}
            </Button>
          ))}
        </div>
        
        <div className="text-center">
          <p className="text-muted-foreground text-sm">
            Looking for something specific?
          </p>
        </div>
      </div>

      {/* Chat Input */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative bg-secondary/30 rounded-2xl border border-border/50 shadow-soft">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about pediatric conditions, treatments, or guidelines..."
            className="min-h-[64px] resize-none border-0 bg-transparent px-6 py-4 text-base placeholder:text-muted-foreground focus:ring-0 focus:outline-none"
            rows={isExpanded ? 4 : 1}
          />
          
          {/* Input Controls */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/20">
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full hover:bg-background"
              >
                <Send className="w-4 h-4 text-accent" />
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full hover:bg-background"
              >
                <Paperclip className="w-4 h-4 text-muted-foreground" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full hover:bg-background"
              >
                <Globe className="w-4 h-4 text-accent" />
              </Button>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-full hover:bg-background"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <ChevronUp className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        </div>
      </form>

      {/* Medical Disclaimer */}
      <div className="mt-6 text-center">
        <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto">
          This AI assistant provides educational information and should not replace professional medical advice. 
          Always consult with qualified healthcare providers for patient care decisions.
        </p>
      </div>
    </div>
  );
};
import { useState } from 'react';
import { Send, Paperclip, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  urgency?: string;
  safety_alerts?: any[];
}

export const ChatInterface = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: message.trim(),
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      // Call Nelson-GPT API
      const { data, error } = await supabase.functions.invoke('nelson-gpt-api', {
        body: {
          message: userMessage.text,
          sessionId: sessionId,
          userId: 'anonymous-user' // In production, use actual user ID
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      // Store session ID for context
      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId);
      }

      // Show safety alerts if present
      if (data.safety_alerts && data.safety_alerts.length > 0) {
        const urgentAlerts = data.safety_alerts.filter((alert: any) => alert.severity >= 9);
        if (urgentAlerts.length > 0) {
          toast({
            title: "⚠️ Medical Alert",
            description: urgentAlerts[0].message,
            variant: "destructive",
            duration: 10000,
          });
        }
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.answer,
        isUser: false,
        timestamp: new Date(),
        urgency: data.urgency_level,
        safety_alerts: data.safety_alerts
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error: any) {
      console.error('Chat error:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I apologize, but I'm currently experiencing technical difficulties. Please try again in a moment, or contact a healthcare professional if this is urgent.",
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Connection Error",
        description: "Please check your internet connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Header - only show when there are messages */}
      {messages.length > 0 && (
        <div className="flex-shrink-0 p-4 border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          <h1 className="text-lg font-semibold text-foreground">Nelson-GPT</h1>
          <p className="text-sm text-muted-foreground">Pediatric Medical Assistant</p>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          /* Welcome Screen */
          <div className="h-full flex flex-col justify-center p-6">
            {/* Main Wordmark */}
            <div className="text-center mb-8 animate-in fade-in duration-700">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 tracking-tight">
                Nelson-GPT
              </h1>
              <p className="text-base text-muted-foreground font-medium">
                Pediatric Medical AI Assistant
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Powered by Nelson Textbook of Pediatrics
              </p>
            </div>

            {/* Suggested Prompts */}
            <div className="mb-6 animate-in fade-in duration-700 delay-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {[
                  "Fever in a 2-year-old child",
                  "Asthma management guidelines", 
                  "Newborn feeding concerns",
                  "Childhood vaccination schedule"
                ].map((prompt, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="text-left justify-start h-auto p-3 text-sm hover:bg-secondary/80 transition-all duration-200"
                    onClick={() => setMessage(prompt)}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>

            {/* Medical Disclaimer */}
            <div className="text-center animate-in fade-in duration-700 delay-400">
              <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto">
                This AI provides educational information and should not replace professional medical advice. 
                Always consult healthcare providers for patient care decisions.
              </p>
            </div>
          </div>
        ) : (
          /* Chat Messages */
          <div className="p-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.isUser 
                    ? 'bg-primary text-primary-foreground ml-12' 
                    : 'bg-secondary/50 text-foreground mr-12'
                }`}>
                  {msg.safety_alerts && msg.safety_alerts.length > 0 && (
                    <div className="mb-2 p-2 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-xs font-medium">Medical Alert</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.text}
                  </div>
                  
                  <div className={`text-xs mt-2 opacity-70 ${
                    msg.isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  }`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {msg.urgency && ` • ${msg.urgency}`}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-secondary/50 rounded-2xl px-4 py-3 mr-12">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Analyzing your medical query...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 p-4 border-t border-border/50 bg-background/80 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative bg-secondary/30 rounded-2xl border border-border/50">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={messages.length === 0 
                ? "Ask about pediatric conditions, treatments, or guidelines..." 
                : "Continue your medical consultation..."
              }
              className="min-h-[52px] max-h-32 resize-none border-0 bg-transparent px-4 py-3 text-sm placeholder:text-muted-foreground focus:ring-0 focus:outline-none"
              rows={1}
              disabled={isLoading}
            />
            
            <div className="flex items-center justify-between px-3 py-2 border-t border-border/20">
              <div className="flex items-center space-x-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 rounded-full hover:bg-background/80"
                  disabled
                >
                  <Paperclip className="w-3.5 h-3.5 text-muted-foreground/50" />
                </Button>
              </div>

              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 rounded-full hover:bg-primary/10 disabled:opacity-50"
                disabled={!message.trim() || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                ) : (
                  <Send className="w-3.5 h-3.5 text-primary" />
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
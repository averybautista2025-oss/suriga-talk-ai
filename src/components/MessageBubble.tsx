import { Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

interface MessageBubbleProps {
  text: string;
  language: 'english' | 'surigaonon';
  isUser: boolean;
}

export const MessageBubble = ({ text, language, isUser }: MessageBubbleProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      setSpeechSynthesis(window.speechSynthesis);
    }
  }, []);

  const playAudio = () => {
    if (isPlaying || !speechSynthesis) return;
    
    setIsPlaying(true);
    
    try {
      // Cancel any ongoing speech
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set language and voice
      utterance.lang = language === 'english' ? 'en-US' : 'en-PH';
      utterance.rate = 0.9; // Slightly slower for clarity
      utterance.pitch = 1.0;
      
      // Get available voices and select appropriate one
      const voices = speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang.startsWith(language === 'english' ? 'en' : 'en'));
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      
      speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
    }
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-slide-up`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-soft ${
          isUser
            ? 'bg-gradient-primary text-white'
            : language === 'english'
            ? 'bg-card text-card-foreground border border-border'
            : 'bg-gradient-accent text-white'
        }`}
      >
        <div className="flex items-start gap-2">
          <p className="flex-1 text-sm leading-relaxed">{text}</p>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-white/20"
            onClick={playAudio}
            disabled={isPlaying || !speechSynthesis}
          >
            <Volume2 className={`h-4 w-4 ${isPlaying ? 'animate-pulse' : ''}`} />
          </Button>
        </div>
        <p className="text-xs mt-1 opacity-70">
          {language === 'english' ? 'English' : 'Surigaonon'}
        </p>
      </div>
    </div>
  );
};

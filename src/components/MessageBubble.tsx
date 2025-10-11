import { Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface MessageBubbleProps {
  text: string;
  language: 'english' | 'surigaonon';
  isUser: boolean;
}

export const MessageBubble = ({ text, language, isUser }: MessageBubbleProps) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const playAudio = async () => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/text-to-speech`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: text,
            language: language,
          }),
        }
      );

      const data = await response.json();
      
      if (data.audioBase64) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audioBase64}`);
        audio.onended = () => setIsPlaying(false);
        audio.play();
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    } finally {
      setTimeout(() => setIsPlaying(false), 100);
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
            disabled={isPlaying}
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

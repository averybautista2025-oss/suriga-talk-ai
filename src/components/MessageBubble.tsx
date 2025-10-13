import { Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MessageBubbleProps {
  text: string;
  language: 'english' | 'surigaonon';
  isUser: boolean;
}

export const MessageBubble = ({ text, language, isUser }: MessageBubbleProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const { toast } = useToast();

  const playAudio = async () => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text, language }
      });

      if (error) throw error;

      if (!data?.audioBase64) {
        throw new Error('No audio data received');
      }

      // Convert base64 to blob and play
      const audioBlob = new Blob(
        [Uint8Array.from(atob(data.audioBase64), c => c.charCodeAt(0))],
        { type: 'audio/mpeg' }
      );
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      await audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      toast({
        title: 'Audio Error',
        description: 'Failed to play audio. Please try again.',
        variant: 'destructive',
      });
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

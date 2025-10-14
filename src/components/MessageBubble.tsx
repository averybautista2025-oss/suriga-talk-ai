import { Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
// Removed supabase client - using browser SpeechSynthesis API instead
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

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast({
        title: 'Audio Unsupported',
        description: 'Your browser does not support text-to-speech.',
        variant: 'destructive',
      });
      return;
    }

    setIsPlaying(true);

    try {
      const synth = window.speechSynthesis;

      const getVoices = () =>
        new Promise<SpeechSynthesisVoice[]>((resolve) => {
          let voices = synth.getVoices();
          if (voices.length) return resolve(voices);
          const id = setInterval(() => {
            voices = synth.getVoices();
            if (voices.length) {
              clearInterval(id);
              resolve(voices);
            }
          }, 100);
          setTimeout(() => {
            clearInterval(id);
            resolve(synth.getVoices());
          }, 3000);
        });

      const voices = await getVoices();
      if (!voices.length) {
        throw new Error('No voices available');
      }

      const lower = (s?: string) => (s ? s.toLowerCase() : '');

      const pickVoice = (all: SpeechSynthesisVoice[]) => {
        if (language === 'english') {
          const en = all.filter((v) => lower(v.lang).startsWith('en'));
          const maleNames = [
            'male',
            'david',
            'mark',
            'daniel',
            'john',
            'brian',
            'george',
            'mike',
            'microsoft david',
            'google uk english male',
          ];
          const match = en.find((v) => maleNames.some((n) => lower(v.name).includes(n)));
          return match || en[0] || all[0];
        } else {
          // Surigaonon: try Cebuano, then Filipino/Tagalog, then any PH voice
          const ceb = all.find((v) => lower(v.name).includes('cebu') || lower(v.lang).includes('ceb'));
          if (ceb) return ceb;
          const fil = all.find((v) => lower(v.lang).includes('fil') || lower(v.name).includes('tagalog'));
          if (fil) return fil;
          const ph = all.find((v) => lower(v.lang).endsWith('-ph'));
          if (ph) return ph;
          return all[0];
        }
      };

      const utterance = new SpeechSynthesisUtterance(text);
      const voice = pickVoice(voices);
      if (voice) {
        utterance.voice = voice;
        if (language === 'surigaonon') {
          utterance.lang = voice.lang || 'ceb-PH';
        } else {
          utterance.lang = voice.lang || 'en-US';
        }
      }
      utterance.rate = 1;
      utterance.pitch = 1;

      utterance.onend = () => {
        setIsPlaying(false);
      };
      utterance.onerror = () => {
        setIsPlaying(false);
        toast({
          title: 'Audio Error',
          description: 'Failed to play audio. Please try again.',
          variant: 'destructive',
        });
      };

      synth.cancel(); // ensure clean start
      synth.speak(utterance);
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

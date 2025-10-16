import { Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

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
        title: 'Audio not supported',
        description: 'Your browser does not support speech synthesis.',
        variant: 'destructive',
      });
      return;
    }

    setIsPlaying(true);

    try {
      const synth = window.speechSynthesis;
      synth.cancel();

      const getVoices = () => synth.getVoices?.() || [];
      const pickVoice = (voices: SpeechSynthesisVoice[]) => {
        if (!voices.length) return null;
        if (language === 'english') {
          const en = voices.filter(v => v.lang?.toLowerCase().startsWith('en'));
          const preferredNames = ['Microsoft David', 'Alex', 'Daniel', 'Fred', 'Google US English', 'Microsoft Mark'];
          return en.find(v => preferredNames.some(n => v.name.includes(n))) || en[0] || voices[0];
        } else {
          const ceb = voices.filter(v => /ceb|cebuano/i.test(v.name) || /ceb|cebuano/i.test(v.lang));
          if (ceb[0]) return ceb[0];
          const ph = voices.filter(v => /-PH$/i.test(v.lang) || /Philippines|Tagalog|Filipino/i.test(v.name));
          if (ph[0]) return ph[0];
          const enPh = voices.find(v => v.lang?.toLowerCase() === 'en-ph');
          if (enPh) return enPh;
          const en = voices.filter(v => v.lang?.toLowerCase().startsWith('en'));
          return en[0] || voices[0];
        }
      };

      let voices = getVoices();
      if (!voices.length) {
        await new Promise(res => setTimeout(res, 200));
        voices = getVoices();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'english' ? 'en-US' : 'ceb-PH';
      const voice = pickVoice(voices);
      if (voice) utterance.voice = voice;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = (e) => {
        console.error('Speech synthesis error', e);
        setIsPlaying(false);
        toast({
          title: 'Audio Error',
          description: 'Text-to-speech failed in your browser.',
          variant: 'destructive',
        });
      };

      synth.speak(utterance);
    } catch (error) {
      console.error('TTS error:', error);
      toast({
        title: 'Audio Error',
        description: 'Text-to-speech failed. Please try again.',
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

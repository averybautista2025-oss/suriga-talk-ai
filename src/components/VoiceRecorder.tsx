import { useState, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface VoiceRecorderProps {
  onTranscript: (text: string) => void;
  language: 'english' | 'surigaonon';
  isDisabled?: boolean;
}

export const VoiceRecorder = ({ onTranscript, language, isDisabled }: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      
      // Set language based on selection
      recognitionInstance.lang = language === 'english' ? 'en-US' : 'en-PH';
      
      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onTranscript(transcript);
        setIsRecording(false);
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        
        toast({
          title: 'Error',
          description: event.error === 'no-speech' 
            ? 'No speech detected. Please try again.' 
            : 'Could not recognize speech. Please try again.',
          variant: 'destructive',
        });
      };

      recognitionInstance.onend = () => {
        setIsRecording(false);
      };

      setRecognition(recognitionInstance);
    } else {
      toast({
        title: 'Not Supported',
        description: 'Speech recognition is not supported in this browser',
        variant: 'destructive',
      });
    }
  }, [language, onTranscript, toast]);

  const startRecording = () => {
    if (!recognition) {
      toast({
        title: 'Not Available',
        description: 'Speech recognition is not available',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Update language before starting
      recognition.lang = language === 'english' ? 'en-US' : 'en-PH';
      recognition.start();
      setIsRecording(true);
      
      toast({
        title: 'Listening...',
        description: 'Speak now',
      });
    } catch (error) {
      console.error('Error starting recognition:', error);
      toast({
        title: 'Error',
        description: 'Could not start recording',
        variant: 'destructive',
      });
    }
  };

  const stopRecording = () => {
    if (recognition && isRecording) {
      recognition.stop();
      setIsRecording(false);
    }
  };

  return (
    <Button
      size="icon"
      variant={isRecording ? 'destructive' : 'default'}
      className={`transition-all ${
        isRecording ? 'animate-pulse-ring' : ''
      }`}
      onClick={isRecording ? stopRecording : startRecording}
      disabled={isDisabled}
    >
      {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </Button>
  );
};

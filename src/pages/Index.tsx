import { useState } from 'react';
import { MessageBubble } from '@/components/MessageBubble';
import { VoiceRecorder } from '@/components/VoiceRecorder';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Languages, MessageSquare, ArrowLeftRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  text: string;
  language: 'english' | 'surigaonon';
  isUser: boolean;
}

type TranslationMode = 'conversation' | 'translation';

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState<'english' | 'surigaonon'>('english');
  const [isTranslating, setIsTranslating] = useState(false);
  const [mode, setMode] = useState<TranslationMode>('translation');
  const { toast } = useToast();

  const targetLanguage = sourceLanguage === 'english' ? 'surigaonon' : 'english';

  const translate = async (text: string) => {
    if (!text.trim()) return;

    setIsTranslating(true);

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: text,
      language: sourceLanguage,
      isUser: true,
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/translate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: text,
            sourceLanguage: sourceLanguage,
            targetLanguage: targetLanguage,
          }),
        }
      );

      const data = await response.json();

      if (data.translatedText) {
        // Add translated message
        const translatedMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: data.translatedText,
          language: targetLanguage,
          isUser: false,
        };
        setMessages(prev => [...prev, translatedMessage]);
        
        // In conversation mode, auto-flip the language for the next input
        if (mode === 'conversation') {
          setSourceLanguage(targetLanguage);
        }
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Translation failed',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to translate',
        variant: 'destructive',
      });
    } finally {
      setIsTranslating(false);
      setInputText('');
    }
  };

  const handleVoiceTranscript = (text: string) => {
    translate(text);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    translate(inputText);
  };

  const toggleLanguage = () => {
    setSourceLanguage(prev => prev === 'english' ? 'surigaonon' : 'english');
  };

  return (
    <div className="min-h-screen bg-gradient-background flex flex-col">
      {/* Header */}
      <header className="bg-gradient-primary text-white p-4 shadow-glow">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <Languages className="h-8 w-8" />
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Surigaonon Translator</h1>
              <p className="text-sm opacity-90">AI-powered conversational translation</p>
            </div>
          </div>
          
          {/* Mode Toggle */}
          <div className="flex gap-2">
            <Button
              variant={mode === 'translation' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setMode('translation')}
              className={`flex-1 ${mode === 'translation' ? '' : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'}`}
            >
              <ArrowLeftRight className="h-4 w-4 mr-2" />
              Translation Mode
            </Button>
            <Button
              variant={mode === 'conversation' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setMode('conversation')}
              className={`flex-1 ${mode === 'conversation' ? '' : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'}`}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Conversation Mode
            </Button>
          </div>
        </div>
      </header>

      {/* Language Toggle/Indicator */}
      <div className="bg-card border-b">
        <div className="max-w-2xl mx-auto">
          {mode === 'translation' ? (
            <LanguageToggle sourceLanguage={sourceLanguage} onToggle={toggleLanguage} />
          ) : (
            <div className="text-center py-3 text-sm font-medium text-muted-foreground">
              Type in: <span className="text-primary font-semibold">{sourceLanguage === 'english' ? 'English' : 'Surigaonon'}</span>
              {' '} → Translates to: <span className="text-accent font-semibold">{targetLanguage === 'english' ? 'English' : 'Surigaonon'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-2">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {mode === 'conversation' ? (
                <>
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <h2 className="text-xl font-semibold mb-2">Start a Conversation</h2>
                  <p className="text-sm">
                    Languages will automatically alternate after each translation
                  </p>
                </>
              ) : (
                <>
                  <Languages className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <h2 className="text-xl font-semibold mb-2">Start Translating</h2>
                  <p className="text-sm">
                    Tap and hold the microphone to speak, or type your message below
                  </p>
                </>
              )}
            </div>
          ) : (
            messages.map(message => (
              <MessageBubble
                key={message.id}
                text={message.text}
                language={message.language}
                isUser={message.isUser}
              />
            ))
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-card border-t p-4 sticky bottom-0">
        <div className="max-w-2xl mx-auto">
          {/* Voice Recorder */}
          <div className="flex justify-center mb-4">
            <VoiceRecorder
              onTranscript={handleVoiceTranscript}
              language={sourceLanguage}
              isDisabled={isTranslating}
            />
          </div>

          {/* Text Input */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              placeholder={`Type in ${sourceLanguage === 'english' ? 'English' : 'Surigaonon'}...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isTranslating}
              className="flex-1"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!inputText.trim() || isTranslating}
              className="bg-primary hover:bg-primary-dark"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Index;

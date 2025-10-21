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
  role?: 'user' | 'assistant';
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

  const converse = async (text: string) => {
    if (!text.trim()) return;

    setIsTranslating(true);

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: text,
      language: sourceLanguage,
      isUser: true,
      role: 'user',
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Build conversation history for context
      const conversationHistory = messages.map(msg => ({
        role: msg.role || (msg.isUser ? 'user' : 'assistant'),
        content: msg.text
      }));

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/conversation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: text,
            language: sourceLanguage,
            conversationHistory: conversationHistory,
          }),
        }
      );

      const data = await response.json();

      if (data.reply) {
        // Add AI response
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: data.reply,
          language: sourceLanguage,
          isUser: false,
          role: 'assistant',
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Conversation failed',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to get response',
        variant: 'destructive',
      });
    } finally {
      setIsTranslating(false);
      setInputText('');
    }
  };

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'conversation') {
      converse(inputText);
    } else {
      translate(inputText);
    }
  };

  const handleVoiceTranscript = (text: string) => {
    if (mode === 'conversation') {
      converse(text);
    } else {
      translate(text);
    }
  };

  const toggleLanguage = () => {
    setSourceLanguage(prev => prev === 'english' ? 'surigaonon' : 'english');
  };

  return (
    <div className="fixed inset-0 bg-gradient-background flex flex-col overflow-x-hidden w-full">
      {/* Header */}
      <header className="bg-gradient-primary text-white p-4 shadow-glow flex-shrink-0">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <Languages className="h-8 w-8" />
            <div className="flex-1">
              <h1 className="text-2xl font-bold">SultiGao Translator</h1>
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

      {/* Language Indicator */}
      <div className="bg-card border-b flex-shrink-0">
        <div className="max-w-2xl mx-auto">
          {mode === 'translation' ? (
            <LanguageToggle sourceLanguage={sourceLanguage} onToggle={toggleLanguage} />
          ) : (
            <div className="text-center py-3">
              <div className="text-sm font-medium text-muted-foreground">
                Conversing in: <span className="text-primary font-semibold">{sourceLanguage === 'english' ? 'English' : 'SultiGao'}</span>
              </div>
              <button 
                onClick={toggleLanguage}
                className="text-xs text-accent hover:underline mt-1"
              >
                Switch to {sourceLanguage === 'english' ? 'SultiGao' : 'English'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 pb-32">
        <div className="max-w-2xl mx-auto space-y-2">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {mode === 'conversation' ? (
                <>
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <h2 className="text-xl font-semibold mb-2">Start a Conversation</h2>
                  <p className="text-sm">
                    Chat naturally with AI in your chosen language
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
      <div className="bg-card border-t p-4 fixed bottom-0 left-0 right-0 flex-shrink-0">
        <div className="max-w-2xl mx-auto">
          {/* Text Input with Voice Recorder and Send Button */}
          <form onSubmit={handleSubmit} className="flex gap-2 items-center">
            <div className="flex-shrink-0">
              <VoiceRecorder
                onTranscript={handleVoiceTranscript}
                language={sourceLanguage}
                isDisabled={isTranslating}
              />
            </div>
            <Input
              placeholder={mode === 'conversation' 
                ? `Chat in ${sourceLanguage === 'english' ? 'English' : 'SultiGao'}...`
                : `Type in ${sourceLanguage === 'english' ? 'English' : 'SultiGao'}...`
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isTranslating}
              className="flex-1"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!inputText.trim() || isTranslating}
              className="bg-primary hover:bg-primary-dark flex-shrink-0"
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

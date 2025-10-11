import { ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LanguageToggleProps {
  sourceLanguage: 'english' | 'surigaonon';
  onToggle: () => void;
}

export const LanguageToggle = ({ sourceLanguage, onToggle }: LanguageToggleProps) => {
  return (
    <div className="flex items-center justify-center gap-3 py-4">
      <div className="text-sm font-medium">
        {sourceLanguage === 'english' ? 'English' : 'Surigaonon'}
      </div>
      <Button
        variant="outline"
        size="sm"
        className="rounded-full h-10 w-10 p-0 border-2 hover:bg-primary hover:text-primary-foreground transition-colors"
        onClick={onToggle}
      >
        <ArrowLeftRight className="h-4 w-4" />
      </Button>
      <div className="text-sm font-medium">
        {sourceLanguage === 'english' ? 'Surigaonon' : 'English'}
      </div>
    </div>
  );
};

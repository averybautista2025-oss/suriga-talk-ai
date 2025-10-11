-- Create translations table to store conversation history and learning data
CREATE TABLE IF NOT EXISTS public.translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_text TEXT NOT NULL,
  source_language TEXT NOT NULL CHECK (source_language IN ('english', 'surigaonon')),
  translated_text TEXT NOT NULL,
  target_language TEXT NOT NULL CHECK (target_language IN ('english', 'surigaonon')),
  audio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_translations_created_at ON public.translations(created_at DESC);
CREATE INDEX idx_translations_languages ON public.translations(source_language, target_language);

-- Enable Row Level Security
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read translations (for learning)
CREATE POLICY "Anyone can read translations"
  ON public.translations
  FOR SELECT
  USING (true);

-- Create policy to allow anyone to insert translations
CREATE POLICY "Anyone can create translations"
  ON public.translations
  FOR INSERT
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_translations_updated_at
  BEFORE UPDATE ON public.translations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, sourceLanguage, targetLanguage } = await req.json();
    
    console.log('Translation request:', { text, sourceLanguage, targetLanguage });

    if (!text || !sourceLanguage || !targetLanguage) {
      throw new Error('Missing required fields');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Build system prompt with learning context
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch recent translations for context and learning
    const { data: recentTranslations } = await supabaseClient
      .from('translations')
      .select('source_text, translated_text, source_language, target_language')
      .or(`source_language.eq.${sourceLanguage},target_language.eq.${targetLanguage}`)
      .order('created_at', { ascending: false })
      .limit(10);

    const learningContext = recentTranslations?.length 
      ? `\n\nPrevious translations for learning context:\n${recentTranslations.map(t => 
          `${t.source_language}: "${t.source_text}" → ${t.target_language}: "${t.translated_text}"`
        ).join('\n')}`
      : '';

    const systemPrompt = `You are an expert translator specializing in English and SultiGao (a Visayan language spoken in Surigao del Norte and Surigao del Sur, Philippines).

CRITICAL INSTRUCTIONS:
1. Translate naturally and conversationally, as people actually speak
2. Use common everyday SultiGao expressions, not literal word-for-word translations
3. Consider cultural context and local idioms
4. For SultiGao, use the dialect commonly spoken in everyday conversations
5. Keep the tone friendly and natural, like a local would speak
6. If translating to SultiGao, prioritize how locals would actually say it over formal translations
7. Learn from the previous translations provided below to maintain consistency

${learningContext}

Respond ONLY with the translation, nothing else.`;

    // Call Lovable AI for translation
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Translate this ${sourceLanguage} text to ${targetLanguage}: "${text}"` }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('AI API error:', error);
      throw new Error(`Translation failed: ${response.status}`);
    }

    const data = await response.json();
    const translatedText = data.choices[0].message.content.trim();

    console.log('Translation result:', translatedText);

    // Store translation for learning
    const { error: dbError } = await supabaseClient
      .from('translations')
      .insert({
        source_text: text,
        source_language: sourceLanguage,
        translated_text: translatedText,
        target_language: targetLanguage,
      });

    if (dbError) {
      console.error('Error storing translation:', dbError);
    }

    return new Response(
      JSON.stringify({ translatedText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Translation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

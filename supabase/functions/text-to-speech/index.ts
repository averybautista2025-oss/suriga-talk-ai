import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { ElevenLabsClient } from "https://esm.sh/elevenlabs@0.8.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text, language } = await req.json();

    if (!text) {
      throw new Error('Text is required');
    }

    console.log('Text-to-speech request:', { text, language });

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY not configured');
    }

    // Initialize ElevenLabs client
    const elevenlabs = new ElevenLabsClient({
      apiKey: ELEVENLABS_API_KEY,
    });

    // Use different voices for different languages
    // English: Brian (nPczCjzI2devNBz1zQrb)
    // Surigaonon: Custom voice (K6AzvUWLhMiziMuhhX31)
    const voiceId = language === 'english' ? 'nPczCjzI2devNBz1zQrb' : 'K6AzvUWLhMiziMuhhX31';
    console.log('Using voiceId:', voiceId);


    const audio = await elevenlabs.textToSpeech.convert(voiceId, {
      text: text,
      model_id: 'eleven_multilingual_v2',
      output_format: 'mp3_44100_128',
    });

    // Convert audio stream to array buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of audio) {
      chunks.push(chunk);
    }
    const arrayBuffer = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
    let offset = 0;
    for (const chunk of chunks) {
      arrayBuffer.set(chunk, offset);
      offset += chunk.length;
    }

    // Convert to base64
    const base64Audio = btoa(
      String.fromCharCode(...arrayBuffer)
    );

    console.log('Generated audio, length:', base64Audio.length);

    return new Response(
      JSON.stringify({ audioBase64: base64Audio }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Text-to-speech error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

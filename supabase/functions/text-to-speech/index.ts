import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Bytez from "https://esm.sh/bytez.js@1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const BYTEZ_API_KEY = "c9a9dad77404315d98477b11079095cc";

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

    // Initialize Bytez SDK
    const sdk = new Bytez(BYTEZ_API_KEY);
    const model = sdk.model("openai/tts-1-hd");

    // Generate speech using Bytez
    const { error, output } = await model.run(text);

    if (error) {
      console.error('Bytez TTS error:', error);
      throw new Error(`Bytez TTS failed: ${error}`);
    }

    console.log('Generated audio via Bytez');

    // Handle output - Bytez returns audio data
    let base64Audio: string;
    
    if (output instanceof ArrayBuffer) {
      base64Audio = btoa(String.fromCharCode(...new Uint8Array(output)));
    } else if (output instanceof Uint8Array) {
      base64Audio = btoa(String.fromCharCode(...output));
    } else if (typeof output === 'string') {
      // If already base64
      base64Audio = output;
    } else if (output?.data) {
      // If wrapped in object
      const data = output.data;
      if (data instanceof ArrayBuffer) {
        base64Audio = btoa(String.fromCharCode(...new Uint8Array(data)));
      } else if (data instanceof Uint8Array) {
        base64Audio = btoa(String.fromCharCode(...data));
      } else {
        base64Audio = String(data);
      }
    } else {
      console.log('Bytez output type:', typeof output, output);
      throw new Error('Unexpected output format from Bytez');
    }

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

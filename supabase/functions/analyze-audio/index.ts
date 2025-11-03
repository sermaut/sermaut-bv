import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audioUrl, requestId } = await req.json();
    
    if (!audioUrl) {
      throw new Error('URL do áudio não fornecida');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    console.log('Analisando áudio:', audioUrl);

    // Chamada para análise de áudio com Lovable AI
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em análise musical. Analise o áudio fornecido e forneça: 1) Qualidade técnica (0-10), 2) Gênero musical, 3) BPM estimado, 4) Tonalidade, 5) Sugestões de melhoria. Seja conciso e objetivo.'
          },
          {
            role: 'user',
            content: `Analise este áudio musical: ${audioUrl}\n\nRequest ID: ${requestId || 'N/A'}`
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de taxa excedido. Tente novamente mais tarde.' }), 
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Pagamento necessário. Adicione créditos ao workspace.' }), 
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const errorText = await response.text();
      console.error('Erro da AI Gateway:', response.status, errorText);
      throw new Error(`Erro na análise: ${response.status}`);
    }

    const data = await response.json();
    const analysis = data.choices[0]?.message?.content;

    console.log('Análise completa:', analysis);

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis,
        requestId 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
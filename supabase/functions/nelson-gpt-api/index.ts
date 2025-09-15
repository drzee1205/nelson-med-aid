import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

interface MedicalQuery {
  message: string;
  sessionId?: string;
  userId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, sessionId, userId }: MedicalQuery = await req.json();

    console.log('Nelson-GPT API: Processing medical query', { message, sessionId, userId });

    // Create or get session
    let session = null;
    if (sessionId) {
      const { data } = await supabaseClient
        .from('user_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      session = data;
    }

    if (!session && userId) {
      const { data: newSession } = await supabaseClient
        .from('user_sessions')
        .insert({
          user_sub: userId,
          started_at: new Date().toISOString(),
          medical_context: {},
          risk_level: 'routine'
        })
        .select()
        .single();
      session = newSession;
    }

    // Create query record
    const { data: query } = await supabaseClient
      .from('queries')
      .insert({
        user_question: message,
        session_id: session?.id,
        created_at: new Date().toISOString(),
        diagnostic_stage: 'initial',
        reasoning_steps: [],
        safety_flags: [],
        urgency_level: 'routine'
      })
      .select()
      .single();

    console.log('Created query record:', query);

    // Call medical query router
    const routerResponse = await supabaseClient.functions.invoke('medical-query-router', {
      body: { 
        message, 
        sessionId: session?.id, 
        queryId: query?.id,
        medicalContext: session?.medical_context || {}
      }
    });

    if (routerResponse.error) {
      throw new Error(`Router error: ${routerResponse.error.message}`);
    }

    const routingResult = routerResponse.data;
    console.log('Medical query routing result:', routingResult);

    // Update query with classification
    await supabaseClient
      .from('queries')
      .update({
        urgency_level: routingResult.urgency_level,
        medical_specialty: routingResult.medical_specialty,
        complexity_score: routingResult.complexity_score
      })
      .eq('id', query.id);

    // Create classification record
    await supabaseClient
      .from('medical_classifications')
      .insert({
        query_id: query.id,
        urgency_level: routingResult.urgency_level,
        medical_specialty: routingResult.medical_specialty,
        complexity_score: routingResult.complexity_score,
        classification_confidence: routingResult.confidence
      });

    // Check for safety alerts
    if (routingResult.safety_alerts && routingResult.safety_alerts.length > 0) {
      for (const alert of routingResult.safety_alerts) {
        await supabaseClient
          .from('safety_alerts')
          .insert({
            session_id: session?.id,
            query_id: query.id,
            alert_type: alert.type,
            alert_message: alert.message,
            triggered_keywords: alert.keywords,
            severity_score: alert.severity
          });
      }
    }

    // Route to appropriate diagnostic workflow
    let diagnosticResponse;
    
    if (routingResult.urgency_level === 'emergency') {
      // Emergency pathway - immediate safety response
      diagnosticResponse = await supabaseClient.functions.invoke('medical-safety-monitor', {
        body: { 
          message, 
          sessionId: session?.id, 
          queryId: query?.id,
          urgency: 'emergency'
        }
      });
    } else {
      // Standard diagnostic workflow
      diagnosticResponse = await supabaseClient.functions.invoke('diagnostic-reasoning', {
        body: { 
          message, 
          sessionId: session?.id, 
          queryId: query?.id,
          classification: routingResult,
          medicalContext: session?.medical_context || {}
        }
      });
    }

    if (diagnosticResponse.error) {
      throw new Error(`Diagnostic error: ${diagnosticResponse.error.message}`);
    }

    const finalResponse = diagnosticResponse.data;

    // Update query with final answer
    await supabaseClient
      .from('queries')
      .update({
        answer: finalResponse.answer,
        confidence: finalResponse.confidence,
        citations: finalResponse.citations,
        reasoning_steps: finalResponse.reasoning_steps,
        safety_flags: finalResponse.safety_flags,
        diagnostic_stage: 'completed'
      })
      .eq('id', query.id);

    // Update session context
    if (session && finalResponse.updated_context) {
      await supabaseClient
        .from('user_sessions')
        .update({
          medical_context: finalResponse.updated_context,
          risk_level: finalResponse.risk_level || session.risk_level
        })
        .eq('id', session.id);
    }

    return new Response(JSON.stringify({
      success: true,
      answer: finalResponse.answer,
      confidence: finalResponse.confidence,
      citations: finalResponse.citations,
      sessionId: session?.id,
      queryId: query?.id,
      urgency_level: routingResult.urgency_level,
      medical_specialty: routingResult.medical_specialty,
      safety_alerts: routingResult.safety_alerts || [],
      reasoning_steps: finalResponse.reasoning_steps || []
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Nelson-GPT API Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
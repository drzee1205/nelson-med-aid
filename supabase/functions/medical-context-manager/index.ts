import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

interface ContextOperation {
  operation: 'get' | 'update' | 'summarize' | 'clear';
  sessionId: string;
  newContext?: any;
  conversationData?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { operation, sessionId, newContext, conversationData }: ContextOperation = await req.json();

    console.log('Medical Context Manager:', { operation, sessionId });

    switch (operation) {
      case 'get':
        return await getContext(sessionId);
      
      case 'update':
        return await updateContext(sessionId, newContext);
      
      case 'summarize':
        return await summarizeContext(sessionId, conversationData);
      
      case 'clear':
        return await clearContext(sessionId);
      
      default:
        throw new Error(`Invalid operation: ${operation}`);
    }

  } catch (error) {
    console.error('Medical Context Manager Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function getContext(sessionId: string) {
  // Get current session context
  const { data: session } = await supabaseClient
    .from('user_sessions')
    .select('medical_context, patient_context, risk_level, specialty_focus')
    .eq('id', sessionId)
    .single();

  if (!session) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Session not found'
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Get recent queries for context
  const { data: recentQueries } = await supabaseClient
    .from('queries')
    .select('user_question, answer, created_at, diagnostic_stage, differential_diagnoses')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(5);

  // Get any context summaries
  const { data: summaries } = await supabaseClient
    .from('medical_context_summary')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(3);

  const contextData = {
    medical_context: session.medical_context || {},
    patient_context: session.patient_context || {},
    risk_level: session.risk_level,
    specialty_focus: session.specialty_focus,
    recent_queries: recentQueries || [],
    summaries: summaries || [],
    context_age: calculateContextAge(recentQueries?.[0]?.created_at)
  };

  console.log('Retrieved context for session:', sessionId);

  return new Response(JSON.stringify({
    success: true,
    context: contextData,
    session_id: sessionId
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function updateContext(sessionId: string, newContext: any) {
  // Get current context
  const { data: currentSession } = await supabaseClient
    .from('user_sessions')
    .select('medical_context, patient_context')
    .eq('id', sessionId)
    .single();

  if (!currentSession) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Session not found'
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Merge new context with existing
  const updatedMedicalContext = {
    ...currentSession.medical_context,
    ...newContext.medical_context,
    last_updated: new Date().toISOString()
  };

  const updatedPatientContext = {
    ...currentSession.patient_context,
    ...newContext.patient_context
  };

  // Update session
  const { data: updatedSession, error } = await supabaseClient
    .from('user_sessions')
    .update({
      medical_context: updatedMedicalContext,
      patient_context: updatedPatientContext,
      risk_level: newContext.risk_level || currentSession.risk_level,
      specialty_focus: newContext.specialty_focus || currentSession.specialty_focus
    })
    .eq('id', sessionId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update context: ${error.message}`);
  }

  console.log('Updated context for session:', sessionId);

  return new Response(JSON.stringify({
    success: true,
    updated_context: {
      medical_context: updatedMedicalContext,
      patient_context: updatedPatientContext,
      risk_level: updatedSession.risk_level,
      specialty_focus: updatedSession.specialty_focus
    },
    session_id: sessionId
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function summarizeContext(sessionId: string, conversationData: any) {
  // Get recent conversation history
  const { data: queries } = await supabaseClient
    .from('queries')
    .select('user_question, answer, created_at, diagnostic_stage, differential_diagnoses, reasoning_steps')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (!queries || queries.length === 0) {
    return new Response(JSON.stringify({
      success: true,
      summary: null,
      message: 'No conversation history to summarize'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Prepare conversation for summarization
  const conversationText = queries.reverse().map(q => 
    `User: ${q.user_question}\nAssistant: ${q.answer || 'Processing...'}\n---`
  ).join('\n');

  // Generate summary using AI
  const summary = await generateContextSummary(conversationText, conversationData);

  // Extract key medical information
  const keySymptoms = extractSymptoms(conversationText);
  const mentionedDiagnoses = extractDiagnoses(queries);
  const medications = extractMedications(conversationText);
  const allergies = extractAllergies(conversationText);

  // Store summary in database
  const { data: summaryRecord } = await supabaseClient
    .from('medical_context_summary')
    .insert({
      session_id: sessionId,
      summary_text: summary,
      key_symptoms: keySymptoms,
      previous_diagnoses: mentionedDiagnoses,
      medications_mentioned: medications,
      allergies_mentioned: allergies,
      summary_confidence: 0.8
    })
    .select()
    .single();

  console.log('Generated context summary for session:', sessionId);

  return new Response(JSON.stringify({
    success: true,
    summary: {
      id: summaryRecord.id,
      text: summary,
      key_symptoms: keySymptoms,
      previous_diagnoses: mentionedDiagnoses,
      medications: medications,
      allergies: allergies,
      created_at: summaryRecord.created_at
    },
    session_id: sessionId
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function clearContext(sessionId: string) {
  // Clear medical context but preserve session
  const { data: clearedSession, error } = await supabaseClient
    .from('user_sessions')
    .update({
      medical_context: {},
      patient_context: {},
      risk_level: 'routine',
      specialty_focus: null
    })
    .eq('id', sessionId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to clear context: ${error.message}`);
  }

  // Archive old summaries (don't delete for audit purposes)
  await supabaseClient
    .from('medical_context_summary')
    .update({ 
      summary_text: '[ARCHIVED] ' + (await supabaseClient
        .from('medical_context_summary')
        .select('summary_text')
        .eq('session_id', sessionId)
        .single()).data?.summary_text || ''
    })
    .eq('session_id', sessionId);

  console.log('Cleared context for session:', sessionId);

  return new Response(JSON.stringify({
    success: true,
    message: 'Medical context cleared successfully',
    session_id: sessionId,
    cleared_at: new Date().toISOString()
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function generateContextSummary(conversationText: string, additionalData?: any): Promise<string> {
  if (!openaiApiKey) {
    return generateBasicSummary(conversationText);
  }

  const prompt = `Summarize this pediatric medical conversation, focusing on key clinical information:

${conversationText}

Additional Context: ${JSON.stringify(additionalData || {})}

Please provide a concise medical summary including:
1. Primary presenting concerns
2. Key symptoms and timeline
3. Any diagnoses discussed
4. Treatment recommendations given
5. Follow-up plans mentioned
6. Important medical history or context

Keep the summary professional, factual, and focused on medically relevant information.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a medical documentation assistant. Create concise, accurate summaries of pediatric medical conversations.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 500
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.choices[0].message.content;
    }
  } catch (error) {
    console.log('AI summarization failed, using basic summary:', error);
  }

  return generateBasicSummary(conversationText);
}

function generateBasicSummary(conversationText: string): string {
  const lines = conversationText.split('\n').filter(line => line.trim());
  const userQuestions = lines.filter(line => line.startsWith('User:')).slice(0, 3);
  
  return `Medical conversation summary:
Primary concerns: ${userQuestions.join('; ')}
Conversation length: ${lines.length} exchanges
Generated: ${new Date().toISOString()}`;
}

function extractSymptoms(text: string): string[] {
  const symptomKeywords = [
    'fever', 'cough', 'vomiting', 'diarrhea', 'rash', 'pain', 'headache',
    'sore throat', 'runny nose', 'ear ache', 'stomach ache', 'nausea',
    'fatigue', 'lethargy', 'irritable', 'crying', 'not eating', 'difficulty breathing'
  ];
  
  const lowerText = text.toLowerCase();
  return symptomKeywords.filter(symptom => lowerText.includes(symptom));
}

function extractDiagnoses(queries: any[]): string[] {
  const diagnoses: Set<string> = new Set();
  
  queries.forEach(query => {
    if (query.differential_diagnoses) {
      const dxList = Array.isArray(query.differential_diagnoses) 
        ? query.differential_diagnoses 
        : [];
      dxList.forEach((dx: any) => {
        if (dx.name || dx.diagnosis) {
          diagnoses.add(dx.name || dx.diagnosis);
        }
      });
    }
  });
  
  return Array.from(diagnoses);
}

function extractMedications(text: string): string[] {
  const medicationPatterns = [
    /tylenol|acetaminophen/gi,
    /ibuprofen|advil|motrin/gi,
    /amoxicillin|antibiotic/gi,
    /inhaler|albuterol/gi,
    /medication|medicine|drug/gi
  ];
  
  const medications: Set<string> = new Set();
  medicationPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => medications.add(match.toLowerCase()));
    }
  });
  
  return Array.from(medications);
}

function extractAllergies(text: string): string[] {
  const allergyPatterns = [
    /allergic to ([a-zA-Z\s]+)/gi,
    /allergy to ([a-zA-Z\s]+)/gi,
    /penicillin allergy/gi,
    /food allergy/gi,
    /environmental allergy/gi
  ];
  
  const allergies: Set<string> = new Set();
  allergyPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const allergen = match.replace(/allergic to |allergy to /gi, '').trim();
        if (allergen.length > 2) {
          allergies.add(allergen);
        }
      });
    }
  });
  
  return Array.from(allergies);
}

function calculateContextAge(lastQueryTime?: string): string {
  if (!lastQueryTime) return 'unknown';
  
  const now = new Date();
  const lastQuery = new Date(lastQueryTime);
  const diffMs = now.getTime() - lastQuery.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  
  if (diffHours < 1) return 'recent';
  if (diffHours < 24) return `${diffHours} hours ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} days ago`;
}
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

// Emergency keywords that require immediate attention
const EMERGENCY_KEYWORDS = [
  'can\'t breathe', 'difficulty breathing', 'chest pain', 'severe pain',
  'unconscious', 'seizure', 'bleeding heavily', 'choking', 'allergic reaction',
  'severe headache', 'high fever', 'emergency', 'urgent', '911', 'hospital'
];

const URGENT_KEYWORDS = [
  'fever', 'vomiting', 'diarrhea', 'rash', 'pain', 'swollen', 'infected',
  'won\'t eat', 'dehydrated', 'lethargic', 'concerning', 'worried'
];

// Medical specialties mapping
const SPECIALTY_KEYWORDS = {
  'cardiology': ['heart', 'chest pain', 'murmur', 'cardiac', 'palpitations'],
  'neurology': ['headache', 'seizure', 'neurological', 'brain', 'development delay'],
  'respiratory': ['breathing', 'cough', 'wheeze', 'asthma', 'pneumonia'],
  'gastroenterology': ['stomach', 'vomiting', 'diarrhea', 'constipation', 'feeding'],
  'dermatology': ['rash', 'skin', 'eczema', 'acne', 'lesion'],
  'orthopedics': ['bone', 'fracture', 'joint', 'limping', 'injury'],
  'endocrinology': ['diabetes', 'growth', 'hormone', 'thyroid', 'weight'],
  'infectious_disease': ['fever', 'infection', 'viral', 'bacterial', 'immunization']
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, sessionId, queryId, medicalContext } = await req.json();

    console.log('Medical Query Router: Processing', { message, sessionId, queryId });

    const messageText = message.toLowerCase();
    
    // 1. Assess urgency level
    let urgency_level = 'routine';
    let safety_alerts = [];

    // Check for emergency keywords
    for (const keyword of EMERGENCY_KEYWORDS) {
      if (messageText.includes(keyword.toLowerCase())) {
        urgency_level = 'emergency';
        safety_alerts.push({
          type: 'emergency',
          message: `Emergency keyword detected: "${keyword}". This may require immediate medical attention.`,
          keywords: [keyword],
          severity: 10
        });
        break;
      }
    }

    // Check for urgent keywords if not emergency
    if (urgency_level === 'routine') {
      for (const keyword of URGENT_KEYWORDS) {
        if (messageText.includes(keyword.toLowerCase())) {
          urgency_level = 'urgent';
          break;
        }
      }
    }

    // 2. Determine medical specialty
    let medical_specialty = 'general_pediatrics';
    let specialty_confidence = 0.5;

    for (const [specialty, keywords] of Object.entries(SPECIALTY_KEYWORDS)) {
      let matches = 0;
      for (const keyword of keywords) {
        if (messageText.includes(keyword.toLowerCase())) {
          matches++;
        }
      }
      
      const confidence = matches / keywords.length;
      if (confidence > specialty_confidence) {
        medical_specialty = specialty;
        specialty_confidence = confidence;
      }
    }

    // 3. Assess complexity score (1-5 scale)
    let complexity_score = 1;
    
    // Increase complexity based on various factors
    if (messageText.split(' ').length > 50) complexity_score += 1; // Long description
    if (messageText.includes('history of') || messageText.includes('previous')) complexity_score += 1; // Medical history
    if (messageText.includes('multiple') || messageText.includes('several')) complexity_score += 1; // Multiple symptoms
    if (urgency_level === 'urgent') complexity_score += 1;
    if (urgency_level === 'emergency') complexity_score = 5;

    // Consider previous context for complexity
    if (medicalContext && Object.keys(medicalContext).length > 0) {
      complexity_score = Math.min(complexity_score + 1, 5);
    }

    // 4. Generate routing confidence
    const confidence = Math.min(
      (specialty_confidence + 
       (urgency_level === 'emergency' ? 1.0 : urgency_level === 'urgent' ? 0.8 : 0.6) +
       (complexity_score / 5)) / 3,
      1.0
    );

    // 5. Determine appropriate workflow type
    let workflow_type = 'standard';
    if (urgency_level === 'emergency') {
      workflow_type = 'emergency';
    } else if (complexity_score >= 4) {
      workflow_type = 'complex';
    } else if (medical_specialty !== 'general_pediatrics') {
      workflow_type = 'specialty';
    }

    // 6. Log routing decision to audit_logs
    await supabaseClient
      .from('audit_logs')
      .insert({
        event: 'medical_query_routed',
        user_sub_hash: sessionId || 'anonymous',
        details: {
          query_id: queryId,
          message_length: message.length,
          urgency_level,
          medical_specialty,
          complexity_score,
          confidence,
          workflow_type,
          safety_alerts_count: safety_alerts.length
        }
      });

    console.log('Routing result:', {
      urgency_level,
      medical_specialty,
      complexity_score,
      confidence,
      workflow_type,
      safety_alerts: safety_alerts.length
    });

    return new Response(JSON.stringify({
      success: true,
      urgency_level,
      medical_specialty,
      complexity_score,
      confidence,
      workflow_type,
      safety_alerts,
      routing_timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Medical Query Router Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
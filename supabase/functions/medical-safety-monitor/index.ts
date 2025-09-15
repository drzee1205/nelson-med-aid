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

// Critical emergency indicators requiring immediate medical attention
const EMERGENCY_INDICATORS = {
  'respiratory_distress': {
    keywords: ['can\'t breathe', 'difficulty breathing', 'gasping', 'blue lips', 'wheezing severely'],
    severity: 10,
    message: 'EMERGENCY: Respiratory distress requires immediate medical attention. Call 911 or go to the nearest emergency room immediately.'
  },
  'cardiac_emergency': {
    keywords: ['chest pain', 'heart racing', 'fainting', 'collapsed', 'cardiac arrest'],
    severity: 10,
    message: 'EMERGENCY: Potential cardiac emergency. Call 911 immediately.'
  },
  'neurological_emergency': {
    keywords: ['seizure', 'unconscious', 'severe headache', 'confusion', 'not responding'],
    severity: 10,
    message: 'EMERGENCY: Neurological emergency. Call 911 or seek immediate emergency care.'
  },
  'severe_allergic_reaction': {
    keywords: ['allergic reaction', 'hives all over', 'swollen face', 'throat closing', 'anaphylaxis'],
    severity: 9,
    message: 'URGENT: Severe allergic reaction. Use EpiPen if available and call 911 immediately.'
  },
  'severe_bleeding': {
    keywords: ['bleeding heavily', 'won\'t stop bleeding', 'blood everywhere', 'hemorrhage'],
    severity: 9,
    message: 'URGENT: Severe bleeding requires immediate medical attention. Apply direct pressure and call 911.'
  },
  'poisoning': {
    keywords: ['poisoned', 'ingested', 'overdose', 'toxic', 'poison control'],
    severity: 9,
    message: 'URGENT: Potential poisoning. Call Poison Control (1-800-222-1222) and/or 911 immediately.'
  },
  'high_fever_infant': {
    keywords: ['fever', 'temperature', 'hot', 'infant', 'newborn', '0-3 months'],
    severity: 8,
    message: 'HIGH PRIORITY: Fever in infants under 3 months requires immediate medical evaluation.'
  },
  'dehydration_severe': {
    keywords: ['severely dehydrated', 'no wet diapers', 'sunken eyes', 'lethargic'],
    severity: 8,
    message: 'HIGH PRIORITY: Severe dehydration requires immediate medical attention.'
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, sessionId, queryId, urgency } = await req.json();

    console.log('Medical Safety Monitor: Analyzing', { queryId, urgency });

    const messageText = message.toLowerCase();
    let safety_alerts = [];
    let safety_flags = [];
    let risk_assessment = 'low';
    let immediate_action_required = false;

    // Scan for emergency indicators
    for (const [category, indicator] of Object.entries(EMERGENCY_INDICATORS)) {
      for (const keyword of indicator.keywords) {
        if (messageText.includes(keyword.toLowerCase())) {
          const alert = {
            category,
            severity: indicator.severity,
            message: indicator.message,
            triggered_keyword: keyword,
            requires_immediate_action: indicator.severity >= 9
          };

          safety_alerts.push(alert);
          safety_flags.push(category);

          if (indicator.severity >= 9) {
            immediate_action_required = true;
            risk_assessment = 'critical';
          } else if (indicator.severity >= 8 && risk_assessment !== 'critical') {
            risk_assessment = 'high';
          }

          // Log safety alert to database
          await supabaseClient
            .from('safety_alerts')
            .insert({
              session_id: sessionId,
              query_id: queryId,
              alert_type: indicator.severity >= 9 ? 'emergency' : 'high_risk',
              alert_message: indicator.message,
              triggered_keywords: [keyword],
              severity_score: indicator.severity
            });

          console.log(`Safety alert triggered: ${category} (severity: ${indicator.severity})`);
          break; // Only trigger once per category
        }
      }
    }

    // Generate safety-focused response
    let response_message = '';
    let confidence = 0.9; // High confidence in safety assessments

    if (immediate_action_required) {
      // Critical emergency response
      response_message = generateEmergencyResponse(safety_alerts, message);
      confidence = 1.0;
    } else if (risk_assessment === 'high') {
      // High priority response
      response_message = generateHighPriorityResponse(safety_alerts, message);
      confidence = 0.95;
    } else {
      // Standard safety guidance
      response_message = generateStandardSafetyResponse(message);
      confidence = 0.8;
    }

    // Log safety monitoring result
    await supabaseClient
      .from('audit_logs')
      .insert({
        event: 'safety_monitoring_completed',
        user_sub_hash: sessionId || 'anonymous',
        details: {
          query_id: queryId,
          risk_assessment,
          safety_alerts_triggered: safety_alerts.length,
          immediate_action_required,
          categories_triggered: [...new Set(safety_flags)]
        }
      });

    return new Response(JSON.stringify({
      success: true,
      answer: response_message,
      confidence: confidence,
      safety_alerts: safety_alerts,
      safety_flags: safety_flags,
      risk_assessment: risk_assessment,
      immediate_action_required: immediate_action_required,
      reasoning_steps: [{
        step: 'safety_monitoring',
        result: `Risk assessment: ${risk_assessment}. ${safety_alerts.length} safety alerts triggered.`,
        confidence: confidence,
        timestamp: new Date().toISOString()
      }]
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Medical Safety Monitor Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateEmergencyResponse(alerts: any[], originalMessage: string): string {
  const primaryAlert = alerts.find(alert => alert.severity >= 9);
  
  return `
🚨 **MEDICAL EMERGENCY DETECTED** 🚨

${primaryAlert.message}

**IMMEDIATE ACTIONS:**
1. **CALL 911 NOW** or go to the nearest emergency room
2. Stay with the patient and monitor vital signs
3. If trained, provide appropriate first aid
4. Have someone meet emergency responders
5. Gather any relevant medical information/medications

**DO NOT DELAY SEEKING PROFESSIONAL MEDICAL CARE**

---

**Important:** This is an automated safety alert based on your description: "${originalMessage.substring(0, 100)}..."

AI medical assistance cannot replace emergency medical services. The symptoms you've described require immediate professional medical evaluation and treatment.

**Emergency Numbers:**
- Emergency Medical Services: **911**
- Poison Control: **1-800-222-1222**

Time is critical in medical emergencies. Please seek help immediately.
  `.trim();
}

function generateHighPriorityResponse(alerts: any[], originalMessage: string): string {
  const primaryAlert = alerts[0];
  
  return `
⚠️ **HIGH PRIORITY MEDICAL CONCERN** ⚠️

${primaryAlert.message}

**RECOMMENDED ACTIONS:**
1. Contact your pediatrician or healthcare provider immediately
2. If after hours, call the on-call service or consider urgent care
3. Monitor symptoms closely and watch for worsening
4. Be prepared to seek emergency care if condition deteriorates

**When to seek immediate emergency care:**
- Symptoms worsen rapidly
- New concerning symptoms develop
- Patient becomes less responsive
- Breathing becomes difficult
- Signs of severe dehydration appear

---

**Your Query:** "${originalMessage.substring(0, 150)}..."

While this situation requires prompt medical attention, I can provide some general guidance while you arrange care with a healthcare professional.

**Next Steps:**
1. Document symptoms with times and details
2. Check temperature and vital signs if possible
3. Prepare list of current medications
4. Contact healthcare provider within the next few hours

**⚠️ Medical Disclaimer:** This assessment is for guidance only. Please consult with a qualified healthcare provider for proper evaluation and treatment.
  `.trim();
}

function generateStandardSafetyResponse(originalMessage: string): string {
  return `
## Medical Guidance

Thank you for your question about: "${originalMessage.substring(0, 100)}..."

Based on my analysis, while your concern doesn't appear to require immediate emergency care, all medical symptoms in children should be evaluated by appropriate healthcare professionals.

**General Recommendations:**
1. Monitor symptoms and document any changes
2. Contact your pediatrician if symptoms persist or worsen
3. Seek urgent care if you become concerned about rapid changes
4. Trust your parental instincts - you know your child best

**When to seek immediate medical attention:**
- Difficulty breathing or rapid breathing
- High fever (especially in infants under 3 months)
- Signs of dehydration
- Persistent vomiting or inability to keep fluids down
- Unusual lethargy or difficulty waking
- Any symptoms that worry you as a parent

**Educational Information:**
I can provide general information about common pediatric conditions, but this should never replace professional medical evaluation, especially for new or concerning symptoms.

---

**⚠️ Important Medical Disclaimer:**
This response is for educational purposes only and should not replace professional medical advice, diagnosis, or treatment. Always consult with a qualified healthcare provider regarding medical concerns about your child.

Would you like me to provide some general educational information about common pediatric conditions, or do you have specific questions about when to seek medical care?
  `.trim();
}
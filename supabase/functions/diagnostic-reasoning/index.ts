import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const mistralApiKey = Deno.env.get('MISTRAL_API_KEY');
const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

// Multi-step diagnostic workflow
const DIAGNOSTIC_STEPS = [
  'symptom_analysis',
  'initial_assessment',
  'differential_diagnosis',
  'evidence_evaluation',
  'treatment_recommendations',
  'follow_up_guidance'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, sessionId, queryId, classification, medicalContext } = await req.json();

    console.log('Diagnostic Reasoning: Starting workflow', { 
      queryId, 
      urgency: classification.urgency_level,
      specialty: classification.medical_specialty 
    });

    // Create diagnostic workflow record
    const { data: workflow } = await supabaseClient
      .from('diagnostic_workflows')
      .insert({
        session_id: sessionId,
        query_id: queryId,
        workflow_type: classification.workflow_type,
        current_step: 1,
        total_steps: DIAGNOSTIC_STEPS.length,
        step_data: {
          original_message: message,
          classification: classification,
          medical_context: medicalContext
        }
      })
      .select()
      .single();

    console.log('Created diagnostic workflow:', workflow?.id);

    let reasoning_steps = [];
    let confidence_scores = {};
    let safety_flags = [];
    let citations = [];
    let updated_context = { ...medicalContext };

    // Step 1: Symptom Analysis & Extraction
    console.log('Step 1: Symptom Analysis');
    const symptomAnalysis = await analyzeSymptoms(message, medicalContext);
    reasoning_steps.push({
      step: 'symptom_analysis',
      result: symptomAnalysis.analysis,
      confidence: symptomAnalysis.confidence,
      timestamp: new Date().toISOString()
    });
    confidence_scores.symptom_analysis = symptomAnalysis.confidence;

    // Update workflow
    await updateWorkflowStep(workflow.id, 2, {
      symptom_analysis: symptomAnalysis,
      completed_steps: ['symptom_analysis']
    });

    // Step 2: Initial Medical Assessment
    console.log('Step 2: Initial Assessment');
    const initialAssessment = await performInitialAssessment(
      symptomAnalysis.symptoms, 
      classification.medical_specialty,
      medicalContext
    );
    reasoning_steps.push({
      step: 'initial_assessment',
      result: initialAssessment.assessment,
      confidence: initialAssessment.confidence,
      timestamp: new Date().toISOString()
    });
    confidence_scores.initial_assessment = initialAssessment.confidence;

    await updateWorkflowStep(workflow.id, 3, {
      initial_assessment: initialAssessment,
      completed_steps: ['symptom_analysis', 'initial_assessment']
    });

    // Step 3: Differential Diagnosis Generation
    console.log('Step 3: Differential Diagnosis');
    const differentialDx = await generateDifferentialDiagnosis(
      symptomAnalysis.symptoms,
      initialAssessment.assessment,
      classification.medical_specialty
    );
    reasoning_steps.push({
      step: 'differential_diagnosis',
      result: differentialDx.diagnoses,
      confidence: differentialDx.confidence,
      timestamp: new Date().toISOString()
    });
    confidence_scores.differential_diagnosis = differentialDx.confidence;

    await updateWorkflowStep(workflow.id, 4, {
      differential_diagnosis: differentialDx,
      completed_steps: ['symptom_analysis', 'initial_assessment', 'differential_diagnosis']
    });

    // Step 4: Evidence Evaluation with Nelson textbook search
    console.log('Step 4: Evidence Evaluation');
    const evidenceEval = await evaluateEvidence(
      differentialDx.diagnoses,
      symptomAnalysis.symptoms,
      classification.medical_specialty
    );
    reasoning_steps.push({
      step: 'evidence_evaluation',
      result: evidenceEval.evaluation,
      confidence: evidenceEval.confidence,
      timestamp: new Date().toISOString()
    });
    confidence_scores.evidence_evaluation = evidenceEval.confidence;
    citations = evidenceEval.citations;

    await updateWorkflowStep(workflow.id, 5, {
      evidence_evaluation: evidenceEval,
      completed_steps: ['symptom_analysis', 'initial_assessment', 'differential_diagnosis', 'evidence_evaluation']
    });

    // Step 5: Treatment Recommendations
    console.log('Step 5: Treatment Recommendations');
    const treatment = await generateTreatmentRecommendations(
      evidenceEval.top_diagnosis,
      symptomAnalysis.symptoms,
      classification.urgency_level
    );
    reasoning_steps.push({
      step: 'treatment_recommendations',
      result: treatment.recommendations,
      confidence: treatment.confidence,
      timestamp: new Date().toISOString()
    });
    confidence_scores.treatment_recommendations = treatment.confidence;

    // Safety check for treatment recommendations
    if (treatment.safety_concerns && treatment.safety_concerns.length > 0) {
      safety_flags.push(...treatment.safety_concerns);
    }

    await updateWorkflowStep(workflow.id, 6, {
      treatment_recommendations: treatment,
      completed_steps: ['symptom_analysis', 'initial_assessment', 'differential_diagnosis', 'evidence_evaluation', 'treatment_recommendations']
    });

    // Step 6: Follow-up Guidance
    console.log('Step 6: Follow-up Guidance');
    const followUp = await generateFollowUpGuidance(
      treatment.recommendations,
      classification.urgency_level,
      symptomAnalysis.symptoms
    );
    reasoning_steps.push({
      step: 'follow_up_guidance',
      result: followUp.guidance,
      confidence: followUp.confidence,
      timestamp: new Date().toISOString()
    });
    confidence_scores.follow_up_guidance = followUp.confidence;

    // Complete workflow
    await updateWorkflowStep(workflow.id, 6, {
      follow_up_guidance: followUp,
      completed_steps: DIAGNOSTIC_STEPS,
      confidence_scores: confidence_scores
    }, true);

    // Calculate overall confidence
    const overall_confidence = Object.values(confidence_scores).reduce((a, b) => a + b, 0) / Object.keys(confidence_scores).length;

    // Update medical context
    updated_context = {
      ...updated_context,
      last_symptoms: symptomAnalysis.symptoms,
      last_assessment: initialAssessment.assessment,
      last_diagnosis: evidenceEval.top_diagnosis,
      session_history: (updated_context.session_history || []).concat([{
        timestamp: new Date().toISOString(),
        query: message,
        diagnosis: evidenceEval.top_diagnosis,
        treatment: treatment.recommendations
      }])
    };

    // Format final response
    const finalAnswer = formatMedicalResponse({
      symptoms: symptomAnalysis.symptoms,
      assessment: initialAssessment.assessment,
      diagnosis: evidenceEval.top_diagnosis,
      evidence: evidenceEval.evaluation,
      treatment: treatment.recommendations,
      followUp: followUp.guidance,
      urgency: classification.urgency_level,
      specialty: classification.medical_specialty
    });

    console.log('Diagnostic workflow completed successfully');

    return new Response(JSON.stringify({
      success: true,
      answer: finalAnswer,
      confidence: overall_confidence,
      citations: citations,
      reasoning_steps: reasoning_steps,
      safety_flags: safety_flags,
      updated_context: updated_context,
      risk_level: classification.urgency_level,
      workflow_id: workflow.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Diagnostic Reasoning Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper functions
async function analyzeSymptoms(message: string, context: any) {
  const prompt = `As a pediatric medical AI, analyze the following patient description and extract key symptoms:

Patient Description: "${message}"

Previous Context: ${JSON.stringify(context, null, 2)}

Please provide:
1. List of primary symptoms
2. List of associated symptoms  
3. Duration and onset if mentioned
4. Severity indicators
5. Any concerning features

Format as JSON with confidence score.`;

  const response = await callAI(prompt);
  try {
    const parsed = JSON.parse(response);
    return {
      symptoms: parsed.symptoms || message,
      analysis: parsed,
      confidence: parsed.confidence || 0.7
    };
  } catch {
    return {
      symptoms: message,
      analysis: response,
      confidence: 0.6
    };
  }
}

async function performInitialAssessment(symptoms: any, specialty: string, context: any) {
  const prompt = `As a pediatric ${specialty} specialist, provide an initial medical assessment:

Symptoms: ${JSON.stringify(symptoms)}
Context: ${JSON.stringify(context)}

Provide:
1. Initial clinical impression
2. Key differential considerations
3. Recommended next steps
4. Red flags to watch for

Format as JSON with confidence score.`;

  const response = await callAI(prompt);
  try {
    const parsed = JSON.parse(response);
    return {
      assessment: parsed.assessment || response,
      confidence: parsed.confidence || 0.7
    };
  } catch {
    return {
      assessment: response,
      confidence: 0.6
    };
  }
}

async function generateDifferentialDiagnosis(symptoms: any, assessment: string, specialty: string) {
  const prompt = `Based on the symptoms and initial assessment, generate a differential diagnosis list:

Symptoms: ${JSON.stringify(symptoms)}
Initial Assessment: ${assessment}
Specialty Focus: ${specialty}

Provide top 5 differential diagnoses ranked by likelihood, each with:
1. Diagnosis name
2. Supporting evidence
3. Likelihood score (0-1)
4. Key distinguishing features

Format as JSON with confidence score.`;

  const response = await callAI(prompt);
  try {
    const parsed = JSON.parse(response);
    return {
      diagnoses: parsed.diagnoses || [],
      confidence: parsed.confidence || 0.7
    };
  } catch {
    return {
      diagnoses: [{ name: "Further evaluation needed", likelihood: 0.5 }],
      confidence: 0.5
    };
  }
}

async function evaluateEvidence(diagnoses: any[], symptoms: any, specialty: string) {
  // Search Nelson textbook for relevant evidence
  const searchQuery = Array.isArray(symptoms) ? symptoms.join(' ') : symptoms;
  
  const { data: medicalChunks } = await supabaseClient
    .rpc('match_medical_chunks', {
      query_embedding: await generateEmbedding(searchQuery),
      match_count: 10,
      keywords: specialty
    });

  const relevantEvidence = medicalChunks || [];
  
  const prompt = `Evaluate the evidence for these differential diagnoses using medical literature:

Diagnoses: ${JSON.stringify(diagnoses)}
Symptoms: ${JSON.stringify(symptoms)}

Medical Evidence:
${relevantEvidence.map(chunk => `- ${chunk.chunk_text.substring(0, 200)}...`).join('\n')}

Provide:
1. Most likely diagnosis with evidence
2. Evidence quality assessment
3. Confidence in diagnosis
4. Alternative considerations

Format as JSON.`;

  const response = await callAI(prompt);
  try {
    const parsed = JSON.parse(response);
    return {
      evaluation: parsed.evaluation || response,
      top_diagnosis: parsed.top_diagnosis || "Further evaluation needed",
      confidence: parsed.confidence || 0.6,
      citations: relevantEvidence.map(chunk => ({
        source: chunk.book_title,
        chapter: chunk.chapter_title,
        page: chunk.page_number,
        relevance: chunk.similarity
      }))
    };
  } catch {
    return {
      evaluation: response,
      top_diagnosis: "Further evaluation needed",
      confidence: 0.5,
      citations: []
    };
  }
}

async function generateTreatmentRecommendations(diagnosis: string, symptoms: any, urgency: string) {
  const prompt = `Provide evidence-based treatment recommendations for pediatric patients:

Primary Diagnosis: ${diagnosis}
Symptoms: ${JSON.stringify(symptoms)}
Urgency Level: ${urgency}

Include:
1. First-line treatment options
2. Dosing considerations for pediatric patients
3. Monitoring requirements
4. When to seek immediate care
5. Parent/caregiver instructions

Format as JSON with confidence score and safety concerns.`;

  const response = await callAI(prompt);
  try {
    const parsed = JSON.parse(response);
    return {
      recommendations: parsed.recommendations || response,
      confidence: parsed.confidence || 0.7,
      safety_concerns: parsed.safety_concerns || []
    };
  } catch {
    return {
      recommendations: response,
      confidence: 0.6,
      safety_concerns: []
    };
  }
}

async function generateFollowUpGuidance(treatment: string, urgency: string, symptoms: any) {
  const prompt = `Provide comprehensive follow-up guidance:

Treatment Plan: ${treatment}
Urgency Level: ${urgency}
Original Symptoms: ${JSON.stringify(symptoms)}

Include:
1. Timeline for improvement
2. Warning signs requiring immediate care
3. Follow-up appointment recommendations
4. Home care instructions
5. When to contact healthcare provider

Format as JSON with confidence score.`;

  const response = await callAI(prompt);
  try {
    const parsed = JSON.parse(response);
    return {
      guidance: parsed.guidance || response,
      confidence: parsed.confidence || 0.7
    };
  } catch {
    return {
      guidance: response,
      confidence: 0.6
    };
  }
}

async function callAI(prompt: string): Promise<string> {
  // Try Mistral first, fallback to OpenAI
  if (mistralApiKey) {
    try {
      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mistralApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'mistral-large-latest',
          messages: [
            { role: 'system', content: 'You are Nelson-GPT, a specialized pediatric medical AI assistant. Provide accurate, evidence-based medical guidance while always emphasizing the need for professional medical evaluation.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.1,
          max_tokens: 2000
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices[0].message.content;
      }
    } catch (error) {
      console.log('Mistral API failed, trying OpenAI fallback:', error);
    }
  }

  // OpenAI fallback
  if (openaiApiKey) {
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
            { role: 'system', content: 'You are Nelson-GPT, a specialized pediatric medical AI assistant. Provide accurate, evidence-based medical guidance while always emphasizing the need for professional medical evaluation.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.1,
          max_tokens: 2000
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices[0].message.content;
      }
    } catch (error) {
      console.log('OpenAI API failed:', error);
    }
  }

  // Fallback response
  return "I apologize, but I'm currently unable to process your request due to technical issues. Please consult with a healthcare professional for medical advice.";
}

async function generateEmbedding(text: string): Promise<number[]> {
  // Simple placeholder - in production, use actual embedding API
  return new Array(1536).fill(0).map(() => Math.random());
}

async function updateWorkflowStep(workflowId: string, step: number, stepData: any, completed = false) {
  await supabaseClient
    .from('diagnostic_workflows')
    .update({
      current_step: step,
      step_data: stepData,
      updated_at: new Date().toISOString(),
      ...(completed && { completed_at: new Date().toISOString() })
    })
    .eq('id', workflowId);
}

function formatMedicalResponse(data: any): string {
  return `
## Medical Assessment

**Primary Symptoms:** ${typeof data.symptoms === 'string' ? data.symptoms : JSON.stringify(data.symptoms)}

**Clinical Assessment:** ${data.assessment}

**Most Likely Diagnosis:** ${data.diagnosis}

**Evidence Summary:** ${data.evidence}

**Treatment Recommendations:** ${data.treatment}

**Follow-up Guidance:** ${data.followUp}

---

**⚠️ Important Medical Disclaimer:**
This assessment is for educational purposes only and should not replace professional medical evaluation. Please consult with a qualified healthcare provider for proper diagnosis and treatment, especially if symptoms worsen or new concerns arise.

**Urgency Level:** ${data.urgency}
**Specialty Focus:** ${data.specialty}
  `.trim();
}
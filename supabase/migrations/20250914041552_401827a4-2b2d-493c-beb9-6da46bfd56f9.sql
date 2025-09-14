-- Core Database Schema Enhancement for Nelson-GPT
-- Phase 1: Extend existing tables for medical workflow support

-- Enhance queries table for diagnostic workflows
ALTER TABLE queries 
ADD COLUMN IF NOT EXISTS diagnostic_stage TEXT DEFAULT 'initial',
ADD COLUMN IF NOT EXISTS reasoning_steps JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS safety_flags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS differential_diagnoses JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS urgency_level TEXT DEFAULT 'routine',
ADD COLUMN IF NOT EXISTS medical_specialty TEXT,
ADD COLUMN IF NOT EXISTS complexity_score INTEGER DEFAULT 1;

-- Enhance user_sessions table for medical context
ALTER TABLE user_sessions 
ADD COLUMN IF NOT EXISTS medical_context JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS risk_level TEXT DEFAULT 'routine',
ADD COLUMN IF NOT EXISTS specialty_focus TEXT,
ADD COLUMN IF NOT EXISTS patient_context JSONB DEFAULT '{}';

-- Create diagnostic_workflows table for tracking multi-step processes
CREATE TABLE IF NOT EXISTS public.diagnostic_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.user_sessions(id) ON DELETE CASCADE,
  query_id BIGINT REFERENCES public.queries(id) ON DELETE CASCADE,
  workflow_type TEXT NOT NULL DEFAULT 'standard',
  current_step INTEGER DEFAULT 1,
  total_steps INTEGER DEFAULT 6,
  step_data JSONB DEFAULT '{}',
  completed_steps TEXT[] DEFAULT '{}',
  confidence_scores JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create medical_classifications table for query categorization
CREATE TABLE IF NOT EXISTS public.medical_classifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_id BIGINT REFERENCES public.queries(id) ON DELETE CASCADE,
  urgency_level TEXT NOT NULL, -- emergency, urgent, routine
  medical_specialty TEXT, -- cardiology, neurology, general_pediatrics, etc.
  complexity_score INTEGER DEFAULT 1, -- 1-5 scale
  classification_confidence NUMERIC(3,2) DEFAULT 0.0,
  auto_classified BOOLEAN DEFAULT true,
  reviewed_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create safety_alerts table for high-risk scenarios
CREATE TABLE IF NOT EXISTS public.safety_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.user_sessions(id) ON DELETE CASCADE,
  query_id BIGINT REFERENCES public.queries(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- emergency, high_risk, requires_attention
  alert_message TEXT NOT NULL,
  triggered_keywords TEXT[] DEFAULT '{}',
  severity_score INTEGER DEFAULT 1, -- 1-10 scale
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create medical_context_summary table for conversation summarization
CREATE TABLE IF NOT EXISTS public.medical_context_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.user_sessions(id) ON DELETE CASCADE,
  summary_text TEXT NOT NULL,
  key_symptoms TEXT[] DEFAULT '{}',
  previous_diagnoses TEXT[] DEFAULT '{}',
  medications_mentioned TEXT[] DEFAULT '{}',
  allergies_mentioned TEXT[] DEFAULT '{}',
  summary_confidence NUMERIC(3,2) DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all new tables
ALTER TABLE public.diagnostic_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_context_summary ENABLE ROW LEVEL SECURITY;

-- RLS Policies for diagnostic_workflows
CREATE POLICY "Users can view their own diagnostic workflows"
ON public.diagnostic_workflows FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.user_sessions s 
  WHERE s.id = diagnostic_workflows.session_id 
  AND s.user_sub = COALESCE(((current_setting('request.jwt.claims'::text, true))::jsonb ->> 'sub'::text), ''::text)
));

CREATE POLICY "Users can create their own diagnostic workflows"
ON public.diagnostic_workflows FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.user_sessions s 
  WHERE s.id = diagnostic_workflows.session_id 
  AND s.user_sub = COALESCE(((current_setting('request.jwt.claims'::text, true))::jsonb ->> 'sub'::text), ''::text)
));

CREATE POLICY "Users can update their own diagnostic workflows"
ON public.diagnostic_workflows FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.user_sessions s 
  WHERE s.id = diagnostic_workflows.session_id 
  AND s.user_sub = COALESCE(((current_setting('request.jwt.claims'::text, true))::jsonb ->> 'sub'::text), ''::text)
));

-- RLS Policies for medical_classifications
CREATE POLICY "Users can view their own medical classifications"
ON public.medical_classifications FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.queries q 
  JOIN public.user_sessions s ON q.session_id = s.id
  WHERE q.id = medical_classifications.query_id 
  AND s.user_sub = COALESCE(((current_setting('request.jwt.claims'::text, true))::jsonb ->> 'sub'::text), ''::text)
));

CREATE POLICY "Service role can manage medical classifications"
ON public.medical_classifications FOR ALL
USING (auth.role() = 'service_role'::text);

-- RLS Policies for safety_alerts
CREATE POLICY "Users can view their own safety alerts"
ON public.safety_alerts FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.user_sessions s 
  WHERE s.id = safety_alerts.session_id 
  AND s.user_sub = COALESCE(((current_setting('request.jwt.claims'::text, true))::jsonb ->> 'sub'::text), ''::text)
));

CREATE POLICY "Service role can manage safety alerts"
ON public.safety_alerts FOR ALL
USING (auth.role() = 'service_role'::text);

-- RLS Policies for medical_context_summary
CREATE POLICY "Users can view their own medical context summary"
ON public.medical_context_summary FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.user_sessions s 
  WHERE s.id = medical_context_summary.session_id 
  AND s.user_sub = COALESCE(((current_setting('request.jwt.claims'::text, true))::jsonb ->> 'sub'::text), ''::text)
));

CREATE POLICY "Service role can manage medical context summary"
ON public.medical_context_summary FOR ALL
USING (auth.role() = 'service_role'::text);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_diagnostic_workflows_session_id ON public.diagnostic_workflows(session_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_workflows_query_id ON public.diagnostic_workflows(query_id);
CREATE INDEX IF NOT EXISTS idx_medical_classifications_query_id ON public.medical_classifications(query_id);
CREATE INDEX IF NOT EXISTS idx_safety_alerts_session_id ON public.safety_alerts(session_id);
CREATE INDEX IF NOT EXISTS idx_safety_alerts_severity ON public.safety_alerts(severity_score DESC);
CREATE INDEX IF NOT EXISTS idx_medical_context_summary_session_id ON public.medical_context_summary(session_id);

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_diagnostic_workflows_updated_at
    BEFORE UPDATE ON public.diagnostic_workflows
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medical_context_summary_updated_at
    BEFORE UPDATE ON public.medical_context_summary
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
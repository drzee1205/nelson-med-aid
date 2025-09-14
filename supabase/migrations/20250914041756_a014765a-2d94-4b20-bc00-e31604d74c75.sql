-- Fix security issues identified by the linter

-- Fix function search_path for existing function
ALTER FUNCTION public.match_medical_chunks(vector, integer, text) SET search_path = public;

-- Fix function search_path for our update function
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- Enable RLS on tables that don't have it
ALTER TABLE public.godzilla_medical_dataset ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_chunks_raw ENABLE ROW LEVEL SECURITY;

-- Create policies for godzilla_medical_dataset (make it readable by everyone since it's reference data)
CREATE POLICY "Public read access to medical dataset"
ON public.godzilla_medical_dataset FOR SELECT
USING (true);

-- Create policies for medical_chunks_raw (service role only)
CREATE POLICY "Service role can manage medical chunks raw"
ON public.medical_chunks_raw FOR ALL
USING (auth.role() = 'service_role'::text);
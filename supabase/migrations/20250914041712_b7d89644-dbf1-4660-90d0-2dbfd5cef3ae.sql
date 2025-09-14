-- Fix security issues identified by the linter

-- 1. Enable RLS on missing tables (godzilla_medical_dataset and medical_chunks_raw)
ALTER TABLE public.godzilla_medical_dataset ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_chunks_raw ENABLE ROW LEVEL SECURITY;

-- Create service role policies for these tables since they contain medical data
CREATE POLICY "Service role can access godzilla_medical_dataset"
ON public.godzilla_medical_dataset FOR ALL
USING (auth.role() = 'service_role'::text);

CREATE POLICY "Service role can access medical_chunks_raw"
ON public.medical_chunks_raw FOR ALL
USING (auth.role() = 'service_role'::text);

-- 2. Fix function search path issues by updating the existing functions
DROP FUNCTION IF EXISTS public.update_updated_at_column();

-- Recreate with proper search path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Also fix the match_medical_chunks function search path
CREATE OR REPLACE FUNCTION public.match_medical_chunks(
    query_embedding extensions.vector, 
    match_count integer DEFAULT 5, 
    keywords text DEFAULT NULL::text
)
RETURNS TABLE(
    id uuid, 
    book_title text, 
    chapter_title text, 
    section_title text, 
    page_number integer, 
    source_url text, 
    chunk_text text, 
    similarity double precision
)
LANGUAGE sql
STABLE
SECURITY DEFINER 
SET search_path = public
AS $function$
    select
        mc.id,
        mc.book_title,
        mc.chapter_title,
        mc.section_title,
        mc.page_number,
        mc.source_url,
        mc.chunk_text,
        1 - (mc.embedding <#> query_embedding) as similarity
    from public.medical_chunks mc
    where (
        keywords is null
        or mc.chunk_text ilike any (string_to_array('%' || replace(keywords, ' ', '%') || '%', ' '))
        or mc.section_title ilike '%' || keywords || '%'
        or mc.chapter_title ilike '%' || keywords || '%'
        or mc.book_title ilike '%' || keywords || '%'
    )
    order by mc.embedding <#> query_embedding
    limit match_count;
$function$;
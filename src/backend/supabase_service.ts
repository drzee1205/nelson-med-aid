import { supabase } from '@/integrations/supabase/client';
import CryptoJS from 'crypto-js';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-secret-key';
export interface MedicalChunk {
  id?: string;
  book_title: string;
  chapter_title: string;
  section_title: string;
  page_number: number;
  source_url: string;
  chunk_text: string;
  embedding: number[];
}

export interface ConversationHistory {
  session_id: string;
  history: any;
}

export interface DiagnosticWorkflow {
  id?: string;
  session_id: string;
  query_id: number;
  workflow_type?: string;
  current_step?: number;
  total_steps?: number;
  step_data?: any;
  completed_steps?: string[];
  confidence_scores?: any;
  created_at?: string;
  updated_at?: string;
  completed_at?: string;
}

export interface PatientContext {
  session_id: string;
  context: any;
}

export interface AuditLog {
  id?: string;
  session_id: string;
  event_type: string;
  event_details: any;
  created_at?: string;
}

export class SupabaseService {
  async logAuditEvent(log: Omit<AuditLog, 'id' | 'created_at'>) {
    const { data, error } = await supabase.from('audit_logs').insert(log);
    if (error) {
      console.error('Error logging audit event:', error);
    }
    return data;
  }

  async getMedicalChunks(embedding: number[], keywords: string, match_count: number) {
    // Assume RLS is enabled, so this is secure
    const { data, error } = await supabase.rpc('match_medical_chunks', {
      query_embedding: embedding,
      keywords: keywords,
      match_count: match_count,
    });

    if (error) {
      console.error('Error fetching medical chunks:', error);
      return null;
    }

    return data;
  }

  async storeMedicalChunks(chunks: MedicalChunk[]) {
    const { data, error } = await supabase.from('medical_chunks').insert(chunks);

    if (error) {
      console.error('Error storing medical chunks:', error);
      return null;
    }

    return data;
  }

  async getConversationHistory(sessionId: string) {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('medical_context')
      .eq('id', sessionId)
      .single();

    if (error) {
      console.error('Error fetching conversation history:', error);
      return null;
    }

    return this.decryptData(data?.medical_context);
  }

  async storeConversationHistory(sessionId: string, history: any) {
    const encryptedHistory = this.encryptData(history);
    const { data, error } = await supabase
      .from('user_sessions')
      .update({ medical_context: encryptedHistory })
      .eq('id', sessionId);

    if (error) {
      console.error('Error storing conversation history:', error);
      return null;
    }

    return data;
  }

  async getDiagnosticWorkflow(workflowId: string) {
    const { data, error } = await supabase.from('diagnostic_workflows').select('*').eq('id', workflowId).single();

    if (error) {
      console.error('Error fetching diagnostic workflow:', error);
      return null;
    }

    return data;
  }

  async createDiagnosticWorkflow(workflowData: Omit<DiagnosticWorkflow, 'id'>) {
    const { data, error } = await supabase.from('diagnostic_workflows').insert(workflowData).select().single();

    if (error) {
      console.error('Error creating diagnostic workflow:', error);
      return null;
    }

    return data;
  }

  async updateDiagnosticWorkflow(workflowId: string, updates: Partial<DiagnosticWorkflow>) {
    const { data, error } = await supabase.from('diagnostic_workflows').update(updates).eq('id', workflowId);

    if (error) {
      console.error('Error updating diagnostic workflow:', error);
      return null;
    }

    return data;
  }

  async getPatientContext(sessionId: string) {
    const { data, error } = await supabase.from('user_sessions').select('patient_context').eq('id', sessionId).single();
    if (error) {
      console.error('Error fetching patient context:', error);
      return null;
    }
    return this.decryptData(data?.patient_context);
  }

  async storePatientContext(sessionId: string, context: any) {
    const encryptedContext = this.encryptData(context);
    const { data, error } = await supabase.from('user_sessions').update({ patient_context: encryptedContext }).eq('id', sessionId);
    if (error) {
      console.error('Error storing patient context:', error);
    }
    return data;
  }

  private encryptData(data: any): string {
    if (!data) return data;
    return CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString();
  }

  private decryptData(data: any): any {
    if (!data || typeof data !== 'string') return data;
    try {
      const bytes = CryptoJS.AES.decrypt(data, ENCRYPTION_KEY);
      return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    } catch (error) {
      console.error('Decryption failed:', error);
      return data; // Return original data if decryption fails
    }
  }
}

export const supabaseService = new SupabaseService();


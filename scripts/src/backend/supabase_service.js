"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabaseService = exports.SupabaseService = void 0;
const client_1 = require("@/integrations/supabase/client");
const crypto_js_1 = __importDefault(require("crypto-js"));
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-secret-key';
class SupabaseService {
    // async logAuditEvent(log: Omit<AuditLog, 'id' | 'created_at'>) {
    //   const { data, error } = await supabase.from('audit_logs').insert(log);
    //   if (error) {
    //     console.error('Error logging audit event:', error);
    //   }
    //   return data;
    // }
    async getMedicalChunks(embedding, keywords, match_count) {
        // Assume RLS is enabled, so this is secure
        const { data, error } = await client_1.supabase.rpc('match_medical_chunks', {
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
    async storeMedicalChunks(chunks) {
        const chunksToInsert = chunks.map(chunk => ({
            ...chunk,
            embedding: JSON.stringify(chunk.embedding),
            // The 'id' field is optional, so we remove it if it's not set
        }));
        const { data, error } = await client_1.supabase.from('medical_chunks').insert(chunksToInsert);
        if (error) {
            console.error('Error storing medical chunks:', error);
            return null;
        }
        return data;
    }
    async getConversationHistory(sessionId) {
        const { data, error } = await client_1.supabase
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
    async storeConversationHistory(sessionId, history) {
        const encryptedHistory = this.encryptData(history);
        const { data, error } = await client_1.supabase
            .from('user_sessions')
            .update({ medical_context: encryptedHistory })
            .eq('id', sessionId);
        if (error) {
            console.error('Error storing conversation history:', error);
            return null;
        }
        return data;
    }
    async getDiagnosticWorkflow(workflowId) {
        const { data, error } = await client_1.supabase.from('diagnostic_workflows').select('*').eq('id', workflowId).single();
        if (error) {
            console.error('Error fetching diagnostic workflow:', error);
            return null;
        }
        return data;
    }
    async createDiagnosticWorkflow(workflowData) {
        const { data, error } = await client_1.supabase.from('diagnostic_workflows').insert(workflowData).select().single();
        if (error) {
            console.error('Error creating diagnostic workflow:', error);
            return null;
        }
        return data;
    }
    async updateDiagnosticWorkflow(workflowId, updates) {
        const { data, error } = await client_1.supabase.from('diagnostic_workflows').update(updates).eq('id', workflowId);
        if (error) {
            console.error('Error updating diagnostic workflow:', error);
            return null;
        }
        return data;
    }
    async getPatientContext(sessionId) {
        const { data, error } = await client_1.supabase.from('user_sessions').select('patient_context').eq('id', sessionId).single();
        if (error) {
            console.error('Error fetching patient context:', error);
            return null;
        }
        return this.decryptData(data?.patient_context);
    }
    async storePatientContext(sessionId, context) {
        const encryptedContext = this.encryptData(context);
        const { data, error } = await client_1.supabase.from('user_sessions').update({ patient_context: encryptedContext }).eq('id', sessionId);
        if (error) {
            console.error('Error storing patient context:', error);
        }
        return data;
    }
    encryptData(data) {
        if (!data)
            return data;
        return crypto_js_1.default.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString();
    }
    decryptData(data) {
        if (!data || typeof data !== 'string')
            return data;
        try {
            const bytes = crypto_js_1.default.AES.decrypt(data, ENCRYPTION_KEY);
            return JSON.parse(bytes.toString(crypto_js_1.default.enc.Utf8));
        }
        catch (error) {
            console.error('Decryption failed:', error);
            return data; // Return original data if decryption fails
        }
    }
}
exports.SupabaseService = SupabaseService;
exports.supabaseService = new SupabaseService();
// export const getDisclaimer = async () => {
//   const { data, error } = await supabase
//     .from('disclaimers')
//     .select('disclaimer_text')
//     .single();
//   if (error) {
//     console.error('Error fetching disclaimer:', error);
//     return 'Medical Information Disclaimer: This information is not a substitute for professional medical advice. Always consult with a healthcare provider for any health concerns.';
//   }
//   return data.disclaimer_text;
// };

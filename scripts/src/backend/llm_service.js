"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.llmService = void 0;
const supabase_service_1 = require("./supabase_service");
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_CHAT_API_URL = 'https://api.mistral.ai/v1/chat/completions';
const MISTRAL_EMBEDDING_API_URL = 'https://api.mistral.ai/v1/embeddings';
class LlmService {
    async generateEmbedding(text) {
        try {
            const response = await fetch(MISTRAL_EMBEDDING_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${MISTRAL_API_KEY}`,
                },
                body: JSON.stringify({
                    model: 'mistral-embed',
                    input: [text],
                }),
            });
            if (!response.ok) {
                console.error('Mistral Embedding API error:', response.statusText);
                return [];
            }
            const data = await response.json();
            return data.data[0].embedding;
        }
        catch (error) {
            console.error('Error generating embedding:', error);
            return [];
        }
    }
    async generateMedicalPrompt(symptoms, history) {
        const embedding = await this.generateEmbedding(symptoms);
        if (embedding.length === 0) {
            // Handle embedding generation failure
            console.error('Embedding generation failed, returning empty prompt.');
            return ''; // Or handle error more gracefully
        }
        const contextChunks = await supabase_service_1.supabaseService.getMedicalChunks(embedding, symptoms, 5);
        const context = contextChunks
            ? contextChunks.map((c) => c.chunk_text).join('\n\n')
            : 'No relevant medical context found.';
        return `
      Based on the following medical context and patient history, provide a differential diagnosis.

      Context:
      ${context}

      History:
      ${JSON.stringify(history, null, 2)}

      Symptoms:
      ${symptoms}

      Please provide a ranked list of possible diagnoses with confidence scores.
    `;
    }
    async generateResponse(symptoms, history) {
        try {
            const prompt = await this.generateMedicalPrompt(symptoms, history);
            if (prompt === '') {
                return {
                    success: false,
                    data: { message: 'Error generating medical prompt due to embedding failure.' },
                    source: 'structured-template',
                };
            }
            const response = await fetch(MISTRAL_CHAT_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${MISTRAL_API_KEY}`,
                },
                body: JSON.stringify({
                    model: 'mistral-large-latest',
                    messages: [{ role: 'user', content: prompt }],
                }),
            });
            if (!response.ok) {
                console.error('Mistral API error:', response.statusText);
                return this.fallbackToLocalModel(symptoms, history);
            }
            const data = await response.json();
            this.validateResponse(data);
            return { success: true, data, source: 'mistral' };
        }
        catch (error) {
            console.error('Error generating response:', error);
            return this.fallbackToLocalModel(symptoms, history);
        }
    }
    async fallbackToLocalModel(symptoms, history) {
        console.log('Falling back to local model...');
        // Placeholder for local model inference
        return this.fallbackToStructuredResponse(symptoms, history);
    }
    async fallbackToStructuredResponse(symptoms, history) {
        console.log('Falling back to structured response...');
        // Placeholder for structured response
        return {
            success: false,
            data: { message: 'All LLM services are currently unavailable. Please try again later.' },
            source: 'structured-template',
        };
    }
    validateResponse(data) {
        // Placeholder for response validation logic
        console.log('Validating response...', data);
    }
}
exports.llmService = new LlmService();

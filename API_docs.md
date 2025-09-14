# API Documentation

This document provides an overview of the backend API endpoints, data models, and key workflows for the Nelson-GPT application.

---

## 1. Data Models

The backend relies on several Supabase tables to manage data. The primary tables are:

### `medical_chunks`
*   **Description:** Stores chunks of text from the Nelson Textbook of Pediatrics, along with their embeddings.
*   **Schema:**
    *   `id`: `UUID` (Primary Key)
    *   `book_title`: `TEXT`
    *   `chapter_title`: `TEXT`
    *   `section_title`: `TEXT`
    *   `page_number`: `INTEGER`
    *   `source_url`: `TEXT`
    *   `chunk_text`: `TEXT`
    *   `embedding`: `VECTOR`

### `diagnostic_workflows`
*   **Description:** Tracks the state of multi-step diagnostic processes.
*   **Schema:**
    *   `id`: `UUID` (Primary Key)
    *   `session_id`: `UUID` (Foreign Key to `user_sessions`)
    *   `query_id`: `BIGINT` (Foreign Key to `queries`)
    *   `workflow_type`: `TEXT`
    *   `current_step`: `INTEGER`
    *   `step_data`: `JSONB`
    *   `completed_at`: `TIMESTAMP`

### `user_sessions`
*   **Description:** Manages user sessions and stores conversation context.
*   **Schema:**
    *   `id`: `UUID` (Primary Key)
    *   `user_sub`: `TEXT`
    *   `medical_context`: `JSONB` (Encrypted)
    *   `patient_context`: `JSONB` (Encrypted)

### `audit_logs`
*   **Description:** Logs significant events for auditing and debugging.
*   **Schema:**
    *   `id`: `UUID` (Primary Key)
    *   `session_id`: `UUID`
    *   `event_type`: `TEXT`
    *   `event_details`: `JSONB`

---

## 2. API Endpoints

The backend does not expose traditional REST or GraphQL endpoints. Instead, it is organized as a set of services that can be called from the frontend.

### `SupabaseService`
*   **`logAuditEvent(log)`:** Logs an audit event.
*   **`getMedicalChunks(embedding, keywords, match_count)`:** Retrieves relevant medical chunks based on a query embedding.
*   **`getConversationHistory(sessionId)`:** Fetches the conversation history for a session.
*   **`storeConversationHistory(sessionId, history)`:** Stores the conversation history.

### `LlmService`
*   **`generateResponse(symptoms, history)`:** Generates a response from the Mistral API, using a RAG workflow.

### `OrchestrationEngine`
*   **`execute(sessionId, query)`:** The main entry point for processing a user query. It manages the overall workflow, from authentication to routing and context management.

---

## 3. Request/Response Formats

### Chat Workflow
*   **Request:** A user query is sent to the `OrchestrationEngine`.
    ```json
    {
      "sessionId": "user-session-id",
      "query": "What are the symptoms of measles?"
    }
    ```
*   **Response:** The engine returns a structured response, including the answer and citations.
    ```json
    {
      "result": "Measles is a childhood infection caused by a virus...",
      "citations": [
        {
          "source": "Nelson Textbook of Pediatrics, Chapter 25",
          "url": "http://example.com/peds/chapter25"
        }
      ]
    }
    ```

---

## 4. RAG Workflow and Citation Tracking

The RAG workflow is implemented in the `LlmService`.

1.  **Embedding Generation:** When a query is received, an embedding is generated.
2.  **Context Retrieval:** The `getMedicalChunks` function is called to retrieve the most relevant text chunks from the `medical_chunks` table.
3.  **Prompt Engineering:** The retrieved chunks are used to construct a detailed prompt for the Mistral API.
4.  **Response Generation:** The LLM generates a response based on the provided context.
5.  **Citation Tracking:** The sources of the retrieved chunks are tracked and returned with the final response to ensure transparency and accuracy.


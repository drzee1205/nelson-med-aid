# Initial Task Breakdown: Phase 1

This document outlines the initial tasks for Phase 1 of the Nelson-GPT project: **Core Chat Interface + RAG Backend**.

---

## Backend Tasks

### 1. Supabase Backend Setup
*   **Task:** Configure the Supabase project, including database schema and vector embeddings.
*   **Details:**
    *   Set up Supabase project and define the necessary tables (`medical_chunks`, `diagnostic_workflows`, `user_sessions`, `audit_logs`).
    *   Enable and configure the `pgvector` extension for vector similarity search.
    *   Implement Row Level Security (RLS) policies to ensure data privacy.
*   **Owner:** `[Backend Team]`

### 2. LangChain/LangGraph Integration
*   **Task:** Integrate LangChain/LangGraph to manage application workflows.
*   **Details:**
    *   Set up the `OrchestrationEngine` to route queries based on complexity and specialty.
    *   Implement the `DiagnosticWorkflow` for multi-step medical reasoning.
    *   Ensure the state is managed correctly throughout the conversation.
*   **Owner:** `[Backend Team]`

### 3. Mistral API Configuration
*   **Task:** Configure the Mistral API for LLM integration.
*   **Details:**
    *   Set up the `LlmService` to handle interactions with the Mistral API.
    *   Manage the `MISTRAL_API_KEY` securely.
    *   Implement fallback mechanisms in case of API failures.
*   **Owner:** `[Backend Team]`

### 4. RAG Workflow and Citation Tracking
*   **Task:** Implement the RAG workflow and track citations.
*   **Details:**
    *   Develop a script to process the Nelson Textbook of Pediatrics, create embeddings, and store them in Supabase.
    *   Implement the `getMedicalChunks` function to retrieve relevant context for a given query.
    *   Ensure that citations are tracked and returned with each response.
*   **Owner:** `[Backend Team]`

---

## Frontend Tasks

### 5. Core Chat Interface
*   **Task:** Develop the main chat interface.
*   **Details:**
    *   Build a responsive and intuitive chat UI using React.

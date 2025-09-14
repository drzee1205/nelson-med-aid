# Nelson-GPT: Project Plan

## 1. Project Scope

The goal of the Nelson-GPT project is to develop a sophisticated pediatric medical assistant as a Progressive Web App (PWA). This application will serve as a "morphic.sh clone with a medical adaptation layer," providing evidence-based guidance for pediatric care. The core of the application will be powered by a Retrieval-Augmented Generation (RAG) workflow, leveraging the Nelson Textbook of Pediatrics.

The project emphasizes a HIPAA-compliant architecture, ensuring no patient data is stored, and focuses on delivering fast, accurate, and citable responses.

---

## 2. Phases & Milestones

The project is divided into four distinct phases, each with specific milestones and objectives.

### Phase 1: Core Chat Interface + RAG Backend
*   **Objective:** Build the foundational components of the application.
*   **Milestones:**
    *   Set up the Supabase backend with pgvector for efficient vector search.
    *   Integrate LangChain/LangGraph to manage complex, stateful workflows.
    *   Configure the Mistral API for Large Language Model (LLM) integration.
    *   Implement the core RAG workflow, including citation tracking.
    *   Develop a functional, modern chat interface using React.

### Phase 2: PWA Offline Functionality
*   **Objective:** Enhance the application with offline capabilities.
*   **Milestones:**
    *   Implement a service worker to cache application assets and data.
    *   Create a `manifest.json` file to define PWA properties.
    *   Ensure a seamless user experience in offline or low-connectivity scenarios.

### Phase 3: Advanced UI/Medical Tools
*   **Objective:** Introduce specialized medical tools and improve the user interface.
*   **Milestones:**
    *   Develop advanced UI components for better data visualization.
    *   Integrate specialized medical calculators (e.g., dosage calculators, growth charts).
    *   Refine the user experience based on initial feedback.

### Phase 4: Performance & Testing
*   **Objective:** Optimize the application for speed, reliability, and accuracy.
*   **Milestones:**
    *   Conduct comprehensive performance testing to ensure sub-3-second response times.
    *   Implement a robust testing suite, including unit, integration, and end-to-end tests.
    *   Perform a final review of the HIPAA compliance measures.

---

## 3. Key Deliverables

*   **Planning Documentation:** `planning_docs.md`, `initial_task_breakdown.md`, `API_docs.md`, `deployment_plan.md`.
*   **Source Code:** A well-documented and maintainable codebase for both the frontend and backend.
*   **Deployment:** A fully deployed PWA and Supabase backend.
*   **Documentation:** Detailed setup instructions, API documentation, and a comprehensive `README.md`.

---

## 4. Success Criteria

*   **Performance:** Achieve sub-3-second response times for all queries, including citations.
*   **Accuracy:** Provide medically accurate and relevant information, with clear citations from the Nelson Textbook of Pediatrics.
*   **Compliance:** Adhere to HIPAA guidelines by not storing any patient data.
*   **User Experience:** Deliver a "pixel-perfect" clone of morphic.sh, adapted for a medical context, with a seamless and intuitive user interface.

## 🩺 Nelson-GPT: Pediatric Medical AI Assistant

📖 Overview

Nelson-GPT is a Progressive Web App (PWA) that replicates the clean, minimal interface of morphic.sh while integrating a Retrieval-Augmented Generation (RAG) pipeline for pediatric medicine.
It provides healthcare professionals with evidence-based clinical support, powered by the Nelson Textbook of Pediatrics.

🚀 Designed for speed, accuracy, and trust, Nelson-GPT combines modern web tech with medical AI to deliver sub-3 second responses and reliable citations.


---

## 🎯 Features

🔹 Pixel-perfect UI — morphic.sh design with pediatric medical branding

🔹 Evidence-based AI — RAG pipeline with citation tracking

🔹 Offline-ready PWA — installable, cache-first, and background sync

🔹 Medical tools — dosing calculator, growth charts, vaccination schedules

🔹 Interactive chat — markdown support, citations, source previews

🔹 User management — auth, chat history, export (Markdown/PDF)

🔹 Accessibility & performance — WCAG 2.1 AA, Lighthouse 90+



---

## 🏗️ Architecture

Backend

Supabase (Postgres + pgvector) for embeddings & chat history

LangChain / LangGraph for orchestration

Mistral API for reasoning engine

RESTful API endpoints with rate limiting

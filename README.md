# AI Mock Interview Engine

A real-time conversational interview platform designed to simulate technical interviews through adaptive voice interactions. The system combines browser-native speech processing, contextual large language model reasoning, and persistent conversation reconstruction to deliver dynamic interview experiences without relying on static question banks or predefined interview flows.

Unlike traditional mock interview platforms that operate using scripted prompts, this engine continuously evaluates candidate responses, adjusts questioning strategies, challenges weak explanations, and generates personalized interview paths based on historical conversation context and external profile signals.

---

# Overview

The platform is designed around three core principles:

* **Voice-first interaction**
* **Context-aware interview reasoning**
* **Stateless conversation orchestration**

All speech processing occurs at the browser edge using native speech APIs, while the backend functions as a lightweight orchestration layer responsible for conversation reconstruction, persistence, and AI reasoning.

The result is a low-latency interview experience that avoids the complexity of dedicated audio streaming infrastructure while maintaining highly adaptive interview behavior.

---

# Core Capabilities

### Dynamic Interview Adaptation

The interviewer continuously evaluates candidate responses and decides whether to:

* investigate deeper technical understanding,
* request clarification,
* challenge incomplete answers,
* pivot to adjacent topics,
* or progress to the next competency area.

### Contextual Question Generation

Questions are generated dynamically using:

* conversation history,
* candidate response quality,
* interview objectives,
* extracted GitHub profile information,
* project and repository metadata.

### Voice-Driven Interaction

The platform supports a fully conversational workflow through:

* browser-native speech recognition,
* synthesized voice responses,
* continuous turn-based interaction,
* near real-time response generation.

### Persistent Interview Reconstruction

Rather than maintaining complex server-side session state, the system reconstructs the complete interview context from persistent storage during every interaction cycle.

---

# System Design

The application architecture intentionally minimizes infrastructure complexity by delegating speech processing to browser-native APIs while maintaining server-side orchestration through a stateless execution model.

```mermaid
graph LR
    A[Browser Mic] -->|PCM Audio| B[Web Speech STT]
    B -->|Text Transcript| C[React Frontend]
    C -->|REST API Payload| D[Bun + Express Backend]
    D -->|Contextual Prompt| E[Gemini 2.5 Flash]
    E -->|Text Response| D
    D -->|save| F[(PostgreSQL)]
    D -->|JSON Reply| C
    C -->|Text Stream| G[Web Speech TTS]
    G -->|Audio Playback| H[Browser Speaker]
```

---

# Interview Execution Lifecycle

Each interview session follows a deterministic orchestration pipeline while allowing non-deterministic conversational behavior.

```mermaid
graph TD
    A[Candidate speaks into mic] --> B[Web Speech API transcribes locally]
    B --> C[Candidate finishes speaking]
    C --> D[Full transcript payload assembled]
    D --> E[Bun API fetches entire conversation history]
    E --> F[Gemini evaluates answer + GitHub context]
    F --> G[Engine decides next phase & generates response]
    G --> H[Response routed back to client]
    H --> I[Web Speech Synthesis converts to speech]
    I --> J[Audio plays for candidate]
    J --> A
```

---

# Conversation Reconstruction Model

The interview engine does not maintain in-memory conversational state. Instead, every interaction cycle reconstructs the entire interview context directly from persistent storage.

This approach provides:

* fault tolerance,
* horizontal scalability,
* deterministic context generation,
* session recovery,
* reduced memory consumption.

```mermaid
graph TD
    A[Interview Initiated] -->|GitHub Scraped| B[System Prompt Seeded]
    B --> C[AI Opening Greeting]
    C --> D[User Submits Spoken Answer]
    D --> E[Transcript Appended to PostgreSQL]
    E --> F[Full History Sent to LLM]
    F -->|Prompt: Evaluate & Follow-up| G[LLM Generates Next Question]
    G -->|Response Spoken| D
    D -->|Time limit / User ends| H[Wrap-up Session]
    H -->|Async Task| I[Generate Detailed Feedback Report]
```

---

# Technology Selection

| Component          | Implementation               |
| ------------------ | ---------------------------- |
| Client Application | React 18, Vite, Tailwind CSS |
| Server Runtime     | Bun, Express.js              |
| Persistence Layer  | PostgreSQL, Prisma ORM       |
| Authentication     | JWT, bcryptjs                |
| Speech Processing  | Native Web Speech API        |
| Language Model     | Google Gemini 2.5 Flash      |

---

# Repository Organization

```text
apps/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   │
│   └── src/
│       ├── db.ts
│       ├── index.ts
│       ├── types.ts
│       └── scrapers/
│           └── github.ts
│
└── frontend/
    └── src/
        ├── components/
        ├── lib/
        ├── styles/
        └── App.tsx
```

---

# Backend Design Decisions

### Browser-Native Speech Processing

Audio transcription and synthesis are delegated entirely to browser-native APIs. This removes the need for:

* WebRTC audio relays,
* speech processing servers,
* persistent audio streams,
* external speech infrastructure.

### Stateless Conversation Management

Interview state is reconstructed from persisted messages during every request cycle rather than relying on long-lived server sessions.

### Context Injection Pipeline

Prior to interview initialization, GitHub metadata is extracted and incorporated into the model context, allowing generation of repository-specific interview questions.

### Asynchronous Evaluation Pipeline

Interview termination triggers a background evaluation workflow that generates structured performance feedback while immediately releasing frontend resources.

### Bun Runtime Optimization

The backend leverages Bun's runtime characteristics to achieve:

* lower startup overhead,
* faster dependency resolution,
* reduced memory consumption,
* efficient request processing.

---

# Local Development

Clone the repository and install all dependencies:

```bash
git clone <repo-url>
cd ai-mock-interview

bun install --cwd apps/backend
bun install --cwd apps/frontend
```

Configure backend environment variables:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/mock_interview
JWT_SECRET=your_secure_jwt_secret
GEMINI_API_KEY=your_google_gemini_key
```

Initialize the database:

```bash
cd apps/backend

npx prisma db push
npx prisma generate

cd ../..
```

Start both applications:

```bash
bun run --cwd apps/backend dev &
bun run --cwd apps/frontend dev
```

Default endpoints:

| Service              | URL                   |
| -------------------- | --------------------- |
| Backend API          | http://localhost:3001 |
| Frontend Application | http://localhost:3000 |

---

# HTTP Interface

```text
POST   /api/v1/auth/register
POST   /api/v1/auth/login

GET    /api/v1/dashboard

POST   /api/v1/pre-interview

POST   /api/v1/interview/:id/init
POST   /api/v1/message/:id
POST   /api/v1/interview/:id/end

GET    /api/v1/result/:id
```

---

# Design Philosophy

This project intentionally avoids:

* static question banks,
* predefined interview trees,
* persistent server-side conversational state,
* dedicated speech infrastructure,
* heavyweight websocket orchestration.

Instead, it adopts a context reconstruction approach where interview intelligence emerges from the combination of persistent conversation history, external profile context, and real-time language model reasoning.

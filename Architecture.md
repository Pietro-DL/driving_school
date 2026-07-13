# Architecture of the Directory Structure:
driving-school-platform/
├── README.md                  # Global context: Project goals, tech stack, global setup
├── docker-compose.yml         # To spin up the DB and services locally
│
├── frontend/                  # TypeScript (Assuming Next.js or React)
│   ├── README.md              # Context: UI framework, state management approach, styling
│   ├── src/
│   │   ├── api/               # API clients/fetch wrappers (mirrors backend endpoints)
│   │   ├── components/        # Reusable dumb components (buttons, video players, cards)
│   │   ├── features/          # Domain-driven UI modules
│   │   │   ├── auth/          # Login, signup, password reset UI
│   │   │   ├── lessons/       # Video viewer, text content rendering
│   │   │   ├── quizzes/       # Quiz runner, result screens
│   │   │   └── payments/      # Pricing tables, checkout flows
│   │   ├── hooks/             # Custom React hooks (e.g., useAuth, useQuizState)
│   │   └── types/             # Shared TypeScript interfaces (mirrors FastAPI schemas)
│
└── backend/                   # Python (FastAPI)
    ├── README.md              # Context: FastAPI setup, DB connection, migration strategy
    ├── requirements.txt
    └── app/
        ├── README.md          # Context: Architectural pattern (e.g., MVC or Service Repository)
        ├── api/               # The Routers (Endpoints only, NO business logic)
        │   ├── v1/
        │   │   ├── endpoints/
        │   │   └── router.py
        ├── core/              # Global config, JWT security, Dependency Injections
        ├── db/                # SQLAlchemy setup, session makers
        ├── models/            # SQLAlchemy Database Models (Tables)
        ├── schemas/           # Pydantic Models (Data validation & serialization)
        ├── services/          # Business logic (Where the heavy lifting lives)
        │   ├── README.md      # Context: Crucial for LLMs. Explain payment gateway integration here.
        │   ├── auth_srv.py
        │   ├── payment_srv.py # Handles the state machine & webhooks
        │   └── quiz_srv.py    # Grading logic
        └── tests/             # Pytest directory

## 1. Identity & Access Management (IAM) Protocol
This section details the lifecycle of user authentication and authorization.

### Core Concept Correction: JWT Generation
- JWTs (JSON Web Tokens) are strictly generated on the Server-Side. If a client generated the token, a malicious user could simply generate a token declaring themselves an "Admin" on a "Premium" plan. The security of a JWT relies on a cryptographic signature that only the server can create because only the server possesses the secret signing key.

#### Phase 1: The Login Flow & Token Generation
This is the process from the moment the user clicks "Login" to the moment they are authenticated.

1. Client-Side (UI Rendering): The user accesses the website. The frontend (frontend/src/features/auth/) renders the login form.

2. Client-Side (Request): The user submits their email and password. A function in frontend/src/api/ sends an HTTP POST request to the backend with these credentials.

3. Server-Side (Routing): The FastAPI router at backend/app/api/v1/endpoints/auth.py receives the payload. It does not process the logic; it immediately passes the data to the service layer.

4. Server-Side (Validation): backend/app/services/auth_srv.py takes over. It queries the PostgreSQL database (via backend/app/db/ and backend/app/models/) to find the user by email.

5. Server-Side (Security Check): The service layer hashes the incoming password using a secure algorithm (like bcrypt) and compares it to the hashed password stored in the database.

6. Server-Side (JWT Generation): If the passwords match, backend/app/core/security.py generates the JWT. The token contains a JSON payload (e.g., {"sub": "user_123", "role": "student", "plan": "premium", "exp": 1718293847}). The server encrypts this payload with a highly secure, private string (the SECRET_KEY stored in your .env file) to create a signature.

7. Server-Side (Response): The server sends the JWT back to the client.

#### Phase 2: Token Storage & Exchange
Once the frontend has the token, it must hold onto it and present it like an ID badge for future requests.

- Client-Side (Storage): The frontend receives the JWT. For maximum security against Cross-Site Scripting (XSS) attacks, the frontend should store this token in an HttpOnly Cookie. This means the browser holds the token and automatically attaches it to future requests, but malicious JavaScript cannot read it. (If you use localStorage, your frontend/src/api/ wrappers must manually attach it to the Authorization header as a Bearer token).

- Client-Side (State): The frontend decodes the JWT payload (which is safe to do client-side, as the payload is just base64 encoded, not encrypted) to update the UI state in frontend/src/features/auth/ (e.g., showing the user's name and hiding the "Buy Premium" button if they already have it).

#### Phase 3: Authorization (Accessing Protected Resources)
This is what happens when a user tries to access a quiz or a video lesson.

1. Client-Side (Request): The user clicks on a premium lesson. frontend/src/api/ sends a GET request to the backend. The browser automatically includes the HttpOnly Cookie containing the JWT.

2. Server-Side (Interception): Before the request reaches the endpoint, a dependency injection in backend/app/core/dependencies.py intercepts it.

3. Server-Side (Verification): The server extracts the JWT and uses its SECRET_KEY to verify the signature.

- If the signature is invalid (someone tampered with the token), the server rejects it with a 401 Unauthorized.

- If the exp (expiration) timestamp has passed, it rejects it.

4. Server-Side (Access Control): If verified, the server looks at the payload (e.g., "plan": "basic"). It checks this against the requirements of the endpoint (backend/app/api/v1/endpoints/lessons.py). If the lesson requires a "premium" plan, the server rejects the request with a 403 Forbidden.

5. Server-Side (Execution): If the user has the right plan, the request is routed to backend/app/services/lesson_srv.py to fetch the data and return it to the client.

Phase 4: Cybersecurity & Database Protection
Protecting the PostgreSQL database and the integrity of the system relies on strict boundaries.

JWT Integrity: Because the JWT is cryptographically signed by backend/app/core/security.py, a hacker cannot intercept their token, change "plan": "basic" to "plan": "premium", and send it back. The server will see the signature no longer matches the payload and will instantly drop the request.

Database Exploitation (SQL Injection): You will use an ORM (Object-Relational Mapper) like SQLAlchemy in your backend/app/db/ directory. You will never write raw SQL strings like SELECT * FROM users WHERE email = ' + user_input + '. SQLAlchemy uses parameterized queries, which automatically sanitize all user inputs, making traditional SQL injection practically impossible.

Data Minimization: The JWT payload only contains non-sensitive identifiers (User ID, Role, Plan). It never contains passwords, personal addresses, or payment details. If a token is somehow intercepted, the attacker only gets a temporary session badge, not the user's identity data.

## 2. Subscription Lifecycle (Stripe Integration)
This section details the process of purchasing a subscription and verifying payment.

[ Frontend Browser ]         [ FastAPI Backend ]         [ Payment Gateway (Stripe) ]
         |                            |                               |
         | 1. Click "Buy Premium"     |                               |
         |--------------------------->|                               |
         |                            | 2. Request Checkout Session   |
         |                            |------------------------------>|
         |                            |                               |
         |                            | 3. Return Secret Session URL  |
         |                            |<------------------------------|
         | 4. Redirect User to URL    |                               |
         |<---------------------------|                               |
         |                            |                               |
         | -- USER ENTERS CARD & APPROVES IN THEIR BANK APP (SCA) --  |
         |                                                            |
         | 5. Payment Success Page                                    | 6. HTTP Webhook Event
         |<-----------------------------------------------------------|---------------->|
         |                            |                               | (Signed Request)|
         |                            | 7. Verify Signature & Payload |                 |
         |                            |    Update DB to "Premium"     |                 |
         |                            |----------------------------   |                 |
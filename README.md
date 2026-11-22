# Student Portal Benchmark: Microservices vs. Monolith

Backend and frontend implementation for the final-year research project:
> **"Design and Implementation of a Containerized Microservices Architecture: A Comparative Performance Evaluation Against a Monolithic System"**

[![Node.js](https://img.shields.io/badge/Node.js-20+-68A063?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Apache JMeter](https://img.shields.io/badge/Apache%20JMeter-5.6-D22128?logo=apachejmeter&logoColor=white)](https://jmeter.apache.org/)

---

## Table of Contents

- [Overview & Research Context](#overview--research-context)
- [Architectural Comparison](#architectural-comparison)
- [System Architecture](#system-architecture)
  - [Microservices Architecture](#microservices-architecture)
  - [Monolithic Architecture](#monolithic-architecture)
- [Repository Structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
  - [1. Environment Configuration](#1-environment-configuration)
  - [2. Running the Microservices Backend](#2-running-the-microservices-backend)
  - [3. Running the Monolith Backend](#3-running-the-monolith-backend)
  - [4. Running the Frontend Portal](#4-running-the-frontend-portal)
- [Demo Credentials](#demo-credentials)
- [Data Seeding & Functional Parity Verification](#data-seeding--functional-parity-verification)
  - [Automated Smoke Testing](#automated-smoke-testing)
  - [Database Seeding](#database-seeding)
- [Performance Benchmarking with JMeter](#performance-benchmarking-with-jmeter)
  - [Test Plan Suites](#test-plan-suites)
  - [Running Headless Benchmarks & Generating Reports](#running-headless-benchmarks--generating-reports)
  - [Benchmark Parameters](#benchmark-parameters)
  - [Benchmarking Best Practices](#benchmarking-best-practices)
- [Fault-Isolation & Resilience Demonstration](#fault-isolation--resilience-demonstration)
- [API Reference](#api-reference)
- [Academic & Implementation Notes (Chapter 4)](#academic--implementation-notes-chapter-4)

---

## Overview & Research Context

This project provides a realistic, production-calibrated university student portal designed to empirically benchmark a **containerized microservices architecture** against an equivalent **monolithic architecture**.

Both architectures implement the **exact same business rules, RESTful API contract, and database schemas**, ensuring that benchmark variance results strictly from architectural and deployment topology (process boundaries, network serialization, database connection pooling, inter-service HTTP communication) rather than application logic.

### Core Modules

1. **Authentication & User Management**: User registration, role-based access control (Student, Lecturer, Admin), and stateless JWT issuance/verification.
2. **Course Catalogue & Registration**: Semester course listings, student enrolments, prerequisite verification, and maximum 24-unit cap enforcement.
3. **Academic Results**: Lecturer grade entry, student transcripts, score updates, and automated Nigerian university standard 5-point grading scale (A–F).
4. **Fees & Payments**: Tuition and student fee invoices, idempotent mock payment gateway processing, and payment transaction history.

---

## Architectural Comparison

| Dimension | Containerized Microservices | Modular Monolith |
|---|---|---|
| **Host Entry Point** | API Gateway (`http://localhost:8080`) | Monolithic App (`http://localhost:3000`) |
| **Application Runtime** | 4 decoupled Express services + 1 API Gateway | 1 unified Express application (4 modules) |
| **Persistence Strategy** | Polyglot Database-per-Service: Auth (Postgres), Results (Postgres), Courses (MongoDB), Payments (MongoDB) | Single Shared Relational Database (PostgreSQL) |
| **Inter-Service Communication** | Synchronous REST (`course-service` $\rightarrow$ `results-service` for prerequisite validation) | Direct relational SQL join / in-memory transaction |
| **Fault Isolation** | High: Failure in one service leaves others operational | Low: Process failure crashes entire application |
| **Docker Compose Spec** | `docker-compose.microservices.yml` | `docker-compose.monolith.yml` |
| **Frontend Compatibility** | Identical API contract; change only `VITE_API_BASE_URL` | Identical API contract; change only `VITE_API_BASE_URL` |

---

## System Architecture

### Microservices Architecture

```
                    +------------------------------------+
                    |  React Frontend / JMeter Runners   |
                    +-----------------+------------------+
                                      |
                                      v
                        [Port 8080] API Gateway
             (Reverse Proxy, JWT Signature Check, Rate Limiter)
                 |              |              |              |
                 v              v              v              v
         +---------------+ +----------+ +-------------+ +--------------+
         |  Auth Service | |  Course  | |   Results   | |   Payment    |
         |   (Port 3001) | |  Service | |   Service   | |   Service    |
         |               | |(Port 3002| | (Port 3003) | | (Port 3004)  |
         +-------+-------+ +----+-----+ +------+------+ +-------+------+
                 |              |              ^                |
                 |              | (Internal)   |                |
                 |              +--------------+                v
                 |           (Check Prereq /internal)   +---------------+
                 |                                      | Mock Payment  |
                 |                                      |    Gateway    |
                 v                                      +-------+-------+
         +---------------+ +----------+ +-------------+         |
         |  PostgreSQL   | | MongoDB  | | PostgreSQL  |         v
         |   (auth_db)   | |(course_db| |(results_db) | +---------------+
         +---------------+ +----------+ +-------------+ |    MongoDB    |
                                                        | (payment_db)  |
                                                        +---------------+
```

### Monolithic Architecture

```
                    +------------------------------------+
                    |  React Frontend / JMeter Runners   |
                    +-----------------+------------------+
                                      |
                                      v
                        [Port 3000] Monolith App
             (Auth, Courses, Results, Payments in Single Process)
                         |                             |
                         v                             v
             +-----------------------+     +-----------------------+
             |      PostgreSQL       |     | Mock Payment Gateway  |
             |     (monolith_db)     |     |      (Port 4000)      |
             +-----------------------+     +-----------------------+
```

---

## Repository Structure

```
spb/
├── gateway/                        # Reverse proxy & API Gateway (routing, rate limiting, JWT check)
├── services/
│   ├── auth-service/               # User registration, authentication, RBAC (PostgreSQL)
│   ├── course-service/             # Course catalogue and enrolment management (MongoDB)
│   ├── results-service/            # Grade entry, transcript calculations (PostgreSQL)
│   └── payment-service/            # Invoicing and payment transaction handling (MongoDB)
├── monolith/                       # Monolithic implementation of all 4 service domains (PostgreSQL)
├── mock-payment-gateway/           # Stand-in service simulating external banking/card processor
├── frontend/                       # Modern React 18 + Vite frontend for Students, Lecturers, and Admins
│   ├── src/
│   │   ├── pages/                  # Login, StudentPortal, and StaffPortal views
│   │   ├── api.js                  # Axios/fetch wrapper with unified JWT auth header injection
│   │   └── App.jsx                 # Dynamic routing and session management
├── shared/                         # Common code: JWT helpers, grading scales, unit limits, errors
├── scripts/
│   ├── smoke-test.js               # 34-check functional parity test runner
│   ├── seed.js                     # Deterministic test-data population script
│   └── sync-shared.js              # Syncs shared/ source files across all microservice directories
├── jmeter/                         # JMeter load-testing and burst benchmark test plans
│   ├── calibration.jmx             # Saturation curve and concurrency ramp-up test
│   ├── burst.jmx                   # Real-world traffic spike simulation
│   ├── login-burst.jmx             # CPU-heavy authentication burst (bcrypt evaluation)
│   ├── register-burst.jmx          # Course enrolment concurrency with inter-service calls
│   └── result-burst.jmx            # High-concurrency pre-authenticated result checks
├── docker-compose.microservices.yml# Docker specification for 6 microservice containers + 4 databases
├── docker-compose.monolith.yml     # Docker specification for monolithic app + Postgres
├── students.csv                    # Seeded student benchmark credentials with pre-computed JWT tokens
└── .env.example                    # Sample environment variable template
```

---

## Prerequisites

Before running the backends or executing benchmarks, ensure you have:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/macOS) or Docker Engine with Docker Compose plugin (Linux).
- [Node.js](https://nodejs.org/) (v20 LTS or later) for seeding and smoke-testing scripts.
- [Apache JMeter](https://jmeter.apache.org/) (v5.6 or later) to execute benchmark suites.

---

## Quick Start

### 1. Environment Configuration

Create a local `.env` configuration file from the template:

```bash
cp .env.example .env
```

Key environment configurations available in `.env`:

| Key | Default | Description |
|---|---|---|
| `JWT_SECRET` | `change-me-to-a-long-random-string` | Secret key used for signing and verifying tokens |
| `INTERNAL_API_KEY` | `change-me-internal` | Key for private inter-service communication |
| `ADMIN_SIGNUP_KEY` | `change-me-admin` | Passkey required to register lecturer or admin accounts |
| `BCRYPT_ROUNDS` | `10` | Password hashing workload (kept identical across both architectures) |
| `MOCK_LATENCY_MS` | `150` | Simulated bank latency added by the mock payment gateway |
| `MOCK_FAILURE_RATE` | `0` | Artificial failure rate for payment resilience testing |
| `RATE_LIMIT_ENABLED` | `false` | Enable/disable gateway rate limiter (keep `false` during benchmarks) |

---

### 2. Running the Microservices Backend

Build and start the API Gateway, 4 domain microservices, 4 dedicated databases, and the mock payment gateway:

```bash
docker compose -f docker-compose.microservices.yml up -d --build
```

Verify service health:

```bash
# Check container status
docker compose -f docker-compose.microservices.yml ps

# Query gateway health check
curl http://localhost:8080/health/services
# Expected output: {"auth":"up","course":"up","results":"up","payment":"up"}
```

To stop the microservices backend:
```bash
docker compose -f docker-compose.microservices.yml down
# Add -v to wipe database volumes:
docker compose -f docker-compose.microservices.yml down -v
```

---

### 3. Running the Monolith Backend

> **Note**: Run only one backend at a time during performance benchmarking to prevent CPU and memory resource contention.

Build and start the Monolith container, its PostgreSQL database, and the mock payment gateway:

```bash
docker compose -f docker-compose.monolith.yml up -d --build
```

Verify health status:

```bash
curl http://localhost:3000/health
# Expected output: {"status":"healthy","database":"connected"}
```

To stop the monolith backend:
```bash
docker compose -f docker-compose.monolith.yml down
```

---

### 4. Running the Frontend Portal

The React frontend allows students, lecturers, and administrators to interact with either backend.

```bash
cd frontend
npm install
```

Configure backend target in `frontend/.env.local`:

```bash
# To target the Microservices backend:
VITE_API_BASE_URL=http://localhost:8080

# OR to target the Monolithic backend:
# VITE_API_BASE_URL=http://localhost:3000
```

Start the Vite development server:

```bash
npm run dev
```

Open your browser at `http://localhost:5173`.

---

## Demo Credentials

Default accounts generated by `scripts/seed.js`:

| Role | Email Address | Password | Permissions & Views |
|---|---|---|---|
| **Administrator** | `admin@portal.test` | `Password123` | Create/update courses, generate fee invoices, audit user reports |
| **Lecturer** | `lecturer@portal.test` | `Password123` | View course registrations, submit and update student semester grades |
| **Student** | `student0001@portal.test` *(through 0500)* | `Password123` | View catalogue, register for courses, check results, pay invoices |

---

## Data Seeding & Functional Parity Verification

### Automated Smoke Testing

Before running performance benchmarks, verify that both backends adhere to the same functional behavior and business rules. The test runner executes **34 end-to-end assertions** (user registration, duplicate handling, JWT security, course creation, prerequisite enforcement, 24-unit cap, grade recording, invoice creation, and payment idempotency).

```bash
# Test Microservices backend
node scripts/smoke-test.js http://localhost:8080

# Test Monolith backend
node scripts/smoke-test.js http://localhost:3000
```

Both tests must output:
```text
34 passed, 0 failed
```

### Database Seeding

Populate the active backend with realistic dataset including standard accounts, 12 departmental courses (with prerequisites), student profiles, completed course results, and fee invoices:

```bash
# Seed Microservices backend with 500 students
node scripts/seed.js http://localhost:8080 --students 500

# Seed Monolith backend with 500 students
node scripts/seed.js http://localhost:3000 --students 500
```

Seeding produces a dataset mapping in `scripts/output/students-<host>-<port>.csv` containing credentials and JWT tokens utilized by the JMeter test plans.

---

## Performance Benchmarking with JMeter

The `jmeter/` directory contains Apache JMeter test plans tailored to evaluate system performance under varying load profiles.

### Test Plan Suites

| Test Plan | File | Load Profile & Objective |
|---|---|---|
| **Calibration** | `jmeter/calibration.jmx` | Ramps up concurrent virtual users to identify system saturation kneepoint and threshold throughput. |
| **General Burst** | `jmeter/burst.jmx` | Simulates a realistic student rush (result release day) with a mixed read/write query distribution. |
| **Login Burst** | `jmeter/login-burst.jmx` | High-concurrency authentication spike evaluating CPU saturation caused by bcrypt hashing in Auth Service vs Monolith. |
| **Registration Burst** | `jmeter/register-burst.jmx` | Concurrently registers students for courses with prerequisites, evaluating synchronous inter-service communication (`course-service` $\rightarrow$ `results-service`). |
| **Result Burst** | `jmeter/result-burst.jmx` | Evaluates database read throughput and response times using pre-authenticated JWT tokens (eliminating auth CPU bias). |

### Running Headless Benchmarks & Generating Reports

Run JMeter in non-GUI (headless) mode for maximum benchmarking accuracy, passing parameters dynamically via CLI flags:

```bash
# Example: Running the Registration Burst test against Microservices (Port 8080)
jmeter -n \
  -t jmeter/register-burst.jmx \
  -Jhost=localhost \
  -Jport=8080 \
  -l results/microservices-register.jtl \
  -e -o results/report-microservices-register/
```

```bash
# Example: Running the same Registration Burst test against Monolith (Port 3000)
jmeter -n \
  -t jmeter/register-burst.jmx \
  -Jhost=localhost \
  -Jport=3000 \
  -l results/monolith-register.jtl \
  -e -o results/report-monolith-register/
```

### Benchmark Parameters

All test plans support property overrides via `-J<param>=<value>`:

| Property | Default | Description |
|---|---|---|
| `host` | `localhost` | Target hostname or IP address |
| `port` | `8080` | Target port (`8080` for Microservices Gateway, `3000` for Monolith) |
| `users` | `500` | Number of concurrent virtual user threads |
| `ramp` | `300` | Thread ramp-up time in seconds |
| `duration` | `360` | Total test execution duration in seconds |

### Benchmarking Best Practices

1. **Isolate Runs**: Never run both backends simultaneously during testing.
2. **Environment Parity**: Keep `BCRYPT_ROUNDS=10`, `RATE_LIMIT_ENABLED=false`, and identical resource constraints.
3. **Warm-Up**: Execute one low-concurrency warm-up run prior to capturing measured benchmark results.
4. **Metrics Collection**: Monitor container CPU and memory consumption during runs via:
   ```bash
   docker stats
   ```

---

## Fault-Isolation & Resilience Demonstration

A key architectural advantage of microservices is **partial fault tolerance** (graceful degradation) compared to the monolithic **single-point-of-failure**.

### Testing Graceful Degradation in Microservices

1. Stop only the Results Service:
   ```bash
   docker compose -f docker-compose.microservices.yml stop results-service
   ```
2. Verify service availability through Gateway:
   ```bash
   curl http://localhost:8080/health/services
   # Output: {"auth":"up","course":"up","results":"down","payment":"up"}
   ```
3. Test endpoints:
   - `GET /api/results/me` $\rightarrow$ Returns `503 Service Unavailable`.
   - `POST /api/registrations` for a course **with prerequisites** $\rightarrow$ Returns `503 Service Unavailable` (depends on Results Service).
   - `POST /api/registrations` for a course **without prerequisites** $\rightarrow$ `201 Created` (**continues to work**).
   - Authentication and Fee Payments $\rightarrow$ `200 OK` (**remain completely functional**).
4. Restore the service:
   ```bash
   docker compose -f docker-compose.microservices.yml start results-service
   ```

### Monolithic Comparison

Stopping the monolith container halts all functionality instantly:
```bash
docker compose -f docker-compose.monolith.yml stop monolith
# All routes across Auth, Courses, Results, and Payments immediately drop connection.
```

---

## API Reference

All protected endpoints require an HTTP header:
`Authorization: Bearer <token>`

| Method | Endpoint | Access Role | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new user account (`student`, `lecturer`, or `admin`) |
| `POST` | `/api/auth/login` | Public | Authenticate credentials; returns signed JWT and profile |
| `GET` | `/api/auth/me` | Authenticated | Retrieve authenticated user profile |
| `GET` | `/api/auth/users` | Admin, Lecturer | List users (`?role=student`) |
| `GET` | `/api/courses` | Authenticated | Fetch course catalogue (`?semester=first\|second`) |
| `GET` | `/api/courses/:code` | Authenticated | Retrieve detailed information for a course |
| `POST` | `/api/courses` | Admin | Create a new course with prerequisite specifications |
| `PUT` | `/api/courses/:code` | Admin | Update course metadata or unit load |
| `POST` | `/api/registrations` | Student | Register semester courses (enforces prerequisites & 24-unit cap) |
| `GET` | `/api/registrations/me` | Student | View current student's enrolled courses |
| `GET` | `/api/registrations` | Admin, Lecturer | Course enrolment roster (`?courseCode=CSC401`) |
| `GET` | `/api/results/me` | Student | View own semester grades and academic GPA |
| `GET` | `/api/results` | Admin, Lecturer | List grades for a specific course |
| `POST` | `/api/results` | Admin, Lecturer | Submit student examination score (auto-computes A–F grade) |
| `PUT` | `/api/results/:id` | Admin, Lecturer | Edit an existing grade score |
| `POST` | `/api/invoices` | Admin | Generate student fee invoice |
| `GET` | `/api/invoices/me` | Student | Retrieve own fee invoices and pending balances |
| `GET` | `/api/invoices` | Admin | Audit invoices (`?status=pending\|paid`) |
| `POST` | `/api/payments` | Student | Submit invoice payment via mock payment gateway |
| `GET` | `/api/payments/me` | Student | Retrieve personal payment transaction receipts |

---

## Academic & Implementation Notes (Chapter 4)

- **Decoupled Verification**: The Auth Service signs standard HMAC-SHA256 JWTs. The API Gateway and downstream services independently verify signatures using `JWT_SECRET` in memory. This eliminates synchronous authentication round-trips to the Auth Service on every request.
- **Polyglot Persistence**: The microservices architecture leverages relational PostgreSQL for structured, foreign-key-heavy data (Users, Grades) and document-oriented MongoDB for semi-structured, catalogue, and transaction data (Courses, Invoices).
- **Inter-Service Resiliency**: Course registration verifies completed prerequisites by querying the Results Service over an internal REST route (`/internal/results/:id/passed`), authenticated via `INTERNAL_API_KEY`.
- **Payment Idempotency**: Invoices transition to `processing` state before delegating external charges to prevent double-spending under concurrent requests.
- **Shared Domain Logic**: Core business rules (5-point grading scale, 24-unit academic limit, bcrypt calculation) reside in `shared/` and are synchronized via `node scripts/sync-shared.js` to guarantee parity.
- **Cross-Service Integrity**: The monolith utilizes relational foreign keys to enforce strict referential integrity. In microservices, cross-domain integrity is maintained at the application layer through API checks.

---

## License

This project was developed for academic research purposes. Released under the MIT License.

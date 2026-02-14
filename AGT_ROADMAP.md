# AGT Compliance Roadmap & Strategy - REST IA

## 1. Vision & Strategy
Our goal is to exceed the technical and operational expectations of the AGT (Administração Geral Tributária) by implementing a fiscal system that combines Swiss-watch precision with NASA-grade data integrity.

### 1.1 Strategic Milestones
| Milestone | Description | Timeline | Status |
| :--- | :--- | :--- | :--- |
| **M1: Core Compliance** | RSA-SHA256 Signatures, JWS Payloads, Hash Chaining | Q1 2026 | ✅ Done |
| **M2: Data Integrity** | Triple Redundancy Storage, PITR Snapshots, DLP Checksums | Q1 2026 | ✅ Done |
| **M3: Audit Dashboard** | Real-time AGT Audit Terminal, Compliance Scoring | Q1 2026 | ✅ Done |
| **M4: Official Certification** | SAF-T AO 1.2 Schema Validation, Official Submission Tests | Q2 2026 | ⏳ Planned |
| **M5: Cloud Integration** | Real-time Fiscal Sync, Multi-Cloud Redundancy | Q2 2026 | ⏳ In Progress |

## 2. Technical Architecture for Excellence
To ensure maximum compliance, the architecture follows these strict principles:

### 2.1 Cryptographic Immutability
Every transaction is signed using a 2048-bit RSA key pair. The private key is never exposed and resides in an encrypted hardware-abstracted layer. The hash chain ensures that any attempt to alter past records will immediately invalidate all subsequent documents.

### 2.2 Triple Redundancy Storage (TRS)
*   **Layer 1:** Native SQLite for high-performance local operations.
*   **Layer 2:** LocalStorage Mirroring for instant failure recovery.
*   **Layer 3:** Real-time Supabase synchronization with conflict resolution.

## 3. AGT Audit Readiness
The system includes a dedicated "AGT Audit Terminal" within the System Health dashboard, allowing auditors to:
1.  Run a complete integrity check of the hash chain.
2.  Validate the JWS structure of any document.
3.  Generate and validate SAF-T AO exports on-the-fly.
4.  Monitor real-time compliance scores.

## 4. Future Proofing
We are anticipating future AGT updates by:
*   Implementing a modular schema that supports versioned SAF-T exports.
*   Preparing for real-time API-based document registration (beyond periodic SAF-T).
*   Integrating AI-driven anomaly detection to identify potential fiscal inconsistencies before they occur.

---
**REST IA:** Redefining the standards of fiscal excellence in Angola.

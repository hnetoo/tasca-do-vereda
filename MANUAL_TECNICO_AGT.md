# Manual Técnico de Arquitetura, Segurança e Estabilidade - REST IA

**Versão:** 1.0 (NASA-Grade Stability Edition)
**Data:** 07/02/2026
**Responsável Técnico:** Helder Neto

---

## 1. Visão Geral da Arquitetura
O sistema "REST IA" utiliza uma arquitetura híbrida Offline-First com sincronização em tempo real, projetada para garantir 99.99% de disponibilidade mesmo em condições adversas de conectividade.

### 1.1. Stack Tecnológica
*   **Frontend:** React + TypeScript + Vite (Performance Ultra-Rápida)
*   **Base de Dados Local:** SQLite (Nativo) / IndexedDB (Web)
*   **Backend/Cloud:** Supabase (PostgreSQL + Realtime)
*   **Segurança:** AES-GCM 256-bit + RSA-SHA256 (Compliance AGT)
*   **Monitorização:** Heurística Customizada de Saúde do Sistema

## 2. Camada de Estabilidade "Military-Grade"

### 2.1. Triple Redundancy Storage (TRS)
Inspirado em sistemas de naves espaciais da NASA, o TRS garante que nenhum dado financeiro seja perdido:
1.  **Nível 1 (Primário):** Base de dados SQLite/IndexedDB para operações de milissegundo.
2.  **Nível 2 (Fallback Local):** Cópia espelhada em LocalStorage para recuperação instantânea se a BD corromper.
3.  **Nível 3 (Cloud):** Sincronização assíncrona com Supabase com tratamento de timeouts via `AbortController`.

### 2.2. Data Loss Protection (DLP) & Validation
O `validationService.ts` atua como um escudo ativo:
*   **Checksum Validation:** Cada objeto de venda possui um hash de integridade. Se o hash não bater, o sistema bloqueia a propagação do erro.
*   **State Guardians:** Antes de qualquer gravação crítica, o sistema valida o estado completo (Full State Validation) para garantir que não há dados órfãos ou inconsistentes.

## 3. Monitorização e Inteligência de Falhas

### 3.1. Health Monitor Service
O `healthMonitorService.ts` monitoriza continuamente a performance:
*   **Long Task Detection:** Identifica bloqueios na UI superiores a 50ms (padrão de fluidez Apple/Tesla).
*   **Stability Scoring:** Calcula uma nota de 0 a 100 baseada no MTBF (Mean Time Between Failures).
*   **Failure Prediction:** Heurística que analisa picos de latência e erros de rede para alertar o operador antes que o sistema fique offline.

### 3.2. Dashboard de Saúde (`SystemHealth.tsx`)
Interface intuitiva para o administrador visualizar:
*   Estado da sincronização em nuvem.
*   Integridade dos backups locais.
*   Métricas de performance em tempo real.
*   Logs de auto-recuperação (Self-healing logs).

## 4. Segurança e Compliance Fiscal (AGT)

### 4.1. Encriptação de Dados
*   **At Rest:** Backups financeiros encriptados com AES-GCM 256-bit.
*   **In Transit:** Comunicação via HTTPS/WSS com certificados TLS 1.3.

### 4.2. Fluxo de Assinatura AGT
1.  **Payload Generation:** O `agtService.ts` constrói o payload JWS com dados do pedido, impostos (IVA) e cliente.
2.  **Hashing:** Utiliza o algoritmo RSA-SHA256 para assinar o documento.
3.  **Chaining:** Cada documento contém o hash do documento anterior, garantindo a inalterabilidade da série de faturação.

## 5. Procedimentos de Recuperação (DRP)

### 5.1. Point-in-Time Recovery (PITR)
O sistema permite restaurar estados anteriores através de snapshots automáticos:
*   Snapshots gerados a cada 1 hora ou após 50 transações.
*   Restauração seletiva de tabelas (ex: apenas `orders` ou `inventory`).

### 5.2. Procedimento de Emergência
1.  Aceder ao Dashboard de Saúde.
2.  Verificar o último backup íntegro (Sinalizado em Verde).
3.  Clicar em "Restaurar Sistema".
4.  O sistema reinicia com o estado validado, mantendo a integridade fiscal.

---
*Este documento detalha as inovações técnicas que elevam o "REST IA" ao padrão de excelência exigido por operações críticas e conformidade fiscal rigorosa.*

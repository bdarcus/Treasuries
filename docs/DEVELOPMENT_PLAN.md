# TIPS Ladder Architect - Unified Development Roadmap

This document merges the specialized **Duration-Matching Innovation** with the **Modern Web App Specification**. It serves as the definitive guide for the project's evolution.

## 1. Core Mission
To provide a professional-grade, privacy-first tool that simplifies TIPS ladder management through an explainable UI and a mathematically rigorous engine that handles market gaps through duration matching.

---

## 2. Technical Philosophy
- **Framework:** SvelteKit (Static SPA mode) for robust state management without a required server.
- **Primary Runtime:** Node.js/npm (with full Bun compatibility).
- **Engine:** Pure JavaScript `rebalance-engine.js` (portable to Rust if high-performance simulation is required later).
- **Persistence:** Local-first storage via `localStorage`.
- **Transparency:** Every UI element must help the user verify the "Innovation" (e.g., visualizing how brackets cover gaps).

---

## 3. Merged Feature Set

### 3.1 Design & Selection Strategies
- **Mode: Full Rebuild.**
- **Cheapest Strategy (Default):** Minimize total cost by prioritizing higher real-yield bonds for each rung.
- **Smooth Strategy:** Minimize year-to-year deviation from target real income.
- **Payment Patterns:** 
    - January-only (Simple annual maturity).
    - Quarterly/Semiannual coupon targeting (Planned).

### 3.2 Maintenance & Gap Coverage (The Innovation)
- **Mode: Gap Rebalance.**
- **Duration Matching:** Mathematically bridge years where the Treasury has no maturing TIPS.
- **Bracket Identification:** Intelligently select anchor bonds to straddle market holes.
- **Adoption Workflow:** "Commit" a design to the portfolio to transition from planning to maintenance.

### 3.3 Tracking & Analytics
- **Visual Projection:** Bar chart of "Target" vs. "Actual" income.
- **Funded Status:** 
    - **Funded:** Within 2% of target.
    - **Partial:** Coupon-only income (missing maturity).
    - **Gap (Covered):** Synthetic coverage via duration matching.
- **Data Abstraction:** Support for multiple data providers (Live Treasury Fetch, Broker CSVs).

---

## 4. Phased Roadmap

### Phase 1: Foundation (Complete)
- [x] SvelteKit Scaffolding & Tailwind CSS integration.
- [x] Migration of the Duration-Matching Engine.
- [x] Basic "Design", "Import", and "Track" workflows.
- [x] Global state management & `localStorage` persistence.
- [x] Cross-runner test compatibility (Node/npm & Bun).

### Phase 2: Selection Logic & Strategy (Complete)
- [x] Implement "Cheapest" vs. "Smooth" selection algorithms in the engine.
- [x] Add "Exclude CUSIP" and "Maturity Range" constraints to Design mode.
- [x] Support custom "Settlement Date" for trade simulations.

### Phase 3: Advanced Cashflows & Taxes (Complete)
- [x] Support quarterly/semiannual income targeting.
- [x] Implement optional Tax Assumption layer (marginal rates).
- [x] "Add Rungs" Wizard: Automated extension of a ladder's horizon.

### Phase 4: Data & Export (Complete)
- [x] PDF/Print-friendly "Trade Ticket" generation.
- [x] Generic `TIPSDataProvider` interface for easy broker integration.
- [x] CSV Export for all calculation views.

---

## 5. Architectural Highlights

### The Ladder Lifecycle
1. **Design**: Configure target years and income.
2. **Commit**: Save the plan as your "Adopted Portfolio."
3. **Track**: Monitor actual cash flows and funded status.
4. **Maintain**: Run the rebalancer to bridge gaps or reinvest proceeds.

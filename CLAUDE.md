# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Unit/algorithm tests
npm test

# E2E regression tests (run after every change)
npm run test:e2e          # headless, ~7s
npx playwright test --headed   # headed (debug)

# Serve locally (no build step required)
npx serve .
# Local test server already running on port 8080
```

## Architecture

**No build step.** Pure ES modules served statically via GitHub Pages. Data fetched from Cloudflare R2 at runtime.

### Module Roles

| Module | Role |
|--------|------|
| `src/bond-math.js` | Pure per-bond math |
| `src/gap-math.js` | Gap/bracket math + sweep helpers |
| `src/rebalance-lib.js` | Rebalance orchestrator — calls the above, no raw formulas |
| `src/build-lib.js` | Build-from-scratch orchestrator — same constraint |
| `src/render.js` | Table HTML from unified `COLS` schema |
| `src/drill.js` | Drill-down popup builder |
| `src/data.js` | CSV fetch/parse from R2 |
| `index.html` | Thin shell: event wiring, calls render/drill, zero business logic |

See `knowledge/5.0_Computation_Modules.md` for function signatures and APIs.

### Spec-First Protocol (hard rule)

**Knowledge docs are the source of truth for algorithm intent.** Any algorithm change updates the spec BEFORE or WITH the code, never after.

| Doc | Governs |
|-----|---------|
| `knowledge/4.0_TIPS_Ladder_Rebalancing.md` | Core rebalance algorithm, all named quantities, formulas, variable mapping |
| `knowledge/5.0_Computation_Modules.md` | Module APIs (bond-math, gap-math) |
| `knowledge/6.0_UI_Schema.md` | COLS schema, table structure, drill popup routing |
| `knowledge/2.1_TIPS_Basics.md` | costPerBond, piPerBond, indexRatio, adjustedPrincipal |

Before touching any displayed value: read the relevant knowledge doc first.

### Data Infrastructure

- **R2 bucket**: `https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev/TIPS/` — files: `TipsYields.csv`, `RefCPI.csv`, `TipsRef.csv`
- **GitHub Actions**: daily yield fetch (`get-tips-yields.yml`), monthly CPI fetch (`fetch-ref-cpi.yml`)

### Naming Conventions

- `fundedYear` (not `fy`) everywhere: `d.fundedYear`, `fundedYearQty`, `fundedYearAmt`, `fundedYearCost`; column header "Funded Year"
- `runBuild` (not `runBuildFromScratch`), `renderBuildOutput`, `buildSummary`, `buildDetails`, `build-table`

### Windows / Tooling Note

The Edit tool may fail with `EEXIST` on project files (Windows path bug). Use node scripts via Bash to patch files when Edit fails.

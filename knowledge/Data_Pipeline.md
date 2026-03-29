# Data Pipeline

Project-wide data acquisition architecture. See `Data_Pipeline_Local.md` (gitignored) for local automation details.

---

## Data Sources

### FedInvest (`Yields.csv`, `RefCpiNsaSa.csv`)
- Fetched daily by GitHub Actions (`scripts/getYieldsFedInvest.js`, `YieldCurves/scripts/updateRefCpi.js`)
- Uploaded to R2 under `Treasuries/`
- FedInvest prices settle T

### Market Broker Quotes (`FidelityTreasuries.csv`, `FidelityTips.csv`)
- Source: Fidelity Fixed Income search (Treasuries + TIPS pages)
- Broker quotes settle T+1
- Downloaded manually and uploaded to R2 under `Treasuries/`

---

## GitHub Actions / Scheduled Tasks

| Workflow | Schedule (PT) | Script | Notes |
|---|---|---|---|
| `get-yields-fedinvest.yml` | Weekdays 11:05am | `scripts/getYieldsFedInvest.js` | Handles holiday skipping internally |
| `update-yield-history.yml` | Weekdays 11am | `YieldsMonitor/scripts/snapHistory.js` | |
| `get-auctions.yml` | Weekdays 8:05am + 10:35am | `scripts/getAuctions.js` | 2 triggers |
| `fetch-tips-ref.yml` | Mondays 7am | `scripts/fetchTipsRef.js` | |
| `fetch-ref-cpi.yml` | Per-month specific dates ~5:35am | `scripts/fetchRefCpi.js --write` | See CPI Release Schedule below |
| `update-ref-cpi-nsa-sa.yml` | Daily 6:35am | `YieldCurves/scripts/updateRefCpi.js` | Uses `checkReleaseDate.js` guard |

### CPI Release Schedule
- `fetch-ref-cpi.yml` runs on specific per-month dates matching the BLS CPI release schedule
- Source: https://www.bls.gov/schedule/news_release/cpi.htm
- Dates are hardcoded in the workflow (one cron entry per month)
- **Annual maintenance:** After the December 10 run each year, the next year's schedule is published on the BLS page. Update `fetch-ref-cpi.yml` with the new dates before year-end.
- `update-ref-cpi-nsa-sa.yml` uses `YieldCurves/scripts/checkReleaseDate.js` for the same gate — keep both in sync when updating dates.

---

## R2 Bucket

Base URL: `https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev`

| File | Description |
|------|-------------|
| `Treasuries/Yields.csv` | FedInvest prices (TIPS + nominals) |
| `Treasuries/RefCpiNsaSa.csv` | Daily reference CPI with SA factors |
| `Treasuries/FidelityTreasuries.csv` | Broker nominal Treasury quotes |
| `Treasuries/FidelityTips.csv` | Broker TIPS quotes |
| `misc/BondHolidaysSifma.csv` | SIFMA bond holidays |

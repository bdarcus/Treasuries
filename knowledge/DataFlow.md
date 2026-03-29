# 0.2 Data Flow Diagram (DFD)

**Scope:** Global — covers all apps and pipelines in the Treasuries repo.
**Authority:** This document is the primary source of truth for the system's data architecture and pipeline logic.

---

## System Context (Level 0)

The system boundary includes GitHub Actions workflows, local automation scripts, and Cloudflare R2 storage.

```mermaid
graph LR
    E[External Sources] --> S((Treasuries System))
    S --> U[User / Browser]
    
    subgraph External Sources
        E1[FedInvest]
        E2[TreasuryDirect]
        E3[FiscalData]
        E4[BLS]
        E5[CNBC]
        E6[Fidelity]
    end
```

---

## External Entities (E)
*Refer to [DATA_DICTIONARY.md](./DATA_DICTIONARY.md) for full descriptions.*

| ID | Name | URL | What it provides |
|---|---|---|---|
| **E1** | FedInvest | `treasurydirect.gov` | Daily settlement prices |
| **E2** | TreasuryDirect | `treasurydirect.gov` | Daily RefCPI values |
| **E3** | FiscalData | `api.fiscaldata.treasury.gov` | Auction results & TIPS metadata |
| **E4** | BLS Public API | `api.bls.gov` | NSA/SA CPI-U time series |
| **E5** | CNBC GraphQL | `cnbcfm.com` | Market mid-price yields |
| **E6** | Fidelity | `fixedincome.fidelity.com` | Broker ask/bid quotes |

---

## Data Stores (S)
*Refer to [DATA_DICTIONARY.md](./DATA_DICTIONARY.md) for schemas.*

| ID | R2 Key | Description | Update Frequency |
|---|---|---|---|
| **S1** | `Yields.csv` | Daily Treasury prices & YTM | Weekdays ~1 PM ET |
| **S2** | `TipsRef.csv` | TIPS metadata (Coupons, Dated Dates) | Weekly |
| **S3** | `RefCPI.csv` | Daily interpolated RefCPI | Monthly |
| **S4** | `RefCpiNsaSa.csv` | BLS CPI NSA/SA time series | Daily (on release day) |
| **S5** | `Auctions.csv` | Historical auction results since 1980 | Weekdays |
| **S6** | `yield-history/` | Per-symbol yield time series (JSON) | Weekdays |
| **S7** | `Fidelity*.csv` | Broker market quotes | 3× Daily |

---

## Data Flow Diagram (Level 1)

```mermaid
graph LR
    %% External Entities (Rectangles)
    E1[E1 FedInvest]
    E2[E2 TreasuryDirect]
    E3[E3 FiscalData]
    E4[E4 BLS API]
    E5[E5 CNBC]
    E6[E6 Fidelity]

    %% Processes (Circles/Stadiums)
    P1((getYieldsFedInvest.js))
    P2((fetchRefCpi.js))
    P3((fetchTipsRef.js))
    P4((updateRefCpi.js))
    P5((getAuctions.js))
    P6((snapHistory.js))
    P7((fidelityDownload.js))

    %% Data Stores (Cylinders)
    S1[(S1 Yields.csv)]
    S2[(S2 TipsRef.csv)]
    S3[(S3 RefCPI.csv)]
    S4[(S4 RefCpiNsaSa.csv)]
    S5[(S5 Auctions.csv)]
    S6[(S6 yield-history/)]
    S7[(S7 FidelityQuotes)]

    %% Apps (Diamonds)
    A1{YieldCurves}
    A2{TipsLadderManager}
    A3{YieldsMonitor}
    A4{TreasuryAuctions}

    %% Flows: Ingestion
    E1 --> P1
    S2 -.-> P1
    E2 --> P2
    E3 --> P3
    E4 --> P4
    E3 --> P5
    E5 --> P6
    S6 -.-> P6
    E6 --> P7

    %% Flows: Storage
    P1 --> S1
    P2 --> S3
    P3 --> S2
    P4 --> S4
    P5 --> S5
    P6 --> S6
    P7 --> S7

    %% Flows: Consumption
    S1 --> A1
    S1 --> A2
    S2 --> A2
    S3 --> A2
    S4 --> A1
    S7 --> A1
    S5 --> A4
    S6 --> A3

    %% Live Browser Fetches
    E5 -.-> A3
    E3 -.-> A4

    %% Interactive Links
    click E1 "https://www.treasurydirect.gov/GA-FI/FedInvest/todaySecurityPriceDetail" "FedInvest Price Source"
    click E2 "https://www.treasurydirect.gov/TA_WS/secindex/search" "TreasuryDirect SecIndex"
    click E3 "https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/od/auctions_query" "FiscalData API"
    click E4 "https://api.bls.gov/publicAPI/v2/timeseries/data/CUUR0000SA0" "BLS API"
    click E5 "https://www.cnbc.com/quotes/US10Y" "CNBC Market Data"
    
    click P1 "../scripts/getYieldsFedInvest.js" "View Script"
    click P2 "../scripts/fetchRefCpi.js" "View Script"
    click P3 "../scripts/fetchTipsRef.js" "View Script"
    click P4 "../scripts/updateRefCpi.js" "View Script"
    click P5 "../scripts/getAuctions.js" "View Script"
    click P6 "../scripts/snapHistory.js" "View Script"

    click S1 "./DATA_DICTIONARY.md#20-data-stores-s" "View Schema"
    click S2 "./DATA_DICTIONARY.md#20-data-stores-s" "View Schema"
    click S3 "./DATA_DICTIONARY.md#20-data-stores-s" "View Schema"
    click S4 "./DATA_DICTIONARY.md#20-data-stores-s" "View Schema"
    click S5 "./DATA_DICTIONARY.md#20-data-stores-s" "View Schema"
    click S6 "./DATA_DICTIONARY.md#20-data-stores-s" "View Schema"
    click S7 "./DATA_DICTIONARY.md#20-data-stores-s" "View Schema"

    click A1 "../YieldCurves/" "Open App Folder"
    click A2 "../TipsLadderManager/" "Open App Folder"
    click A3 "../YieldsMonitor/" "Open App Folder"
    click A4 "../TreasuryAuctions/" "Open App Folder"
```

### Legend

| Shape / Line | Meaning |
|---|---|
| `[Rectangle]` | **External Entity**: Source outside our control (API, Website). |
| `((Circle))` | **Process**: Script or Workflow that transforms or moves data. |
| `[(Cylinder)]` | **Data Store**: R2 Cloud Storage file (CSV/JSON). |
| `{Diamond}` | **Application**: Browser-based tool that consumes the data. |
| `───►` (Solid) | **Primary Flow**: A direct write or read operation. |
| `- - ►` (Dashed) | **Dependency / Fetch**: Secondary lookup or live browser request. |

---

## Internal Processes
*Refer to [DATA_DICTIONARY.md](./DATA_DICTIONARY.md) for variable definitions.*

| Process | Workflow / Script | Reads | Writes |
|---|---|---|---|
| FedInvest yield computation | `get-yields-fedinvest.yml` | E1, S2 | S1 |
| TIPS reference fetch | `fetch-tips-ref.yml` | E3 | S2 |
| Reference CPI fetch | `fetch-ref-cpi.yml` | E2 | S3 |
| CPI NSA/SA update | `update-ref-cpi-nsa-sa.yml` | E4 | S4 |
| Auction results fetch | `get-auctions.yml` | E3 | S5 |
| Yield history snapshot | `update-yield-history.yml` | E5, S6 | S6 |
| Fidelity download/upload | Local automation | E6 | S7 |

---

## [Data Dictionary (DD)](./DATA_DICTIONARY.md)

This document relies on the **[DATA_DICTIONARY.md](./DATA_DICTIONARY.md)** for all specific variable definitions, financial formulas, and technical constants.

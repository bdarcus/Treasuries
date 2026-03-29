# Treasury Investors Portal Data Dictionary (DD)

**Scope:** Global — Covers all apps and pipelines in the Treasuries repo.
**Authority:** This document is the primary source of truth for all data definitions. It supersedes all other documentation for variable meanings and data structures.

---

## 0.0 DD Notation

| Symbol | Meaning |
|---|---|
| `=` | is composed of / is defined as |
| `+` | AND |
| `[ x \| y ]` | Selection (either x or y) |
| `{ x }` | Iteration (zero or more of x) |
| `( x )` | Optional (x may or may not be present) |
| `* x *` | Comment / Narrative definition |
| `@ x` | Identifier (Key field) |

---

## 1.0 External Entities (E)
*External sources providing data to the system.*

**E1: FedInvest** = *US Treasury price source for bills, notes, bonds, TIPS (no STRIPS)*
**E2: TreasuryDirect SecIndex** = *Source for daily interpolated RefCPI values*
**E3: FiscalData API** = *Source for auction results and TIPS metadata*
**E4: BLS Public API** = *Source for monthly NSA and SA CPI-U time series*
**E5: CNBC GraphQL** = *Source for market mid-price yields*
**E6: Fidelity Fixed Income** = *Broker source for real-time ask/bid quotes including STRIPS*

---

## 2.0 Data Stores (S)
*Internal R2 data files and their schemas.*

**S1: Yields.csv** = `Settlement_Date + { @CUSIP + Type + Maturity + Coupon + DatedDateCPI + Price + Yield }`
**S2: TipsRef.csv** = `{ @CUSIP + Maturity + DatedDate + Coupon + BaseCPI + Term }`
**S3: RefCPI.csv** = `{ @Date + RefCPI }`
**S4: RefCpiNsaSa.csv** = `{ @Date + CPI_NSA + CPI_SA + SA_Factor }`
**S5: Auctions.csv** = `{ @CUSIP + @Auction_Date + Security_Type + ... + High_Yield + ... }`
**S6: YieldHistory** = `{ @Symbol + { [ Timestamp + Yield_Value ] } }`
**S7: FidelityQuotes** = `{ @CUSIP + Maturity + Coupon + Ask_Price + Bid_Price + Ask_Yield + Bid_Yield }`

---

## 3.0 Data Elements (Primitives)

`CUSIP` = *9-character unique identifier for a Treasury security*
`Quantity` = *Integer (1 = $1,000 face value)*
`Face_Value` = `Quantity * 1000`
`Price` = *Market value as % of par (e.g., 102.5)*
`Clean_Price` = *Price excluding accrued interest (and for TIPS, before inflation adjustment)*
`Settlement_Date` = *[ Trade_Date + 1 Business Day | Manual_Override ]*
`Maturity_Date` = *Date principal is repaid*
`Coupon_Rate` = *Fixed annual interest rate paid by the security*

---

## 4.0 Financial Composites & Formulas

### 4.1 TIPS Elements
`Ref_CPI_dated` = *Reference CPI value on the TIPS Dated Date*
`Ref_CPI_settle` = *Reference CPI value on the Settlement Date*
`Index_Ratio` = `Ref_CPI_settle / Ref_CPI_dated`
`Par_Value_Adjusted` = `Face_Value * Index_Ratio`
`Annual_Interest_Real` = `Face_Value * Coupon_Rate`
`Annual_Interest_Nominal` = `Par_Value_Adjusted * Coupon_Rate`
`P+I_per_TIPS` = `Par_Value_Adjusted + (Annual_Interest_Nominal * [0.5 | 1.0])` *See 2.1 TIPS Basics for half-year rule*
`Cost_per_TIPS` = `(Price / 100) * Index_Ratio * 1000`

### 4.2 Ladder & Portfolio Elements
`Funded_Year` = *Calendar year (rung) in the ladder*
`Ladder_Period` = `First_Year + ... + Last_Year`
`DARA` = *Desired Annual Real Amount (Target total cash flow in today's dollars)*
`ARA` = `P+I_per_TIPS + LMI` *Actual cash flow produced for a Funded Year*
`LMI` = `{ Annual_Interest_Real_for_TIPS_maturing_in_years > Current_Year }`
`Gap_Year` = *Funded Year with no existing Treasury TIPS issuance*
`Synthetic_TIPS` = *Theoretical TIPS created for Gap Years (Yield interpolated)*
`Bracket_Year` = *Existing TIPS maturity used to fund/bracket a Gap Year*

### 4.3 Seasonal Adjustment (SA) Elements
`SA_Factor` = `CPI_NSA / CPI_SA`
`SA_Yield` = *Real yield normalized for seasonal inflation patterns*
`SAO_Yield` = *Trend-fitted yield using SA data and linear regression*

---

## 5.0 Global Constants

`LOWEST_LOWER_BRACKET_YEAR` = 2026
`REFCPI_CUSIP` = "912828V98" *Reference CUSIP for CPI-U index tracking*
`SIFMA_HOLIDAYS` = *Calendar of bond market closures*

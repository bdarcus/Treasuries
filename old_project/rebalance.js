#!/usr/bin/env node
// @ts-check

// TIPS Ladder Rebalancing Engine — Node.js port of RebalnceForDurationMatch.js
// Usage: node rebalance.js [--dara AMOUNT] [--method Full|Gap] [--cash AMOUNT] [--start-year YYYY] [--end-year YYYY] [holdings.csv]

import fs from 'fs';
import path from 'path';
import readline from 'readline';

import {
  localDate,
  toDateStr,
  fmtDate,
  yieldFromPrice,
  buildTipsMap,
  runRebalance
} from './rebalance-engine.js';

// ─── Configuration ───────────────────────────────────────────────────────────
const REFCPI_CUSIP = '912810FD5'; // matures 04/15/2028 — replace after that

const FEDINVEST_URL = 'https://www.treasurydirect.gov/GA-FI/FedInvest/securityPriceDetail';
const TIPSREF_URL =
  'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/od/auctions_query' +
  '?format=json&sort=maturity_date' +
  '&filter=inflation_index_security:eq:Yes,reopening:eq:No' +
  '&fields=cusip,ref_cpi_on_dated_date,dated_date,maturity_date,security_term,int_rate' +
  '&page[number]=1&page[size]=150';

// ─── CLI args ─────────────────────────────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  let dara = null, method = null, holdingsFile = null;
  let cash = 0, startYear = null, endYear = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dara')       { dara = parseFloat(args[++i]); continue; }
    if (args[i] === '--method')     { const m = args[++i]; method = m[0].toUpperCase() + m.slice(1).toLowerCase(); continue; }
    if (args[i] === '--cash')       { cash = parseFloat(args[++i]); continue; }
    if (args[i] === '--start-year') { startYear = parseInt(args[++i], 10); continue; }
    if (args[i] === '--end-year')   { endYear = parseInt(args[++i], 10); continue; }
    if (!args[i].startsWith('--'))  { holdingsFile = args[i]; }
  }

  return { dara, method, holdingsFile, cash, startYear, endYear };
}

// ─── Interactive prompts (simulates web form inputs) ─────────────────────────
async function promptInputs(holdingsFile, dara, method, cash, startYear, endYear) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
  const ask = prompt => new Promise(resolve => rl.question(prompt, resolve));

  const modeAns = (await ask('Are you (R)ebalancing an existing ladder or building a (N)ew one? [default: R]: ')).trim().toLowerCase();
  const isNewBuild = modeAns === 'n';

  if (isNewBuild) {
    method = 'Full'; // New build is always full rebuild
    if (!startYear) startYear = parseInt((await ask(`Start year [default: ${new Date().getFullYear()}]: `)).trim() || new Date().getFullYear().toString(), 10);
    if (!endYear)   endYear   = parseInt((await ask(`End year [default: ${startYear + 10}]: `)).trim() || (startYear + 10).toString(), 10);
    if (!cash)      cash      = parseFloat((await ask('Initial cash to invest: ')).trim() || '0');
    if (!dara)      dara      = parseFloat((await ask('Target annual real income (DARA): ')).trim() || '0');
    holdingsFile = null;
  } else {
    if (!holdingsFile) {
      holdingsFile = (await ask('Holdings CSV path [e.g. data/holdings.csv]: ')).trim();
    }
    if (dara === null) {
      const ans = (await ask('DARA (leave blank to infer from holdings): ')).trim();
      dara = ans ? parseFloat(ans) : null;
    }
    if (method === null) {
      const ans = (await ask('Rebalance method — Gap or Full [default: Gap]: ')).trim();
      method = ans.toLowerCase() === 'full' ? 'Full' : 'Gap';
    }
    if (!cash) {
      const ans = (await ask('Initial extra cash to add (optional): ')).trim();
      cash = ans ? parseFloat(ans) : 0;
    }
  }

  rl.close();
  return { holdingsFile, dara, method, cash, startYear, endYear };
}

// ─── Date helpers ─────────────────────────────────────────────────────────────
function mostRecentWeekday(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  if (day === 0) d.setDate(d.getDate() - 2);
  if (day === 6) d.setDate(d.getDate() - 1);
  return d;
}

// ─── FedInvest fetch ──────────────────────────────────────────────────────────
async function fetchTipsPrices(date) {
  const day   = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year  = String(date.getFullYear());

  const body = new URLSearchParams({
    priceDateDay: day, priceDateMonth: month, priceDateYear: year,
    fileType: 'csv', csv: 'CSV FORMAT'
  });

  const res = await fetch(FEDINVEST_URL, { method: 'POST', body });
  if (!res.ok) throw new Error(`FedInvest HTTP ${res.status}`);

  const text = await res.text();
  const lines = text.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  return lines.slice(1)
    .map(line => {
      const c = line.split(',').map(s => s.trim());
      return {
        cusip:    c[0],
        type:     c[1],
        coupon:   parseFloat(c[2]),   // decimal (e.g. 0.00125)
        maturity: c[3],               // YYYY-MM-DD
        buy:  parseFloat(c[5]) || 0,
        sell: parseFloat(c[6]) || 0,
        eod:  parseFloat(c[7]) || 0,
      };
    })
    .filter(r => r.type === 'TIPS');
}

// ─── Base CPI / metadata fetch (Treasury FiscalData auctions_query) ───────────
async function fetchBaseCpi() {
  const res = await fetch(TIPSREF_URL);
  if (!res.ok) throw new Error(`FiscalData HTTP ${res.status}`);
  const json = await res.json();
  return json.data.map(r => ({
    cusip:     r.cusip,
    baseCpi:   parseFloat(r.ref_cpi_on_dated_date),
    coupon:    parseFloat(r.int_rate) / 100,
    maturity:  r.maturity_date,
    datedDate: r.dated_date,
  }));
}

// ─── Settlement CPI fetch (TreasuryDirect secindex) ───────────────────────────
async function fetchSettlementCpi(dateStr) {
  const url =
    `https://www.treasurydirect.gov/TA_WS/secindex/search?cusip=${REFCPI_CUSIP}` +
    `&format=jsonp&callback=jQuery_CUSIP_FETCHER&filterscount=0&groupscount=0` +
    `&sortdatafield=indexDate&sortorder=asc&pagenum=0&pagesize=1000` +
    `&recordstartindex=0&recordendindex=1000&_=${Date.now()}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`TreasuryDirect HTTP ${res.status}`);
  const text = await res.text();
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('Could not parse refCPI JSONP');

  const rows = JSON.parse(match[0]).map(r => ({
    date:   r.indexDate.split('T')[0],
    refCpi: parseFloat(r.refCpi),
  }));

  // Find exact match or nearest prior date
  const prior = rows.filter(r => r.date <= dateStr);
  if (prior.length === 0) throw new Error(`No settlement CPI data on or before ${dateStr}`);
  const row = prior[prior.length - 1];
  if (row.date !== dateStr) {
    console.error(`No settlement CPI for ${dateStr}, using ${row.date}`);
  }
  return row.refCpi;
}

// ─── Main engine ─────────────────────────────────────────────────────────────
async function main() {
  let { dara, method, holdingsFile, cash, startYear, endYear } = parseArgs();

  // ── Prompt for any missing inputs ──
  if (process.argv.length <= 2) {
    ({ holdingsFile, dara, method, cash, startYear, endYear } = await promptInputs(holdingsFile, dara, method, cash, startYear, endYear));
  }

  // ── Load holdings ──
  let holdingsRaw = [];
  if (holdingsFile && fs.existsSync(holdingsFile)) {
    holdingsRaw = fs.readFileSync(holdingsFile, 'utf8')
      .trim().split('\n')
      .filter(l => l.trim())
      .map(line => {
        const [cusip, qty] = line.split(',').map(s => s.trim());
        return { cusip, qty: parseInt(qty, 10) };
      });
  }

  // ── Fetch market data ──
  console.error('Fetching TIPS prices from FedInvest...');
  let priceRows = [];
  let priceDate = mostRecentWeekday();
  for (let attempt = 0; attempt < 5; attempt++) {
    priceRows = await fetchTipsPrices(priceDate);
    if (priceRows.length > 0) break;
    console.error(`No data for ${toDateStr(priceDate)}, trying previous weekday...`);
    priceDate.setDate(priceDate.getDate() - 1);
    priceDate = mostRecentWeekday(priceDate);
  }
  if (priceRows.length === 0) throw new Error('No TIPS price data found');

  const settlementDate = priceDate;
  const settleDateStr  = toDateStr(settlementDate);
  const settleDateDisp = fmtDate(settlementDate);
  console.error(`Settlement date: ${settleDateStr}`);

  console.error('Fetching base CPI from Treasury FiscalData...');
  const baseCpiRows = await fetchBaseCpi();

  console.error('Fetching settlement CPI from TreasuryDirect...');
  const refCPI = await fetchSettlementCpi(settleDateStr);
  console.error(`Settlement CPI: ${refCPI}`);

  // ── Build unified TIPS map ──
  const tipsMap = buildTipsMap(baseCpiRows, priceRows, settleDateStr);

  // ── RUN REBALANCE ──
  const { results, HDR, summary } = runRebalance({
    dara,
    method: method || 'Gap',
    holdings: holdingsRaw,
    tipsMap,
    refCPI,
    settlementDate,
    initialCash: cash,
    startYear,
    endYear
  });

  // ── Output ──
  const { DARA, costDeltaSum, initialCash, totalCash } = summary;
  const fmtI = n => typeof n === 'number' ? Math.round(n).toLocaleString() : String(n);
  const sign = n => typeof n === 'number' && n > 0 ? '+' + Math.round(n) : String(Math.round(n) || n);

  console.log(`\nSettlement: ${settleDateDisp}  |  RefCPI: ${refCPI}  |  DARA: ${fmtI(DARA)}`);
  if (initialCash > 0) console.log(`Initial cash: ${initialCash.toLocaleString()}`);
  console.log(`Net cash delta: ${sign(costDeltaSum)}`);
  console.log(`Final cash balance: ${fmtI(totalCash)}`);

  const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const mainTableRows = results.map(r => '<tr>' + r.map((v, ci) => `<td class="${ci>=4?'num':''}">${typeof v==='number'?(ci===1||ci===3?v:v.toLocaleString()):esc(v)}</td>`).join('') + '</tr>').join('\n');

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>TIPS Rebalance</title><style>body{font-family:system-ui;font-size:13px;padding:20px}table{border-collapse:collapse;width:100%}th{background:#222;color:#fff;padding:5px;text-align:right}td{padding:4px;border-bottom:1px solid #eee;text-align:right}.num{font-variant-numeric:tabular-nums}.pos{color:green}.neg{color:red}</style></head><body><h1>TIPS Rebalance</h1><p>Settlement: ${settleDateDisp} | RefCPI: ${refCPI} | DARA: ${fmtI(DARA)} | Initial Cash: ${initialCash.toLocaleString()} | Final Cash: ${totalCash.toLocaleString()}</p><table><thead><tr>${HDR.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${mainTableRows}</tbody></table></body></html>`;
  
  const outputDir = holdingsFile ? path.dirname(holdingsFile) : '.';
  fs.writeFileSync(path.join(outputDir, 'output.html'), html);
  console.log(`Output written to ${path.join(outputDir, 'output.html')}`);
}

main().catch(err => { console.error(err); process.exit(1); });

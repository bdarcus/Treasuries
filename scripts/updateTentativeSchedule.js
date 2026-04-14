import fs from 'fs';
import path from 'path';

/**
 * Fetch the Treasury's Tentative Auction Schedule XML and extract TIPS auctions.
 * Saves a JSON file for the TreasuryAuctions UI to cross-reference.
 */

const TENTATIVE_XML_URL = 'https://home.treasury.gov/system/files/221/Tentative-Auction-Schedule.xml';
const OUTPUT_FILE = 'TreasuryAuctions/data/tentative_tips.json';

async function update() {
  console.log(`Fetching tentative schedule from ${TENTATIVE_XML_URL}...`);
  const r = await fetch(TENTATIVE_XML_URL);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const xml = await r.text();

  // Extract <AuctionCalendarDate> blocks
  const blocks = xml.match(/<AuctionCalendarDate>[\s\S]*?<\/AuctionCalendarDate>/g) || [];
  const tipsAuctions = [];

  blocks.forEach(block => {
    // Only care about TIPS
    if (block.includes('<TIPS>Y</TIPS>')) {
      const auctionDate = (block.match(/<AuctionDate>(.*?)<\/AuctionDate>/) || [])[1];
      const term = (block.match(/<SecurityTermWeekYear>(.*?)<\/SecurityTermWeekYear>/) || [])[1];
      const reopen = (block.match(/<ReOpeningIndicator>(.*?)<\/ReOpeningIndicator>/) || [])[1];
      
      if (auctionDate && term) {
        tipsAuctions.push({
          auction_date: auctionDate,
          security_term: term,
          reopening: reopen === 'Y' ? 'Yes' : 'No'
        });
      }
    }
  });

  // Ensure directory exists
  const dir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(tipsAuctions, null, 2));
  console.log(`Successfully saved ${tipsAuctions.length} upcoming TIPS auctions to ${OUTPUT_FILE}`);
}

update().catch(console.error);

import fs from 'fs';
import path from 'path';

/**
 * Fetch the Treasury's Tentative Auction Schedule XML.
 * 1. Saves the raw XML to R2 for the UI to display.
 * 2. Extracts TIPS-only auctions to a JSON file for the UI to cross-reference.
 */

const TENTATIVE_XML_URL = 'https://home.treasury.gov/system/files/221/Tentative-Auction-Schedule.xml';
const OUTPUT_JSON = 'TreasuryAuctions/data/tentative_tips.json';
const OUTPUT_XML = 'TreasuryAuctions/data/Tentative-Auction-Schedule.xml';
const R2_JSON_KEY = 'TIPS/tentative_tips.json';
const R2_XML_KEY = 'TIPS/Tentative-Auction-Schedule.xml';

// ── R2 upload ─────────────────────────────────────────────────────────────────
async function uploadToR2(key, body, contentType) {
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
  const { CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = process.env;
  if (!CLOUDFLARE_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET)
    throw new Error('Cloudflare R2 credentials not found in environment variables');

  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
  });

  await s3.send(new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, Body: body, ContentType: contentType }));
  console.log(`Uploaded → R2 bucket "${R2_BUCKET}", key "${key}" (${contentType})`);
}

async function update() {
  console.log(`Fetching tentative schedule from ${TENTATIVE_XML_URL}...`);
  const r = await fetch(TENTATIVE_XML_URL);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const xml = await r.text();

  // Save raw XML local
  const xmlDir = path.dirname(OUTPUT_XML);
  if (!fs.existsSync(xmlDir)) fs.mkdirSync(xmlDir, { recursive: true });
  fs.writeFileSync(OUTPUT_XML, xml);
  console.log(`Saved raw XML to ${OUTPUT_XML}`);

  // Extract <AuctionCalendarDate> blocks for TIPS JSON
  const blocks = xml.match(/<AuctionCalendarDate>[\s\S]*?<\/AuctionCalendarDate>/g) || [];
  const tipsAuctions = [];

  blocks.forEach(block => {
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

  const jsonBody = JSON.stringify(tipsAuctions, null, 2);

  // Save local JSON
  const jsonDir = path.dirname(OUTPUT_JSON);
  if (!fs.existsSync(jsonDir)) fs.mkdirSync(jsonDir, { recursive: true });
  fs.writeFileSync(OUTPUT_JSON, jsonBody);
  console.log(`Saved ${tipsAuctions.length} upcoming TIPS auctions to ${OUTPUT_JSON}`);

  // Upload to R2
  try {
    await uploadToR2(R2_XML_KEY, xml, 'text/xml');
    await uploadToR2(R2_JSON_KEY, jsonBody, 'application/json');
  } catch (err) {
    console.warn('R2 upload failed (check your .env if running locally):', err.message);
  }
}

update().catch(console.error);

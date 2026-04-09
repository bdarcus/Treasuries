// One-shot: deletes the legacy Treasuries/Yields.csv key from R2.
// Run once after confirming Treasuries/YieldsFromFedInvestPrices.csv exists.
// Usage: node scripts/deleteOldYieldsCsv.js

import { S3Client, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
dotenv.config();

const { CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = process.env;
if (!CLOUDFLARE_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
  console.error('Missing R2 credentials in .env');
  process.exit(1);
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
});

const NEW_KEYS = ['Treasuries/YieldsFromFedInvestPrices.csv', 'TIPS/YieldsFromFedInvestPrices.csv'];
const OLD_KEYS = [
  'Treasuries/Yields.csv',
  'Treasuries/YieldsDerivedFromFedInvestPrices.csv',
  'TIPS/YieldsDerivedFromFedInvestPrices.csv'
];

// Verify new keys exist before deleting old ones
for (const key of NEW_KEYS) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    console.log(`Confirmed: ${key} exists.`);
  } catch {
    console.error(`Abort: ${key} not found in R2. Run the pipeline first.`);
    process.exit(1);
  }
}

for (const key of OLD_KEYS) {
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    console.log(`Deleted: ${key}`);
  } catch (err) {
    console.error(`Failed to delete ${key}: ${err.message}`);
  }
}

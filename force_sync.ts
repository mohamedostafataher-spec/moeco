import { rssService } from './server/services/rssService.ts';
import dotenv from 'dotenv';
dotenv.config();

async function forceSync() {
  console.log("FORCING MANUAL RSS SYNC...");
  try {
    await rssService.fetchAndSyncAll();
    console.log("SYNC FINISHED SUCCESS");
  } catch (e) {
    console.error("SYNC FAILED", e);
  }
}

forceSync();

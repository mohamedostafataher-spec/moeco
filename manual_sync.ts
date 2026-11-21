import { rssService } from './server/services/rssService.ts';
import * as dotenv from 'dotenv';
dotenv.config();
async function run() {
   await rssService.fetchAndSyncAll();
   console.log("Done");
}
run();

import { rssService } from './server/services/rssService';

async function manualSync() {
    console.log('Triggering manual RSS sync to populate last_fetched_at...');
    await rssService.fetchAndSyncAll();
    console.log('Manual sync complete.');
}

manualSync();

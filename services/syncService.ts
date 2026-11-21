
import { storageService } from './storageService';
import { supabase } from './supabaseClient';

export const syncService = {
  syncData: async () => {
    if (!storageService.isOnline()) return;

    try {
      console.log('Syncing data with cloud (Supabase)...');
      // Fetch latest server timestamp to prevent stale state
      const { data, error } = await supabase.rpc('get_server_time').single();
      if (error) {
         console.warn('Sync soft-fail - unable to reach DB time', error);
      }
      return true;
    } catch (e) {
      console.error('Sync failed', e);
      return false;
    }
  },

  startAutoSync: () => {
    window.addEventListener('online', () => {
      syncService.syncData();
    });
    
    // Sync every 5 minutes if online
    setInterval(() => {
      if (storageService.isOnline()) {
        syncService.syncData();
      }
    }, 5 * 60 * 1000);
  }
};

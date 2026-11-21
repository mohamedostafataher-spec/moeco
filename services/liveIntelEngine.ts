
import { supabase } from './supabaseClient';
import { notificationService } from './notificationService';

export const liveIntelEngine = {
  /**
   * Smart Alert Merging Logic
   * Groups new alerts with existing active ones if they are geographically and categorically close
   */
  processNewAlert: async (newAlert: any) => {
    try {
      // 1. Fetch active alerts in the same category and city
      const { data: activeAlerts } = await supabase
        .from('alerts')
        .select('*')
        .eq('category', newAlert.category)
        .eq('is_active', true)
        .neq('id', newAlert.id);

      const THRESHOLD_MINUTES = 60;
      
      const similarAlert = activeAlerts?.find(a => {
        const timeDiff = Math.abs(new Date(a.created_at).getTime() - new Date(newAlert.created_at).getTime());
        const isTimeClose = (timeDiff / (1000 * 60)) < THRESHOLD_MINUTES;
        
        // Basic Geo-proximity check (if available)
        const isLocallyClose = a.location?.city === newAlert.location?.city;
        
        return isTimeClose && isLocallyClose;
      });

      if (similarAlert) {
        console.log('Smart Alert Merging: Found similar alert, updating status.');
        // Logic to merge: Update instructions or severity if needed
        // For now, we follow the "independent" rule but log the merge possibility
        if (newAlert.severity === 'critical' && similarAlert.severity !== 'critical') {
           // Escalate if new one is more severe
           await supabase.from('alerts').update({ severity: 'critical' }).eq('id', similarAlert.id);
        }
      }
      
      // Feed to notification queue regardless to ensure independence as requested
      notificationService.queueAlert({
        id: newAlert.id,
        title: { ar: newAlert.title_ar, en: newAlert.title_en },
        message: { ar: newAlert.description_ar, en: newAlert.description_en },
        severity: newAlert.severity,
        category: newAlert.category
      });

    } catch (e) {
      console.error('Intel Engine Error:', e);
    }
  },

  /**
   * Automatic Data Healing Logic
   * Merges user suggestions into the master record if confidence exceeds threshold
   */
  processLiveUpdates: async (serviceId: string) => {
    const { data: updates } = await supabase
      .from('service_live_updates')
      .select('*')
      .eq('service_id', serviceId)
      .eq('status', 'pending');

    if (!updates) return;

    for (const update of updates) {
      if (update.confidence_score >= 0.9 || update.verified_count >= 10) {
        // Auto-merge to government_services
        const updateData: any = {};
        updateData[update.field] = update.new_value;
        
        const { error } = await supabase
          .from('government_services')
          .update(updateData)
          .eq('id', serviceId);
        
        if (!error) {
          await supabase.from('service_live_updates').update({ status: 'merged' }).eq('id', update.id);
          console.log(`Self-Healing: Merged update for service ${serviceId}`);
        }
      }
    }
  }
};

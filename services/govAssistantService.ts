import { supabase } from './supabaseClient';
import { smartAiService } from './smartAiService';

export const govAssistantService = {
  getServices: async () => {
    return await supabase.from('government_services').select('*');
  },

  getServiceSteps: async (serviceId: number) => {
    return await supabase.from('service_steps').select('*').eq('service_id', serviceId).order('step_order');
  },

  getUserProgress: async (userId: string) => {
    return await supabase.from('user_service_progress').select('*, government_services(*)').eq('user_id', userId);
  },

  updateProgress: async (userId: string, serviceId: number, step: number, completed: boolean) => {
    return await supabase
      .from('user_service_progress')
      .upsert({ user_id: userId, service_id: serviceId, current_step: step, completed, updated_at: new Date().toISOString() });
  },

  getServiceLocations: async (serviceId: number) => {
    return await supabase.from('service_locations').select('*').eq('service_id', serviceId);
  },

  generateDocumentList: async (serviceName: string) => {
    // Fallback intelligence parsing based on service names
    const serviceMap: any = {
      'passport': 'passport',
      'جواز سفر': 'passport',
      'id_card': 'id_card',
      'بطاقة شخصية': 'id_card',
      'driving_license': 'driving_license',
      'رخصة قيادة': 'driving_license'
    };
    const key = serviceMap[serviceName.toLowerCase()] || 'id_card';
    return await smartAiService.getGovernmentGuidance(key);
  },

  getFormTemplate: (serviceName: string) => {
    return {
      title: `نموذج طلب ${serviceName}`,
      fields: [
        { name: 'full_name', label: 'الاسم بالكامل', type: 'text', required: true },
        { name: 'national_id', label: 'الرقم القومي', type: 'number', required: true },
        { name: 'address', label: 'العنوان بالتفصيل', type: 'text', required: true },
        { name: 'phone', label: 'رقم الهاتف', type: 'tel', required: true }
      ]
    };
  },
  
  recordServiceEmission: async (userId: string, serviceId: number, emissionSaved: number) => {
    return await supabase
      .from('user_emissions')
      .insert({ 
        user_id: userId, 
        source: 'gov_service', 
        source_id: serviceId.toString(), 
        amount: emissionSaved, 
        date: new Date().toISOString() 
      });
  }
};

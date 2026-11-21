
import { supabase } from './supabaseClient';

const API_URL = '/api/unified/admin';

const getAuthHeaders = () => {
  const token = localStorage.getItem('moeco_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const adminService = {
  async getStats() {
    const response = await fetch(`${API_URL}/stats`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  },

  async getReports() {
    const response = await fetch(`${API_URL}/reports`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch reports');
    return response.json();
  },

  async updateReportStatus(id: string, status: string) {
    const response = await fetch(`${API_URL}/report/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    if (!response.ok) throw new Error('Failed to update report status');
    return response.json();
  },

  async getConfig(userId: string) {
    const response = await fetch(`${API_URL}/config/${userId}`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch config');
    return response.json();
  },

  async saveConfig(config: any) {
    const response = await fetch(`${API_URL}/config`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(config)
    });
    if (!response.ok) throw new Error('Failed to save config');
    return response.json();
  },

  async getScreens() {
    const response = await fetch(`${API_URL}/screens`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch screens');
    return response.json();
  },

  async updateScreen(id: string, data: any) {
    const response = await fetch(`${API_URL}/screen/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update screen');
    return response.json();
  },

  async getAds() {
    const response = await fetch(`${API_URL}/ads`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch ads');
    return response.json();
  },

  async saveAd(ad: any) {
    const response = await fetch(`${API_URL}/ad`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(ad)
    });
    if (!response.ok) throw new Error('Failed to save ad');
    return response.json();
  },

  async getUsers() {
    const response = await fetch(`${API_URL}/users`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },

  async updateUserRole(id: string, role: string) {
    const response = await fetch(`${API_URL}/user/${id}/role`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ role })
    });
    if (!response.ok) throw new Error('Failed to update user role');
    return response.json();
  }
};

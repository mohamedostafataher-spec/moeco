
import axios from 'axios';

const DEFAULT_TIMEOUT = 5000;

export interface ApiResponse<T> {
  data: T | null;
  fromCache: boolean;
  error: string | null;
}

class ApiClient {
  private cachePrefix = 'moeco_cache_v2_';

  private getCacheKey(url: string, params?: any): string {
    return `${this.cachePrefix}${url}${params ? JSON.stringify(params) : ''}`;
  }

  private setCache(key: string, data: any) {
    try {
      localStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.warn('Cache storage failed', e);
    }
  }

  private getCache(key: string): any | null {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      return JSON.parse(item).data;
    } catch (e) {
      return null;
    }
  }

  async get<T>(url: string, params?: any, timeout = DEFAULT_TIMEOUT): Promise<ApiResponse<T>> {
    const cacheKey = this.getCacheKey(url, params);
    
    // Check network status
    if (!navigator.onLine) {
      console.log(`Offline: loading ${url} from cache`);
      return {
        data: this.getCache(cacheKey),
        fromCache: true,
        error: 'Offline'
      };
    }

    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);

      const response = await axios.get(url, {
        params,
        signal: controller.signal
      });

      clearTimeout(id);
      
      // Update cache
      this.setCache(cacheKey, response.data);

      return {
        data: response.data,
        fromCache: false,
        error: null
      };
    } catch (error: any) {
      if (error.message !== 'canceled') {
        console.error(`API Error (${url}):`, error.message);
      }
      
      // Fallback to cache
      const cachedData = this.getCache(cacheKey);
      return {
        data: cachedData,
        fromCache: true,
        error: error.message
      };
    }
  }

  // Clear cache if needed (e.g. on logout)
  clearCache() {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(this.cachePrefix)) {
        localStorage.removeItem(key);
      }
    });
  }
}

export const apiClient = new ApiClient();

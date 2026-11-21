
export interface DataSource<T> {
  name: string;
  fetch: () => Promise<T>;
}

export const MultiSourceDataEngine = {
  fetchWithFailover: async <T>(sources: DataSource<T>[], fallback: T): Promise<{ data: T, source: string, status: 'ok' | 'fallback' }> => {
    for (const source of sources) {
      try {
        console.log(`Attempting to fetch from source: ${source.name}`);
        const data = await source.fetch();
        if (data) {
          return { data, source: source.name, status: 'ok' };
        }
      } catch (error) {
        console.warn(`Source ${source.name} failed:`, error);
      }
    }

    console.warn('All sources failed, using fallback data');
    return { data: fallback, source: 'Fallback', status: 'fallback' };
  }
};

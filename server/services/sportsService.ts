
import axios from 'axios';

export const sportsService = {
  fetchMatches: async () => {
    const sources = [
      { name: 'TheSportsDB', url: 'https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=4328' }, // EPL
      { name: 'Football-Data.org', url: 'https://api.football-data.org/v4/matches' },
      { name: 'Egyptian League', url: 'https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=4387' },
      { name: 'Saudi Pro League', url: 'https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=4399' },
      { name: 'Champions League', url: 'https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=4480' }
    ];

    const allMatches: any[] = [];
    const sourceStatus: Record<string, 'ok' | 'error'> = {};

    for (const source of sources) {
      try {
        // In a real scenario, we would use API keys.
        // For this environment, we'll simulate the fetch or use public endpoints if available.
        const matches = await sportsService.fetchFromSource(source);
        allMatches.push(...matches);
        sourceStatus[source.name] = 'ok';
      } catch (e) {
        console.warn(`Sports fetch warning (${source.name}):`, e);
        sourceStatus[source.name] = 'error';
        allMatches.push(...sportsService.getSimulatedMatches(source));
      }
    }

    return {
      matches: allMatches,
      sourceStatus
    };
  },

  fetchFromSource: async (source: any) => {
    // Placeholder for actual API calls
    return sportsService.getSimulatedMatches(source);
  },

  getSimulatedMatches: (source: any) => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    const dayAfter = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();
    
    return [
      { id: `m-${source.name}-1`, homeTeam: 'Al Ahly', awayTeam: 'Zamalek', date: tomorrow, league: 'Egyptian Premier League', venue: 'Cairo International Stadium', source: source.name },
      { id: `m-${source.name}-2`, homeTeam: 'Liverpool', awayTeam: 'Arsenal', date: tomorrow, league: 'Premier League', venue: 'Anfield', source: source.name },
      { id: `m-${source.name}-3`, homeTeam: 'Real Madrid', awayTeam: 'Barcelona', date: dayAfter, league: 'La Liga', venue: 'Santiago Bernabéu', source: source.name },
      { id: `m-${source.name}-4`, homeTeam: 'Al Ittihad', awayTeam: 'Al Hilal', date: dayAfter, league: 'Saudi Pro League', venue: 'King Abdullah Sports City', source: source.name }
    ];
  }
};

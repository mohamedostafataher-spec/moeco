import axios from 'axios';
import * as cheerio from 'cheerio';
import { supabase } from './supabaseClient.ts';
import dotenv from 'dotenv';

dotenv.config();

export interface Match {
  match_id: string;
  team_home: string;
  team_away: string;
  league: string;
  date: string;
  time: string;
  status: string;
  score: string;
  source: string;
  stadium?: string;
  attendance?: number;
}

export const matchesEngine = {
  async fetchLive(): Promise<Match[]> {
    console.log('Starting Matches Live Fetch...');
    const matches: Match[] = [];
    const today = new Date().toISOString().split('T')[0];

    const safeId = (id: string) => id.substring(0, 250);
    const safeText = (text: string, max: number = 200) => text.trim().substring(0, max);

    // 1. Yallakora Fetch
    try {
      const response = await axios.get('https://www.yallakora.com/match-center/', {
        timeout: 10000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      const $ = cheerio.load(response.data);
      
      $('.matchCard').each((i, el) => {
        const teamHome = safeText($(el).find('.teamA p').text());
        const teamAway = safeText($(el).find('.teamB p').text());
        const scoreHome = safeText($(el).find('.MResult .score:eq(0)').text(), 10);
        const scoreAway = safeText($(el).find('.MResult .score:eq(1)').text(), 10);
        const time = safeText($(el).find('.MResult .time').text(), 20);
        const status = safeText($(el).find('.matchStatus span').text() || 'Scheduled', 50);
        const league = safeText($(el).closest('.matchesList').find('.tourTitle h2').text() || 'Yallakora Matches', 100);
        const stadium = safeText($(el).find('.matchStadium').text(), 100);

        if (teamHome && teamAway) {
          matches.push({
            match_id: safeId(`yk-${teamHome}-${teamAway}-${today}`.replace(/\s+/g, '-')),
            team_home: teamHome,
            team_away: teamAway,
            league,
            date: today,
            time: time || 'TBD',
            status,
            score: scoreHome && scoreAway && scoreHome !== '-' ? `${scoreHome} - ${scoreAway}` : 'vs',
            source: 'Yallakora',
            stadium: stadium || 'ملعب غير محدد'
          });
        }
      });
    } catch (error) {
      console.warn('Could not scrape Yallakora, skipping.');
    }

    // 2. BBC Sport Fetch (Fallback/Additional)
    try {
      const response = await axios.get('https://www.bbc.com/sport/football/scores-fixtures', {
        timeout: 10000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const $ = cheerio.load(response.data);
      
      $('.sp-c-fixture').each((i, el) => {
        const teamHome = safeText($(el).find('.sp-c-fixture__team-name--home .sp-c-fixture__team-name-trunc').text());
        const teamAway = safeText($(el).find('.sp-c-fixture__team-name--away .sp-c-fixture__team-name-trunc').text());
        const scoreHome = safeText($(el).find('.sp-c-fixture__number--home').text(), 10);
        const scoreAway = safeText($(el).find('.sp-c-fixture__number--away').text(), 10);
        const time = safeText($(el).find('.sp-c-fixture__number--time').text(), 20);
        const status = safeText($(el).find('.sp-c-fixture__status').text() || (scoreHome ? 'Finished' : 'Scheduled'), 50);
        
        if (teamHome && teamAway) {
          matches.push({
            match_id: safeId(`bbc-${teamHome}-${teamAway}-${today}`.replace(/\s+/g, '-')),
            team_home: teamHome,
            team_away: teamAway,
            league: 'International',
            date: today,
            time: time || 'TBD',
            status,
            score: scoreHome && scoreAway ? `${scoreHome} - ${scoreAway}` : 'vs',
            source: 'BBC Sport'
          });
        }
      });
    } catch (error) {
      console.warn('Could not scrape BBC Sport, skipping.');
    }

    // 3. FilGoal Fetch
    try {
      const response = await axios.get('https://www.filgoal.com/matches', {
        timeout: 10000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const $ = cheerio.load(response.data);
      
      $('.mc-block').each((i, el) => {
        const teamHome = safeText($(el).find('.f').text());
        const teamAway = safeText($(el).find('.s').text());
        const score = safeText($(el).find('.m').text(), 20);
        const time = safeText($(el).find('.match-time').text(), 20);
        const status = safeText($(el).find('.match-status').text() || 'Scheduled', 50);
        const league = safeText($(el).closest('.championship').find('h6').text() || 'FilGoal Matches', 100);

        if (teamHome && teamAway) {
          matches.push({
            match_id: safeId(`fg-${teamHome}-${teamAway}-${today}`.replace(/\s+/g, '-')),
            team_home: teamHome,
            team_away: teamAway,
            league,
            date: today,
            time: time || 'TBD',
            status,
            score: score || 'vs',
            source: 'FilGoal'
          });
        }
      });
    } catch (error) {
      console.warn('Could not scrape FilGoal, skipping.');
    }

    // 4. Btolat Fetch
    try {
      const response = await axios.get('https://www.btolat.com/matches', {
        timeout: 10000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const $ = cheerio.load(response.data);
      
      $('.match-box').each((i, el) => {
        const teamHome = safeText($(el).find('.team1 p').text());
        const teamAway = safeText($(el).find('.team2 p').text());
        const scoreHome = safeText($(el).find('.score1').text(), 10);
        const scoreAway = safeText($(el).find('.score2').text(), 10);
        const time = safeText($(el).find('.date').text(), 20);
        const status = safeText($(el).find('.status').text() || 'Scheduled', 50);
        const league = safeText($(el).closest('.league-box').find('.league-title').text() || 'Btolat Matches', 100);

        if (teamHome && teamAway) {
          matches.push({
            match_id: safeId(`bt-${teamHome}-${teamAway}-${today}`.replace(/\s+/g, '-')),
            team_home: teamHome,
            team_away: teamAway,
            league,
            date: today,
            time: time || 'TBD',
            status,
            score: scoreHome && scoreAway ? `${scoreHome} - ${scoreAway}` : 'vs',
            source: 'Btolat'
          });
        }
      });
    } catch (error) {
      console.warn('Could not scrape Btolat, skipping.');
    }

    // 5. ESPN Fetch
    try {
      const response = await axios.get('https://www.espn.com/soccer/fixtures', {
        timeout: 10000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const $ = cheerio.load(response.data);
      
      $('.match-container').each((i, el) => {
        const teamHome = safeText($(el).find('.team-a .short-name').text());
        const teamAway = safeText($(el).find('.team-b .short-name').text());
        const score = safeText($(el).find('.score').text(), 20);
        const time = safeText($(el).find('.time').text(), 20);
        const status = safeText($(el).find('.game-status').text() || 'Scheduled', 50);
        const league = safeText($(el).closest('.schedule-container').find('.table-caption').text() || 'ESPN Matches', 100);

        if (teamHome && teamAway) {
          matches.push({
            match_id: safeId(`espn-${teamHome}-${teamAway}-${today}`.replace(/\s+/g, '-')),
            team_home: teamHome,
            team_away: teamAway,
            league,
            date: today,
            time: time || 'TBD',
            status,
            score: score || 'vs',
            source: 'ESPN'
          });
        }
      });
    } catch (error) {
      console.warn('Could not scrape ESPN, skipping.');
    }

    // 6. LiveScore Fetch
    try {
      const response = await axios.get('https://www.livescore.com/en/', {
        timeout: 10000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const $ = cheerio.load(response.data);
      
      $('.MatchRow_container__3sC2B').each((i, el) => {
        const teamHome = safeText($(el).find('.MatchRow_home__1O1r_').text());
        const teamAway = safeText($(el).find('.MatchRow_away__3s2o_').text());
        const score = safeText($(el).find('.MatchRow_score__1_3_').text(), 20);
        const time = safeText($(el).find('.MatchRow_time__2_3_').text(), 20);
        const status = safeText($(el).find('.MatchRow_status__1_3_').text() || 'Scheduled', 50);
        const league = safeText($(el).closest('.Category_container__1_3_').find('.Category_title__1_3_').text() || 'LiveScore Matches', 100);

        if (teamHome && teamAway) {
          matches.push({
            match_id: safeId(`ls-${teamHome}-${teamAway}-${today}`.replace(/\s+/g, '-')),
            team_home: teamHome,
            team_away: teamAway,
            league,
            date: today,
            time: time || 'TBD',
            status,
            score: score || 'vs',
            source: 'LiveScore'
          });
        }
      });
    } catch (error) {
      console.warn('Could not scrape LiveScore, skipping.');
    }

    // 7. TheSportsDB API (Public/Simulated)
    try {
      const leagues = [4328, 4387, 4399, 4480]; // EPL, Egypt, Saudi, CL
      for (const leagueId of leagues) {
        const response = await axios.get(`https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=${leagueId}`);
        if (response.data && response.data.events) {
          response.data.events.forEach((event: any) => {
            matches.push({
              match_id: safeId(`tsdb-${event.idEvent}`),
              team_home: safeText(event.strHomeTeam),
              team_away: safeText(event.strAwayTeam),
              league: safeText(event.strLeague, 100),
              date: event.dateEvent,
              time: safeText(event.strTime, 20),
              status: 'Scheduled',
              score: 'vs',
              source: 'TheSportsDB',
              stadium: safeText(event.strVenue || 'International Stadium', 100)
            });
          });
        }
      }
    } catch (error) {
      console.warn('TheSportsDB API failed, skipping.');
    }

    // If scraping fails completely, we don't return mock data as requested.
    // We just return whatever we got (which might be empty).
    return matches;
  },

  async syncToSupabase() {
    try {
      if (!supabase) {
        console.log('Supabase client missing. Skipping matches sync.');
        return { success: false, message: 'Supabase client missing' };
      }
      const liveData = await this.fetchLive();
      if (liveData.length > 0) {
        // Deduplicate by match_id
        const uniqueMatches = Array.from(new Map(liveData.map(m => [m.match_id, m])).values());

        const { error } = await supabase
          .from('matches')
          .upsert(uniqueMatches, { onConflict: 'match_id' });
        
        if (error) {
          console.warn('Matches Sync Database Error:', error.message);
          // If table doesn't exist, we just skip sync instead of crashing
          if (error.code === '42P01') {
             console.warn('Table "matches" does not exist yet. Skipping sync.');
             return { success: false, message: 'Table missing' };
          }
          throw error;
        }
        console.log(`Successfully synced ${uniqueMatches.length} matches to Supabase.`);
        return { success: true, count: uniqueMatches.length, data: uniqueMatches };
      }
      return { success: false, message: 'No data fetched' };
    } catch (error) {
      console.error('Matches Sync Error:', error);
      return { success: false, error };
    }
  },

  async getMatches() {
    const { data, error } = await supabase.from('matches').select('*').order('time');
    if (error || !data || data.length === 0) {
      const live = await this.fetchLive();
      this.syncToSupabase().catch(err => console.error('Matches background sync failed:', err)); 
      return live;
    }
    return data;
  }
};

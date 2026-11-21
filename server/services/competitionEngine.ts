
import { supabase } from './supabaseClient.ts';
import dotenv from 'dotenv';

const DEFAULT_QUESTIONS = [
  { question: 'What is the most eco-friendly transport in Cairo?', options: ['Metro', 'Car', 'Bus', 'Tuk-tuk'], answer: 'Metro', points: 10 },
  { question: 'How much CO2 does a tree absorb per year?', options: ['22kg', '5kg', '100kg', '50kg'], answer: '22kg', points: 15 },
  { question: 'Which Egyptian city is known for its wind energy?', options: ['Zafarana', 'Cairo', 'Alexandria', 'Luxor'], answer: 'Zafarana', points: 10 }
];

export const competitionEngine = {
  syncDailyQuestion: async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if we already have a question for today
      const { data: existing } = await supabase
        .from('daily_questions')
        .select('*')
        .eq('date', today)
        .single();

      if (!existing) {
        const randomQ = DEFAULT_QUESTIONS[Math.floor(Math.random() * DEFAULT_QUESTIONS.length)];
        await supabase.from('daily_questions').insert({
          ...randomQ,
          date: today,
          created_at: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error syncing daily question:', error);
    }
  }
};

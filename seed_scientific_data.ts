import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('Seeding scientific data for 2026...');

  const data = [
    {
      key: 'utility_rates_egypt_2026',
      category: 'financial',
      value: {
        electricity: {
          tiers: [
            { id: "1", min: 0, max: 50, rate: 0.68 },
            { id: "2", min: 51, max: 100, rate: 0.78 },
            { id: "3", min: 101, max: 200, rate: 0.95 },
            { id: "4", min: 201, max: 350, rate: 1.55 },
            { id: "5", min: 351, max: 650, rate: 1.95 },
            { id: "6", min: 651, max: 1000, rate: 2.1 },
            { id: "7", min: 1001, max: 999999, rate: 2.23 },
          ],
          fixedFees: { "1": 1, "2": 2, "3": 6, "4": 11, "5": 15, "6": 25, "7": 40 },
          currency: "EGP",
        },
        water: {
          tiers: [
            { min: 0, max: 10, rate: 1.25 },
            { min: 11, max: 20, rate: 2.5 },
            { min: 21, max: 30, rate: 3.25 },
            { min: 31, max: 999, rate: 4.5 },
          ],
          sewageRatio: 0.75,
          currency: "EGP",
        },
        gas: {
          tiers: [
            { min: 0, max: 30, rate: 3.0 },
            { min: 31, max: 60, rate: 4.0 },
            { min: 61, max: 999, rate: 5.0 },
          ],
          currency: "EGP",
        },
      },
    },
    {
      key: 'emission_factors',
      category: 'environmental',
      value: {
        electricity: 0.527,
        water: 0.342,
        gas: 2.02,
        gas_piped: 2.02,
        gas_vehicle: 1.89,
        gas_cylinder_home: 36.4,
        gas_cylinder_comm: 72.8,
        car_petrol: 0.23,
        car_diesel: 0.27,
        car_hybrid: 0.11,
        car_electric: 0.045,
        metro: 0.048,
        monorail: 0.035,
        lrt: 0.032,
        hsr: 0.028,
        brt: 0.065,
        bus: 0.092,
        microbus: 0.12,
        microbus_intercity: 0.085,
        river_bus: 0.055,
        food_meat: 12.5,
        food_veg: 0.8,
        waste_landfill: 1.4,
        waste_recycling: 0.1,
      },
    },
    {
        key: 'transport_config_2026',
        category: 'transport',
        value: {
            metro: { base_fare: 8, tier_1: 12, tier_2: 15, tier_3: 20 },
            monorail: { base_fare: 20, max_fare: 40 },
            lrt: { base_fare: 15, max_fare: 35 },
            brt: { fare: 15 },
            bus: { ordinary: 8, premium: 15, collective: 12 },
            microbus: { average_fare_km: 0.8 },
            taxi_electric: { base: 15, km_rate: 6 }
        }
    }
  ];

  for (const item of data) {
    const { error } = await supabase
      .from('scientific_data')
      .upsert({ 
        key: item.key, 
        category: item.category, 
        value: item.value 
      }, { onConflict: 'key' });
    
    if (error) {
      console.error(`Error seeding ${item.key}:`, error);
    } else {
      console.log(`Successfully seeded ${item.key}`);
    }
  }

  console.log('Seeding complete.');
}

seed();

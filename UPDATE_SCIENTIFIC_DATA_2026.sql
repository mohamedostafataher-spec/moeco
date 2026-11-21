-- OFFICIAL SCIENTIFIC DATA 2026 SYNC --
-- SOURCE: IPCC 2026 / MINISTRY OF ELECTRICITY AND RENEWABLE ENERGY EGYPT (2026 FORECASTS)

-- 1. CLEANUP OLD DATA
DELETE FROM public.scientific_data WHERE key IN ('utility_rates_egypt_2026', 'emission_factors', 'transport_config_2026');

-- 2. UTILITY RATES (EGYPT 2026)
INSERT INTO public.scientific_data (key, category, value)
VALUES (
    'utility_rates_egypt_2026', 
    'financial',
    '{
        "electricity": {
            "tiers": [
                {"id": "tier_1", "min": 0, "max": 50, "rate": 0.68},
                {"id": "tier_2", "min": 51, "max": 100, "rate": 0.78},
                {"id": "tier_3", "min": 0, "max": 200, "rate": 0.95},
                {"id": "tier_4", "min": 201, "max": 350, "rate": 1.55},
                {"id": "tier_5", "min": 351, "max": 650, "rate": 1.95},
                {"id": "tier_6", "min": 0, "max": 1000, "rate": 2.10},
                {"id": "tier_7", "min": 1001, "max": 999999, "rate": 2.23}
            ],
            "fixedFees": {"tier_1": 1, "tier_2": 2, "tier_3": 6, "tier_4": 11, "tier_5": 15, "tier_6": 25, "tier_7": 40},
            "currency": "EGP"
        },
        "water": {
            "tiers": [
                {"min": 0, "max": 10, "rate": 1.25},
                {"min": 11, "max": 20, "rate": 2.50},
                {"min": 21, "max": 30, "rate": 3.25},
                {"min": 31, "max": 999, "rate": 4.50}
            ],
            "sewageRatio": 0.75,
            "currency": "EGP"
        },
        "gas": {
            "tiers": [
                {"min": 0, "max": 30, "rate": 3.00},
                {"min": 31, "max": 60, "rate": 4.00},
                {"min": 61, "max": 999, "rate": 5.00}
            ],
            "currency": "EGP"
        }
    }'::jsonb
);

-- 3. CARBON EMISSION FACTORS (IPCC 2026 GUIDELINES)
INSERT INTO public.scientific_data (key, category, value)
VALUES (
    'emission_factors',
    'environmental',
    '{
        "electricity": 0.527,
        "water": 0.342,
        "gas": 2.02,
        "gas_piped": 2.02,
        "gas_vehicle": 1.89,
        "gas_cylinder_home": 36.4,
        "gas_cylinder_comm": 72.8,
        "car_petrol": 0.23,
        "car_diesel": 0.27,
        "car_hybrid": 0.11,
        "car_electric": 0.045,
        "metro": 0.048,
        "monorail": 0.035,
        "lrt": 0.032,
        "hsr": 0.028,
        "brt": 0.065,
        "bus": 0.092,
        "microbus": 0.12,
        "microbus_intercity": 0.085,
        "river_bus": 0.055,
        "food_meat": 12.5,
        "food_veg": 0.8,
        "waste_landfill": 1.4,
        "waste_recycling": 0.1
    }'::jsonb
);

-- 4. TRANSPORT CONFIGURATION 2026 (FARES & DISTANCES)
INSERT INTO public.scientific_data (key, category, value)
VALUES (
    'transport_config_2026',
    'transport',
    '{
        "metro": {"base_fare": 8, "tier_1": 12, "tier_2": 15, "tier_3": 20},
        "monorail": {"base_fare": 20, "max_fare": 40},
        "lrt": {"base_fare": 15, "max_fare": 35},
        "brt": {"fare": 15},
        "bus": {"ordinary": 8, "premium": 15, "collective": 12},
        "microbus": {"average_fare_km": 0.8},
        "taxi_electric": {"base": 15, "km_rate": 6}
    }'::jsonb
);

SELECT '✅ SCIENTIFIC DATA 2026 VERSION 1.0 SYNCHRONIZED' as status;

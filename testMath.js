let usage = 61;
let category = 'gas';
let allTiers = [
    { sector: 'gas', tier_name: 'tier_1', min_consumption: 0, max_consumption: 30, price_per_unit: 2.50, fixed_fee: 12 },
    { sector: 'gas', tier_name: 'tier_2', min_consumption: 31, max_consumption: 60, price_per_unit: 3.25, fixed_fee: 12 },
    { sector: 'gas', tier_name: 'tier_3', min_consumption: 61, max_consumption: 99999, price_per_unit: 3.75, fixed_fee: 12 },
];
let total = 0;
let remaining = usage;
const sortedTiers = [...allTiers].sort((a, b) => a.min_consumption - b.min_consumption);

for (const tier of sortedTiers) {
    if (remaining <= 0) break;
    const tMin = tier.min_consumption;
    const tMax = tier.max_consumption;
    const tierSize = tMin === 0 ? tMax : (tMax - tMin + 1);
    
    const consumedInTier = Math.min(remaining, tierSize);
    total += consumedInTier * tier.price_per_unit;
    remaining -= consumedInTier;

    if (usage >= tMin && (usage <= tMax || tMax >= 99999)) {
      total += (tier.fixed_fee || 0);
    }
}
console.log("Total computed: ", total);


import sequelize from "./config/database";
import Country from "./models/Country";
import Governorate from "./models/Governorate";
import City from "./models/City";
import Sector from "./models/Sector";
import EmissionFactor from "./models/EmissionFactor";

async function seed() {
  try {
    await sequelize.sync({ force: true });
    console.log("Database synced for seeding...");

    // 1. Sectors
    const sectors = await Sector.bulkCreate([
      { nameEn: "Electricity", nameAr: "الكهرباء", icon: "Zap", color: "#FBBF24" },
      { nameEn: "Water", nameAr: "المياه", icon: "Droplets", color: "#3B82F6" },
      { nameEn: "Transport", nameAr: "النقل", icon: "Car", color: "#EF4444" },
      { nameEn: "Waste", nameAr: "النفايات", icon: "Trash2", color: "#10B981" },
      { nameEn: "Agriculture", nameAr: "الزراعة", icon: "Leaf", color: "#8B5CF6" },
    ]);

    // 2. Countries
    const egypt = await Country.create({
      nameEn: "Egypt",
      nameAr: "مصر",
      code: "EG",
      currency: "EGP",
      flag: "🇪🇬"
    });

    const uae = await Country.create({
      nameEn: "United Arab Emirates",
      nameAr: "الإمارات",
      code: "AE",
      currency: "AED",
      flag: "🇦🇪"
    });

    // 3. Governorates & Cities for Egypt
    const cairoGov = await Governorate.create({
      nameEn: "Cairo",
      nameAr: "القاهرة",
      countryId: egypt.id,
      lat: 30.0444,
      lng: 31.2357
    });

    await City.create({
      nameEn: "New Cairo",
      nameAr: "القاهرة الجديدة",
      governorateId: cairoGov.id,
      lat: 30.0299,
      lng: 31.4913
    });

    // 4. Emission Factors
    await EmissionFactor.bulkCreate([
      { countryId: egypt.id, sectorId: sectors[0].id, factor: 0.5, unit: "kgCO2/kWh" },
      { countryId: egypt.id, sectorId: sectors[1].id, factor: 0.3, unit: "kgCO2/m3" },
      { countryId: egypt.id, sectorId: sectors[2].id, factor: 0.2, unit: "kgCO2/km" },
    ]);

    console.log("Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seed();

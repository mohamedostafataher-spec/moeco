
import sequelize from './server/config/database.ts';
import Country from './server/models/Country.ts';
import Governorate from './server/models/Governorate.ts';
import City from './server/models/City.ts';
import Sector from './server/models/Sector.ts';
import EmissionFactor from './server/models/EmissionFactor.ts';

async function seed() {
  try {
    await sequelize.sync({ force: true });
    console.log('Database synced for seeding');

    // 1. Create Egypt
    const egypt = await Country.create({
      nameAr: 'مصر',
      nameEn: 'Egypt',
      code: 'EG',
      currency: 'EGP'
    });

    // 2. Create Sectors
    const sectors = [
      { nameAr: 'الكهرباء', nameEn: 'Electricity', icon: 'Zap', unit: 'kWh', factor: 0.533 },
      { nameAr: 'المياه', nameEn: 'Water', icon: 'Droplets', unit: 'm3', factor: 0.298 },
      { nameAr: 'الغاز الطبيعي', nameEn: 'Natural Gas', icon: 'Flame', unit: 'm3', factor: 2.02 },
      { nameAr: 'النقل', nameEn: 'Transport', icon: 'Bike', unit: 'km', factor: 0.12 },
      { nameAr: 'النفايات', nameEn: 'Waste', icon: 'Trash2', unit: 'kg', factor: 0.5 },
      { nameAr: 'الزراعة', nameEn: 'Agriculture', icon: 'Leaf', unit: 'ton', factor: 2.5 },
      { nameAr: 'الصحة', nameEn: 'Health', icon: 'ShieldCheck', unit: 'visit', factor: 0.1 },
      { nameAr: 'جودة الهواء', nameEn: 'Air Quality', icon: 'Wind', unit: 'AQI', factor: 0 },
      { nameAr: 'النشاط الصناعي', nameEn: 'Industrial Activity', icon: 'Briefcase', unit: 'ton', factor: 3.2 }
    ];

    for (const s of sectors) {
      const sector = await Sector.create({
        nameAr: s.nameAr,
        nameEn: s.nameEn,
        icon: s.icon,
        unit: s.unit
      });

      await EmissionFactor.create({
        countryId: egypt.id,
        sectorId: sector.id,
        factor: s.factor,
        source: 'CAPMAS / Ministry of Electricity'
      });
    }

    // 3. Create Governorates and Cities
    const govData = [
      { nameAr: 'القاهرة', nameEn: 'Cairo', lat: 30.0444, lng: 31.2357, cities: ['القاهرة الجديدة', 'المعادي', 'حلوان'] },
      { nameAr: 'الإسكندرية', nameEn: 'Alexandria', lat: 31.2001, lng: 29.9187, cities: ['وسط الإسكندرية', 'المنتزة', 'العامرية'] },
      { nameAr: 'الجيزة', nameEn: 'Giza', lat: 30.0131, lng: 31.2089, cities: ['6 أكتوبر', 'الشيخ زايد', 'الدقي'] },
      { nameAr: 'أسوان', nameEn: 'Aswan', lat: 24.0889, lng: 32.8998, cities: ['أسوان', 'كوم أمبو', 'إدفو'] },
      { nameAr: 'الأقصر', nameEn: 'Luxor', lat: 25.6872, lng: 32.6396, cities: ['الأقصر', 'إسنا', 'أرمنت'] },
      { nameAr: 'بورسعيد', nameEn: 'Port Said', lat: 31.2565, lng: 32.2841, cities: ['بورسعيد', 'بورفؤاد'] },
      { nameAr: 'السويس', nameEn: 'Suez', lat: 29.9668, lng: 32.5498, cities: ['السويس', 'الأربعين'] },
      { nameAr: 'المنصورة', nameEn: 'Mansoura', lat: 31.0409, lng: 31.3785, cities: ['المنصورة', 'طلخا'] },
      { nameAr: 'طنطا', nameEn: 'Tanta', lat: 30.7865, lng: 31.0004, cities: ['طنطا', 'المحلة الكبرى'] },
      { nameAr: 'الفيوم', nameEn: 'Fayoum', lat: 29.3084, lng: 30.8428, cities: ['الفيوم', 'إطسا'] }
    ];

    for (const g of govData) {
      const gov = await Governorate.create({
        countryId: egypt.id,
        nameAr: g.nameAr,
        nameEn: g.nameEn,
        lat: g.lat,
        lng: g.lng
      });

      for (const c of g.cities) {
        await City.create({
          governorateId: gov.id,
          nameAr: c,
          nameEn: c // Simplified for seed
        });
      }
    }

    console.log('Seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();

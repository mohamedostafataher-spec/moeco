
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.ts';
import Country from './Country.ts';

class Governorate extends Model {
  public id!: string;
  public countryId!: string;
  public nameAr!: string;
  public nameEn!: string;
  public lat?: number;
  public lng?: number;
}

Governorate.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  countryId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Country,
      key: 'id',
    },
  },
  nameAr: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  nameEn: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lat: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  lng: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
}, {
  sequelize,
  modelName: 'Governorate',
});

Governorate.belongsTo(Country, { foreignKey: 'countryId' });
Country.hasMany(Governorate, { foreignKey: 'countryId' });

export default Governorate;

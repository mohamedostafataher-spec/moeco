
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.ts';
import Country from './Country.ts';
import Sector from './Sector.ts';

class EmissionFactor extends Model {
  public id!: string;
  public countryId!: string;
  public sectorId!: string;
  public factor!: number; // kg CO2 per unit
  public source!: string;
  public lastUpdated!: Date;
}

EmissionFactor.init({
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
  sectorId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Sector,
      key: 'id',
    },
  },
  factor: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  source: {
    type: DataTypes.STRING,
  },
  lastUpdated: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  modelName: 'EmissionFactor',
});

EmissionFactor.belongsTo(Country, { foreignKey: 'countryId' });
EmissionFactor.belongsTo(Sector, { foreignKey: 'sectorId' });
Country.hasMany(EmissionFactor, { foreignKey: 'countryId' });
Sector.hasMany(EmissionFactor, { foreignKey: 'sectorId' });

export default EmissionFactor;

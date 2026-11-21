
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.ts';
import User from './User.ts';
import Sector from './Sector.ts';
import City from './City.ts';
import Country from './Country.ts';

class ConsumptionLog extends Model {
  public id!: string;
  public userId!: string;
  public sectorId!: string;
  public cityId!: string;
  public countryId!: string;
  public consumption!: number;
  public unit!: string;
  public cost!: number;
  public currency!: string;
  public co2!: number;
  public status!: string;
  public method!: string;
  public methodAr!: string;
  public timestamp!: Date;
}

ConsumptionLog.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
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
  cityId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: City,
      key: 'id',
    },
  },
  countryId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Country,
      key: 'id',
    },
  },
  consumption: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  unit: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  cost: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: 'EGP',
  },
  co2: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Actual',
  },
  method: {
    type: DataTypes.STRING,
    defaultValue: 'Direct meter reading',
  },
  methodAr: {
    type: DataTypes.STRING,
    defaultValue: 'قراءة العداد المباشرة',
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  modelName: 'ConsumptionLog',
});

ConsumptionLog.belongsTo(User, { foreignKey: 'userId' });
ConsumptionLog.belongsTo(Sector, { foreignKey: 'sectorId' });
ConsumptionLog.belongsTo(City, { foreignKey: 'cityId' });
ConsumptionLog.belongsTo(Country, { foreignKey: 'countryId' });

export default ConsumptionLog;

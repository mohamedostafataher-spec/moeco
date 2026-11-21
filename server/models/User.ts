
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.ts';
import Country from './Country.ts';
import Governorate from './Governorate.ts';
import City from './City.ts';

class User extends Model {
  public id!: string;
  public email!: string;
  public password!: string;
  public role!: 'User' | 'Admin' | 'Government' | 'Researcher';
  public countryId!: string;
  public governorateId!: string;
  public cityId!: string;
  public points!: number;
  public greenCoins!: number;
  public badges!: string[];
}

User.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('User', 'Admin', 'Government', 'Researcher'),
    defaultValue: 'User',
  },
  countryId: {
    type: DataTypes.UUID,
    references: {
      model: Country,
      key: 'id',
    },
  },
  governorateId: {
    type: DataTypes.UUID,
    references: {
      model: Governorate,
      key: 'id',
    },
  },
  cityId: {
    type: DataTypes.UUID,
    references: {
      model: City,
      key: 'id',
    },
  },
  points: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  greenCoins: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  badges: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
}, {
  sequelize,
  modelName: 'User',
});

User.belongsTo(Country, { foreignKey: 'countryId' });
User.belongsTo(Governorate, { foreignKey: 'governorateId' });
User.belongsTo(City, { foreignKey: 'cityId' });

export default User;

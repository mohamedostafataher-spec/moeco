
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.ts';

class Country extends Model {
  public id!: string;
  public nameAr!: string;
  public nameEn!: string;
  public code!: string; // e.g., EG, FR
  public currency!: string;
}

Country.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  nameAr: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  nameEn: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  code: {
    type: DataTypes.STRING(5),
    allowNull: false,
    unique: true,
  },
  currency: {
    type: DataTypes.STRING(10),
    defaultValue: 'USD',
  },
}, {
  sequelize,
  modelName: 'Country',
});

export default Country;

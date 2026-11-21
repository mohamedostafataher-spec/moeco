
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.ts';

class Sector extends Model {
  public id!: string;
  public nameAr!: string;
  public nameEn!: string;
  public icon!: string;
  public unit!: string;
}

Sector.init({
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
  icon: {
    type: DataTypes.STRING,
  },
  unit: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  sequelize,
  modelName: 'Sector',
});

export default Sector;

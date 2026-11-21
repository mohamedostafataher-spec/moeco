
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.ts';
import Governorate from './Governorate.ts';

class City extends Model {
  public id!: string;
  public governorateId!: string;
  public nameAr!: string;
  public nameEn!: string;
}

City.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  governorateId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Governorate,
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
}, {
  sequelize,
  modelName: 'City',
});

City.belongsTo(Governorate, { foreignKey: 'governorateId' });
Governorate.hasMany(City, { foreignKey: 'governorateId' });

export default City;

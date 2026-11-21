
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.ts';
import User from './User.ts';

class RefreshToken extends Model {
  public id!: string;
  public userId!: string;
  public token!: string;
  public expiresAt!: Date;
}

RefreshToken.init({
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
  token: {
    type: DataTypes.STRING(512),
    allowNull: false,
    unique: true,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  sequelize,
  modelName: 'RefreshToken',
});

RefreshToken.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(RefreshToken, { foreignKey: 'userId' });

export default RefreshToken;

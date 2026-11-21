
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.ts';
import User from './User.ts';

class PolicySimulation extends Model {
  public id!: string;
  public userId!: string;
  public name!: string;
  public scenarioData!: any; // JSON with input parameters
  public resultData!: any; // JSON with calculated impacts
  public timestamp!: Date;
}

PolicySimulation.init({
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
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  scenarioData: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  resultData: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  modelName: 'PolicySimulation',
});

PolicySimulation.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(PolicySimulation, { foreignKey: 'userId' });

export default PolicySimulation;


import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.ts';

class AuditLog extends Model {
  public id!: string;
  public userId!: string;
  public action!: string;
  public details!: string;
  public timestamp!: Date;
  public ipAddress!: string;
}

AuditLog.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  details: {
    type: DataTypes.TEXT,
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  ipAddress: {
    type: DataTypes.STRING,
  },
}, {
  sequelize,
  modelName: 'AuditLog',
});

export default AuditLog;


import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.ts';

class Alert extends Model {
  public id!: string;
  public category!: string;
  public severity!: 'Low' | 'Medium' | 'High' | 'Critical';
  public titleAr!: string;
  public titleEn!: string;
  public messageAr!: string;
  public messageEn!: string;
  public country!: string;
  public city!: string;
  public timestamp!: Date;
  public sourceName!: string;
  public sourceUrl!: string;
}

Alert.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  severity: {
    type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'),
    allowNull: false,
  },
  titleAr: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  titleEn: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  messageAr: {
    type: DataTypes.TEXT,
  },
  messageEn: {
    type: DataTypes.TEXT,
  },
  country: {
    type: DataTypes.STRING,
  },
  city: {
    type: DataTypes.STRING,
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  sourceName: {
    type: DataTypes.STRING,
  },
  sourceUrl: {
    type: DataTypes.STRING,
  },
}, {
  sequelize,
  modelName: 'Alert',
});

export default Alert;

import { Sequelize, DataTypes } from 'sequelize';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './moeco.sqlite',
  logging: false,
});

async function init() {
  const AppConfig = sequelize.define('app_config', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    config_key: { type: DataTypes.TEXT, unique: true, allowNull: false },
    config_value: { type: DataTypes.JSONB, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
  });

  const Coupon = sequelize.define('coupons', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    title: { type: DataTypes.TEXT, allowNull: false },
    code: { type: DataTypes.TEXT, allowNull: false },
    source: { type: DataTypes.TEXT, allowNull: true },
    category: { type: DataTypes.TEXT, allowNull: true },
  });

  const TransportLine = sequelize.define('transport_lines', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.TEXT, allowNull: false },
    line_type: { type: DataTypes.TEXT, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
  });

  const TransportStation = sequelize.define('transport_stations', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.TEXT, allowNull: false },
    location_lat: { type: DataTypes.FLOAT },
    location_lng: { type: DataTypes.FLOAT },
  });
  
  // Define relationship
  TransportLine.hasMany(TransportStation, { foreignKey: 'line_id' });
  TransportStation.belongsTo(TransportLine, { foreignKey: 'line_id' });

  await sequelize.sync({ alter: true });
  console.log('Database initialized successfully.');
}

init().catch(console.error);

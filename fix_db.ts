import sequelize from './server/config/database.ts';
import { DataTypes } from 'sequelize';

async function runFix() {
  const queryInterface = sequelize.getQueryInterface();
  
  // Fix app_config
  try {
    await queryInterface.addColumn('app_config', 'description', {
      type: DataTypes.TEXT,
      allowNull: true
    });
    console.log('Added description to app_config');
  } catch (e: any) {
    console.log('app_config/description likely already exists:', e.message);
  }

  // Fix coupons
  try {
    await queryInterface.addColumn('coupons', 'source', {
      type: DataTypes.TEXT,
      allowNull: true
    });
    console.log('Added source to coupons');
  } catch (e: any) {
    console.log('coupons/source likely already exists:', e.message);
  }
}

runFix().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});

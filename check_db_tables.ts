import { Sequelize } from 'sequelize';
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './moeco.sqlite',
  logging: false,
});

async function check() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log('Tables:', tables);
  } catch (e) {
    console.error('Error:', e);
  }
}
check();

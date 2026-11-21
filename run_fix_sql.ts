import fs from 'fs';
import sequelize from './server/config/database.ts';

async function runFix() {
    try {
        const sql = fs.readFileSync('FIX_SCHEMA.sql', 'utf8');
        await sequelize.query(sql);
        console.log('Schema fixed successfully.');
    } catch (error) {
        console.error('Error applying schema fix:', error);
    } finally {
        await sequelize.close();
    }
}
runFix();

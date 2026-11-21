import fs from 'fs';
import sequelize from './server/config/database.ts';

async function applyRepair() {
    try {
        console.log('Running repair script via Sequelize...');
        // Correct path to the repair script
        const sql = fs.readFileSync('./REPAIR_ALL_DATABASE.sql', 'utf8');
        
        // Split by semicolon to run statements sequentially if needed by dialect
        const statements = sql.split(';').filter(s => s.trim() !== '');
        
        for (const statement of statements) {
            await sequelize.query(statement);
        }
        console.log('Repair script applied successfully.');
    } catch (error) {
        console.error('Error applying repair script:', error);
    } finally {
        await sequelize.close();
    }
}
applyRepair();


import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.ts';

export const getAlerts = async (req: AuthRequest, res: Response) => {
  try {
    // Alerts for now
    const alerts = [
      { id: 1, title: 'Heatwave Warning', message: 'High temperatures expected tomorrow.', severity: 'High' },
      { id: 2, title: 'Water Shortage', message: 'Low water pressure in your area.', severity: 'Medium' }
    ];
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
};

export const createAlert = async (req: AuthRequest, res: Response) => {
  try {
    const { title, message, severity, governorateId } = req.body;
    // Logic to save alert
    res.status(201).json({ message: 'Alert created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create alert' });
  }
};

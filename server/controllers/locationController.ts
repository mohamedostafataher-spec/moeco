
import type { Request, Response } from 'express';
import Country from '../models/Country.ts';
import Governorate from '../models/Governorate.ts';
import City from '../models/City.ts';
import Sector from '../models/Sector.ts';

export const getCountries = async (req: Request, res: Response) => {
  try {
    const countries = await Country.findAll();
    res.json(countries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch countries' });
  }
};

export const getGovernorates = async (req: Request, res: Response) => {
  try {
    const { countryId } = req.params;
    const governorates = await Governorate.findAll({ where: { countryId } });
    res.json(governorates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch governorates' });
  }
};

export const getCities = async (req: Request, res: Response) => {
  try {
    const { governorateId } = req.params;
    const cities = await City.findAll({ where: { governorateId } });
    res.json(cities);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cities' });
  }
};

export const getSectors = async (req: Request, res: Response) => {
  try {
    const sectors = await Sector.findAll();
    res.json(sectors);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sectors' });
  }
};

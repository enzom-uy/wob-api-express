import { Request, Response } from 'express';
import { z } from 'zod';
import { recentWobsQuery, randomWobQuery, searchWobsQuery } from '../services/wobs-query.service';

export const search = async (req: Request, res: Response) => {
  try {
    const response = await searchWobsQuery(req.query);

    res.status(200).json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(422).json({ errors: error.issues });
      return;
    }
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const random = async (req: Request, res: Response) => {
  try {
    const response = await randomWobQuery(req.query);

    res.status(200).json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(422).json({ errors: error.issues });
      return;
    }
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const recent = async (_req: Request, res: Response) => {
  try {
    const { total, results } = await recentWobsQuery();

    res.status(200).json({
      currentPage: 1,
      perPage: 20,
      total,
      lastPage: Math.ceil(total / 20),
      data: results,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(422).json({ errors: error.issues });
      return;
    }
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

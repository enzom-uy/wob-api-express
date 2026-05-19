import { Request, Response } from 'express';
import { z } from 'zod';
import { parse, isValid, isBefore, startOfToday, isAfter } from 'date-fns';
import { searchWobs, getRandomWob } from '../services/wobs.service';

const parseDate = (val: string) => {
  const parsed = parse(val, 'dd-MM-yyyy', new Date());
  if (!isValid(parsed)) return undefined;
  return parsed;
};

const dateStringSchema = z
  .string()
  .refine((val) => parseDate(val) !== undefined, {
    message: 'Debe tener el formato DD-MM-YYYY.',
  })
  .transform((val) => parseDate(val)!);

export const searchSchema = z
  .object({
    query: z.string().min(1).max(255),
    page: z.coerce.number().int().min(1).default(1),
    perPage: z.coerce.number().int().min(1).max(25).default(10),
    caseSensitive: z.string(),
    afterDate: dateStringSchema.optional(),
    beforeDate: dateStringSchema.optional(),
  })
  .superRefine((data, ctx) => {
    const today = startOfToday();

    if (data.afterDate && !isBefore(data.afterDate, today)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La fecha de inicio (afterDate) debe ser anterior a hoy.',
        path: ['afterDate'],
      });
    }

    if (data.beforeDate && !isBefore(data.beforeDate, today)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La fecha límite (beforeDate) debe ser anterior a hoy.',
        path: ['beforeDate'],
      });
    }

    if (data.afterDate && data.beforeDate && !isAfter(data.beforeDate, data.afterDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'La fecha límite (beforeDate) debe ser posterior a la fecha de inicio (afterDate).',
        path: ['beforeDate'],
      });
    }
  });

export const randomSchema = z
  .object({
    afterDate: dateStringSchema.optional(),
    beforeDate: dateStringSchema.optional(),
  })
  .superRefine((data, ctx) => {
    const today = startOfToday();

    if (data.afterDate && !isBefore(data.afterDate, today)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La fecha de inicio (afterDate) debe ser anterior a hoy.',
        path: ['afterDate'],
      });
    }

    if (data.beforeDate && !isBefore(data.beforeDate, today)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La fecha límite (beforeDate) debe ser anterior a hoy.',
        path: ['beforeDate'],
      });
    }

    if (data.afterDate && data.beforeDate && !isAfter(data.beforeDate, data.afterDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'La fecha límite (beforeDate) debe ser posterior a la fecha de inicio (afterDate).',
        path: ['beforeDate'],
      });
    }
  });

export const search = async (req: Request, res: Response) => {
  try {
    const validatedData = searchSchema.parse(req.query);

    const { query, page, perPage, afterDate, beforeDate, caseSensitive } = validatedData;
    const boolCaseSensitive = Boolean(caseSensitive);

    const { total, results } = await searchWobs({
      query,
      page,
      perPage,
      afterDate,
      beforeDate,
      boolCaseSensitive,
    });

    res.status(200).json({
      currentPage: page,
      perPage: perPage,
      total: total,
      lastPage: Math.ceil(total / perPage),
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

export const random = async (req: Request, res: Response) => {
  try {
    const validatedData = randomSchema.parse(req.query);
    const { afterDate, beforeDate } = validatedData;

    const randomWob = await getRandomWob({ afterDate, beforeDate });

    res.status(200).json({
      data: randomWob,
      afterDate: req.query.afterDate || null,
      beforeDate: req.query.beforeDate || null,
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

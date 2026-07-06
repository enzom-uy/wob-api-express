import { z } from 'zod';
import { isAfter, isBefore, isValid, parse, startOfToday } from 'date-fns';
import { getRandomWob, searchWobs } from './wobs.service';

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
    query: z.string().trim().min(1).max(255),
    page: z.coerce.number().int().min(1).default(1),
    perPage: z.coerce.number().int().min(1).max(25).default(10),
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

export const searchWobsQuery = async (params: unknown) => {
  const { query, page, perPage, afterDate, beforeDate } = searchSchema.parse(params);
  const { total, results } = await searchWobs({
    query,
    page,
    perPage,
    afterDate,
    beforeDate,
  });

  return {
    currentPage: page,
    perPage,
    total,
    lastPage: Math.ceil(total / perPage),
    data: results,
  };
};

export const randomWobQuery = async (params: unknown) => {
  const { afterDate, beforeDate } = randomSchema.parse(params);
  const randomWob = await getRandomWob({ afterDate, beforeDate });

  return {
    data: randomWob,
    afterDate: afterDate ?? null,
    beforeDate: beforeDate ?? null,
  };
};

export const recentWobsQuery = async () => {
  return searchWobs({
    query: '',
    page: 1,
    perPage: 20,
    afterDate: undefined,
    beforeDate: undefined,
  });
};

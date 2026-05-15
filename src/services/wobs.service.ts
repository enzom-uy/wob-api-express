import { db } from '../db/db';
import { wob, tags, wobTags } from '../db/schema';
import { sql, desc, count, gt, lt, and, or, eq } from 'drizzle-orm';

interface SearchParams {
  query: string;
  page: number;
  perPage: number;
  afterDate?: Date;
  beforeDate?: Date;
}

interface RandomParams {
  afterDate?: Date;
  beforeDate?: Date;
}

export const searchWobs = async ({ query, page, perPage, afterDate, beforeDate }: SearchParams) => {
  const offset = (page - 1) * perPage;

  const dateFilters = [];
  if (afterDate) dateFilters.push(gt(wob.date, afterDate));
  if (beforeDate) dateFilters.push(lt(wob.date, beforeDate));

  const searchCondition = or(
    sql`${wob.data}::text ILIKE ${'%' + query + '%'}`,
    sql`EXISTS (
      SELECT 1 FROM ${wobTags} wt
      JOIN ${tags} t ON wt.tag_id = t.id
      WHERE wt.wob_id = ${wob.id} AND t.name ILIKE ${'%' + query + '%'}
    )`,
  );

  const conditions = and(searchCondition, ...dateFilters);

  const [totalResult] = await db.select({ count: count() }).from(wob).where(conditions);

  const total = totalResult.count;

  const rawResults = await db
    .select({
      wob: wob,
      tags: sql<
        string[]
      >`COALESCE(json_agg(${tags.name}) FILTER (WHERE ${tags.name} IS NOT NULL), '[]')`,
    })
    .from(wob)
    .leftJoin(wobTags, eq(wob.id, wobTags.wobId))
    .leftJoin(tags, eq(wobTags.tagId, tags.id))
    .where(conditions)
    .groupBy(wob.id)
    .orderBy(desc(wob.date))
    .limit(perPage)
    .offset(offset);

  const results = rawResults.map((row) => ({
    ...row.wob,
    tags: row.tags,
  }));

  return {
    total,
    results,
  };
};

export const getRandomWob = async ({ afterDate, beforeDate }: RandomParams) => {
  const dateFilters = [];
  if (afterDate) dateFilters.push(gt(wob.date, afterDate));
  if (beforeDate) dateFilters.push(lt(wob.date, beforeDate));

  const conditions = dateFilters.length > 0 ? and(...dateFilters) : undefined;

  const rawResults = await db
    .select({
      wob: wob,
      tags: sql<
        string[]
      >`COALESCE(json_agg(${tags.name}) FILTER (WHERE ${tags.name} IS NOT NULL), '[]')`,
    })
    .from(wob)
    .leftJoin(wobTags, eq(wob.id, wobTags.wobId))
    .leftJoin(tags, eq(wobTags.tagId, tags.id))
    .where(conditions)
    .groupBy(wob.id)
    .orderBy(sql`RANDOM()`)
    .limit(1);

  if (rawResults.length === 0) return null;

  return {
    ...rawResults[0].wob,
    tags: rawResults[0].tags,
  };
};

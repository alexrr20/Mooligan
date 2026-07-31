import * as z from "zod";

export const CatalogCardRecordSchema = z.object({
  collector_number: z.string(),
  id: z.string().min(1),
  json: z.string(),
  name: z.string(),
  oracle_id: z.string().nullable(),
  set_code: z.string(),
  updated_at: z.iso.datetime({ offset: true }),
});
export type CatalogCardRecord = z.infer<typeof CatalogCardRecordSchema>;

export const CatalogPageSchema = z.object({
  cards: z.array(CatalogCardRecordSchema).max(500),
  nextCursor: z.string().nullable(),
  version: z.string().min(1),
});
export type CatalogPage = z.infer<typeof CatalogPageSchema>;

import * as z from "zod";

import { FinishSchema } from "./catalog.ts";

export const DesiredPrintingSchema = z.object({
  finish: FinishSchema.optional(),
  printingId: z.string().min(1),
});
export type DesiredPrinting = z.infer<typeof DesiredPrintingSchema>;

export const CardListEntrySchema = z.object({
  cardId: z.string().min(1),
  desiredPrinting: DesiredPrintingSchema.optional(),
  id: z.string().min(1),
  notes: z.string().optional(),
  quantity: z.number().int().positive(),
});
export type CardListEntry = z.infer<typeof CardListEntrySchema>;

export const CardListSchema = z.object({
  createdAt: z.iso.datetime({ offset: true }),
  entries: z.array(CardListEntrySchema),
  id: z.string().min(1),
  name: z.string().min(1),
  notes: z.string().optional(),
  updatedAt: z.iso.datetime({ offset: true }),
});
export type CardList = z.infer<typeof CardListSchema>;

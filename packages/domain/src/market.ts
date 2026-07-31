import * as z from "zod";

import { FinishSchema } from "./catalog.ts";

export const MoneySchema = z.object({
  amountMinor: z.number().int(),
  currency: z.string().regex(/^[A-Z]{3}$/),
});
export type Money = z.infer<typeof MoneySchema>;

export const PriceQuoteSchema = z.object({
  finish: FinishSchema,
  observedAt: z.iso.datetime({ offset: true }),
  price: MoneySchema,
  printingId: z.string().min(1),
  source: z.string().min(1),
});
export type PriceQuote = z.infer<typeof PriceQuoteSchema>;

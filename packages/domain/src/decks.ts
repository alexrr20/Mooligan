import * as z from "zod";

import { FinishSchema } from "./catalog.ts";

export const DeckSectionSchema = z.enum([
  "mainboard",
  "sideboard",
  "commander",
  "companion",
  "maybeboard",
]);
export type DeckSection = z.infer<typeof DeckSectionSchema>;

/** A deck slot using an exact printing and finish. */
export const DeckEntrySchema = z.object({
  finish: FinishSchema,
  id: z.string().min(1),
  printingId: z.string().min(1),
  quantity: z.number().int().positive(),
  section: DeckSectionSchema,
});
export type DeckEntry = z.infer<typeof DeckEntrySchema>;

export const DeckSchema = z.object({
  createdAt: z.iso.datetime({ offset: true }),
  entries: z.array(DeckEntrySchema),
  formatId: z.string().min(1),
  id: z.string().min(1),
  name: z.string().min(1),
  notes: z.string().optional(),
  tags: z.array(z.string().min(1)),
  updatedAt: z.iso.datetime({ offset: true }),
});
export type Deck = z.infer<typeof DeckSchema>;

export const DeckRevisionSchema = z.object({
  createdAt: z.iso.datetime({ offset: true }),
  deckId: z.string().min(1),
  entries: z.array(DeckEntrySchema),
  id: z.string().min(1),
  message: z.string().optional(),
});
export type DeckRevision = z.infer<typeof DeckRevisionSchema>;

/** Assigns owned copies to a deck without making ownership part of the decklist. */
export const DeckAllocationSchema = z.object({
  collectionLotId: z.string().min(1),
  deckEntryId: z.string().min(1),
  quantity: z.number().int().positive(),
});
export type DeckAllocation = z.infer<typeof DeckAllocationSchema>;

/** Derived by deck validation rather than parsed from storage or transport. */
export type DeckValidationIssue = {
  code: string;
  entryId?: string;
  message: string;
  severity: "error" | "warning";
};

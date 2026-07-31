import * as z from "zod";

const httpsUrlSchema = z.url().refine((value) => new URL(value).protocol === "https:", {
  message: "Expected an HTTPS URL",
});

export const CatalogReleaseSchema = z.object({
  compressedSize: z.number().int().positive(),
  downloadUrl: httpsUrlSchema,
  updatedAt: z.iso.datetime({ offset: true }),
});
export type CatalogRelease = z.infer<typeof CatalogReleaseSchema>;

export const ScryfallBulkDataSchema = z.object({
  compressed_size: z.number().int().positive(),
  jsonl_download_uri: httpsUrlSchema,
  type: z.literal("default_cards"),
  updated_at: z.iso.datetime({ offset: true }),
});

export const ScryfallCardDownloadSchema = z.object({
  collector_number: z.string(),
  id: z.string().min(1),
  name: z.string().min(1),
  object: z.literal("card"),
  oracle_id: z.string().nullable().optional(),
  set: z.string().min(1),
});

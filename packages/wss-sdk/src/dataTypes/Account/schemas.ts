import { z } from "zod";

export const schemaAccountMetadataBase = z.object({
    name: z.string(),
    currencyId: z.string(),
    seedId: z.string(),
    derivationPath: z.string(),
    derivationMode: z.string(),
});

export const schemaAccountMetadataXPub = schemaAccountMetadataBase.extend({
    type: z.literal("xPub"),
    xPub: z.string(),
});

export const schemaAccountMetadataAddress = schemaAccountMetadataBase.extend({
    type: z.literal("address"),
    address: z.string(),
});

export const schemaAccountMetadata = z.discriminatedUnion("type", [
    schemaAccountMetadataXPub,
    schemaAccountMetadataAddress,
]);

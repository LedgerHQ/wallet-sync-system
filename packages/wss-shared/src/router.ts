import { z } from "zod";
import { publicProcedure, router } from "./trpc";
import { MemoryDatabase } from "./MemoryDatabase";
import { schemaEncryptedClientData } from "./types/schemas";

const database = new MemoryDatabase();

export const appRouter = router({
  getEncryptedClientData: publicProcedure
    .input(
      z.object({
        fromUpdatedAt: z.number().nullable(),
        ownerId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const clientRecords = database.getClientDataRecordsForUser({
        ownerId: input.ownerId,
        fromUpdatedAt: input.fromUpdatedAt,
      });

      return {
        entries: clientRecords,
        total: clientRecords.length,
      };
    }),

  updateEncryptedClientData: publicProcedure
    .input(
      z.object({
        entries: z.array(schemaEncryptedClientData.omit({
          updatedAt: true,
          createdAt: true,
        })),
        clientTimeHint: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { clientTimeHint, entries } = input;

      database.updateData(entries, clientTimeHint);
    }),
});

export type AppRouter = typeof appRouter;

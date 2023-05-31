import {z} from "zod";
import {publicProcedure, router} from "./trpc";
import {MemoryDatabase} from "./MemoryDatabase";
import {schemaEncryptedClientData} from "./types/schemas";
import {DataType} from "./types/api";

const database = new MemoryDatabase();

export const appRouter = router({
  atomicGet: publicProcedure
    .input(
      z.object({
        datatypeId: z.nativeEnum(DataType),
        ownerId: z.string(),
        from: z.number().optional()
      })
    )
    .query(async ({input}) => {
      return database.atomicGet(
        input.datatypeId,
        input.ownerId,
        input.from,
      );
    }),

  atomicPost: publicProcedure
    .input(
      z.object({
        datatypeId: z.nativeEnum(DataType),
        ownerId: z.string(),
        version: z.number(),
        payload: z.string(),
        details: z.string().optional()
      })
    )
    .mutation(async ({input}) => {
      return database.atomicPost(
        input.datatypeId,
        input.ownerId,
        input.version,
        input.payload,
        input.details
      );
    }),
});

export type AppRouter = typeof appRouter;

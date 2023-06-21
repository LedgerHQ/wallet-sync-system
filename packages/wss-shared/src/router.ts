import { z } from "zod";
import { publicProcedure, router } from "./trpc";
import { MemoryDatabase } from "./MemoryDatabase";
import { DataType } from "./types/api";
import { logger } from "./logger";

const database = new MemoryDatabase();

export const appRouter = router({
  atomicGet: publicProcedure
    .input(
      z.object({
        datatypeId: z.nativeEnum(DataType),
        ownerId: z.string(),
        from: z.number().optional(),
      })
    )
    .query(({ input }) => {
      logger.info(
        `atomicGet from ${input.ownerId}. From ${
          input.from || "no version specified"
        }`
      );

      return database.atomicGet(input.datatypeId, input.ownerId, input.from);
    }),

  atomicPost: publicProcedure
    .input(
      z.object({
        datatypeId: z.nativeEnum(DataType),
        ownerId: z.string(),
        version: z.number(),
        payload: z.string(),
        details: z.string().optional(),
      })
    )
    .mutation(({ input }) => {
      logger.info(
        `atomicPost from ${input.ownerId}. Version: ${input.version}`
      );
      logger.silly(`${input.payload}`);

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

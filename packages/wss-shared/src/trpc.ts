import { initTRPC } from "@trpc/server";
import SuperJSON from "superjson";

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC.create({
  transformer: SuperJSON,
});

/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
export const { router } = t;
export const publicProcedure = t.procedure;

import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { appRouter } from "./router";

async function main() {
  const server = createHTTPServer({
    router: appRouter,
  });

  server.listen(3000);
}

main();

export type AppRouter = typeof appRouter;

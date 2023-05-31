import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { appRouter } from "@ledgerhq/wss-shared";

async function main() {
  const server = createHTTPServer({
    router: appRouter,
  });

  server.listen(3000);
}

main();

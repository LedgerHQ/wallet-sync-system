import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { appRouter } from "@ledgerhq/wss-shared";
import cors from "cors";

async function main() {
  const server = createHTTPServer({
    middleware: cors(),
    router: appRouter,
  });

  server.listen(3000);
}

main();

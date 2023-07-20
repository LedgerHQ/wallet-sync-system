import Koa from "koa";
import cors from "@koa/cors";
import KoaRouter from "koa-router";
import { koaBody } from "koa-body";

import { z } from "zod";
import { schemaDataType } from "@ledgerhq/wss-shared/src/types/api";
import { MemoryDatabase } from "./MemoryDatabase";
import { logger } from "./logger";

const app = new Koa();
const router = new KoaRouter();
const database = new MemoryDatabase();

const schemaAtomicGetQueryHeaders = z.object({
  "x-ledger-public-key": z.string(),
  "x-ledger-timestamp": z.string(),
  "x-ledger-client-version": z.string().optional(),
});

const schemaAtomicGetQueryParams = z.object({
  version: z
    .preprocess((val) => parseInt(z.string().parse(val), 10), z.number())
    .optional(),
});

router.get("/atomic/v1/:datatype", (ctx, next) => {
  const headers = schemaAtomicGetQueryHeaders.parse(ctx.request.headers);
  const params = schemaAtomicGetQueryParams.parse(ctx.request.query);
  const dataType = schemaDataType.parse(ctx.params.datatype);

  logger.info(
    `atomicGet from "${headers["x-ledger-public-key"]}" from ${
      params.version || "no version specified"
    }`
  );

  const record = database.atomicGet(
    dataType,
    headers["x-ledger-public-key"],
    params.version
  );

  ctx.body = record;

  return next();
});

const schemaAtomicPostQueryHeaders = z.object({
  "x-ledger-public-key": z.string(),
  "x-ledger-timestamp": z.string(),
  "x-ledger-signature": z.string(),
  "x-ledger-client-version": z.string().optional(),
});

const schemaAtomicPostQueryParams = z.object({
  version: z.preprocess(
    (val) => parseInt(z.string().parse(val), 10),
    z.number()
  ),
});

const schemaAtomicPostQueryBody = z.object({
  payload: z.string(),
});

router.post("/atomic/v1/:datatype", koaBody(), (ctx, next) => {
  console.log(ctx.request.body);
  // ctx.router available
  const headers = schemaAtomicPostQueryHeaders.parse(ctx.request.headers);
  const params = schemaAtomicPostQueryParams.parse(ctx.request.query);
  const body = schemaAtomicPostQueryBody.parse(ctx.request.body);
  const dataType = schemaDataType.parse(ctx.params.datatype);

  logger.info(
    `atomicPost from ${headers["x-ledger-public-key"]}. Version: ${params.version}`
  );
  logger.silly(`${body.payload}`);

  ctx.body = database.atomicPost(
    dataType,
    headers["x-ledger-public-key"],
    params.version,
    body.payload
  );

  return next();
});

app.use(cors());
app.use(router.routes());
app.use(router.allowedMethods());

function main() {
  app.listen(3000);
}

main();

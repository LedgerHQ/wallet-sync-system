import {
  CreateTRPCProxyClient,
  createTRPCProxyClient,
  httpBatchLink,
} from "@trpc/client";
import SuperJSON from "superjson";
import crypto from "crypto";

import type { AppRouter } from "@ledgerhq/wss-shared";
import { AccountMetadata } from "./dataTypes/Account/1.0.0/types";
import { v5 as uuidv5 } from "uuid";
import { UUIDV5_NAMESPACE } from "./constants";
import { DataType } from "@ledgerhq/wss-shared/src/types/api";
import { Observable, Subject } from "rxjs";
import { schemaWalletDecryptedData } from "./dataTypes/schemas";
import { WalletDecryptedData } from "./dataTypes/types";

type SaveDataParams = {
  accounts: AccountMetadata[];
};

type WalletSyncClientParams = {
  pollFrequencyMs: number;
  url: string;
  auth: Buffer;
};

export class WalletSyncClient {
  private _version: number | undefined = undefined;
  private _intervalHandle: NodeJS.Timer | null = null;
  private _params: WalletSyncClientParams;
  private _subject: Subject<WalletDecryptedData> = new Subject();
  private _trpc: CreateTRPCProxyClient<AppRouter>;
  private _userId: string;

  constructor(params: WalletSyncClientParams) {
    this._params = params;
    this._userId = uuidv5(params.auth, UUIDV5_NAMESPACE);
    this._trpc = createTRPCProxyClient<AppRouter>({
      transformer: SuperJSON,
      links: [
        httpBatchLink({
          url: params.url,
        }),
      ],
    });
  }

  observable(): Observable<WalletDecryptedData> {
    return this._subject;
  }

  private async _poll() {
    const response = await this._trpc.atomicGet.query({
      datatypeId: DataType.Accounts,
      ownerId: this._userId,
      from: this._version,
    });

    switch (response.status) {
      case "no-data":
        console.log("Server has no data");
        break;
      case "up-to-date":
        console.log("Up to date");
        break;
      case "out-of-sync":
        this._version = response.version;

        const rawPayload = Buffer.from(response.payload, "base64");
        const iv = rawPayload.slice(0, 16);
        const encryptedData = rawPayload.slice(16);

        const decipher = crypto.createDecipheriv(
          "aes-256-cbc",
          this._params.auth,
          iv
        );

        const decryptedData = Buffer.concat([
          decipher.update(encryptedData),
          decipher.final(),
        ]);

        const parsedData = JSON.parse(decryptedData.toString());

        console.log(
          "Server has an update: version",
          response.version,
          " updated at ",
          response.updatedAt,
          parsedData
        );
        const safeData = schemaWalletDecryptedData.parse(parsedData);

        this._subject.next(safeData);
        break;
    }
  }

  saveData(data: SaveDataParams) {
    const serializedData = Buffer.from(JSON.stringify(data), "utf8");

    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv("aes-256-cbc", this._params.auth, iv);
    const encryptedData = Buffer.concat([
      cipher.update(serializedData),
      cipher.final(),
    ]);

    const rawPayload = Buffer.concat([iv, encryptedData]);

    this._trpc.atomicPost.mutate({
      datatypeId: DataType.Accounts,
      ownerId: this._userId,
      version: (this._version ?? 0) + 1,
      details: "PoC/0.0.0",
      payload: rawPayload.toString("base64"),
    });
  }

  start() {
    if (this._intervalHandle !== null) {
      throw new Error("WalletSyncClient already started");
    }

    // starting the update loop
    this._intervalHandle = setInterval(
      this._poll.bind(this),
      this._params.pollFrequencyMs
    );

    // doing an initial poll
    this._poll();
  }

  stop() {
    if (this._intervalHandle === null) {
      throw new Error("WalletSyncClient not started");
    }

    // stopping the update loop
    clearInterval(this._intervalHandle);
    this._intervalHandle = null;
  }

  isStarted(): boolean {
    return this._intervalHandle !== null;
  }

  setVersion(version: number) {
    this._version = version;
  }
}

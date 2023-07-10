import {
  CreateTRPCProxyClient,
  createTRPCProxyClient,
  httpBatchLink,
} from "@trpc/client";
import SuperJSON from "superjson";
import crypto from "crypto";

import type { AppRouter } from "@ledgerhq/wss-shared";
import { DataType } from "@ledgerhq/wss-shared/src/types/api";
import { Observable, Subject } from "rxjs";
import { AccountMetadata } from "./dataTypes/Account/1.0.0/types";
import { IV_LENGTH } from "./constants";
import { schemaWalletDecryptedData } from "./dataTypes/schemas";
import { WalletDecryptedData } from "./dataTypes/types";
import { getUserIdForPrivateKey } from "./helpers";

type SaveDataParams = AccountMetadata[];

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
    this._userId = getUserIdForPrivateKey(params.auth);
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

    // eslint-disable-next-line default-case
    switch (response.status) {
      case "no-data": {
        // eslint-disable-next-line no-console
        console.log("Server has no data");
        break;
      }
      case "up-to-date": {
        // eslint-disable-next-line no-console
        console.log("Up to date");
        break;
      }
      case "out-of-sync": {
        this._version = response.version;

        const rawPayload = Buffer.from(response.payload, "base64");
        const iv = rawPayload.slice(0, IV_LENGTH);
        const encryptedData = rawPayload.slice(IV_LENGTH);

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
  }

  async saveData(data: SaveDataParams, dataType: DataType) {
    const serializedData = Buffer.from(JSON.stringify(data), "utf8");

    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv("aes-256-cbc", this._params.auth, iv);
    const encryptedData = Buffer.concat([
      cipher.update(serializedData),
      cipher.final(),
    ]);

    const rawPayload = Buffer.concat([iv, encryptedData]);

    return this._trpc.atomicPost.mutate({
      datatypeId: dataType,
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
    this._intervalHandle = setInterval(() => {
      void this._poll();
    }, this._params.pollFrequencyMs);

    // doing an initial poll
    void this._poll();
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

  get version() {
    return this._version;
  }
}

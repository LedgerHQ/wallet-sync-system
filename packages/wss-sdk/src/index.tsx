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
import { schemaAccountMetadata } from "./dataTypes/Account/1.0.0/schemas";
import { z } from "zod";
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

  private _iv = crypto.randomBytes(16);

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

        const decipher = crypto.createDecipheriv(
          "aes-256-cbc",
          this._params.auth,
          this._iv
        );

        let decryptedData = decipher.update(
          response.payload,
          "base64",
          "utf-8"
        );
        decryptedData += decipher.final("utf8");

        const parsedData = JSON.parse(decryptedData);

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
    const serializedData = JSON.stringify(data);

    const cipher = crypto.createCipheriv(
      "aes-256-cbc",
      this._params.auth,
      this._iv
    );
    let encryptedData = cipher.update(serializedData, "utf-8", "base64");
    encryptedData += cipher.final("base64");

    this._trpc.atomicPost.mutate({
      datatypeId: DataType.Accounts,
      ownerId: this._userId,
      version: (this._version ?? 0) + 1,
      details: "PoC/0.0.0",
      payload: encryptedData,
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

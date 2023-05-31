import {
  CreateTRPCProxyClient,
  createTRPCProxyClient,
  httpBatchLink,
} from "@trpc/client";
import SuperJSON from "superjson";
import crypto from "crypto";

import type {AppRouter} from "@ledgerhq/wss-shared";
import { AccountMetadata } from "./dataTypes/Account/1.0.0/types";
import {v5 as uuidv5} from "uuid";
import {UUIDV5_NAMESPACE} from "./constants";
import {DataType} from "@ledgerhq/wss-shared/src/types/api";

type SaveDataParams = {
  accounts: AccountMetadata[];
};

type Auth = {
  privateKey: Buffer;
  publicKey: Buffer;
};

type WalletSyncClientParams = {
  pollFrequencyMs: number;
  url: string;
  auth: Auth;
};

export class WalletSyncClient {
  private _version: number | null = null;
  private _intervalHandle: NodeJS.Timer | null = null;
  private _params: WalletSyncClientParams;

  private _trpc: CreateTRPCProxyClient<AppRouter>;

  constructor(params: WalletSyncClientParams) {
    this._params = params;
    this._trpc = createTRPCProxyClient<AppRouter>({
      transformer: SuperJSON,
      links: [
        httpBatchLink({
          url: params.url,
        }),
      ],
    });
  }

  private async _poll() {
    const ownerId = uuidv5(
      this._params.auth.publicKey.toString("base64"),
      UUIDV5_NAMESPACE
    );

    const response = await this._trpc.atomicGet.query({
      datatypeId: DataType.Accounts,
      ownerId,
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

        const privKey = crypto.createPrivateKey({
          key: this._params.auth.privateKey,
          format: "der",
          type: "pkcs8",
        });

        const decryptedData = crypto.privateDecrypt(
          privKey,
          Buffer.from(response.payload, "base64")
        );
        const parsedData = JSON.parse(decryptedData.toString());

        console.log("Server has an update", response.version, response.updatedAt, parsedData);

        break;
    }
  }

  saveData(data: SaveDataParams) {

    const ownerId = uuidv5(
      this._params.auth.publicKey.toString("base64"),
      UUIDV5_NAMESPACE
    );

    const pubKey = crypto.createPublicKey({
      key: this._params.auth.publicKey,
      format: "der",
      type: "spki",
    });

    const serializedData = JSON.stringify(data);

    const encryptedData = crypto.publicEncrypt(pubKey, Buffer.from(serializedData));

    this._trpc.atomicPost.mutate({
      datatypeId: DataType.Accounts,
      ownerId,
      version: (this._version ?? 0 ) + 1,
      details: "PoC/0.0.0",
      payload: encryptedData.toString("base64")
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

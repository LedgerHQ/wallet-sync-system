import {
  CreateTRPCProxyClient,
  createTRPCProxyClient,
  httpBatchLink,
} from "@trpc/client";
import SuperJSON from "superjson";
import crypto from "crypto";

import type { AppRouter } from "../../apps/server/src";
import { AccountMetadata } from "./dataTypes/Account/types";
import { getAccountId } from "./dataTypes/Account/logic";
import { ClientDataRecord } from "../../apps/server/src/MemoryDatabase";
import { v5 as uuidv5 } from "uuid";
import { UUIDV5_NAMESPACE } from "./constants";

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
  private _epoch: number | null = null;
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

    const response = await this._trpc.getEncryptedClientData.query({
      fromUpdatedAt: this._epoch,
      ownerId,
    });

    console.log(response);

    const { entries } = response;

    const mostRecentData = entries.reduce((acc, entry) => {
      return entry.updatedAt > acc ? entry.updatedAt : acc;
    }, 0);

    this._epoch = mostRecentData;
  }

  saveData(data: SaveDataParams) {
    const entries: Omit<ClientDataRecord, "updatedAt" | "createdAt">[] = [];

    const ownerId = uuidv5(
      this._params.auth.publicKey.toString("base64"),
      UUIDV5_NAMESPACE
    );

    const pubKey = crypto.createPublicKey({
      key: this._params.auth.publicKey,
      format: "der",
      type: "spki",
    });

    for (let i = 0; i < data.accounts.length; i++) {
      const account = data.accounts[i];

      const serializedData = JSON.stringify(account);

      const encryptedData = crypto.publicEncrypt(
        pubKey,
        Buffer.from(serializedData)
      );

      entries.push({
        id: getAccountId(account),
        ownerId,
        dataTypeId: 0,
        encryptedData: encryptedData.toString("base64"),
      });
    }

    this._trpc.updateEncryptedClientData.mutate({
      entries,
      clientTimeHint: Date.now(),
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

  setEpoch(epoch: number) {
    this._epoch = epoch;
  }
}

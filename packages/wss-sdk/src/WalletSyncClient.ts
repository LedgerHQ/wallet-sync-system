import crypto from "crypto";

import {
  schemaAtomicGetResponse,
  schemaAtomicPostResponse,
} from "@ledgerhq/wss-shared/src/types/api";
import { Observable, Subject } from "rxjs";
import axios, { Axios } from "axios";
import { AccountMetadata } from "./dataTypes/Account/1.0.0/types";
import { IV_LENGTH } from "./constants";
import { schemaWalletDecryptedData } from "./dataTypes/schemas";
import { WalletDecryptedData } from "./dataTypes/types";
import { getUserIdForPrivateKey } from "./helpers";

type SaveDataParams = AccountMetadata[];

type WalletSyncVersionManager = {
  onVersionUpdate: (version: number) => void;
  getVersion: () => number | undefined;
};

type WalletSyncClientParams = {
  pollFrequencyMs: number;
  url: string;
  auth: Buffer;
  clientInfo: string; // lld/1.0.0
};

export class WalletSyncClient {
  private _versionManager: WalletSyncVersionManager;

  private _intervalHandle: NodeJS.Timer | null = null;

  private _params: WalletSyncClientParams;

  private _subject: Subject<WalletDecryptedData> = new Subject();

  private _axios: Axios;

  private _userId: string;

  constructor(
    params: WalletSyncClientParams,
    versionManager: WalletSyncVersionManager
  ) {
    this._params = params;
    this._versionManager = versionManager;
    this._userId = getUserIdForPrivateKey(params.auth);
    this._axios = axios.create({
      baseURL: params.url,
      headers: {
        "X-Ledger-Public-Key": "aaaaaa00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001",
        "X-Ledger-Client-Version": params.clientInfo,
      },
    });
  }

  observable(): Observable<WalletDecryptedData> {
    return this._subject;
  }

  private async _poll() {
    const version = this._versionManager.getVersion();

    console.log("polling...");

    const rawResponse = await this._axios.get<unknown, unknown>(
      `/atomic/v1/accounts`,
      {
        params: {
          version
        },
        headers: {
          "X-Ledger-Timestamp": '2000-01-01T00:00:00.000000000+00:00',
          "X-Ledger-Signature": "0000000000000000000000000000000000000000000000000000000000000000",
        }
      }
    );

    // @ts-ignore
    const response = schemaAtomicGetResponse.parse(rawResponse.data);

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

        const parsedData: unknown = JSON.parse(decryptedData.toString());

        console.log(
          "Server has an update: version",
          response.version,
          " updated at ",
          response.date,
          parsedData
        );
        const safeData = schemaWalletDecryptedData.parse(parsedData);

        this._versionManager.onVersionUpdate(response.version);
        this._subject.next(safeData);
        break;
      }
    }
  }

  async saveData(data: SaveDataParams) {
    const version = this._versionManager.getVersion();

    const serializedData = Buffer.from(JSON.stringify(data), "utf8");

    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv("aes-256-cbc", this._params.auth, iv);
    const encryptedData = Buffer.concat([
      cipher.update(serializedData),
      cipher.final(),
    ]);

    const rawPayload = Buffer.concat([iv, encryptedData]);

    const newVersion = (version ?? 0) + 1;

    const rawResponse = await this._axios.post<unknown, unknown>(
      `/atomic/v1/accounts`,
      {
        payload: rawPayload.toString("base64"),
      },
      {
        params: {
          version: newVersion,
        },
        headers: {
          "X-Ledger-Timestamp": '2000-01-01T00:00:00.000000000+00:00',
          "X-Ledger-Signature": "0000000000000000000000000000000000000000000000000000000000000000",
        },
      }
    );

    // @ts-ignore
    const response = schemaAtomicPostResponse.parse(rawResponse.data);

    if (response.status === "updated") {
      this._versionManager.onVersionUpdate(response.version);
    }

    return response;
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
}

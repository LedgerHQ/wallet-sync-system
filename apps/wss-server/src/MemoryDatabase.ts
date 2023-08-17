import {
  DataType,
  AtomicGetResponse,
  AtomicPostResponse,
} from "@ledgerhq/wss-shared/src/types/api";

export type Record = {
  datatypeId: DataType;
  ownerId: string;
  version: number;
  payload: string;
  date: string;
};

export class MemoryDatabase {
  _atomicRecords: Map<string, Record> = new Map();

  atomicGet(
    datatypeId: DataType,
    ownerId: string,
    from: number | undefined
  ): AtomicGetResponse {
    const recordId = `${String(datatypeId)}-${ownerId}`;
    const record = this._atomicRecords.get(recordId);

    if (record === undefined) {
      return { status: "no-data" };
    }

    if (from === record.version) {
      return { status: "up-to-date" };
    }

    return { status: "out-of-sync", ...record };
  }

  atomicPost(
    datatypeId: DataType,
    ownerId: string,
    version: number,
    payload: string
  ): AtomicPostResponse {
    const recordId = `${String(datatypeId)}-${ownerId}`;
    const record = this._atomicRecords.get(recordId);

    if (record && version !== record.version + 1)
      return { status: "out-of-sync", ...record };

    const now = Date.now();

    this._atomicRecords.set(recordId, {
      datatypeId,
      ownerId,
      version,
      payload,
      date: now.toLocaleString(),
    });

    return { status: "updated", version };
  }
}

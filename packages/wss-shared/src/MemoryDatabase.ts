import {DataType, atomic} from "./types/api";

export type Record = {
  datatypeId: DataType;
  ownerId: string;
  version: number;
  payload: string;
  createdAt: number;
  updatedAt: number;
  details?: string;
}

export class MemoryDatabase {
  _atomicRecords: Map<{ datatypeId: DataType, ownerId: string }, Record> = new Map();

  constructor() {
  }

  atomicGet(
    datatypeId: DataType,
    ownerId: string,
    from: number | undefined
  ): atomic.get.Response {

    const record = this._atomicRecords.get({datatypeId, ownerId})

    if (record == undefined)
      return {status: "no-data"};

    if (from == record.version)
      return {status: "up-to-date"};

    return {status: "out-of-sync", ...record};
  }

  atomicPost(
    datatypeId: DataType,
    ownerId: string,
    version: number,
    payload: string,
    details: string | undefined
  ): atomic.post.Response {
    const record = this._atomicRecords.get({datatypeId, ownerId})

    if (record !== undefined && version != record.version + 1)
      return {status: "out-of-sync", ...record};

    const now = Date.now();

    this._atomicRecords.set({datatypeId, ownerId}, {
      datatypeId,
      ownerId,
      version,
      payload,
      createdAt: record?.createdAt ?? now,
      updatedAt: now,
      details
    });

    return {status: "updated"};
  }
}

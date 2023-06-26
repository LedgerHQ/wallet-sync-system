export enum DataType {
  Configuration = "configuration",
  Accounts = "accounts",
  Addresses = "addresses",
  TransactionTags = "transaction-tags",
}

// Atomic

// Get

export type AtomicGetNoData = { status: "no-data" };
export type AtomicGetUpToDate = { status: "up-to-date" };
export type AtomicGetOutOfSync = {
  status: "out-of-sync";
  version: number;
  payload: string;
  createdAt: number;
  updatedAt: number;
  info?: string;
};

export type AtomicGetResponse =
  | AtomicGetNoData
  | AtomicGetUpToDate
  | AtomicGetOutOfSync;

// Post

export type AtomicPostRequest = { payload: string };
export type AtomicPostUpdated = { status: "updated"; version: number };
export type AtomicPostOutOfSync = {
  status: "out-of-sync";
  version: number;
  payload: string;
  createdAt: number;
  updatedAt: number;
  info?: string;
};
export type AtomicPostResponse = AtomicPostUpdated | AtomicPostOutOfSync;

// Incremental

export type IncrementalUpdate = {
  version: number;
  payload: string;
  createdAt: number;
  updatedAt: number;
  info?: string;
};

// Get

export type IncrementalGetNoData = { status: "no-data" };
export type IncrementalGetUpToDate = { status: "up-to-date" };
export type IncrementalGetOutOfSync = {
  status: "out-of-sync";
  updates: IncrementalUpdate[];
};
export type IncrementalGetResponse =
  | IncrementalGetNoData
  | IncrementalGetUpToDate
  | IncrementalGetOutOfSync;

// Post

export type IncrementalPostRequest = { payload: string };
export type IncrementalPostUpdated = { status: "updated"; version: number };
export type IncrementalPostOutOfSync = {
  status: "out-of-sync";
  updates: IncrementalUpdate[];
};
export type IncrementalPostResponse =
  | IncrementalPostUpdated
  | IncrementalPostOutOfSync;

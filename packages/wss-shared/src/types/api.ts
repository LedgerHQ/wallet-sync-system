export enum DataType {
  Configuration = "configuration",
  Accounts = "accounts",
  Addresses = "addresses",
  TransactionTags = "transaction-tags",
}

export namespace atomic {
  export namespace get {
    export type NoData = { status: "no-data"; };
    export type UpToDate = { status: "up-to-date"; };
    export type OutOfSync = {
      status: "out-of-sync";
      version: number;
      payload: string;
      createdAt: number;
      updatedAt: number;
      info?: string;
    };
    export type Response = UpToDate | NoData | OutOfSync
  }
  export namespace post {
    export type Request = { payload: string; }
    export type Updated = { status: "updated"; };
    export type OutOfSync = {
      status: "out-of-sync";
      version: number;
      payload: string;
      createdAt: number;
      updatedAt: number;
      info?: string;
    };
    export type Response = Updated | OutOfSync
  }
}

export namespace incremental {
  export type Update = {
    version: number;
    payload: string;
    createdAt: number;
    updatedAt: number;
    info?: string;
  };
  export namespace get {
    export type NoData = { status: "no-data"; };
    export type UpToDate = { status: "up-to-date"; };
    export type OutOfSync = { status: "out-of-sync"; updates: Update[] };
    export type Response = UpToDate | NoData | OutOfSync
  }
  export namespace post {
    export type Request = { payload: string; }
    export type Updated = { status: "updated"; };
    export type OutOfSync = { status: "out-of-sync"; updates: Update[] };
    export type Response = Updated | OutOfSync
  }
}

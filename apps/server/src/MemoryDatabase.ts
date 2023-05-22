type JSONValue =
    | string
    | number
    | boolean
    | JSONObject
    | JSONArray;

interface JSONObject {
    [x: string]: JSONValue;
}

interface JSONArray extends Array<JSONValue> { }

export type DataType = {
    id: number;
    type: string;
    jsonSchema: JSONObject,
}

export type ClientDataRecord = {
    id: string;
    ownerId: string;
    dataTypeId: number;
    encryptedData: string;
    createdAt: number;
    updatedAt: number;
}

type GetNewDataRecordsQuery = {
  ownerId: string;
  fromUpdatedAt: number | null;
};

export class MemoryDatabase {
  _dataType: Map<number, DataType> = new Map();
  _clientDataRecordById: Map<string, ClientDataRecord> = new Map();
  constructor() {}

  getClientDataRecordsForUser(query: GetNewDataRecordsQuery): ClientDataRecord[] {
    const clientDataRecords = Array.from(this._clientDataRecordById, ([key, value]) => value);

    return clientDataRecords.filter(
      (clientDataRecord) => {
        if (query.fromUpdatedAt !== null) {
            return clientDataRecord.ownerId === query.ownerId && clientDataRecord.updatedAt > query.fromUpdatedAt;
        }
        return clientDataRecord.ownerId === query.ownerId;
      }
    );
  }

  updateData(entries: Omit<ClientDataRecord, "updatedAt" | "createdAt">[], timeHint?: number) {
    const now = Date.now();

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      const existingEntry = this._clientDataRecordById.get(entry.id);

      if (existingEntry) {
        if (!timeHint || timeHint > existingEntry.updatedAt) {
          this._clientDataRecordById.set(entry.id, {
            ...existingEntry,
            ...entry,
            updatedAt: now,
          });    
        } 
      } else {
        this._clientDataRecordById.set(entry.id, {
          createdAt: now,
          ...entry,
          updatedAt: now,
        });
  
      }
    }
  }
}

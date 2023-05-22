import { v5 as uuidv5 } from "uuid";
import { AccountMetadata } from "./types";
import { UUIDV5_NAMESPACE } from "../../constants";

export function getAccountId(accountMetadata: AccountMetadata) {
  const aggregatedId =
    accountMetadata.type === "address"
      ? `${accountMetadata.address}-${accountMetadata.derivationPath}-${accountMetadata.currencyId}`
      : `${accountMetadata.xPub}-${accountMetadata.derivationPath}-${accountMetadata.currencyId}-${accountMetadata.derivationMode}`;

  return uuidv5(aggregatedId, UUIDV5_NAMESPACE);
}

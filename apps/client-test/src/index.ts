import {WalletSyncClient} from "@ledgerhq/wss-sdk"
import 'isomorphic-fetch';
import * as crypto from "crypto";

function generateAuth(): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    resolve(crypto.randomBytes(32))
  })
}

async function main() {
  const auth = await generateAuth();
  console.log(auth);

  const client = new WalletSyncClient({
    url: "http://localhost:3000",
    pollFrequencyMs: 5000,
    auth,
  });

  client.setVersion(0);

  client.saveData({
    accounts: [
      {
        type: "address",
        currencyId: "ethereum",
        name: "Ethereum 1",
        address: "0x053A031856b23A823b71e032C92b1599Ac1cc3F2",
        seedId: "041d35ac3e26b1f11fba0dcc2c22ad8555878cd78a67339f5d183b77f29e0487f75dd64b1db0bb3af426196657662ffbb5caaeb9c843e0bdd997cf5969ff84a4bc",
        derivationPath: "44'/60'/0'/0/0",
        derivationMode: "default",
      },
      {
        type: "address",
        currencyId: "ethereum",
        name: "Ethereum 1",
        address: "0x053A031856b23A823b71e032C92b1599Ac1cc3F2",
        seedId: "041d35ac3e26b1f11fba0dcc2c22ad8555878cd78a67339f5d183b77f29e0487f75dd64b1db0bb3af426196657662ffbb5caaeb9c843e0bdd997cf5969ff84a4bc",
        derivationPath: "44'/60'/0'/0/0",
        derivationMode: "default",
      }
    ]
  })

  client.observable().subscribe((accountMetadata) => {
    console.log("new account metadata: ", accountMetadata);
  });

  /*
  example:
  client.subscribe((items) => {
    // get new accounts items.accounts
  })
  */

  client.start();

  // client.poll();
}

main();
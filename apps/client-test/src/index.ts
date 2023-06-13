import {WalletSyncClient} from "@ledgerhq/wss-sdk"
import 'isomorphic-fetch';
import * as crypto from "crypto";

function generateAuth(): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    resolve(crypto.randomBytes(32))
  })
}

async function main() {
  const auth = Buffer.from("UzLcjVdLnRmgxhsLS5SDDxP0jHUMUneHKYDEAy5oFw8=", "base64"); // await generateAuth();
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
        type: "xPub",
        currencyId: "bitcoin",
        name: "Bitcoin 1",
        xPub: "xpub6BuMJGcTwpMSqqwU4EZVASWw8qd42CsD9HtDHjEJNDYjChiBxzCE9kWHdziQjh1efz3khFCvLBEcKfYMNjB8Xc9vbKvE4p3MgbZFdicGihU",
        seedId: "04b3b8888ccc77642c07b6361027d2434bf487b38dab43cea16afd1b796d835db42ea6beceb3cec2f29a4177488b205e340bd00e3b78d7a6d89825900aae4dd9b3",
        derivationPath: "84'/0'/0'/0/0",
        derivationMode: "native_segwit",
      }
    ]
  })

  client.observable().subscribe((walletData) => {
    console.log("new wallet data: ", walletData);
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
import { WalletSyncClient } from "@ledgerhq/wss-sdk"
import { generateKeyPair } from "crypto";
import 'isomorphic-fetch';

type AsymetricKeys = {
  privateKey: Buffer,
  publicKey: Buffer
}

function generateAuth(): Promise<AsymetricKeys> {
  return new Promise((resolve, reject) => {
    generateKeyPair('rsa', {
      modulusLength: 4096,
      publicKeyEncoding: {
        type: 'spki',
        format: 'der',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'der',
      },
    }, (error, publicKey, privateKey) => {
      if (error) {
        reject(error);
        return;
      }
      resolve({
        publicKey,
        privateKey
      });
    });
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
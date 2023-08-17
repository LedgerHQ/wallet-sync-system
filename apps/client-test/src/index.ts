import { WalletSyncClient } from "@ledgerhq/wss-sdk";
import "isomorphic-fetch";

async function main() {
  const auth =
    "aaaaaa00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001"; // await generateAuth();

  let version: number | undefined;

  const client = new WalletSyncClient(
    {
      url: "http://localhost:3000",
      pollFrequencyMs: 5000,
      auth,
      clientInfo: "test/0.0.1",
    },
    {
      onVersionUpdate: (newVersion) => {
        version = newVersion;
      },
      getVersion: () => version,
    }
  );

  client.observable().subscribe((walletData) => {
    // eslint-disable-next-line no-console
    console.log("new wallet data: ", walletData);
  });

  const result = await client.saveData([
    {
      id: "js:1:ethereum:0x053A031856b23A823b71e032C92b1599Ac1cc3F2:",
      currencyId: "ethereum",
      name: "Ethereum 1",
      freshAddress: "0x053A031856b23A823b71e032C92b1599Ac1cc3F2",
      seedIdentifier:
        "041d35ac3e26b1f11fba0dcc2c22ad8555878cd78a67339f5d183b77f29e0487f75dd64b1db0bb3af426196657662ffbb5caaeb9c843e0bdd997cf5969ff84a4bc",
      derivationMode: "",
      index: 0,
      balance: "0",
    },
    {
      id: "js:2:bitcoin:xpub6D1KvVxAfT1obxiWidB8H7gjQsALwezt4i4CknRsQ7UhCytJw4ZChkrKrdLFjEmA89epjLN5sSeM916shcWbYmSA9cdYjkCx9BzeyJr5yC9:native_segwit",
      seedIdentifier:
        "xpub6D1KvVxAfT1obxiWidB8H7gjQsALwezt4i4CknRsQ7UhCytJw4ZChkrKrdLFjEmA89epjLN5sSeM916shcWbYmSA9cdYjkCx9BzeyJr5yC9",
      name: "Bitcoin native_segwit xpub6D1K...eyJr5yC9",
      derivationMode: "native_segwit",
      index: 0,
      freshAddress: "bc1qe348n4czfyd83jflnzk0eqtazh39wves2zy0x6",
      currencyId: "bitcoin",
      balance: "0",
    },
  ]);

  // eslint-disable-next-line no-console
  console.log("saved data:", result);

  // start polling
  client.start();
}

void main();

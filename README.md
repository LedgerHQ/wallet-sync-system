# Wallet Sync System

The Wallet Sync System is a revolutionary trustless client-server project that allows Ledger Live users to synchronize their personal data, including crypto accounts, across multiple platforms without revealing any sensitive information to the server host (Ledger). This project leverages the power of asymmetric cryptography, utilizing Ledger hardware wallets to generate the keys required to encrypt data for secure storage and retrieval on the server.

The initial targets of the Wallet Sync System are:

- Ledger Live Desktop
- Ledger Live Mobile
- Ledger Safari Extension

Although primarily designed for Ledger Live, the Wallet Sync System can theoretically work with any wallet.

This repository is a monorepo that houses the following packages:

### /apps/client-test
This is a minimal client implementation that utilizes the client SDK (Software Development Kit). It serves as an example of how to implement a client for the Wallet Sync System.

### /apps/server
This package contains a server with an in-memory database for testing purposes. It's designed to simulate the server environment without requiring a full server setup, making it ideal for development and testing.

### /packages/client-sdk
The Client SDK contains all the logic necessary for the Wallet Sync System to operate, including cryptography and synchronization functionality. This package forms the backbone of the client-side operations of the Wallet Sync System.

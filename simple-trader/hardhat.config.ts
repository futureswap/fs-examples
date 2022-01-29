import type { HardhatUserConfig } from "hardhat/types";

// Randomly generated wallet
const LOCALHOST_MNEMONIC =
  "lunch civil depend recall arch valley another then roof busy uniform hammer";

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  solidity: {
    compilers: [
      {
        version: "0.8.11",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          outputSelection: {
            "*": {
              "*": [
                "ast",
                "metadata",
                "evm.bytecode", // Enable the metadata and bytecode outputs of every single contract.
                "evm.bytecode.sourceMap", // Enable the source map output of every single contract.
              ],
            },
          },
        },
      },
    ],
  },
  networks: {
    hardhat: {
      accounts: {
        count: 200,
        mnemonic: LOCALHOST_MNEMONIC,
        accountsBalance: "10000000000000000000000000000",
      },
      // See more information in https://hardhat.org/hardhat-network/reference/#mining-modes
      mining: {
        // Auto-mining enabled means that hardhat automatically mines new transactions as they are
        // sent.
        auto: true,
        // With this configuration, hardhat will also mine new blocks every 5 seconds, regardless
        // of whether there is a transaction to execute.
        interval: 5000,
      },
      allowUnlimitedContractSize: true,
    },
    localhost: {
      url: "http://localhost:8545",
      chainId: 31337,
      accounts: {
        count: 200,
        mnemonic: LOCALHOST_MNEMONIC,
      },
      allowUnlimitedContractSize: true,
    },
  },
};

export default {
  ...config,
};

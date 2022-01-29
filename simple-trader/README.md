# Simple trader

An example of a contract that trades on a Futureswap exchange.

See https://docs.futureswap.com/protocol/trading/trading-flow and
https://docs.futureswap.com/protocol/developer/trade for additional details.

## Installation

Create an `.env` file with the following content:

```properties
JSON_RPC_PROVIDER=
MNEMONIC=
EXCHANGE=
SIMPLE_TRADER=
```

1. `JSON_RPC_PROVIDER` - a URL of your JSON-RPC provider, such as (Infura)[https://infura.io/], or
   (Alchemy)[https://www.alchemy.com/].

2. `MNEMONIC` - a mnemonic of wallet that contains some ETH and stable token.  It would be used to
   deploy the trading contract, and will initiate all the interactions with the trading contract.

   For Rinkeby, you can get test USDC as described here:
   https://docs.futureswap.com/protocol/developer/trade

3. `EXCHANGE` - an address of the exchange contract you want to interact with.  You can find
   addresses of deployed contracts here:
   https://docs.futureswap.com/protocol/developer/addresses-abis-and-links

   For Arbitrum Rinkeby, you can use `0xfcD6da3Ea74309905Baa5F3BAbDdE630FccCcBD1`.

4. `SIMPLE_TRADER` - if left unset, the script will deploy a new contract and will print it's
   address.  You can then put this address into the `.env` `SIMPLE_TRADER` field to reuse existing
   deployment on subsequent runs.

## Execution

Now you should be able to just run the example:

```bash
$ yarn install
$ yarn build
$ yarn start
```

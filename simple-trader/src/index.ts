import { Signer } from "@ethersproject/abstract-signer";
import { Contract } from "@ethersproject/contracts";
import { JsonRpcProvider, TransactionResponse } from "@ethersproject/providers";
import { formatEther, formatUnits, parseUnits } from "@ethersproject/units";
import { Wallet } from "@ethersproject/wallet";
import * as dotenv from "dotenv";
import {
  IERC20,
  IERC20__factory,
  IFutureswap,
  IFutureswap__factory,
  SimpleTrader,
  SimpleTrader__factory,
} from "../typechain-types";

const IERC20METADATA_ABI = [
  "function decimals() external view returns (uint8)",
];

const main = async () => {
  const config = getConfig();

  const provider = new JsonRpcProvider(config.providerEndpoint);
  const wallet = Wallet.fromMnemonic(config.mnemonic);
  const signer = wallet.connect(provider);

  const exchangeAddress = config.exchangeAddress;
  const exchange = IFutureswap__factory.connect(exchangeAddress, signer);

  const stableAddress = await exchange.stableToken();
  const stableToken = IERC20__factory.connect(stableAddress, signer);

  const assetAddress = await exchange.assetToken();
  const assetToken = IERC20__factory.connect(assetAddress, signer);

  await walletInfo(wallet, provider, stableToken);

  console.log(">>> Deployment");
  const trader = await deployTrader(
    signer,
    exchangeAddress,
    config.simpleTraderAddress
  );
  await showTraderInfo(provider, trader.address, stableToken);

  console.log(">>> Send stable to trader");
  await sendStableToTrader(provider, stableToken, trader, "500");
  await showTraderInfo(provider, trader.address, stableToken);

  console.log(">>> Approve Exchange");
  await approveExchange(provider, trader, stableToken, "10000");

  console.log(">>> Open long");
  await changePosition(
    provider,
    trader,
    stableToken,
    assetToken,
    "1",
    "500",
    "0"
  );
  await showTraderPosition(provider, exchange, trader, stableToken, assetToken);
  await showTraderInfo(provider, trader.address, stableToken);

  console.log(">>> Close position");
  await changePosition(
    provider,
    trader,
    stableToken,
    assetToken,
    "0",
    "0",
    "0"
  );
  await showTraderPosition(provider, exchange, trader, stableToken, assetToken);
  await showTraderInfo(provider, trader.address, stableToken);

  console.log(">>> Withdraw stable");
  await withdrawStable(trader, stableToken);
  await showTraderInfo(provider, trader.address, stableToken);
  await walletInfo(wallet, provider, stableToken);
};

const walletInfo = async (
  wallet: Wallet,
  provider: JsonRpcProvider,
  stableToken: IERC20
): Promise<void> => {
  const balance = await provider.getBalance(wallet.address);
  const stableBalance = await stableToken.balanceOf(wallet.address);

  const stableMeta = new Contract(
    stableToken.address,
    IERC20METADATA_ABI,
    provider
  );
  const stableDecimals = await stableMeta.decimals();

  console.log(`wallet: address: ${wallet.address}`);
  console.log(`        balance: ${formatEther(balance)} ETH`);
  console.log(
    `        stable balance: ${formatUnits(stableBalance, stableDecimals)}`
  );
};

const deployTrader = async (
  signer: Signer,
  exchangeAddress: string,
  existingAddress: string
): Promise<SimpleTrader> => {
  if (existingAddress !== "") {
    return SimpleTrader__factory.connect(existingAddress, signer);
  }

  const simpleTrader = await new SimpleTrader__factory(signer).deploy(
    exchangeAddress
  );
  await waitTransaction(
    simpleTrader.deployTransaction,
    "SimpleTrader deployment"
  );

  return simpleTrader;
};

const showTraderInfo = async (
  provider: JsonRpcProvider,
  traderAddress: string,
  stableToken: IERC20
): Promise<void> => {
  const balance = await provider.getBalance(traderAddress);
  const stableBalance = await stableToken.balanceOf(traderAddress);

  const stableMeta = new Contract(
    stableToken.address,
    IERC20METADATA_ABI,
    provider
  );
  const stableDecimals = await stableMeta.decimals();

  console.log(`trader: address: ${traderAddress}`);
  console.log(`        balance: ${formatEther(balance)} ETH`);
  console.log(
    `        stable balance: ${formatUnits(stableBalance, stableDecimals)}`
  );
};

const sendStableToTrader = async (
  provider: JsonRpcProvider,
  stableToken: IERC20,
  trader: SimpleTrader,
  amount: string
): Promise<void> => {
  const stableMeta = new Contract(
    stableToken.address,
    IERC20METADATA_ABI,
    provider
  );
  const stableDecimals = await stableMeta.decimals();

  const amountInToken = parseUnits(amount, stableDecimals);

  const tx = await stableToken.transfer(trader.address, amountInToken);
  await waitTransaction(tx, "Token transfer");
};

const approveExchange = async (
  provider: JsonRpcProvider,
  trader: SimpleTrader,
  stableToken: IERC20,
  amount: string
): Promise<void> => {
  const stableMeta = new Contract(
    stableToken.address,
    IERC20METADATA_ABI,
    provider
  );
  const stableDecimals = await stableMeta.decimals();

  const amountInToken = parseUnits(amount, stableDecimals);

  const tx = await trader.approveStable(amountInToken);
  await waitTransaction(tx, "trader.approveStable()");
};

const changePosition = async (
  provider: JsonRpcProvider,
  trader: SimpleTrader,
  stableToken: IERC20,
  assetToken: IERC20,
  deltaAsset: string,
  deltaStable: string,
  stableBound: string
): Promise<void> => {
  const stableMeta = new Contract(
    stableToken.address,
    IERC20METADATA_ABI,
    provider
  );
  const stableDecimals = await stableMeta.decimals();

  const assetMeta = new Contract(
    assetToken.address,
    IERC20METADATA_ABI,
    provider
  );
  const assetDecimals = await assetMeta.decimals();

  const deltaAssetInToken = parseUnits(deltaAsset, assetDecimals);
  const deltaStableInToken = parseUnits(deltaStable, stableDecimals);
  const stableBoundInToken = parseUnits(stableBound, stableDecimals);

  const tx = await trader.changePosition(
    deltaAssetInToken,
    deltaStableInToken,
    stableBoundInToken
  );
  await waitTransaction(tx, "trader.changePosition()");
};

const showTraderPosition = async (
  provider: JsonRpcProvider,
  exchange: IFutureswap,
  trader: SimpleTrader,
  stableToken: IERC20,
  assetToken: IERC20
): Promise<void> => {
  const [asset, stable, _trancheId, _shareClass] = await exchange.getPosition(
    trader.address
  );

  const stableMeta = new Contract(
    stableToken.address,
    IERC20METADATA_ABI,
    provider
  );
  const stableDecimals = await stableMeta.decimals();

  const assetMeta = new Contract(
    assetToken.address,
    IERC20METADATA_ABI,
    provider
  );
  const assetDecimals = await assetMeta.decimals();

  console.log(
    `trader position: stable: ${formatUnits(stable, stableDecimals)}`
  );
  console.log(`                 asset:  ${formatUnits(asset, assetDecimals)}`);
};

const withdrawStable = async (
  trader: SimpleTrader,
  stableToken: IERC20
): Promise<void> => {
  const stableBalance = await stableToken.balanceOf(trader.address);

  const tx = await trader.withdrawStable(stableBalance);
  await waitTransaction(tx, "trader.withdrawStable()");
};

const waitTransaction = async (
  tx: TransactionResponse,
  context?: string
): Promise<void> => {
  const response = tx;

  if (context != undefined) {
    console.log(`${context}: ${response.hash}`);
  } else {
    console.log(`Waiting for: ${response.hash}`);
  }
  const receipt = await response.wait();
  console.log(`  ... Cost: ${formatEther(receipt.effectiveGasPrice)} ETH`);
  console.log(`      Mined in block: ${receipt.blockNumber}`);
};

const getConfig = (): {
  providerEndpoint: string;
  mnemonic: string;
  exchangeAddress: string;
  simpleTraderAddress: string;
} => {
  dotenv.config();

  const getOrFail = (envName: string, allowEmpty: boolean): string => {
    const value = process.env[envName];
    if (value === undefined) {
      throw new Error(
        `Error: "${envName}" is required in the .env file or in the process environment.`
      );
    }

    if (!allowEmpty && value == "") {
      throw new Error(
        `Error: "${envName}", in the .env file, is empty, but a value is required.  See README.md`
      );
    }

    return value;
  };

  const providerEndpoint = getOrFail("JSON_RPC_PROVIDER", false);
  const mnemonic = getOrFail("MNEMONIC", false);
  const exchangeAddress = getOrFail("EXCHANGE", false);
  const simpleTraderAddress = getOrFail("SIMPLE_TRADER", true);

  return { providerEndpoint, mnemonic, exchangeAddress, simpleTraderAddress };
};

main();

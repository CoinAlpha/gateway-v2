import { BigNumber, providers, Wallet } from 'ethers';

// insert a string into another string at an index
const stringInsert = (str: string, val: string, index: number) => {
  if (index > 0) {
    return str.substring(0, index) + val + str.substr(index);
  }

  return val + str;
};

//
export const bigNumberWithDecimalToStr = (n: BigNumber, d: number): string => {
  const n_ = n.toString();

  let zeros = '';

  if (n_.length <= d) {
    zeros = '0'.repeat(d - n_.length + 1);
  }

  return stringInsert(n_.split('').reverse().join('') + zeros, '.', d)
    .split('')
    .reverse()
    .join('');
};

export interface Erc20Token {
  symbol: string;
  address: string;
  decimals: number;
}

export interface EthTransactionReceipt {
  gasUsed: number;
  blockNumber: number;
  confirmations: number;
  status: number;
  logs: Array<providers.Log>;
}

export abstract class EthereumBase {
  // get the ETH balance of an address as a string
  abstract getETHBalance(wallet: Wallet): Promise<string>;

  // get the ERC20 token balance of an address as a string
  abstract getERC20Balance(
    wallet: Wallet,
    tokenAddress: string,
    decimals: number
  ): Promise<string>;

  abstract getERC20Allowance(
    wallet: Wallet,
    spender: string,
    tokenAddress: string,
    decimals: number
  ): Promise<string>;

  abstract approveERC20(
    wallet: Wallet,
    spender: string,
    tokenAddress: string,
    amount: BigNumber,
    gasPrice: number
  ): Promise<string>;

  abstract getERC20TokenBySymbol(tokenSymbol: string): Erc20Token;

  abstract getERC20TokenByAddress(tokenAddress: string): Erc20Token;

  abstract getWalletByPrivateKey(privateKey: string): Wallet;

  abstract getTransactionReceipt(
    txHash: string
  ): Promise<EthTransactionReceipt>;
}

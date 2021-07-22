import { BigNumber, Contract, Wallet, providers } from 'ethers';

import abi from './ethereum.abi.json';
import axios from 'axios';
import {
  Erc20Token,
  EthereumBase,
  EthTransactionReceipt,
  bigNumberWithDecimalToStr,
} from '../../services/ethereum-base';

import { EthereumConfig } from './ethereum.config';

export interface Erc20TokenList {
  name: string;
  tokens: Erc20Token[];
}

export class Ethereum extends EthereumBase {
  private readonly provider;
  private erc20TokenList: Erc20TokenList | null = null;

  constructor(ethereumConfig: EthereumConfig) {
    super();
    this.provider = new providers.JsonRpcProvider(
      ethereumConfig.mainnet.rpcUrl
    );
    (async () => {
      const { data } = await axios.get(ethereumConfig.mainnet.tokenList);
      this.erc20TokenList = data;
    })();
  }

  async getETHBalance(wallet: Wallet): Promise<string> {
    try {
      const walletBalance = await wallet.getBalance();
      return bigNumberWithDecimalToStr(walletBalance, 18);
    } catch (err) {
      throw new Error(err.reason || 'error ETH balance lookup');
    }
  }

  async getERC20Balance(
    wallet: Wallet,
    tokenAddress: string,
    decimals = 18
  ): Promise<string> {
    // instantiate a contract and pass in provider for read-only access
    const contract = new Contract(tokenAddress, abi.ERC20Abi, this.provider);
    try {
      const balance = await contract.balanceOf(wallet.address);
      return bigNumberWithDecimalToStr(balance, decimals);
    } catch (err) {
      throw new Error(
        err.reason || `Error balance lookup for token address ${tokenAddress}`
      );
    }
  }

  async getERC20Allowance(
    wallet: Wallet,
    spender: string,
    tokenAddress: string,
    decimals = 18
  ): Promise<string> {
    // instantiate a contract and pass in provider for read-only access
    const contract = new Contract(tokenAddress, abi.ERC20Abi, this.provider);
    try {
      const allowance = await contract.allowance(wallet.address, spender);
      return bigNumberWithDecimalToStr(allowance, decimals);
    } catch (err) {
      throw new Error(err.reason || 'error allowance lookup');
    }
  }

  async approveERC20(
    wallet: Wallet,
    spender: string,
    tokenAddress: string,
    amount: BigNumber,
    gasPrice: number
  ): Promise<string> {
    try {
      // instantiate a contract and pass in wallet, which act on behalf of that signer
      const contract = new Contract(tokenAddress, abi.ERC20Abi, wallet);
      return await contract.approve(spender, amount, {
        gasPrice: gasPrice * 1e9,
        // fixate gas limit to prevent overwriting
        gasLimit: 100000,
      });
    } catch (err) {
      throw new Error(err.reason || 'error approval');
    }
  }

  getERC20TokenBySymbol(tokenSymbol: string): Erc20Token {
    if (this.erc20TokenList) {
      const symbol = tokenSymbol.toUpperCase();
      const tokenContractAddress = this.erc20TokenList.tokens.find((obj) => {
        return obj.symbol === symbol;
      });

      if (tokenContractAddress) {
        return tokenContractAddress;
      } else {
        throw new Error('getERC20TokenBySymbol error');
      }
    } else {
      throw new Error('getERC20TokenBySymbol error');
    }
  }

  getERC20TokenByAddress(tokenAddress: string): Erc20Token {
    if (this.erc20TokenList) {
      const tokenContract = this.erc20TokenList.tokens.filter((obj) => {
        return obj.address.toUpperCase() === tokenAddress.toUpperCase();
      });
      return tokenContract[0];
    } else {
      throw new Error('getERC20TokenByAddress error');
    }
  }

  getWalletByPrivateKey(privateKey: string): Wallet {
    return new Wallet(privateKey, this.provider);
  }

  async getTransactionReceipt(txHash: string): Promise<EthTransactionReceipt> {
    const transaction = await this.provider.getTransactionReceipt(txHash);

    let gasUsed;
    if (transaction.gasUsed) {
      gasUsed = transaction.gasUsed.toNumber();
    } else {
      gasUsed = 0;
    }

    return {
      gasUsed: gasUsed,
      blockNumber: transaction.blockNumber,
      confirmations: transaction.confirmations,
      status: transaction.status || 0,
      logs: transaction.logs,
    };
  }
}

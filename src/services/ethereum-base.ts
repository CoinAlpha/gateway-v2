import { BigNumber, Contract, providers, Wallet } from 'ethers';
import abi from './ethereum.abi.json';
import axios from 'axios';
import fs from 'fs';
import { TokenValue } from './base';

// the receipt from a transaction
export interface EthTransactionReceipt {
  gasUsed: number;
  blockNumber: number;
  confirmations: number;
  status: number;
  logs: Array<providers.Log>;
}

// information about an Ethereum token
export interface Token {
  chainID: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
}

// MKR does not match the ERC20 perfectly so we need to use a separate ABI.
const MKR_ADDRESS = '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2';

// the type of information source for tokens
type TokenListType = 'FILE' | 'URL';

export class EthereumBase {
  private readonly provider;
  private tokenList: Token[] = [];
  private tokenMap: Record<string, Token> = {};
  // there are async values set in the constructor
  private ready: boolean = false;

  public chainID;
  public rpcUrl;
  public gasPriceConstant;

  constructor(
    chainID: number,
    rpcUrl: string,
    tokenListSource: string,
    tokenListType: TokenListType,
    gasPriceConstant: number
  ) {
    this.provider = new providers.JsonRpcProvider(rpcUrl);
    this.chainID = chainID;
    this.rpcUrl = rpcUrl;
    this.gasPriceConstant = gasPriceConstant;
    (async () => {
      this.tokenList = await this.getTokenList(tokenListSource, tokenListType);
      this.tokenList.forEach((token) => {
        this.tokenMap[token.symbol] = token;
      });
      this.ready = true;
    })();
  }

  isReady(): boolean {
    return this.ready;
  }

  // returns a Tokens for a given list source and list type
  async getTokenList(
    tokenListSource: string,
    tokenListType: TokenListType
  ): Promise<Token[]> {
    if (tokenListType === 'URL') {
      const { data } = await axios.get(tokenListSource);
      return data;
    } else {
      return JSON.parse(fs.readFileSync(tokenListSource, 'utf8'));
    }
  }

  // return the Token object for a symbol
  getTokenForSymbol(symbol: string): Token | null {
    if (this.tokenMap[symbol]) {
      return this.tokenMap[symbol];
    }
    return null;
  }

  // returns the gas price
  getGasPrice(): number {
    return this.gasPriceConstant;
  }

  // returns Wallet for a private key
  getWallet(privateKey: string): Wallet {
    return new Wallet(privateKey, this.provider);
  }

  // returns the ETH balance, convert BigNumber to string
  async getEthBalance(wallet: Wallet): Promise<TokenValue> {
    try {
      const balance = await wallet.getBalance();
      return { value: balance, decimals: 18 };
    } catch (err) {
      throw new Error(err.reason || 'error ETH balance lookup');
    }
  }

  // returns the balance for an ERC-20 token
  async getERC20Balance(
    wallet: Wallet,
    tokenAddress: string,
    decimals: number
  ): Promise<TokenValue> {
    // instantiate a contract and pass in provider for read-only access
    let contract;
    if (tokenAddress === MKR_ADDRESS) {
      contract = new Contract(tokenAddress, abi.MKRAbi, this.provider);
    } else {
      contract = new Contract(tokenAddress, abi.ERC20Abi, this.provider);
    }
    try {
      const balance = await contract.balanceOf(wallet.address);
      return { value: balance, decimals: decimals };
    } catch (err) {
      throw new Error(
        err.reason || `Error balance lookup for token address ${tokenAddress}`
      );
    }
  }

  // returns the allowance for an ERC-20 token
  async getERC20Allowance(
    wallet: Wallet,
    spender: string,
    tokenAddress: string,
    decimals: number
  ): Promise<TokenValue> {
    // instantiate a contract and pass in provider for read-only access
    let contract;
    if (tokenAddress === MKR_ADDRESS) {
      contract = new Contract(tokenAddress, abi.MKRAbi, this.provider);
    } else {
      contract = new Contract(tokenAddress, abi.ERC20Abi, this.provider);
    }
    try {
      const allowance = await contract.allowance(wallet.address, spender);
      return { value: allowance, decimals: decimals };
    } catch (err) {
      throw new Error(err.reason || 'error allowance lookup');
    }
  }

  // returns TxReceipt for a txHash
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

  // adds allowance by spender to transfer the given amount of Token
  async approveERC20(
    wallet: Wallet,
    spender: string,
    tokenAddress: string,
    amount: BigNumber
  ): Promise<boolean> {
    try {
      // instantiate a contract and pass in wallet, which act on behalf of that signer
      let contract;
      if (tokenAddress === MKR_ADDRESS) {
        contract = new Contract(tokenAddress, abi.MKRAbi, wallet);
      } else {
        contract = new Contract(tokenAddress, abi.ERC20Abi, wallet);
      }

      return await contract.approve(spender, amount);
    } catch (err) {
      throw new Error(err.reason || 'error approval');
    }
  }
}

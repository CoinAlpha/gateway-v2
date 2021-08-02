import abi from '../../services/ethereum.abi.json';
import axios from 'axios';
import { BigNumber, Contract, Wallet } from 'ethers';
import { EthereumBase, Token } from '../../services/ethereum-base';
import { ConfigManager } from '../../services/config-manager';
import { EthereumConfig } from './ethereum.config';
import { TokenValue } from '../../services/base';

// MKR does not match the ERC20 perfectly so we need to use a separate ABI.
const MKR_ADDRESS = '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2';

// Balancer addresses
const BALANCER_MAINNET_ADDRESS = '0x3E66B66Fd1d0b02fDa6C811Da9E0547970DB2f21';
const BALANCER_KOVAN_ADDRESS = '0x4e67bf5bD28Dd4b570FBAFe11D0633eCbA2754Ec';

// Uniswap addresses
const UNISWAP_ROUTER_ADDRESS = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
const UNISWAP_V3_ROUTER_ADDRESS = '0xE592427A0AEce92De3Edee1F18E0157C05861564';
const UNISWAP_V3_NFT_MANAGER_ADDRESS =
  '0xC36442b4a4522E871399CD717aBDD847Ab11FE88';

export class Ethereum extends EthereumBase {
  private ethGasStationUrl: string;
  private gasPrice: number;
  private gasPriceLastUpdated: Date | null;
  private _approvedSpenders: string[];

  constructor() {
    let config, otherApprovedSpenders;
    if (ConfigManager.config.ETHEREUM_CHAIN === 'mainnet') {
      config = EthereumConfig.config.mainnet;
      otherApprovedSpenders = [BALANCER_MAINNET_ADDRESS];
    } else {
      config = EthereumConfig.config.kovan;
      otherApprovedSpenders = [BALANCER_KOVAN_ADDRESS];
    }

    super(
      config.chainId,
      config.rpcUrl + ConfigManager.config.INFURA_KEY,
      config.tokenListSource,
      config.tokenListType,
      ConfigManager.config.ETH_MANUAL_GAS_PRICE
    );

    this.ethGasStationUrl =
      'https://ethgasstation.info/api/ethgasAPI.json?api-key=' +
      ConfigManager.config.ETH_GAS_STATION_API_KEY;

    this.gasPrice = ConfigManager.config.ETH_MANUAL_GAS_PRICE;
    this.gasPriceLastUpdated = null;
    this._approvedSpenders = [
      UNISWAP_ROUTER_ADDRESS,
      UNISWAP_V3_ROUTER_ADDRESS,
      UNISWAP_V3_NFT_MANAGER_ADDRESS,
    ].concat(otherApprovedSpenders);

    this.updateGasPrice();
  }

  get approvedSpenders(): string[] {
    return this._approvedSpenders;
  }

  // ethereum token lists are large. instead of reloading each time with
  // getTokenList, we can read the stored tokenList value from when the
  // object was initiated.
  getStoredTokenList(): Token[] {
    return this.tokenList;
  }

  // If ConfigManager.config.ETH_GAS_STATION_ENABLE is true this will
  // continually update the gas price.
  async updateGasPrice(): Promise<void> {
    if (ConfigManager.config.ETH_GAS_STATION_ENABLE) {
      const { data } = await axios.get(this.ethGasStationUrl);

      // divide by 10 to convert it to Gwei
      this.gasPrice = data[ConfigManager.config.ETH_GAS_STATION_GAS_LEVEL] / 10;
      this.gasPriceLastUpdated = new Date();

      setTimeout(
        this.updateGasPrice.bind(this),
        ConfigManager.config.ETH_GAS_STATION_REFRESH_TIME * 1000
      );
    }
  }

  getGasPrice(): number {
    return this.gasPrice;
  }

  // returns null if the gasPrice is manually set
  getGasPriceLastDated(): Date | null {
    return this.gasPriceLastUpdated;
  }

  // override getERC20Balance definition to handle MKR edge case
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

  // override getERC20Allowance
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

  // override approveERC20
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

  getTokenBySymbol(tokenSymbol: string): Token | undefined {
    const symbol = tokenSymbol.toUpperCase();

    let tokenContractAddress = undefined;
    for (var i = 0; i < this.tokenList.length; i++) {
      const token: Token = this.tokenList[i];
      if (token.symbol === symbol) {
        tokenContractAddress = token;
        break;
      }
    }
    return tokenContractAddress;
  }
}

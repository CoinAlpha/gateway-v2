import axios from 'axios';
import { EthereumBase } from '../../services/ethereum-base';
import { ConfigManager } from '../../services/config-manager';
import { EthereumConfig } from './ethereum.config';

export class Ethereum extends EthereumBase {
  private ethGasStationUrl: string;
  private gasPrice: number;
  private gasPriceLastUpdated: Date | null;

  constructor() {
    let config;
    if (ConfigManager.config.ETHEREUM_CHAIN === 'mainnet') {
      config = EthereumConfig.config.mainnet;
    } else {
      config = EthereumConfig.config.kovan;
    }

    super(
      config.chainId,
      config.rpcUrl,
      config.tokenListSource,
      config.tokenListType,
      ConfigManager.config.ETH_MANUAL_GAS_PRICE
    );

    this.ethGasStationUrl =
      'https://ethgasstation.info/api/ethgasAPI.json?api-key=' +
      ConfigManager.config.ETH_GAS_STATION_API_KEY;

    this.gasPrice = ConfigManager.config.ETH_MANUAL_GAS_PRICE;
    this.gasPriceLastUpdated = null;

    this.updateGasPrice();
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
}

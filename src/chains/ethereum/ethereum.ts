import axios from 'axios';
import { EthereumBase } from '../../services/ethereum-base';
import { ConfigManager } from '../../services/config-manager';
import { EthereumConfig } from './ethereum.config';

// chainId
// rpcUrl
// tokenListType
// tokenListSource

export class Ethereum extends EthereumBase {
  private ethGasStationUrl;

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
      0
    );

    this.ethGasStationUrl =
      'https://ethgasstation.info/api/ethgasAPI.json?api-key=' +
      ConfigManager.config.ETH_GAS_STATION_API_KEY;
  }

  async getGasPrice(): Promise<number> {
    const { data } = await axios.get(this.ethGasStationUrl);

    // divide by 10 to convert it to Gwei
    const gasPrice = data[ConfigManager.config.ETH_GAS_STATION_GAS_LEVEL] / 10;
    return gasPrice;
  }
}

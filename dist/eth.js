"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProvider = void 0;
const ethers_1 = require("ethers");
const web3_1 = __importDefault(require("web3"));
function createProvider(ethNetworkUrl) {
    if (ethNetworkUrl.includes('infura')) {
        const networkPrefix = ethNetworkUrl.split('infura')[0];
        if (process && process.env) {
            const { INFURA_API_KEY } = process.env;
            if (!INFURA_API_KEY) {
                throw new Error('no infura key found!');
            }
            ethNetworkUrl = `${networkPrefix}infura.io/ws/v3/${INFURA_API_KEY}`;
        }
        else {
            throw new Error('must use nodejs to connect to infura provider!');
        }
    }
    const web3Provider = new web3_1.default.providers.WebsocketProvider(ethNetworkUrl, {
        reconnect: {
            auto: false,
        },
    });
    const provider = new ethers_1.providers.Web3Provider(web3Provider);
    // 12s minute polling interval (default is 4s)
    provider.pollingInterval = 12000;
    return provider;
}
exports.createProvider = createProvider;
//# sourceMappingURL=eth.js.map
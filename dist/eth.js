"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProvider = void 0;
const ethers_1 = require("ethers");
const web3_1 = __importDefault(require("web3"));
const logging_1 = __importDefault(require("./logging"));
const node_fetch_1 = __importDefault(require("node-fetch"));
function createProvider(ethNetworkUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        if (ethNetworkUrl.includes('infura')) {
            const networkPrefix = ethNetworkUrl.split('infura')[0];
            if (process && process.env) {
                const { INFURA_API_KEY } = process.env;
                if (!INFURA_API_KEY) {
                    throw new Error('no infura key found!');
                }
                ethNetworkUrl = `${networkPrefix}infura.io/ws/v3/${INFURA_API_KEY}`;
                let res, data;
                try {
                    res = yield node_fetch_1.default(`https://mainnet.infura.io/v3/${INFURA_API_KEY}`, {
                        method: 'POST',
                        body: JSON.stringify({
                            jsonrpc: '2.0',
                            method: 'eth_getBalance',
                            params: ['0xBf4eD7b27F1d666546E30D74d50d173d20bca754', 'latest'],
                            id: 1,
                        }),
                        headers: { 'Content-Type': 'application/json' },
                    });
                    data = yield res.json();
                    if (!data ||
                        !Object.keys(data).includes('jsonrpc') ||
                        !Object.keys(data).includes('id') ||
                        !Object.keys(data).includes('result'))
                        throw new Error('A connection to infura could not be established.');
                }
                catch (error) {
                    logging_1.default.error('Check your INFURA_API_KEY');
                    throw error;
                }
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
    });
}
exports.createProvider = createProvider;
//# sourceMappingURL=eth.js.map
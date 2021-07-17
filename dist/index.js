"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Erc20TokenUrls = exports.marlinContracts = exports.molochContracts = exports.networkSpecs = exports.networkUrls = exports.getRabbitMQConfig = exports.createListener = exports.Erc20Listener = exports.MarlinListener = exports.MolochListener = exports.SubstrateListener = exports.Erc20Types = exports.Erc20Events = exports.SubstrateTypes = exports.SubstrateEvents = exports.MarlinTypes = exports.MarlinEvents = exports.MolochTypes = exports.MolochEvents = void 0;
const clover_1 = require("./specs/clover");
const hydraDX_1 = require("./specs/hydraDX");
const kulupu_1 = require("./specs/kulupu");
const node_types_1 = require("@edgeware/node-types");
const stafi_1 = require("./specs/stafi");
const types_1 = require("./chains/substrate/types");
__exportStar(require("./interfaces"), exports);
exports.MolochEvents = __importStar(require("./chains/moloch/index"));
exports.MolochTypes = __importStar(require("./chains/moloch/types"));
exports.MarlinEvents = __importStar(require("./chains/marlin/index"));
exports.MarlinTypes = __importStar(require("./chains/marlin/types"));
exports.SubstrateEvents = __importStar(require("./chains/substrate/index"));
exports.SubstrateTypes = __importStar(require("./chains/substrate/types"));
exports.Erc20Events = __importStar(require("./chains/erc20/index"));
exports.Erc20Types = __importStar(require("./chains/erc20/types"));
exports.SubstrateListener = __importStar(require("./chains/substrate/Listener"));
exports.MolochListener = __importStar(require("./chains/moloch/Listener"));
exports.MarlinListener = __importStar(require("./chains/marlin/Listener"));
exports.Erc20Listener = __importStar(require("./chains/erc20/Listener"));
var util_1 = require("../src/util");
Object.defineProperty(exports, "createListener", { enumerable: true, get: function () { return util_1.createListener; } });
Object.defineProperty(exports, "getRabbitMQConfig", { enumerable: true, get: function () { return util_1.getRabbitMQConfig; } });
__exportStar(require("./handlers"), exports);
__exportStar(require("./rabbitmq/producer"), exports);
__exportStar(require("./Listener"), exports);
// defaults
exports.networkUrls = {
    clover: 'wss://api.clover.finance',
    hydradx: 'wss://rpc-01.snakenet.hydradx.io',
    edgeware: 'ws://mainnet1.edgewa.re:9944',
    'edgeware-local': 'ws://localhost:9944',
    'edgeware-testnet': 'wss://beresheet1.edgewa.re',
    kusama: 'wss://kusama-rpc.polkadot.io',
    polkadot: 'wss://rpc.polkadot.io',
    kulupu: 'ws://rpc.kulupu.corepaper.org/ws',
    stafi: 'wss://scan-rpc.stafi.io/ws',
    moloch: 'wss://mainnet.infura.io/ws',
    'moloch-local': 'ws://127.0.0.1:9545',
    marlin: 'wss://mainnet.infura.io/ws',
    'marlin-local': 'ws://127.0.0.1:9545',
};
exports.networkSpecs = {
    clover: clover_1.CloverSpec,
    hydradx: hydraDX_1.HydraDXSpec,
    kulupu: kulupu_1.KulupuSpec,
    edgeware: node_types_1.spec,
    'edgeware-local': node_types_1.spec,
    'edgeware-testnet': node_types_1.spec,
    stafi: stafi_1.StafiSpec,
};
exports.molochContracts = {
    moloch: '0x1fd169A4f5c59ACf79d0Fd5d91D1201EF1Bce9f1',
    'moloch-local': '0x9561C133DD8580860B6b7E504bC5Aa500f0f06a7',
};
exports.marlinContracts = {
    comp: '0xEa2923b099b4B588FdFAD47201d747e3b9599A5f',
    governorAlpha: '0xeDAA76873524f6A203De2Fa792AD97E459Fca6Ff',
    timelock: '0x7d89D52c464051FcCbe35918cf966e2135a17c43', // TESTNET
};
exports.Erc20TokenUrls = [
    'https://wispy-bird-88a7.uniswap.workers.dev/?url=http://tokenlist.aave.eth.link',
    'https://gateway.ipfs.io/ipns/tokens.uniswap.org',
    'https://wispy-bird-88a7.uniswap.workers.dev/?url=http://defi.cmc.eth.link',
];
const excludedEvents = [
    types_1.EventKind.Reward,
    types_1.EventKind.TreasuryRewardMinting,
    types_1.EventKind.TreasuryRewardMintingV2,
    types_1.EventKind.HeartbeatReceived,
];
//# sourceMappingURL=index.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloverSpec = void 0;
exports.CloverSpec = {
    types: {
        Amount: 'i128',
        Keys: 'SessionKeys4',
        AmountOf: 'Amount',
        Balance: 'u128',
        Rate: 'FixedU128',
        Ratio: 'FixedU128',
        EcdsaSignature: '[u8; 65]',
        EvmAddress: 'H160',
        EthereumTxHash: 'H256',
        BridgeNetworks: {
            _enum: ['BSC', 'Ethereum'],
        },
        AccountInfo: 'AccountInfoWithDualRefCount',
    },
};
//# sourceMappingURL=clover.js.map
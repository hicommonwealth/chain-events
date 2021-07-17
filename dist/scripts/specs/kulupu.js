"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KulupuSpec = void 0;
exports.KulupuSpec = {
    typesBundle: {
        spec: {
            kulupu: {
                types: [
                    {
                        // on all versions
                        minmax: [0, undefined],
                        types: {
                            CurvePoint: {
                                start: 'BlockNumber',
                                reward: 'Balance',
                                taxation: 'Perbill',
                            },
                            Difficulty: 'U256',
                            DifficultyAndTimestamp: {
                                difficulty: 'Difficulty',
                                timestamp: 'Moment',
                            },
                            Era: {
                                genesisBlockHash: 'H256',
                                finalBlockHash: 'H256',
                                finalStateRoot: 'H256',
                            },
                        },
                    },
                    {
                        // swap to MultiAddress in runtime 13
                        minmax: [13, undefined],
                        types: {
                            Address: 'MultiAddress',
                            LookupSource: 'MultiAddress',
                        },
                    },
                    {
                        // enable pallet-lockdrop in runtime 17
                        minmax: [17, undefined],
                        types: {
                            CampaignIdentifier: '[u8; 4]',
                        },
                    },
                ],
            },
        },
    },
};
//# sourceMappingURL=kulupu.js.map
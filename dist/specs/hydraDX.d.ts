export declare const HydraDXSpec: {
    types: {
        Fee: {
            numerator: string;
            denominator: string;
        };
        Chain: {
            genesisHash: string;
            lastBlockHash: string;
        };
        Price: string;
        Amount: string;
        Address: string;
        AmountOf: string;
        AssetPair: {
            asset_in: string;
            asset_out: string;
        };
        Intention: {
            who: string;
            amount: string;
            discount: string;
            asset_buy: string;
            asset_sell: string;
            sell_or_buy: string;
        };
        CurrencyId: string;
        OrderedSet: string;
        BalanceInfo: {
            amount: string;
            assetId: string;
        };
        IntentionId: string;
        CurrencyIdOf: string;
        LookupSource: string;
        IntentionType: {
            _enum: string[];
        };
        OrmlAccountData: {
            free: string;
            frozen: string;
            reserved: string;
        };
    };
};

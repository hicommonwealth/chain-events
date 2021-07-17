export declare const HydraDXSpec: {
    types: {
        Amount: string;
        AmountOf: string;
        Address: string;
        BalanceInfo: {
            amount: string;
            assetId: string;
        };
        CurrencyId: string;
        CurrencyIdOf: string;
        Intention: {
            who: string;
            asset_sell: string;
            asset_buy: string;
            amount: string;
            discount: string;
            sell_or_buy: string;
        };
        IntentionId: string;
        IntentionType: {
            _enum: string[];
        };
        LookupSource: string;
        Price: string;
        Chain: {
            genesisHash: string;
            lastBlockHash: string;
        };
    };
};

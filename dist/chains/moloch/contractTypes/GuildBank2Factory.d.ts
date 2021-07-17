import { ContractFactory, Signer } from 'ethers';
import { Provider } from 'ethers/providers';
import { UnsignedTransaction } from 'ethers/utils/transaction';
import { TransactionOverrides } from './index';
import { GuildBank2 } from './GuildBank2';
export declare class GuildBank2Factory extends ContractFactory {
    constructor(signer?: Signer);
    deploy(overrides?: TransactionOverrides): Promise<GuildBank2>;
    getDeployTransaction(overrides?: TransactionOverrides): UnsignedTransaction;
    attach(address: string): GuildBank2;
    connect(signer: Signer): GuildBank2Factory;
    static connect(address: string, signerOrProvider: Signer | Provider): GuildBank2;
}

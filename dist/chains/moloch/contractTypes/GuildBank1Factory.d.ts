import { ContractFactory, Signer } from 'ethers';
import { Provider } from 'ethers/providers';
import { UnsignedTransaction } from 'ethers/utils/transaction';
import { TransactionOverrides } from './index';
import { GuildBank1 } from './GuildBank1';
export declare class GuildBank1Factory extends ContractFactory {
    constructor(signer?: Signer);
    deploy(approvedTokenAddress: string, overrides?: TransactionOverrides): Promise<GuildBank1>;
    getDeployTransaction(approvedTokenAddress: string, overrides?: TransactionOverrides): UnsignedTransaction;
    attach(address: string): GuildBank1;
    connect(signer: Signer): GuildBank1Factory;
    static connect(address: string, signerOrProvider: Signer | Provider): GuildBank1;
}

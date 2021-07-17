import { ContractFactory, Signer } from 'ethers';
import { Provider } from 'ethers/providers';
import { UnsignedTransaction } from 'ethers/utils/transaction';
import { TransactionOverrides } from './index';
import { Erc721 } from './Erc721';
export declare class Erc721Factory extends ContractFactory {
    constructor(signer?: Signer);
    deploy(overrides?: TransactionOverrides): Promise<Erc721>;
    getDeployTransaction(overrides?: TransactionOverrides): UnsignedTransaction;
    attach(address: string): Erc721;
    connect(signer: Signer): Erc721Factory;
    static connect(address: string, signerOrProvider: Signer | Provider): Erc721;
}

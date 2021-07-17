import { ContractFactory, Signer } from 'ethers';
import { Provider } from 'ethers/providers';
import { UnsignedTransaction } from 'ethers/utils/transaction';
import { TransactionOverrides } from './index';
import { Erc777 } from './Erc777';
export declare class Erc777Factory extends ContractFactory {
    constructor(signer?: Signer);
    deploy(name: string, symbol: string, defaultOperators: string[], overrides?: TransactionOverrides): Promise<Erc777>;
    getDeployTransaction(name: string, symbol: string, defaultOperators: string[], overrides?: TransactionOverrides): UnsignedTransaction;
    attach(address: string): Erc777;
    connect(signer: Signer): Erc777Factory;
    static connect(address: string, signerOrProvider: Signer | Provider): Erc777;
}

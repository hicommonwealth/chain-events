import { ContractFactory, Signer } from 'ethers';
import { Provider } from 'ethers/providers';
import { UnsignedTransaction } from 'ethers/utils/transaction';
import { TransactionOverrides } from './index';
import { Erc20 } from './Erc20';
export declare class Erc20Factory extends ContractFactory {
    constructor(signer?: Signer);
    deploy(overrides?: TransactionOverrides): Promise<Erc20>;
    getDeployTransaction(overrides?: TransactionOverrides): UnsignedTransaction;
    attach(address: string): Erc20;
    connect(signer: Signer): Erc20Factory;
    static connect(address: string, signerOrProvider: Signer | Provider): Erc20;
}

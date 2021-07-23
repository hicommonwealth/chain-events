import { ContractFactory, Signer } from 'ethers';
import { Provider } from 'ethers/providers';
import { UnsignedTransaction } from 'ethers/utils/transaction';
import { TransactionOverrides } from './index';
import { MPond } from './MPond';
export declare class MPondFactory extends ContractFactory {
    constructor(signer?: Signer);
    deploy(account: string, bridge: string, overrides?: TransactionOverrides): Promise<MPond>;
    getDeployTransaction(account: string, bridge: string, overrides?: TransactionOverrides): UnsignedTransaction;
    attach(address: string): MPond;
    connect(signer: Signer): MPondFactory;
    static connect(address: string, signerOrProvider: Signer | Provider): MPond;
}

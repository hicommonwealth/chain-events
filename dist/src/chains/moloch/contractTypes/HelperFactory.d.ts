import { ContractFactory, Signer } from 'ethers';
import { Provider } from 'ethers/providers';
import { UnsignedTransaction } from 'ethers/utils/transaction';
import { TransactionOverrides } from './index';
import { Helper } from './Helper';
export declare class HelperFactory extends ContractFactory {
    constructor(signer?: Signer);
    deploy(overrides?: TransactionOverrides): Promise<Helper>;
    getDeployTransaction(overrides?: TransactionOverrides): UnsignedTransaction;
    attach(address: string): Helper;
    connect(signer: Signer): HelperFactory;
    static connect(address: string, signerOrProvider: Signer | Provider): Helper;
}

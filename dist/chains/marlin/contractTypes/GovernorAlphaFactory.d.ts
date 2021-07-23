import { ContractFactory, Signer } from 'ethers';
import { Provider } from 'ethers/providers';
import { UnsignedTransaction } from 'ethers/utils/transaction';
import { TransactionOverrides } from './index';
import { GovernorAlpha } from './GovernorAlpha';
export declare class GovernorAlphaFactory extends ContractFactory {
    constructor(signer?: Signer);
    deploy(timelock_: string, MPond_: string, guardian_: string, overrides?: TransactionOverrides): Promise<GovernorAlpha>;
    getDeployTransaction(timelock_: string, MPond_: string, guardian_: string, overrides?: TransactionOverrides): UnsignedTransaction;
    attach(address: string): GovernorAlpha;
    connect(signer: Signer): GovernorAlphaFactory;
    static connect(address: string, signerOrProvider: Signer | Provider): GovernorAlpha;
}

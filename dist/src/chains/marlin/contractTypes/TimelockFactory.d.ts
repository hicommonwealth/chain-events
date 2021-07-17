import { ContractFactory, Signer } from 'ethers';
import { Provider } from 'ethers/providers';
import { UnsignedTransaction } from 'ethers/utils/transaction';
import { BigNumberish } from 'ethers/utils';
import { TransactionOverrides } from './index';
import { Timelock } from './Timelock';
export declare class TimelockFactory extends ContractFactory {
    constructor(signer?: Signer);
    deploy(admin_: string, delay_: BigNumberish, overrides?: TransactionOverrides): Promise<Timelock>;
    getDeployTransaction(admin_: string, delay_: BigNumberish, overrides?: TransactionOverrides): UnsignedTransaction;
    attach(address: string): Timelock;
    connect(signer: Signer): TimelockFactory;
    static connect(address: string, signerOrProvider: Signer | Provider): Timelock;
}

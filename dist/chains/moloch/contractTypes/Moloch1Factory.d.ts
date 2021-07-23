import { ContractFactory, Signer } from 'ethers';
import { Provider } from 'ethers/providers';
import { UnsignedTransaction } from 'ethers/utils/transaction';
import { BigNumberish } from 'ethers/utils';
import { TransactionOverrides } from './index';
import { Moloch1 } from './Moloch1';
export declare class Moloch1Factory extends ContractFactory {
    constructor(signer?: Signer);
    deploy(summoner: string, _approvedToken: string, _periodDuration: BigNumberish, _votingPeriodLength: BigNumberish, _gracePeriodLength: BigNumberish, _abortWindow: BigNumberish, _proposalDeposit: BigNumberish, _dilutionBound: BigNumberish, _processingReward: BigNumberish, overrides?: TransactionOverrides): Promise<Moloch1>;
    getDeployTransaction(summoner: string, _approvedToken: string, _periodDuration: BigNumberish, _votingPeriodLength: BigNumberish, _gracePeriodLength: BigNumberish, _abortWindow: BigNumberish, _proposalDeposit: BigNumberish, _dilutionBound: BigNumberish, _processingReward: BigNumberish, overrides?: TransactionOverrides): UnsignedTransaction;
    attach(address: string): Moloch1;
    connect(signer: Signer): Moloch1Factory;
    static connect(address: string, signerOrProvider: Signer | Provider): Moloch1;
}

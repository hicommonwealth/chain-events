import { ContractFactory, Signer } from 'ethers';
import { Provider } from 'ethers/providers';
import { UnsignedTransaction } from 'ethers/utils/transaction';
import { BigNumberish } from 'ethers/utils';
import { TransactionOverrides } from './index';
import { Moloch2 } from './Moloch2';
export declare class Moloch2Factory extends ContractFactory {
    constructor(signer?: Signer);
    deploy(summoner: string, _approvedTokens: string[], _periodDuration: BigNumberish, _votingPeriodLength: BigNumberish, _gracePeriodLength: BigNumberish, _emergencyExitWait: BigNumberish, _proposalDeposit: BigNumberish, _dilutionBound: BigNumberish, _processingReward: BigNumberish, overrides?: TransactionOverrides): Promise<Moloch2>;
    getDeployTransaction(summoner: string, _approvedTokens: string[], _periodDuration: BigNumberish, _votingPeriodLength: BigNumberish, _gracePeriodLength: BigNumberish, _emergencyExitWait: BigNumberish, _proposalDeposit: BigNumberish, _dilutionBound: BigNumberish, _processingReward: BigNumberish, overrides?: TransactionOverrides): UnsignedTransaction;
    attach(address: string): Moloch2;
    connect(signer: Signer): Moloch2Factory;
    static connect(address: string, signerOrProvider: Signer | Provider): Moloch2;
}

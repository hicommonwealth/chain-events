import { ContractFactory, Signer } from 'ethers';
import { Provider } from 'ethers/providers';
import { UnsignedTransaction } from 'ethers/utils/transaction';
import { BigNumberish } from 'ethers/utils';
import { TransactionOverrides } from './index';
import { Token } from './Token';
export declare class TokenFactory extends ContractFactory {
    constructor(signer?: Signer);
    deploy(supply: BigNumberish, overrides?: TransactionOverrides): Promise<Token>;
    getDeployTransaction(supply: BigNumberish, overrides?: TransactionOverrides): UnsignedTransaction;
    attach(address: string): Token;
    connect(signer: Signer): TokenFactory;
    static connect(address: string, signerOrProvider: Signer | Provider): Token;
}

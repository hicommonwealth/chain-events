/* Generated by ts-generator ver. 0.0.8 */
/* tslint:disable */

import { Contract, ContractTransaction, EventFilter, Signer } from "ethers";
import { Listener, Provider } from "ethers/providers";
import { Arrayish, BigNumber, BigNumberish, Interface } from "ethers/utils";
import {
  TransactionOverrides,
  TypedEventDescription,
  TypedFunctionDescription
} from ".";

interface CompInterfaceInterface extends Interface {
  functions: {
    getPriorVotes: TypedFunctionDescription<{
      encode([account, blockNumber]: [string, BigNumberish]): string;
    }>;
  };

  events: {};
}

export class CompInterface extends Contract {
  connect(signerOrProvider: Signer | Provider | string): CompInterface;
  attach(addressOrName: string): CompInterface;
  deployed(): Promise<CompInterface>;

  on(event: EventFilter | string, listener: Listener): CompInterface;
  once(event: EventFilter | string, listener: Listener): CompInterface;
  addListener(
    eventName: EventFilter | string,
    listener: Listener
  ): CompInterface;
  removeAllListeners(eventName: EventFilter | string): CompInterface;
  removeListener(eventName: any, listener: Listener): CompInterface;

  interface: CompInterfaceInterface;

  functions: {
    getPriorVotes(
      account: string,
      blockNumber: BigNumberish
    ): Promise<BigNumber>;
  };

  getPriorVotes(account: string, blockNumber: BigNumberish): Promise<BigNumber>;

  filters: {};

  estimate: {
    getPriorVotes(
      account: string,
      blockNumber: BigNumberish
    ): Promise<BigNumber>;
  };
}

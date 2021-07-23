/* Generated by ts-generator ver. 0.0.8 */
/* tslint:disable */

import { Contract, ContractTransaction, EventFilter, Signer } from 'ethers';
import { Listener, Provider } from 'ethers/providers';
import { Arrayish, BigNumber, BigNumberish, Interface } from 'ethers/utils';
import {
  TransactionOverrides,
  TypedEventDescription,
  TypedFunctionDescription,
} from './index';

interface TimelockInterfaceInterface extends Interface {
  functions: {
    delay: TypedFunctionDescription<{ encode([]: []): string }>;

    GRACE_PERIOD: TypedFunctionDescription<{ encode([]: []): string }>;

    acceptAdmin: TypedFunctionDescription<{ encode([]: []): string }>;

    queuedTransactions: TypedFunctionDescription<{
      encode([hash]: [Arrayish]): string;
    }>;

    queueTransaction: TypedFunctionDescription<{
      encode([target, value, signature, data, eta]: [
        string,
        BigNumberish,
        string,
        Arrayish,
        BigNumberish
      ]): string;
    }>;

    cancelTransaction: TypedFunctionDescription<{
      encode([target, value, signature, data, eta]: [
        string,
        BigNumberish,
        string,
        Arrayish,
        BigNumberish
      ]): string;
    }>;

    executeTransaction: TypedFunctionDescription<{
      encode([target, value, signature, data, eta]: [
        string,
        BigNumberish,
        string,
        Arrayish,
        BigNumberish
      ]): string;
    }>;
  };

  events: {};
}

export class TimelockInterface extends Contract {
  connect(signerOrProvider: Signer | Provider | string): TimelockInterface;
  attach(addressOrName: string): TimelockInterface;
  deployed(): Promise<TimelockInterface>;

  on(event: EventFilter | string, listener: Listener): TimelockInterface;
  once(event: EventFilter | string, listener: Listener): TimelockInterface;
  addListener(
    eventName: EventFilter | string,
    listener: Listener
  ): TimelockInterface;
  removeAllListeners(eventName: EventFilter | string): TimelockInterface;
  removeListener(eventName: any, listener: Listener): TimelockInterface;

  interface: TimelockInterfaceInterface;

  functions: {
    delay(): Promise<BigNumber>;

    GRACE_PERIOD(): Promise<BigNumber>;

    acceptAdmin(overrides?: TransactionOverrides): Promise<ContractTransaction>;

    queuedTransactions(hash: Arrayish): Promise<boolean>;

    queueTransaction(
      target: string,
      value: BigNumberish,
      signature: string,
      data: Arrayish,
      eta: BigNumberish,
      overrides?: TransactionOverrides
    ): Promise<ContractTransaction>;

    cancelTransaction(
      target: string,
      value: BigNumberish,
      signature: string,
      data: Arrayish,
      eta: BigNumberish,
      overrides?: TransactionOverrides
    ): Promise<ContractTransaction>;

    executeTransaction(
      target: string,
      value: BigNumberish,
      signature: string,
      data: Arrayish,
      eta: BigNumberish,
      overrides?: TransactionOverrides
    ): Promise<ContractTransaction>;
  };

  delay(): Promise<BigNumber>;

  GRACE_PERIOD(): Promise<BigNumber>;

  acceptAdmin(overrides?: TransactionOverrides): Promise<ContractTransaction>;

  queuedTransactions(hash: Arrayish): Promise<boolean>;

  queueTransaction(
    target: string,
    value: BigNumberish,
    signature: string,
    data: Arrayish,
    eta: BigNumberish,
    overrides?: TransactionOverrides
  ): Promise<ContractTransaction>;

  cancelTransaction(
    target: string,
    value: BigNumberish,
    signature: string,
    data: Arrayish,
    eta: BigNumberish,
    overrides?: TransactionOverrides
  ): Promise<ContractTransaction>;

  executeTransaction(
    target: string,
    value: BigNumberish,
    signature: string,
    data: Arrayish,
    eta: BigNumberish,
    overrides?: TransactionOverrides
  ): Promise<ContractTransaction>;

  filters: {};

  estimate: {
    delay(): Promise<BigNumber>;

    GRACE_PERIOD(): Promise<BigNumber>;

    acceptAdmin(): Promise<BigNumber>;

    queuedTransactions(hash: Arrayish): Promise<BigNumber>;

    queueTransaction(
      target: string,
      value: BigNumberish,
      signature: string,
      data: Arrayish,
      eta: BigNumberish
    ): Promise<BigNumber>;

    cancelTransaction(
      target: string,
      value: BigNumberish,
      signature: string,
      data: Arrayish,
      eta: BigNumberish
    ): Promise<BigNumber>;

    executeTransaction(
      target: string,
      value: BigNumberish,
      signature: string,
      data: Arrayish,
      eta: BigNumberish
    ): Promise<BigNumber>;
  };
}

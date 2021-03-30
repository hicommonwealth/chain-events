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

interface GuildBank2Interface extends Interface {
  functions: {
    isOwner: TypedFunctionDescription<{ encode([]: []): string }>;

    owner: TypedFunctionDescription<{ encode([]: []): string }>;

    renounceOwnership: TypedFunctionDescription<{ encode([]: []): string }>;

    transferOwnership: TypedFunctionDescription<{
      encode([newOwner]: [string]): string;
    }>;

    withdraw: TypedFunctionDescription<{
      encode([receiver, shares, totalShares, _approvedTokens]: [
        string,
        BigNumberish,
        BigNumberish,
        string[]
      ]): string;
    }>;

    withdrawToken: TypedFunctionDescription<{
      encode([token, receiver, amount]: [string, string, BigNumberish]): string;
    }>;
  };

  events: {
    OwnershipTransferred: TypedEventDescription<{
      encodeTopics([previousOwner, newOwner]: [
        string | null,
        string | null
      ]): string[];
    }>;

    Withdrawal: TypedEventDescription<{
      encodeTopics([receiver, tokenAddress, amount]: [
        string | null,
        string | null,
        null
      ]): string[];
    }>;
  };
}

export class GuildBank2 extends Contract {
  connect(signerOrProvider: Signer | Provider | string): GuildBank2;
  attach(addressOrName: string): GuildBank2;
  deployed(): Promise<GuildBank2>;

  on(event: EventFilter | string, listener: Listener): GuildBank2;
  once(event: EventFilter | string, listener: Listener): GuildBank2;
  addListener(eventName: EventFilter | string, listener: Listener): GuildBank2;
  removeAllListeners(eventName: EventFilter | string): GuildBank2;
  removeListener(eventName: any, listener: Listener): GuildBank2;

  interface: GuildBank2Interface;

  functions: {
    /**
     * Returns true if the caller is the current owner.
     */
    isOwner(overrides?: TransactionOverrides): Promise<boolean>;

    /**
     * Returns true if the caller is the current owner.
     */
    "isOwner()"(overrides?: TransactionOverrides): Promise<boolean>;

    /**
     * Returns the address of the current owner.
     */
    owner(overrides?: TransactionOverrides): Promise<string>;

    /**
     * Returns the address of the current owner.
     */
    "owner()"(overrides?: TransactionOverrides): Promise<string>;

    /**
     * Leaves the contract without owner. It will not be possible to call `onlyOwner` functions anymore. Can only be called by the current owner.     * NOTE: Renouncing ownership will leave the contract without an owner, thereby removing any functionality that is only available to the owner.
     */
    renounceOwnership(
      overrides?: TransactionOverrides
    ): Promise<ContractTransaction>;

    /**
     * Leaves the contract without owner. It will not be possible to call `onlyOwner` functions anymore. Can only be called by the current owner.     * NOTE: Renouncing ownership will leave the contract without an owner, thereby removing any functionality that is only available to the owner.
     */
    "renounceOwnership()"(
      overrides?: TransactionOverrides
    ): Promise<ContractTransaction>;

    /**
     * Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.
     */
    transferOwnership(
      newOwner: string,
      overrides?: TransactionOverrides
    ): Promise<ContractTransaction>;

    /**
     * Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.
     */
    "transferOwnership(address)"(
      newOwner: string,
      overrides?: TransactionOverrides
    ): Promise<ContractTransaction>;

    withdraw(
      receiver: string,
      shares: BigNumberish,
      totalShares: BigNumberish,
      _approvedTokens: string[],
      overrides?: TransactionOverrides
    ): Promise<ContractTransaction>;

    "withdraw(address,uint256,uint256,address[])"(
      receiver: string,
      shares: BigNumberish,
      totalShares: BigNumberish,
      _approvedTokens: string[],
      overrides?: TransactionOverrides
    ): Promise<ContractTransaction>;

    withdrawToken(
      token: string,
      receiver: string,
      amount: BigNumberish,
      overrides?: TransactionOverrides
    ): Promise<ContractTransaction>;

    "withdrawToken(address,address,uint256)"(
      token: string,
      receiver: string,
      amount: BigNumberish,
      overrides?: TransactionOverrides
    ): Promise<ContractTransaction>;
  };

  /**
   * Returns true if the caller is the current owner.
   */
  isOwner(overrides?: TransactionOverrides): Promise<boolean>;

  /**
   * Returns true if the caller is the current owner.
   */
  "isOwner()"(overrides?: TransactionOverrides): Promise<boolean>;

  /**
   * Returns the address of the current owner.
   */
  owner(overrides?: TransactionOverrides): Promise<string>;

  /**
   * Returns the address of the current owner.
   */
  "owner()"(overrides?: TransactionOverrides): Promise<string>;

  /**
   * Leaves the contract without owner. It will not be possible to call `onlyOwner` functions anymore. Can only be called by the current owner.     * NOTE: Renouncing ownership will leave the contract without an owner, thereby removing any functionality that is only available to the owner.
   */
  renounceOwnership(
    overrides?: TransactionOverrides
  ): Promise<ContractTransaction>;

  /**
   * Leaves the contract without owner. It will not be possible to call `onlyOwner` functions anymore. Can only be called by the current owner.     * NOTE: Renouncing ownership will leave the contract without an owner, thereby removing any functionality that is only available to the owner.
   */
  "renounceOwnership()"(
    overrides?: TransactionOverrides
  ): Promise<ContractTransaction>;

  /**
   * Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.
   */
  transferOwnership(
    newOwner: string,
    overrides?: TransactionOverrides
  ): Promise<ContractTransaction>;

  /**
   * Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.
   */
  "transferOwnership(address)"(
    newOwner: string,
    overrides?: TransactionOverrides
  ): Promise<ContractTransaction>;

  withdraw(
    receiver: string,
    shares: BigNumberish,
    totalShares: BigNumberish,
    _approvedTokens: string[],
    overrides?: TransactionOverrides
  ): Promise<ContractTransaction>;

  "withdraw(address,uint256,uint256,address[])"(
    receiver: string,
    shares: BigNumberish,
    totalShares: BigNumberish,
    _approvedTokens: string[],
    overrides?: TransactionOverrides
  ): Promise<ContractTransaction>;

  withdrawToken(
    token: string,
    receiver: string,
    amount: BigNumberish,
    overrides?: TransactionOverrides
  ): Promise<ContractTransaction>;

  "withdrawToken(address,address,uint256)"(
    token: string,
    receiver: string,
    amount: BigNumberish,
    overrides?: TransactionOverrides
  ): Promise<ContractTransaction>;

  filters: {
    OwnershipTransferred(
      previousOwner: string | null,
      newOwner: string | null
    ): EventFilter;

    Withdrawal(
      receiver: string | null,
      tokenAddress: string | null,
      amount: null
    ): EventFilter;
  };

  estimate: {
    /**
     * Returns true if the caller is the current owner.
     */
    isOwner(overrides?: TransactionOverrides): Promise<BigNumber>;

    /**
     * Returns true if the caller is the current owner.
     */
    "isOwner()"(overrides?: TransactionOverrides): Promise<BigNumber>;

    /**
     * Returns the address of the current owner.
     */
    owner(overrides?: TransactionOverrides): Promise<BigNumber>;

    /**
     * Returns the address of the current owner.
     */
    "owner()"(overrides?: TransactionOverrides): Promise<BigNumber>;

    /**
     * Leaves the contract without owner. It will not be possible to call `onlyOwner` functions anymore. Can only be called by the current owner.     * NOTE: Renouncing ownership will leave the contract without an owner, thereby removing any functionality that is only available to the owner.
     */
    renounceOwnership(overrides?: TransactionOverrides): Promise<BigNumber>;

    /**
     * Leaves the contract without owner. It will not be possible to call `onlyOwner` functions anymore. Can only be called by the current owner.     * NOTE: Renouncing ownership will leave the contract without an owner, thereby removing any functionality that is only available to the owner.
     */
    "renounceOwnership()"(overrides?: TransactionOverrides): Promise<BigNumber>;

    /**
     * Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.
     */
    transferOwnership(
      newOwner: string,
      overrides?: TransactionOverrides
    ): Promise<BigNumber>;

    /**
     * Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.
     */
    "transferOwnership(address)"(
      newOwner: string,
      overrides?: TransactionOverrides
    ): Promise<BigNumber>;

    withdraw(
      receiver: string,
      shares: BigNumberish,
      totalShares: BigNumberish,
      _approvedTokens: string[],
      overrides?: TransactionOverrides
    ): Promise<BigNumber>;

    "withdraw(address,uint256,uint256,address[])"(
      receiver: string,
      shares: BigNumberish,
      totalShares: BigNumberish,
      _approvedTokens: string[],
      overrides?: TransactionOverrides
    ): Promise<BigNumber>;

    withdrawToken(
      token: string,
      receiver: string,
      amount: BigNumberish,
      overrides?: TransactionOverrides
    ): Promise<BigNumber>;

    "withdrawToken(address,address,uint256)"(
      token: string,
      receiver: string,
      amount: BigNumberish,
      overrides?: TransactionOverrides
    ): Promise<BigNumber>;
  };
}

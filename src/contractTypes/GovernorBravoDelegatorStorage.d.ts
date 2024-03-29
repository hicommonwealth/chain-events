/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import {
  ethers,
  EventFilter,
  Signer,
  BigNumber,
  BigNumberish,
  PopulatedTransaction,
  Contract,
  ContractTransaction,
  CallOverrides,
} from "ethers";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";
import { TypedEventFilter, TypedEvent, TypedListener } from "./commons";

interface GovernorBravoDelegatorStorageInterface
  extends ethers.utils.Interface {
  functions: {
    "admin()": FunctionFragment;
    "implementation()": FunctionFragment;
    "pendingAdmin()": FunctionFragment;
  };

  encodeFunctionData(functionFragment: "admin", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "implementation",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "pendingAdmin",
    values?: undefined
  ): string;

  decodeFunctionResult(functionFragment: "admin", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "implementation",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "pendingAdmin",
    data: BytesLike
  ): Result;

  events: {};
}

export class GovernorBravoDelegatorStorage extends Contract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  listeners<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter?: TypedEventFilter<EventArgsArray, EventArgsObject>
  ): Array<TypedListener<EventArgsArray, EventArgsObject>>;
  off<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  on<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  once<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  removeListener<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  removeAllListeners<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>
  ): this;

  listeners(eventName?: string): Array<Listener>;
  off(eventName: string, listener: Listener): this;
  on(eventName: string, listener: Listener): this;
  once(eventName: string, listener: Listener): this;
  removeListener(eventName: string, listener: Listener): this;
  removeAllListeners(eventName?: string): this;

  queryFilter<EventArgsArray extends Array<any>, EventArgsObject>(
    event: TypedEventFilter<EventArgsArray, EventArgsObject>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEvent<EventArgsArray & EventArgsObject>>>;

  interface: GovernorBravoDelegatorStorageInterface;

  functions: {
    admin(overrides?: CallOverrides): Promise<[string]>;

    "admin()"(overrides?: CallOverrides): Promise<[string]>;

    implementation(overrides?: CallOverrides): Promise<[string]>;

    "implementation()"(overrides?: CallOverrides): Promise<[string]>;

    pendingAdmin(overrides?: CallOverrides): Promise<[string]>;

    "pendingAdmin()"(overrides?: CallOverrides): Promise<[string]>;
  };

  admin(overrides?: CallOverrides): Promise<string>;

  "admin()"(overrides?: CallOverrides): Promise<string>;

  implementation(overrides?: CallOverrides): Promise<string>;

  "implementation()"(overrides?: CallOverrides): Promise<string>;

  pendingAdmin(overrides?: CallOverrides): Promise<string>;

  "pendingAdmin()"(overrides?: CallOverrides): Promise<string>;

  callStatic: {
    admin(overrides?: CallOverrides): Promise<string>;

    "admin()"(overrides?: CallOverrides): Promise<string>;

    implementation(overrides?: CallOverrides): Promise<string>;

    "implementation()"(overrides?: CallOverrides): Promise<string>;

    pendingAdmin(overrides?: CallOverrides): Promise<string>;

    "pendingAdmin()"(overrides?: CallOverrides): Promise<string>;
  };

  filters: {};

  estimateGas: {
    admin(overrides?: CallOverrides): Promise<BigNumber>;

    "admin()"(overrides?: CallOverrides): Promise<BigNumber>;

    implementation(overrides?: CallOverrides): Promise<BigNumber>;

    "implementation()"(overrides?: CallOverrides): Promise<BigNumber>;

    pendingAdmin(overrides?: CallOverrides): Promise<BigNumber>;

    "pendingAdmin()"(overrides?: CallOverrides): Promise<BigNumber>;
  };

  populateTransaction: {
    admin(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "admin()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    implementation(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "implementation()"(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    pendingAdmin(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "pendingAdmin()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;
  };
}

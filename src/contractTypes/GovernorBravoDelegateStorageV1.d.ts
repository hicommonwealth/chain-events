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

interface GovernorBravoDelegateStorageV1Interface
  extends ethers.utils.Interface {
  functions: {
    "admin()": FunctionFragment;
    "comp()": FunctionFragment;
    "implementation()": FunctionFragment;
    "initialProposalId()": FunctionFragment;
    "latestProposalIds(address)": FunctionFragment;
    "pendingAdmin()": FunctionFragment;
    "proposalCount()": FunctionFragment;
    "proposalThreshold()": FunctionFragment;
    "proposals(uint256)": FunctionFragment;
    "timelock()": FunctionFragment;
    "votingDelay()": FunctionFragment;
    "votingPeriod()": FunctionFragment;
  };

  encodeFunctionData(functionFragment: "admin", values?: undefined): string;
  encodeFunctionData(functionFragment: "comp", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "implementation",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "initialProposalId",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "latestProposalIds",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "pendingAdmin",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "proposalCount",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "proposalThreshold",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "proposals",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(functionFragment: "timelock", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "votingDelay",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "votingPeriod",
    values?: undefined
  ): string;

  decodeFunctionResult(functionFragment: "admin", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "comp", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "implementation",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "initialProposalId",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "latestProposalIds",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "pendingAdmin",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "proposalCount",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "proposalThreshold",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "proposals", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "timelock", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "votingDelay",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "votingPeriod",
    data: BytesLike
  ): Result;

  events: {};
}

export class GovernorBravoDelegateStorageV1 extends Contract {
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

  interface: GovernorBravoDelegateStorageV1Interface;

  functions: {
    admin(overrides?: CallOverrides): Promise<[string]>;

    "admin()"(overrides?: CallOverrides): Promise<[string]>;

    comp(overrides?: CallOverrides): Promise<[string]>;

    "comp()"(overrides?: CallOverrides): Promise<[string]>;

    implementation(overrides?: CallOverrides): Promise<[string]>;

    "implementation()"(overrides?: CallOverrides): Promise<[string]>;

    initialProposalId(overrides?: CallOverrides): Promise<[BigNumber]>;

    "initialProposalId()"(overrides?: CallOverrides): Promise<[BigNumber]>;

    latestProposalIds(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    "latestProposalIds(address)"(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    pendingAdmin(overrides?: CallOverrides): Promise<[string]>;

    "pendingAdmin()"(overrides?: CallOverrides): Promise<[string]>;

    proposalCount(overrides?: CallOverrides): Promise<[BigNumber]>;

    "proposalCount()"(overrides?: CallOverrides): Promise<[BigNumber]>;

    proposalThreshold(overrides?: CallOverrides): Promise<[BigNumber]>;

    "proposalThreshold()"(overrides?: CallOverrides): Promise<[BigNumber]>;

    proposals(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<
      [
        BigNumber,
        string,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        boolean,
        boolean
      ] & {
        id: BigNumber;
        proposer: string;
        eta: BigNumber;
        startBlock: BigNumber;
        endBlock: BigNumber;
        forVotes: BigNumber;
        againstVotes: BigNumber;
        abstainVotes: BigNumber;
        canceled: boolean;
        executed: boolean;
      }
    >;

    "proposals(uint256)"(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<
      [
        BigNumber,
        string,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        boolean,
        boolean
      ] & {
        id: BigNumber;
        proposer: string;
        eta: BigNumber;
        startBlock: BigNumber;
        endBlock: BigNumber;
        forVotes: BigNumber;
        againstVotes: BigNumber;
        abstainVotes: BigNumber;
        canceled: boolean;
        executed: boolean;
      }
    >;

    timelock(overrides?: CallOverrides): Promise<[string]>;

    "timelock()"(overrides?: CallOverrides): Promise<[string]>;

    votingDelay(overrides?: CallOverrides): Promise<[BigNumber]>;

    "votingDelay()"(overrides?: CallOverrides): Promise<[BigNumber]>;

    votingPeriod(overrides?: CallOverrides): Promise<[BigNumber]>;

    "votingPeriod()"(overrides?: CallOverrides): Promise<[BigNumber]>;
  };

  admin(overrides?: CallOverrides): Promise<string>;

  "admin()"(overrides?: CallOverrides): Promise<string>;

  comp(overrides?: CallOverrides): Promise<string>;

  "comp()"(overrides?: CallOverrides): Promise<string>;

  implementation(overrides?: CallOverrides): Promise<string>;

  "implementation()"(overrides?: CallOverrides): Promise<string>;

  initialProposalId(overrides?: CallOverrides): Promise<BigNumber>;

  "initialProposalId()"(overrides?: CallOverrides): Promise<BigNumber>;

  latestProposalIds(
    arg0: string,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  "latestProposalIds(address)"(
    arg0: string,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  pendingAdmin(overrides?: CallOverrides): Promise<string>;

  "pendingAdmin()"(overrides?: CallOverrides): Promise<string>;

  proposalCount(overrides?: CallOverrides): Promise<BigNumber>;

  "proposalCount()"(overrides?: CallOverrides): Promise<BigNumber>;

  proposalThreshold(overrides?: CallOverrides): Promise<BigNumber>;

  "proposalThreshold()"(overrides?: CallOverrides): Promise<BigNumber>;

  proposals(
    arg0: BigNumberish,
    overrides?: CallOverrides
  ): Promise<
    [
      BigNumber,
      string,
      BigNumber,
      BigNumber,
      BigNumber,
      BigNumber,
      BigNumber,
      BigNumber,
      boolean,
      boolean
    ] & {
      id: BigNumber;
      proposer: string;
      eta: BigNumber;
      startBlock: BigNumber;
      endBlock: BigNumber;
      forVotes: BigNumber;
      againstVotes: BigNumber;
      abstainVotes: BigNumber;
      canceled: boolean;
      executed: boolean;
    }
  >;

  "proposals(uint256)"(
    arg0: BigNumberish,
    overrides?: CallOverrides
  ): Promise<
    [
      BigNumber,
      string,
      BigNumber,
      BigNumber,
      BigNumber,
      BigNumber,
      BigNumber,
      BigNumber,
      boolean,
      boolean
    ] & {
      id: BigNumber;
      proposer: string;
      eta: BigNumber;
      startBlock: BigNumber;
      endBlock: BigNumber;
      forVotes: BigNumber;
      againstVotes: BigNumber;
      abstainVotes: BigNumber;
      canceled: boolean;
      executed: boolean;
    }
  >;

  timelock(overrides?: CallOverrides): Promise<string>;

  "timelock()"(overrides?: CallOverrides): Promise<string>;

  votingDelay(overrides?: CallOverrides): Promise<BigNumber>;

  "votingDelay()"(overrides?: CallOverrides): Promise<BigNumber>;

  votingPeriod(overrides?: CallOverrides): Promise<BigNumber>;

  "votingPeriod()"(overrides?: CallOverrides): Promise<BigNumber>;

  callStatic: {
    admin(overrides?: CallOverrides): Promise<string>;

    "admin()"(overrides?: CallOverrides): Promise<string>;

    comp(overrides?: CallOverrides): Promise<string>;

    "comp()"(overrides?: CallOverrides): Promise<string>;

    implementation(overrides?: CallOverrides): Promise<string>;

    "implementation()"(overrides?: CallOverrides): Promise<string>;

    initialProposalId(overrides?: CallOverrides): Promise<BigNumber>;

    "initialProposalId()"(overrides?: CallOverrides): Promise<BigNumber>;

    latestProposalIds(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "latestProposalIds(address)"(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    pendingAdmin(overrides?: CallOverrides): Promise<string>;

    "pendingAdmin()"(overrides?: CallOverrides): Promise<string>;

    proposalCount(overrides?: CallOverrides): Promise<BigNumber>;

    "proposalCount()"(overrides?: CallOverrides): Promise<BigNumber>;

    proposalThreshold(overrides?: CallOverrides): Promise<BigNumber>;

    "proposalThreshold()"(overrides?: CallOverrides): Promise<BigNumber>;

    proposals(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<
      [
        BigNumber,
        string,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        boolean,
        boolean
      ] & {
        id: BigNumber;
        proposer: string;
        eta: BigNumber;
        startBlock: BigNumber;
        endBlock: BigNumber;
        forVotes: BigNumber;
        againstVotes: BigNumber;
        abstainVotes: BigNumber;
        canceled: boolean;
        executed: boolean;
      }
    >;

    "proposals(uint256)"(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<
      [
        BigNumber,
        string,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        boolean,
        boolean
      ] & {
        id: BigNumber;
        proposer: string;
        eta: BigNumber;
        startBlock: BigNumber;
        endBlock: BigNumber;
        forVotes: BigNumber;
        againstVotes: BigNumber;
        abstainVotes: BigNumber;
        canceled: boolean;
        executed: boolean;
      }
    >;

    timelock(overrides?: CallOverrides): Promise<string>;

    "timelock()"(overrides?: CallOverrides): Promise<string>;

    votingDelay(overrides?: CallOverrides): Promise<BigNumber>;

    "votingDelay()"(overrides?: CallOverrides): Promise<BigNumber>;

    votingPeriod(overrides?: CallOverrides): Promise<BigNumber>;

    "votingPeriod()"(overrides?: CallOverrides): Promise<BigNumber>;
  };

  filters: {};

  estimateGas: {
    admin(overrides?: CallOverrides): Promise<BigNumber>;

    "admin()"(overrides?: CallOverrides): Promise<BigNumber>;

    comp(overrides?: CallOverrides): Promise<BigNumber>;

    "comp()"(overrides?: CallOverrides): Promise<BigNumber>;

    implementation(overrides?: CallOverrides): Promise<BigNumber>;

    "implementation()"(overrides?: CallOverrides): Promise<BigNumber>;

    initialProposalId(overrides?: CallOverrides): Promise<BigNumber>;

    "initialProposalId()"(overrides?: CallOverrides): Promise<BigNumber>;

    latestProposalIds(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "latestProposalIds(address)"(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    pendingAdmin(overrides?: CallOverrides): Promise<BigNumber>;

    "pendingAdmin()"(overrides?: CallOverrides): Promise<BigNumber>;

    proposalCount(overrides?: CallOverrides): Promise<BigNumber>;

    "proposalCount()"(overrides?: CallOverrides): Promise<BigNumber>;

    proposalThreshold(overrides?: CallOverrides): Promise<BigNumber>;

    "proposalThreshold()"(overrides?: CallOverrides): Promise<BigNumber>;

    proposals(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "proposals(uint256)"(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    timelock(overrides?: CallOverrides): Promise<BigNumber>;

    "timelock()"(overrides?: CallOverrides): Promise<BigNumber>;

    votingDelay(overrides?: CallOverrides): Promise<BigNumber>;

    "votingDelay()"(overrides?: CallOverrides): Promise<BigNumber>;

    votingPeriod(overrides?: CallOverrides): Promise<BigNumber>;

    "votingPeriod()"(overrides?: CallOverrides): Promise<BigNumber>;
  };

  populateTransaction: {
    admin(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "admin()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    comp(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "comp()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    implementation(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "implementation()"(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    initialProposalId(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "initialProposalId()"(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    latestProposalIds(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "latestProposalIds(address)"(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    pendingAdmin(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "pendingAdmin()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    proposalCount(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "proposalCount()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    proposalThreshold(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "proposalThreshold()"(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    proposals(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "proposals(uint256)"(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    timelock(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "timelock()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    votingDelay(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "votingDelay()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    votingPeriod(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "votingPeriod()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;
  };
}
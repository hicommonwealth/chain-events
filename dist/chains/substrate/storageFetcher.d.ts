/**
 * The purpose of this file is to synthesize "events" from currently-present
 * chain data, such that we don't need to "start fresh". We can "recover" the
 * originating event of any present entity and use that to seed our database
 * when converting from a client-based chain listener setup to a server-based one.
 */
import { ApiPromise } from '@polkadot/api';
import { CWEvent, IStorageFetcher } from '../../interfaces';
import { IDemocracyProposed, IDemocracyStarted, IDemocracyPassed, IPreimageNoted, ITreasuryProposed, ICollectiveProposed, ICollectiveVoted, ISignalingNewProposal, ISignalingCommitStarted, ISignalingVotingStarted, ISignalingVotingCompleted, IEventData, IIdentitySet, ITreasuryBountyEvents, INewTip, ITipVoted, ITipClosing } from './types';
export declare class StorageFetcher extends IStorageFetcher<ApiPromise> {
    fetchIdentities(addresses: string[]): Promise<CWEvent<IIdentitySet>[]>;
    fetch(): Promise<CWEvent<IEventData>[]>;
    fetchDemocracyProposals(blockNumber: number): Promise<CWEvent<IDemocracyProposed>[]>;
    fetchDemocracyReferenda(blockNumber: number): Promise<CWEvent<IDemocracyStarted | IDemocracyPassed>[]>;
    fetchDemocracyPreimages(hashes: string[]): Promise<CWEvent<IPreimageNoted>[]>;
    fetchTreasuryProposals(blockNumber: number): Promise<CWEvent<ITreasuryProposed>[]>;
    fetchBounties(blockNumber: number): Promise<CWEvent<ITreasuryBountyEvents>[]>;
    fetchCollectiveProposals(moduleName: 'council' | 'technicalCommittee', blockNumber: number): Promise<CWEvent<ICollectiveProposed | ICollectiveVoted>[]>;
    fetchTips(blockNumber: number): Promise<CWEvent<INewTip | ITipVoted | ITipClosing>[]>;
    fetchSignalingProposals(blockNumber: number): Promise<CWEvent<ISignalingNewProposal | ISignalingCommitStarted | ISignalingVotingStarted | ISignalingVotingCompleted>[]>;
}

/**
 * The purpose of this file is to synthesize "events" from currently-present
 * chain data, such that we don't need to "start fresh". We can "recover" the
 * originating event of any present entity and use that to seed our database
 * when converting from a client-based chain listener setup to a server-based one.
 */

import _ from 'underscore';
import { ApiPromise } from '@polkadot/api';
import { Option, Vec } from '@polkadot/types';
import {
  BalanceOf,
  AccountId,
  Hash,
  BlockNumber,
  Registration,
  TreasuryProposal,
  Proposal,
  Votes,
  OpenTip,
} from '@polkadot/types/interfaces';
import { Codec } from '@polkadot/types/types';
import { DeriveProposalImage } from '@polkadot/api-derive/types';
import { isFunction, hexToString } from '@polkadot/util';

import { CWEvent, IStorageFetcher } from '../../interfaces';
import { factory, formatFilename } from '../../logging';

import {
  EventKind,
  IDemocracyProposed,
  IDemocracyStarted,
  IDemocracyPassed,
  IPreimageNoted,
  ITreasuryProposed,
  ITreasuryBountyProposed,
  ICollectiveProposed,
  ICollectiveVoted,
  ISignalingNewProposal,
  ISignalingCommitStarted,
  ISignalingVotingStarted,
  ISignalingVotingCompleted,
  IEventData,
  IIdentitySet,
  parseJudgement,
  IdentityJudgement,
  ITreasuryBountyBecameActive,
  ITreasuryBountyAwarded,
  ITreasuryBountyEvents,
  INewTip,
  ITipVoted,
  ITipClosing,
} from './types';

const log = factory.getLogger(formatFilename(__filename));

export class StorageFetcher extends IStorageFetcher<ApiPromise> {
  public async fetchIdentities(
    addresses: string[]
  ): Promise<CWEvent<IIdentitySet>[]> {
    if (!this._api.query.identity) {
      log.info('Identities module not detected.');
      return [];
    }

    const blockNumber = +(await this._api.rpc.chain.getHeader()).number;

    // fetch all identities and registrars from chain
    const identities: Option<
      Registration
    >[] = await this._api.query.identity.identityOf.multi(addresses);
    const registrars = await this._api.query.identity.registrars();

    // construct events
    const cwEvents: CWEvent<IIdentitySet>[] = _.zip(addresses, identities)
      .map(
        ([address, id]: [string, Option<Registration>]): CWEvent<
          IIdentitySet
        > => {
          // if no identity found, do nothing
          if (!id.isSome) return null;
          const { info, judgements } = id.unwrap();
          if (!info.display || !info.display.isRaw) return null;

          // parse out judgements from identity info
          const parsedJudgements = judgements
            .map(([judgmentId, judgement]): [string, IdentityJudgement] => {
              const registrarOpt = registrars[+judgmentId];
              // skip invalid registrars
              if (!registrarOpt || !registrarOpt.isSome) return null;
              return [
                registrarOpt.unwrap().account.toString(),
                parseJudgement(judgement),
              ];
            })
            .filter((j) => !!j);
          return {
            // use current block as "fake" set date
            blockNumber,
            data: {
              kind: EventKind.IdentitySet,
              who: address,
              displayName: info.display.asRaw.toUtf8(),
              judgements: parsedJudgements,
            },
          };
        }
      )
      // remove null values
      .filter((v) => !!v);
    return cwEvents;
  }

  public async fetch(): Promise<CWEvent<IEventData>[]> {
    // get current blockNumber for synthesizing events
    const blockNumber = +(await this._api.rpc.chain.getHeader()).number;

    /** democracy proposals */
    const democracyProposalEvents = await this.fetchDemocracyProposals(
      blockNumber
    );

    /** democracy referenda */
    const democracyReferendaEvents = await this.fetchDemocracyReferenda(
      blockNumber
    );

    /** democracy preimages */
    const proposalHashes = democracyProposalEvents.map(
      (d) => (d.data as IDemocracyProposed).proposalHash
    );
    const referendaHashes = democracyReferendaEvents
      .filter((d) => d.data.kind === EventKind.DemocracyStarted)
      .map((d) => (d.data as IDemocracyStarted).proposalHash);
    const democracyPreimageEvents = await this.fetchDemocracyPreimages([
      ...proposalHashes,
      ...referendaHashes,
    ]);

    /** treasury proposals */
    const treasuryProposalEvents = await this.fetchTreasuryProposals(
      blockNumber
    );
    const bountyEvents = await this.fetchBounties(blockNumber);

    /** collective proposals */
    let technicalCommitteeProposalEvents = [];
    if (this._api.query.technicalCommittee) {
      technicalCommitteeProposalEvents = await this.fetchCollectiveProposals(
        'technicalCommittee',
        blockNumber
      );
    }
    const councilProposalEvents = await this.fetchCollectiveProposals(
      'council',
      blockNumber
    );

    /** tips */
    const tipsEvents = await this.fetchTips(blockNumber);

    /** signaling proposals */
    const signalingProposalEvents = await this.fetchSignalingProposals(
      blockNumber
    );

    log.info('Fetch complete.');
    return [
      ...democracyProposalEvents,
      ...democracyReferendaEvents,
      ...democracyPreimageEvents,
      ...treasuryProposalEvents,
      ...bountyEvents,
      ...technicalCommitteeProposalEvents,
      ...councilProposalEvents,
      ...signalingProposalEvents,
      ...tipsEvents,
    ];
  }

  public async fetchDemocracyProposals(
    blockNumber: number
  ): Promise<CWEvent<IDemocracyProposed>[]> {
    if (!this._api.query.democracy) {
      return [];
    }
    log.info('Fetching democracy proposals...');
    const publicProps = await this._api.query.democracy.publicProps();
    const deposits: Array<Option<
      [BalanceOf, Vec<AccountId>] & Codec
    >> = await this._api.queryMulti(
      publicProps.map(([idx]) => [this._api.query.democracy.depositOf, idx])
    );
    const proposedEvents = _.zip(publicProps, deposits)
      .map(
        ([[idx, hash, proposer], depositOpt]): IDemocracyProposed => {
          if (!depositOpt.isSome) return null;

          // handle kusama vs edgeware depositOpt order
          const depositors = depositOpt.unwrap();
          let deposit: BalanceOf;
          if (isFunction((depositors[1] as BalanceOf).mul)) {
            [, deposit] = depositors;
          } else {
            [deposit] = depositors;
          }
          return {
            kind: EventKind.DemocracyProposed,
            proposalIndex: +idx,
            proposalHash: hash.toString(),
            proposer: proposer.toString(),
            deposit: deposit.toString(),
          };
        }
      )
      .filter((e) => !!e);
    log.info(`Found ${proposedEvents.length} democracy proposals!`);
    return proposedEvents.map((data) => ({ blockNumber, data }));
  }

  public async fetchDemocracyReferenda(
    blockNumber: number
  ): Promise<CWEvent<IDemocracyStarted | IDemocracyPassed>[]> {
    if (!this._api.query.democracy) {
      log.info('Democracy module not detected.');
      return [];
    }

    log.info('Migrating democracy referenda...');
    const activeReferenda = await this._api.derive.democracy.referendumsActive();
    const startEvents = activeReferenda.map((r) => {
      return {
        kind: EventKind.DemocracyStarted,
        referendumIndex: +r.index,
        proposalHash: r.imageHash.toString(),
        voteThreshold: r.status.threshold.toString(),
        endBlock: +r.status.end,
      } as IDemocracyStarted;
    });
    const dispatchQueue = await this._api.derive.democracy.dispatchQueue();
    const passedEvents: Array<IDemocracyStarted | IDemocracyPassed> = _.flatten(
      dispatchQueue.map(({ index, at, imageHash }) => {
        return [
          {
            kind: EventKind.DemocracyStarted,
            referendumIndex: +index,
            proposalHash: imageHash.toString(),

            // fake unknown values for started event
            voteThreshold: '',
            endBlock: 0,
          } as IDemocracyStarted,
          {
            kind: EventKind.DemocracyPassed,
            referendumIndex: +index,
            dispatchBlock: +at,
          } as IDemocracyPassed,
        ];
      })
    );
    log.info(`Found ${startEvents.length} democracy referenda!`);
    return [...startEvents, ...passedEvents].map((data) => ({
      blockNumber,
      data,
    }));
  }

  // must pass proposal hashes found in prior events
  public async fetchDemocracyPreimages(
    hashes: string[]
  ): Promise<CWEvent<IPreimageNoted>[]> {
    if (!this._api.query.democracy) {
      return [];
    }
    log.info('Migrating preimages...');
    const hashCodecs = hashes.map((hash) => this._api.createType('Hash', hash));
    const preimages = await this._api.derive.democracy.preimages(hashCodecs);
    const notedEvents: Array<[number, IPreimageNoted]> = _.zip(
      hashes,
      preimages
    ).map(([hash, preimage]: [string, DeriveProposalImage]) => {
      if (!preimage || !preimage.proposal) return [0, null];
      return [
        +preimage.at,
        {
          kind: EventKind.PreimageNoted,
          proposalHash: hash,
          noter: preimage.proposer.toString(),
          preimage: {
            method: preimage.proposal.method,
            section: preimage.proposal.section,
            args: preimage.proposal.args.map((arg) => arg.toString()),
          },
        } as IPreimageNoted,
      ];
    });
    const cwEvents = notedEvents
      .filter(([, data]) => !!data)
      .map(([blockNumber, data]) => ({ blockNumber, data }));
    log.info(`Found ${cwEvents.length} preimages!`);
    return cwEvents;
  }

  public async fetchTreasuryProposals(
    blockNumber: number
  ): Promise<CWEvent<ITreasuryProposed>[]> {
    if (!this._api.query.treasury) {
      log.info('Treasury module not detected.');
      return [];
    }

    log.info('Migrating treasury proposals...');
    const approvals = await this._api.query.treasury.approvals();
    const nProposals = await this._api.query.treasury.proposalCount();
    const proposalIds: number[] = [];

    for (let i = 0; i < +nProposals; i++) {
      if (!approvals.some((id) => +id === i)) {
        proposalIds.push(i);
      }
    }
    const proposals = await this._api.query.treasury.proposals.multi<
      Option<TreasuryProposal>
    >(proposalIds);
    const proposedEvents = proposalIds
      .map((id, index) => {
        if (!proposals[index] || !proposals[index].isSome) return null;
        const { proposer, value, beneficiary, bond } = proposals[
          index
        ].unwrap();
        return {
          kind: EventKind.TreasuryProposed,
          proposalIndex: +id,
          proposer: proposer.toString(),
          value: value.toString(),
          beneficiary: beneficiary.toString(),
          bond: bond.toString(),
        } as ITreasuryProposed;
      })
      .filter((e) => !!e);
    log.info(`Found ${proposedEvents.length} treasury proposals!`);
    return proposedEvents.map((data) => ({ blockNumber, data }));
  }

  public async fetchBounties(
    blockNumber: number
  ): Promise<CWEvent<ITreasuryBountyEvents>[]> {
    // TODO: List all relevant events explicitly?
    if (
      !this._api.query.treasury?.bountyCount &&
      !this._api.query.bounties?.bountyCount
    ) {
      log.info('Bounties module not detected.');
      return [];
    }

    log.info('Migrating treasury bounties...');
    const bounties = await this._api.derive.bounties.bounties();
    const events = [];
    for (const b of bounties) {
      events.push({
        kind: EventKind.TreasuryBountyProposed,
        bountyIndex: +b.index,
        proposer: b.bounty.proposer.toString(),
        value: b.bounty.value.toString(),
        fee: b.bounty.fee.toString(),
        curatorDeposit: b.bounty.curatorDeposit.toString(),
        bond: b.bounty.bond.toString(),
        description: b.description,
      } as ITreasuryBountyProposed);

      if (b.bounty.status.isActive) {
        events.push({
          kind: EventKind.TreasuryBountyBecameActive,
          bountyIndex: +b.index,
          curator: b.bounty.status.asActive.curator.toString(),
          updateDue: +b.bounty.status.asActive.updateDue,
        } as ITreasuryBountyBecameActive);
      }

      if (b.bounty.status.isPendingPayout) {
        events.push({
          kind: EventKind.TreasuryBountyBecameActive,
          bountyIndex: +b.index,
          curator: b.bounty.status.asPendingPayout.curator.toString(),
          updateDue: blockNumber, // fake this unavailable field
        } as ITreasuryBountyBecameActive);
        events.push({
          kind: EventKind.TreasuryBountyAwarded,
          bountyIndex: +b.index,
          value: b.bounty.value.toString(),
          beneficiary: b.bounty.status.asPendingPayout.beneficiary.toString(),
          curator: b.bounty.status.asPendingPayout.curator.toString(),
          unlockAt: +b.bounty.status.asPendingPayout.unlockAt,
        } as ITreasuryBountyAwarded);
      }
    }

    log.info(`Found ${bounties.length} bounties!`);
    return events.map((data) => ({ blockNumber, data }));
  }

  public async fetchCollectiveProposals(
    moduleName: 'council' | 'technicalCommittee',
    blockNumber: number
  ): Promise<CWEvent<ICollectiveProposed | ICollectiveVoted>[]> {
    if (!this._api.query[moduleName]) {
      log.info(`${moduleName} module not detected.`);
      return [];
    }

    log.info(`Migrating ${moduleName} proposals...`);
    const proposalHashes = await this._api.query[moduleName].proposals();
    const proposals: Array<Option<Proposal>> = await Promise.all(
      proposalHashes.map(async (h) => {
        try {
          // awaiting inside the map here to force the individual call to throw, rather than the Promise.all
          return await this._api.query[moduleName].proposalOf(h);
        } catch (e) {
          log.error(`Failed to fetch council motion hash ${h.toString()}`);
          return Promise.resolve(null);
        }
      })
    );
    const proposalVotes = await this._api.query[moduleName].voting.multi<
      Option<Votes>
    >(proposalHashes);
    const proposedEvents = _.flatten(
      proposalHashes
        .map((hash, index) => {
          const proposalOpt = proposals[index];
          const votesOpt = proposalVotes[index];
          if (
            !hash ||
            !proposalOpt ||
            !votesOpt ||
            !proposalOpt.isSome ||
            !votesOpt.isSome
          )
            return null;
          const proposal = proposalOpt.unwrap();
          const votes = votesOpt.unwrap();
          return [
            {
              kind: EventKind.CollectiveProposed,
              collectiveName: moduleName,
              proposalIndex: +votes.index,
              proposalHash: hash.toString(),
              threshold: +votes.threshold,
              call: {
                method: proposal.method,
                section: proposal.section,
                args: proposal.args.map((arg) => arg.toString()),
              },

              // unknown
              proposer: '',
            } as ICollectiveProposed,
            ...votes.ayes.map(
              (who) =>
                ({
                  kind: EventKind.CollectiveVoted,
                  collectiveName: moduleName,
                  proposalHash: hash.toString(),
                  voter: who.toString(),
                  vote: true,
                } as ICollectiveVoted)
            ),
            ...votes.nays.map(
              (who) =>
                ({
                  kind: EventKind.CollectiveVoted,
                  collectiveName: moduleName,
                  proposalHash: hash.toString(),
                  voter: who.toString(),
                  vote: false,
                } as ICollectiveVoted)
            ),
          ];
        })
        .filter((es) => !!es)
    );
    const nProposalEvents = proposedEvents.filter(
      (e) => e.kind === EventKind.CollectiveProposed
    ).length;
    log.info(
      `Found ${nProposalEvents} ${moduleName} proposals and ${
        proposedEvents.length - nProposalEvents
      } votes!`
    );
    return proposedEvents.map((data) => ({ blockNumber, data }));
  }

  public async fetchTips(
    blockNumber: number
  ): Promise<CWEvent<INewTip | ITipVoted | ITipClosing>[]> {
    if (!this._api.query.tips) {
      log.info('Tips module not detected.');
      return [];
    }

    log.info('Migrating tips...');
    const openTipKeys = await this._api.query.tips.tips.keys();
    const results: CWEvent<INewTip | ITipVoted | ITipClosing>[] = [];
    for (const key of openTipKeys) {
      const hash = key.args[0].toString();
      try {
        const tip = await this._api.rpc.state.getStorage<Option<OpenTip>>(key);
        if (tip.isSome) {
          const {
            reason: reasonHash,
            who,
            finder,
            deposit,
            closes,
            tips: tipVotes,
            findersFee,
          } = tip.unwrap();
          const reason = await this._api.query.tips.reasons(reasonHash);
          if (reason.isSome) {
            // newtip events
            results.push({
              blockNumber,
              data: {
                kind: EventKind.NewTip,
                proposalHash: hash,
                who: who.toString(),
                reason: hexToString(reason.unwrap().toString()),
                finder: finder.toString(),
                deposit: deposit.toString(),
                findersFee: findersFee.valueOf(),
              },
            });

            // n tipvoted events
            for (const [voter, amount] of tipVotes) {
              results.push({
                blockNumber,
                data: {
                  kind: EventKind.TipVoted,
                  proposalHash: hash,
                  who: voter.toString(),
                  value: amount.toString(),
                },
              });
            }

            // tipclosing event
            if (closes.isSome) {
              const closesAt = +closes.unwrap();
              results.push({
                blockNumber,
                data: {
                  kind: EventKind.TipClosing,
                  proposalHash: hash,
                  closing: closesAt,
                },
              });
            }
          }
        }
      } catch (e) {
        log.error(`Unable to fetch tip "${key.args[0]}"!`);
      }
    }

    const newTips = results.filter((v) => v.data.kind === EventKind.NewTip);
    log.info(`Found ${newTips.length} open tips!`);
    return results;
  }

  public async fetchSignalingProposals(
    blockNumber: number
  ): Promise<
    CWEvent<
      | ISignalingNewProposal
      | ISignalingCommitStarted
      | ISignalingVotingStarted
      | ISignalingVotingCompleted
    >[]
  > {
    if (!this._api.query.signaling || !this._api.query.voting) {
      log.info('Signaling module not detected.');
      return [];
    }

    log.info('Migrating signaling proposals...');
    if (!this._api.query.voting || !this._api.query.signaling) {
      log.info('Found no signaling proposals (wrong chain)!');
      return [];
    }
    // in "prevoting" phase
    const inactiveProposals = await this._api.query.signaling.inactiveProposals<
      Vec<[Hash, BlockNumber] & Codec>
    >();
    // in "commit" or "voting" phase
    const activeProposals = await this._api.query.signaling.activeProposals<
      Vec<[Hash, BlockNumber] & Codec>
    >();
    // in "completed" phase
    const completedProposals = await this._api.query.signaling.completedProposals<
      Vec<[Hash, BlockNumber] & Codec>
    >();
    const proposalHashes = [
      ...inactiveProposals,
      ...activeProposals,
      ...completedProposals,
    ].map(([hash]) => hash);

    // fetch records
    const proposalRecordOpts = await this._api.queryMulti(
      proposalHashes.map((hash) => [this._api.query.signaling.proposalOf, hash])
    );
    const proposalRecords = _.zip(proposalRecordOpts, proposalHashes)
      .filter(([p]) => p.isSome)
      .map(([p, hash]) => [p.unwrap(), hash]);
    const voteRecordOpts = await this._api.queryMulti(
      proposalRecords.map(([p]) => [
        this._api.query.voting.voteRecords,
        p.vote_id,
      ])
    );
    const allRecords = _.zip(proposalRecords, voteRecordOpts)
      .filter(([, voteOpt]) => voteOpt.isSome)
      .map(([[record, hash], vote]) => [hash, record, vote.unwrap()]);

    // generate events
    const newProposalEvents = allRecords.map(([hash, proposal, voting]) => {
      return {
        kind: EventKind.SignalingNewProposal,
        proposer: proposal.author.toString(),
        proposalHash: hash.toString(),
        voteId: voting.id.toString(),
        title: proposal.title.toString(),
        description: proposal.contents.toString(),
        tallyType: voting.data.tally_type.toString(),
        voteType: voting.data.vote_type.toString(),
        choices: voting.outcomes.map((outcome) => outcome.toString()),
      } as ISignalingNewProposal;
    });

    // we're not using commit in production, but check anyway
    const commitStartedEvents = allRecords
      .filter(([, proposal]) => proposal.stage.isCommit)
      .map(([hash, proposal, voting]) => {
        return {
          kind: EventKind.SignalingCommitStarted,
          proposalHash: hash.toString(),
          voteId: voting.id.toString(),
          endBlock: +proposal.transition_time,
        } as ISignalingCommitStarted;
      });

    // assume all voting/completed proposals skipped straight there without commit
    const votingStartedEvents = allRecords
      .filter(
        ([, proposal]) => proposal.stage.isVoting || proposal.stage.isCompleted
      )
      .map(([hash, proposal, voting]) => {
        return {
          kind: EventKind.SignalingVotingStarted,
          proposalHash: hash.toString(),
          voteId: voting.id.toString(),
          endBlock: +proposal.transition_time,
        } as ISignalingVotingStarted;
      });

    const completedEvents = allRecords
      .filter(([, proposal]) => proposal.stage.isCompleted)
      .map(([hash, , voting]) => {
        return {
          kind: EventKind.SignalingVotingCompleted,
          proposalHash: hash.toString(),
          voteId: voting.id.toString(),
        } as ISignalingVotingCompleted;
      });

    const events = [
      ...newProposalEvents,
      ...commitStartedEvents,
      ...votingStartedEvents,
      ...completedEvents,
    ];
    // we could plausibly populate the completed events with block numbers, but not necessary
    log.info(`Found ${newProposalEvents.length} signaling proposals!`);
    return events.map((data) => ({ blockNumber, data }));
  }
}

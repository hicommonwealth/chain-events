import { AccountId, EraPoints, EraRewardPoints, RewardPoint, EraIndex, BlockHash } from '@polkadot/types/interfaces';
import { ApiPromise } from '@polkadot/api';
import { AccountPoints } from '../types';

async function retrievePoints(api: ApiPromise, era: EraIndex, hash: BlockHash, validators: AccountId[]): Promise<EraRewardPoints> {
  const currentEraPointsEarned = await api.query.staking.currentEraPointsEarned.at<EraPoints>(hash, era);
  const total = currentEraPointsEarned.total;
  const individual = currentEraPointsEarned.individual;

  return api.registry.createType('EraRewardPoints', {
    individual: new Map<AccountId, RewardPoint>(
      individual
        .map((points) => api.registry.createType('RewardPoint', points))
        .map((points, index): [AccountId, RewardPoint] => [validators[index] as AccountId, points])
    ),
    total
  });
}


export function currentPoints(api: ApiPromise, era: EraIndex, hash: BlockHash, validators: AccountId[]): Promise<AccountPoints> {
  const points: AccountPoints = {};
  // api call to retreive eraRewardPoints for version >= 38
  if (api.query.staking.erasRewardPoints)
    return api.query.staking.erasRewardPoints.at<EraRewardPoints>(hash, era).then((rewardPoints) => {
      rewardPoints.individual.forEach((rewardPoint, accountKey) => {
        points[accountKey.toString()] = +rewardPoint;
      });
      return points;
    })
  else {
    // creating eraRewardPoints for  for version = 31
    return api.query.staking.currentEraPointsEarned.at<EraPoints>(hash, era).then((eraPoints) => {
      const individual = eraPoints.individual;
      individual.map((point, idx) => {
        points[validators[idx].toString()] = +point
      });
      return points;
    });

  }
}
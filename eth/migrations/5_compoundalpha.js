const Uni = artifacts.require('Uni');
const GovernorAlpha = artifacts.require('GovernorAlpha');
const Timelock = artifacts.require('Timelock');

// eslint-disable-next-line func-names
module.exports = async function (deployer, network, accounts) {
  // Uni
  await  deployer.deploy(Uni, accounts[0], accounts[1], 0);
  const uni = await Uni.deployed();

  // Timelock
  await  deployer.deploy(Timelock, accounts[0], 172800); // 172800 is 2 days in seconds, which is the minimum delay for the contract
  const timelock = await Timelock.deployed();

  // GovernorAlpha
  await deployer.deploy(GovernorAlpha, timelock.address, uni.address, accounts[0]);
  const governorAlpha = GovernorAlpha.deployed();
};

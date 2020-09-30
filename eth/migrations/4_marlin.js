const Comp = artifacts.require('Comp');
const GovernorAlpha = artifacts.require('GovernorAlpha');
const Timelock = artifacts.require('Timelock');

// eslint-disable-next-line func-names
module.exports = async function (deployer, network, accounts) {
  // Marlin Contracts
  // accounts[0] is initial comp holder, admin of timelock, and guardian of GovernorAlpha
  const compGaurdian = accounts[0]
  await  deployer.deploy(Comp, compGaurdian);
  const comp = await Comp.deployed();
  await  deployer.deploy(Timelock, compGaurdian, 172800); // 172800 is 2 days in seconds, which is the minimum delay for the contract
  const timelock = await Timelock.deployed();
  await deployer.deploy(GovernorAlpha, timelock.address, comp.address, compGaurdian);
  const governorAlpha = GovernorAlpha.deployed();
};

/* Generated by ts-generator ver. 0.0.8 */
/* tslint:disable */

import { Contract, Signer } from "ethers";
import { Provider } from "ethers/providers";

import { MPondInterface } from "./MPondInterface";

export class MPondInterfaceFactory {
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): MPondInterface {
    return new Contract(address, _abi, signerOrProvider) as MPondInterface;
  }
}

const _abi = [
  {
    constant: true,
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address"
      },
      {
        internalType: "uint256",
        name: "blockNumber",
        type: "uint256"
      }
    ],
    name: "getPriorVotes",
    outputs: [
      {
        internalType: "uint96",
        name: "",
        type: "uint96"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  }
];
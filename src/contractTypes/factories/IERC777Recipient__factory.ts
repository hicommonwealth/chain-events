/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer } from "ethers";
import { Provider } from "@ethersproject/providers";

import type { IERC777Recipient } from "../IERC777Recipient";

export class IERC777Recipient__factory {
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): IERC777Recipient {
    return new Contract(address, _abi, signerOrProvider) as IERC777Recipient;
  }
}

const _abi = [
  {
    constant: false,
    inputs: [
      {
        internalType: "address",
        name: "operator",
        type: "address",
      },
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "userData",
        type: "bytes",
      },
      {
        internalType: "bytes",
        name: "operatorData",
        type: "bytes",
      },
    ],
    name: "tokensReceived",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
];

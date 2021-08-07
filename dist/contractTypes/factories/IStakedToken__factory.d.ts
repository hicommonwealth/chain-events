import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { IStakedToken } from "../IStakedToken";
export declare class IStakedToken__factory {
    static connect(address: string, signerOrProvider: Signer | Provider): IStakedToken;
}

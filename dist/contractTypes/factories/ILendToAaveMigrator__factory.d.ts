import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { ILendToAaveMigrator } from "../ILendToAaveMigrator";
export declare class ILendToAaveMigrator__factory {
    static connect(address: string, signerOrProvider: Signer | Provider): ILendToAaveMigrator;
}

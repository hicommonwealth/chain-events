import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { ISwapCollateral } from "../ISwapCollateral";
export declare class ISwapCollateral__factory {
    static connect(address: string, signerOrProvider: Signer | Provider): ISwapCollateral;
}

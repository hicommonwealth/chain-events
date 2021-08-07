import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { IFlashLiquidationAdapter } from "../IFlashLiquidationAdapter";
export declare class IFlashLiquidationAdapter__factory {
    static connect(address: string, signerOrProvider: Signer | Provider): IFlashLiquidationAdapter;
}

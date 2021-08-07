import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { IMinter } from "../IMinter";
export declare class IMinter__factory {
    static connect(address: string, signerOrProvider: Signer | Provider): IMinter;
}

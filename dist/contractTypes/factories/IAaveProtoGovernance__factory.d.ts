import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { IAaveProtoGovernance } from "../IAaveProtoGovernance";
export declare class IAaveProtoGovernance__factory {
    static connect(address: string, signerOrProvider: Signer | Provider): IAaveProtoGovernance;
}

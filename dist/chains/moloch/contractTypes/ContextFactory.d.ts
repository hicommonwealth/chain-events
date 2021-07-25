import { Signer } from "ethers";
import { Provider } from "ethers/providers";
import { Context } from "./Context";
export declare class ContextFactory {
    static connect(address: string, signerOrProvider: Signer | Provider): Context;
}

import { Signer } from "ethers";
import { Provider } from "ethers/providers";
import { Ierc777Recipient } from "./Ierc777Recipient";
export declare class Ierc777RecipientFactory {
    static connect(address: string, signerOrProvider: Signer | Provider): Ierc777Recipient;
}

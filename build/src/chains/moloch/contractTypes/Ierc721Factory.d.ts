import { Signer } from "ethers";
import { Provider } from "ethers/providers";
import { Ierc721 } from "./Ierc721";
export declare class Ierc721Factory {
    static connect(address: string, signerOrProvider: Signer | Provider): Ierc721;
}

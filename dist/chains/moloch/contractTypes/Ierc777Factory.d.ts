import { Signer } from "ethers";
import { Provider } from "ethers/providers";
import { Ierc777 } from "./Ierc777";
export declare class Ierc777Factory {
    static connect(address: string, signerOrProvider: Signer | Provider): Ierc777;
}

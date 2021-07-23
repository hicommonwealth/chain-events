import { Signer } from "ethers";
import { Provider } from "ethers/providers";
import { Ierc777Sender } from "./Ierc777Sender";
export declare class Ierc777SenderFactory {
    static connect(address: string, signerOrProvider: Signer | Provider): Ierc777Sender;
}

import { Signer } from "ethers";
import { Provider } from "ethers/providers";
import { TimelockInterface } from "./TimelockInterface";
export declare class TimelockInterfaceFactory {
    static connect(address: string, signerOrProvider: Signer | Provider): TimelockInterface;
}

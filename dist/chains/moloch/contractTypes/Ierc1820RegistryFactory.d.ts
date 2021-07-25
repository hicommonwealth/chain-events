import { Signer } from "ethers";
import { Provider } from "ethers/providers";
import { Ierc1820Registry } from "./Ierc1820Registry";
export declare class Ierc1820RegistryFactory {
    static connect(address: string, signerOrProvider: Signer | Provider): Ierc1820Registry;
}

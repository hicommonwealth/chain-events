import { Signer } from "ethers";
import { Provider } from "ethers/providers";
import { MPondInterface } from "./MPondInterface";
export declare class MPondInterfaceFactory {
    static connect(address: string, signerOrProvider: Signer | Provider): MPondInterface;
}

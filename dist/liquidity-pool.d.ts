import { Token } from "erc20-list";
import Web3 from "web3";
import { Factory } from "./factory";
export declare class LiquidityPool extends Token {
    protected web3: Web3;
    constructor(web3: Web3, address: string, abi?: any);
    protected tokenA: Promise<Token>;
    getTokenA(): Promise<Token>;
    protected tokenB: Promise<Token>;
    getTokenB(): Promise<Token>;
    protected factory: Promise<Factory>;
    getFactory(): Promise<Factory>;
    getReserves(): Promise<[number, number]>;
}

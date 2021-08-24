import { Token } from "erc20";
import Web3 from "web3";
import { Factory } from "./factory";
export declare class LiquidityPool extends Token {
    protected web3: Web3;
    constructor(web3: Web3, address: string);
    private tokenA;
    getTokenA(): Promise<Token>;
    private tokenB;
    getTokenB(): Promise<Token>;
    private factory;
    getFactory(): Promise<Factory>;
    getReserves(): Promise<[number, number]>;
}

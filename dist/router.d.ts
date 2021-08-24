import { Token } from "erc20-list";
import { Contract } from "web3-eth-contract";
import Web3 from "web3";
import { Factory } from "./factory";
import { TransactionConfig } from "web3-eth";
export declare class Router {
    private web3;
    maxHops: number;
    readonly contract: Contract;
    supportFeeOnTransferTokens: boolean;
    constructor(web3: Web3, address: string);
    protected weth: Promise<Token>;
    getWeth(): Promise<Token>;
    protected factory: Promise<Factory>;
    getFactory(): Promise<Factory>;
    getAmountsOut(srcAmount: number, path: Token[]): Promise<number[]>;
    protected routes: [Token, Token][];
    addRoute(tokenA: Token, tokenB: Token): Promise<boolean>;
    getBestPath(srcAmount: number, srcToken: Token, dstToken: Token): Promise<Token[]>;
    protected paths: {
        [key: string]: Token[][];
    };
    getPaths(srcToken: Token, dstToken: Token): Promise<Token[][]>;
    protected _getPaths(srcToken: Token, dstToken: Token | undefined, maxHops: number, routes: [Token, Token][]): Token[][];
    swap(path: Token[], srcAmount: number, dstMinReturn: number, to: string, deadline?: number): Promise<TransactionConfig>;
}

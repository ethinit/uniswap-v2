import { Token } from "erc20-list";
import { Contract } from "web3-eth-contract";
import { LiquidityPool } from "./liquidity-pool";
import Web3 from "web3";
export declare class Factory {
    private web3;
    contract: Contract;
    protected constructor(web3: Web3, address: string, abi?: any);
    static getInstance(web3: Web3, address: string): Factory;
    protected liquidityPools: {
        [key: string]: Promise<LiquidityPool | null>;
    };
    getLiquidityPool(tokenA: Token, tokenB: Token): Promise<LiquidityPool | null>;
}

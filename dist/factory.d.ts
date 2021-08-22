import { Token } from "erc20-list";
import { Contract } from "web3-eth-contract";
import Web3 from "web3";
export declare class Factory {
    private web3;
    contract: Contract;
    constructor(web3: Web3, address: string);
    private liquidityPools;
    getLiquidityPool(tokenA: Token, tokenB: Token): Promise<Token | null>;
}

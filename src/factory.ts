import { Token } from "erc20-list";
import { Contract } from "web3-eth-contract";
import { LiquidityPool } from "./liquidity-pool";
import Web3 from "web3";

const factoryAbi = require('../factory.abi.json');

export class Factory {
    public contract: Contract;

    constructor(private web3: Web3, address: string) {
        this.contract = new web3.eth.Contract(factoryAbi, address);
    }

    private liquidityPools: { [key: string]: Promise<LiquidityPool | null> } = {};
    public getLiquidityPool(tokenA: Token, tokenB: Token): Promise<LiquidityPool | null> {
        let cacheKey = [tokenA.getAddress(), tokenB.getAddress()].sort().join(',');

        if (!this.liquidityPools[cacheKey]) {
            this.liquidityPools[cacheKey] = this.contract.methods.getPair(tokenA.getAddress(), tokenB.getAddress()).call().then((pairAddress: string) => {
                if (pairAddress == '0x0000000000000000000000000000000000000000') {
                    return null;
                }

                return new LiquidityPool(this.web3, pairAddress);
            })
        }

        return this.liquidityPools[cacheKey];
    }
}
import { Token } from "erc20-list";
import { Contract } from "web3-eth-contract";
import { LiquidityPool } from "./liquidity-pool";
import Web3 from "web3";

const factoryAbi = require('../factory.abi.json');

export class Factory {
    public contract: Contract;

    protected constructor(private web3: Web3, address: string) {
        this.contract = new web3.eth.Contract(factoryAbi, address);
    }

    static getInstance(web3: Web3, address: string): Factory {
        if (!web3['ethinit']) {
            web3['ethinit'] = {};
        }

        if (!web3['ethinit']['uniswap-v2']) {
            web3['ethinit']['uniswap-v2'] = {};
        }

        address = address.toLowerCase();
        if (!web3['ethinit']['uniswap-v2'][address]) {
            web3['ethinit']['uniswap-v2'][address] = new Factory(web3, address);
        }

        return web3['ethinit']['uniswap-v2'][address];
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
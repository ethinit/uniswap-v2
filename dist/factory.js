"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Factory = void 0;
const erc20_list_1 = require("erc20-list");
const factoryAbi = require('../factory.abi.json');
class Factory {
    constructor(web3, address) {
        this.web3 = web3;
        this.liquidityPools = {};
        this.contract = new web3.eth.Contract(factoryAbi, address);
    }
    getLiquidityPool(tokenA, tokenB) {
        let cacheKey = [tokenA.getAddress(), tokenB.getAddress()].sort().join(',');
        if (!this.liquidityPools[cacheKey]) {
            this.liquidityPools[cacheKey] = this.contract.methods.getPair(tokenA.getAddress(), tokenB.getAddress()).call().then((pairAddress) => {
                if (pairAddress == '0x0000000000000000000000000000000000000000') {
                    return null;
                }
                return erc20_list_1.Token.getInstance(this.web3, pairAddress);
            });
        }
        return this.liquidityPools[cacheKey];
    }
}
exports.Factory = Factory;

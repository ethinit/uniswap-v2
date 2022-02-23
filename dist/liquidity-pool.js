"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiquidityPool = void 0;
const erc20_list_1 = require("erc20-list");
const factory_1 = require("./factory");
const lpAbi = require('../liquidity-pool.abi.json');
class LiquidityPool extends erc20_list_1.Token {
    constructor(web3, address, abi = lpAbi) {
        super(web3, address, abi);
        this.web3 = web3;
    }
    getTokenA() {
        if (!this.tokenA) {
            this.tokenA = this.contract.methods.token0().call().then(address => erc20_list_1.Token.getInstance(this.web3, address));
        }
        return this.tokenA;
    }
    getTokenB() {
        if (!this.tokenB) {
            this.tokenB = this.contract.methods.token1().call().then(address => erc20_list_1.Token.getInstance(this.web3, address));
        }
        return this.tokenB;
    }
    getFactory() {
        if (!this.factory) {
            this.factory = this.contract.methods.factory().call().then(address => factory_1.Factory.getInstance(this.web3, address));
        }
        return this.factory;
    }
    async getReserves() {
        let reserves = await this.contract.methods.getReserves().call();
        let token0 = await this.getTokenA();
        let token1 = await this.getTokenB();
        return [
            await token0.utils.toDecimal(reserves[0]),
            await token1.utils.toDecimal(reserves[1]),
        ];
    }
}
exports.LiquidityPool = LiquidityPool;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dex = void 0;
const router_1 = require("./router");
class Dex {
    constructor(web3, routerAddr = '0x7a250d5630b4cf539739df2c5dacb4c659f2488d') {
        this.web3 = web3;
        this.router = new router_1.Router(this.web3, routerAddr);
    }
    getPrice(srcAmount, srcToken, dstToken) {
        return this.router.getBestPath(srcAmount, srcToken, dstToken).then(path => this.router.getAmountsOut(srcAmount, path).then(amounts => amounts.pop()));
    }
    getRate(srcAmount, srcToken, dstToken) {
        return this.getPrice(srcAmount, srcToken, dstToken).then(price => price / srcAmount);
    }
    swap(srcAmount, srcToken, dstMinReturn, dstToken, to, deadline = 300) {
        return this.router.getBestPath(srcAmount, srcToken, dstToken).then(bestPath => this.router.swap(bestPath, srcAmount, dstMinReturn, to, deadline));
    }
    approve(token) {
        return token.approve(this.router.contract.options.address);
    }
    isApproved(sellerAddr, token) {
        return token.getAllowance(sellerAddr, this.router.contract.options.address).then((allowence) => allowence > 0);
    }
}
exports.Dex = Dex;

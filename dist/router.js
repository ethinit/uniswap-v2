"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Router = void 0;
const erc20_list_1 = require("erc20-list");
const factory_1 = require("./factory");
const routerAbi = require('../router.abi.json');
class Router {
    constructor(web3, address) {
        this.web3 = web3;
        this.maxHops = 2;
        this.supportFeeOnTransferTokens = false;
        this.routes = [];
        this.paths = {};
        this.contract = new this.web3.eth.Contract(routerAbi, address);
    }
    getWeth() {
        if (!this.weth) {
            this.weth = this.contract.methods.WETH().call().then(wethAddr => erc20_list_1.Token.getInstance(this.web3, wethAddr));
        }
        return this.weth;
    }
    getFactory() {
        if (!this.factory) {
            this.factory = this.contract.methods.factory().call().then(factoryAddress => factory_1.Factory.getInstance(this.web3, factoryAddress));
        }
        return this.factory;
    }
    async getAmountsOut(srcAmount, path) {
        if (path.length < 2) {
            throw "path must be at least 2 tokens.";
        }
        let addrPath = [];
        path.forEach(token => addrPath.push(token.getAddress()));
        return this.contract.methods.getAmountsOut(await path[0].utils.fromDecimal(srcAmount), addrPath).call()
            .then(async (amounts) => {
            let decAmounts = [];
            for (let i = 1; i < amounts.length; i++) {
                decAmounts.push(await path[i].utils.toDecimal(amounts[i]));
            }
            return decAmounts;
        });
    }
    async addRoute(tokenA, tokenB) {
        let lp = await this.getFactory().then(factory => factory.getLiquidityPool(tokenA, tokenB));
        if (!lp) {
            return false; // pool doesn't exists
        }
        for (let i in this.routes) {
            if ((tokenA.utils.isEqual(this.routes[i][0]) && tokenB.utils.isEqual(this.routes[i][1]))
                ||
                    (tokenA.utils.isEqual(this.routes[i][1]) && tokenB.utils.isEqual(this.routes[i][0]))) {
                return false;
            }
        }
        this.routes.push([tokenA, tokenB]);
        this.paths = {}; // clear chache
        return true;
    }
    async getBestPath(srcAmount, srcToken, dstToken) {
        let routes = await this.getPaths(srcToken, dstToken);
        if (routes.length == 0) {
            throw `Route not found for ${srcToken.getAddress()} -> ${dstToken.getAddress()}`;
        }
        let bestPrice;
        let bestPath;
        for (let p in routes) {
            let path = routes[p];
            let price = (await this.getAmountsOut(srcAmount, path)).pop();
            if (!bestPrice || price > bestPrice) {
                bestPrice = price;
                bestPath = path;
            }
        }
        return bestPath;
    }
    async getPaths(srcToken, dstToken) {
        let cacheKey = [srcToken.getAddress(), dstToken.getAddress(), this.maxHops].sort().join(',');
        if (!this.paths[cacheKey]) {
            await this.addRoute(srcToken, dstToken);
            this.paths[cacheKey] = this._getPaths(srcToken, dstToken, this.maxHops, this.routes);
        }
        return this.paths[cacheKey];
    }
    _getPaths(srcToken, dstToken, maxHops, routes) {
        let paths = [];
        if (maxHops <= 0 || routes.length == 0) {
            return paths;
        }
        maxHops--;
        for (let i = 0; i < routes.length; i++) {
            let tokenA = routes[i][0];
            let tokenB = routes[i][1];
            if (tokenA.utils.isEqual(srcToken) || tokenB.utils.isEqual(srcToken)) {
                let nextLpPath = routes.slice(0, i).concat(routes.slice(i + 1)); // remove current pair
                let nextPaths;
                if (tokenA.utils.isEqual(srcToken)) {
                    paths.push([tokenA, tokenB]);
                    nextPaths = this._getPaths(tokenB, undefined, maxHops, nextLpPath);
                }
                else {
                    paths.push([tokenB, tokenA]);
                    nextPaths = this._getPaths(tokenA, undefined, maxHops, nextLpPath);
                }
                for (let np in nextPaths) {
                    paths.push([srcToken].concat(nextPaths[np]));
                }
            }
        }
        paths.sort((a, b) => a.length > b.length ? 1 : -1);
        if (dstToken) {
            let filteredPahts = [];
            for (let p in paths) {
                let path = paths[p];
                let lastToken = path[path.length - 1];
                if (lastToken.utils.isEqual(dstToken)) {
                    filteredPahts.push(path);
                }
            }
            return filteredPahts;
        }
        return paths;
    }
    async swap(path, srcAmount, dstMinReturn, to, deadline = 300) {
        let amountIn = await path[0].utils.fromDecimal(srcAmount);
        let amountOutMin = await path[path.length - 1].utils.fromDecimal(dstMinReturn);
        let addrPath = [];
        path.forEach(token => addrPath.push(token.getAddress()));
        let txConfig = {
            to: this.contract.options.address,
            gas: 250000 + ((addrPath.length - 2) * 50000)
        };
        deadline += Math.floor((new Date()).getTime() / 1000);
        let method = (this.supportFeeOnTransferTokens ? 'swapExactTokensForTokensSupportingFeeOnTransferTokens' : 'swapExactTokensForTokens');
        txConfig.data = this.contract.methods[method](amountIn, amountOutMin, addrPath, to, deadline).encodeABI();
        return txConfig;
    }
}
exports.Router = Router;

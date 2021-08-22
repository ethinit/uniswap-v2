import { Token } from "erc20-list";
import { Contract } from "web3-eth-contract";
import Web3 from "web3";
import { Factory } from "./factory";
import { TransactionConfig } from "web3-eth";

const routerAbi = require('../router.abi.json');

export class Router {
    public maxHops: number = 2;
    public readonly contract: Contract;
    public supportFeeOnTransferTokens: boolean = false;

    constructor(private web3: Web3, address: string) {
        this.contract = new this.web3.eth.Contract(routerAbi, address);
    }

    private weth: Promise<Token>;
    getWeth(): Promise<Token> {
        if (!this.weth) {
            this.weth = this.contract.methods.WETH().call().then(wethAddr => Token.getInstance(this.web3, wethAddr));
        }

        return this.weth;
    }

    private factory: Promise<Factory>;
    getFactory(): Promise<Factory> {
        if (!this.factory) {
            this.factory = this.contract.methods.factory().call().then(factoryAddress => new Factory(this.web3, factoryAddress));
        }

        return this.factory;
    }

    async getAmountsOut(srcAmount: number, path: Token[]): Promise<number[]> {
        if (path.length < 2) {
            throw "path must be at least 2 tokens."
        }

        let addrPath: string[] = [];
        path.forEach(token => addrPath.push(token.getAddress()));

        return this.contract.methods.getAmountsOut(await path[0].utils.fromDecimal(srcAmount), addrPath).call()
            .then(async (amounts: string[]) => {
                let decAmounts: number[] = [];
                for (let i = 1; i < amounts.length; i++) {
                    decAmounts.push(await path[i].utils.toDecimal(amounts[i]));
                }

                return decAmounts;
            });
    }

    private routes: [Token, Token][] = [];
    async addRoute(tokenA: Token, tokenB: Token): Promise<boolean> {
        let lp: Token = await this.getFactory().then(factory => factory.getLiquidityPool(tokenA, tokenB));

        if (!lp) {
            return false; // pool doesn't exists
        }

        for (let i in this.routes) {
            if (
                (tokenA.utils.isEqual(this.routes[i][0]) && tokenB.utils.isEqual(this.routes[i][1]))
                ||
                (tokenA.utils.isEqual(this.routes[i][1]) && tokenB.utils.isEqual(this.routes[i][0]))
            ) {
                return false;
            }
        }

        this.routes.push([tokenA, tokenB]);
        this.paths = {}; // clear chache
        return true;
    }

    async getBestPath(srcAmount: number, srcToken: Token, dstToken: Token): Promise<Token[]> {
        let routes: Token[][] = await this.getPaths(srcToken, dstToken);

        if (routes.length == 0) {
            throw `Route not found for ${srcToken.getAddress()} -> ${dstToken.getAddress()}`;
        }

        let bestPrice: number;
        let bestPath: Token[];

        for (let p in routes) {
            let path: Token[] = routes[p];

            let price: number = (await this.getAmountsOut(srcAmount, path)).pop();

            if (!bestPrice || price > bestPrice) {
                bestPrice = price;
                bestPath = path;
            }
        }

        return bestPath;
    }

    private paths: { [key: string]: Token[][] } = {};
    async getPaths(srcToken: Token, dstToken: Token): Promise<Token[][]> {
        let cacheKey = [srcToken.getAddress(), dstToken.getAddress(), this.maxHops].sort().join(',');

        if (!this.paths[cacheKey]) {
            await this.addRoute(srcToken, dstToken);
            this.paths[cacheKey] = this._getPaths(srcToken, dstToken, this.maxHops, this.routes);
        }

        return this.paths[cacheKey];
    }

    protected _getPaths(srcToken: Token, dstToken: Token | undefined, maxHops: number, routes: [Token, Token][]): Token[][] {
        let paths: Token[][] = [];

        if (maxHops <= 0 || routes.length == 0) {
            return paths;
        }

        maxHops--;

        for (let i = 0; i < routes.length; i++) {
            let tokenA: Token = routes[i][0];
            let tokenB: Token = routes[i][1];

            if (tokenA.utils.isEqual(srcToken) || tokenB.utils.isEqual(srcToken)) {
                let nextLpPath: [Token, Token][] = routes.slice(0, i).concat(routes.slice(i + 1)); // remove current pair

                let nextPaths: Token[][];

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
            let filteredPahts: Token[][] = [];
            for (let p in paths) {
                let path: Token[] = paths[p];
                let lastToken: Token = path[path.length - 1];

                if (lastToken.utils.isEqual(dstToken)) {
                    filteredPahts.push(path);
                }
            }

            return filteredPahts;
        }

        return paths;
    }

    async swap(path: Token[], srcAmount: number, dstMinReturn: number, to: string, deadline: number = 300): Promise<TransactionConfig> {
        let amountIn: string = await path[0].utils.fromDecimal(srcAmount);
        let amountOutMin: string = await path[path.length - 1].utils.fromDecimal(dstMinReturn);

        let addrPath: string[] = [];
        path.forEach(token => addrPath.push(token.getAddress()));

        let txConfig: TransactionConfig = {
            to: this.contract.options.address,
            gas: 250000 + ((addrPath.length - 2) * 50000)
        }

        deadline += Math.floor((new Date()).getTime() / 1000);

        let method: string = (this.supportFeeOnTransferTokens ? 'swapExactTokensForTokensSupportingFeeOnTransferTokens' : 'swapExactTokensForTokens');
        txConfig.data = this.contract.methods[method](amountIn, amountOutMin, addrPath, to, deadline).encodeABI();

        return txConfig;
    }
}
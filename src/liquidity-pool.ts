import { Token } from "erc20";
import Web3 from "web3";
const lpAbi = require('../liquidity-pool.abi.json')

export class LiquidityPool extends Token {
    constructor(protected web3: Web3, address: string) {
        super(web3, address, lpAbi);
    }

    private tokenA: Promise<Token>;
    public getTokenA(): Promise<Token> {
        if (!this.tokenA) {
            this.tokenA = this.contract.methods.token0().call().then(address => Token.getInstance(this.web3, address));
        }

        return this.tokenA;
    }

    private tokenB: Promise<Token>;
    public getTokenB(): Promise<Token> {
        if (!this.tokenB) {
            this.tokenB = this.contract.methods.token1().call().then(address => Token.getInstance(this.web3, address));
        }

        return this.tokenB;
    }

    public async getReserves(): Promise<[number, number]> {
        let reserves = await this.contract.methods.getReserves().call();
        let token0 = await this.getTokenA();
        let token1 = await this.getTokenB();

        return [
            await token0.utils.toDecimal(reserves[0]),
            await token1.utils.toDecimal(reserves[1]),
        ];
    }
}
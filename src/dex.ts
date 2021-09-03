import Web3 from 'web3';
import { Token } from 'erc20-list';
import { TransactionConfig } from "web3-eth";
import { Router } from './router';

export class Dex {

    public router: Router;

    constructor(protected web3: Web3, routerAddr: string = '0x7a250d5630b4cf539739df2c5dacb4c659f2488d') {
        this.router = new Router(this.web3, routerAddr);
    }

    getPrice(srcAmount: number, srcToken: Token, dstToken: Token): Promise<number> {
        return this.router.getBestPath(srcAmount, srcToken, dstToken).then(path =>
            this.router.getAmountsOut(srcAmount, path).then(amounts => amounts.pop())
        );
    }

    getRate(srcAmount: number, srcToken: Token, dstToken: Token): Promise<number> {
        return this.getPrice(srcAmount, srcToken, dstToken).then(price => price / srcAmount);
    }

    swap(srcAmount: number, srcToken: Token, dstMinReturn: number, dstToken: Token, to: string, deadline: number = 300): Promise<TransactionConfig> {
        return this.router.getBestPath(srcAmount, srcToken, dstToken).then(bestPath => this.router.swap(bestPath, srcAmount, dstMinReturn, to, deadline))
    }

    approve(token: Token): Promise<TransactionConfig> {
        return token.approve(this.router.contract.options.address);
    }

    isApproved(sellerAddr: string, token: Token): Promise<boolean> {
        return token.getAllowance(sellerAddr, this.router.contract.options.address).then((allowence: number) => allowence > 0);
    }
}
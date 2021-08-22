import Web3 from 'web3';
import { Token } from 'erc20-list';
import { TransactionConfig } from "web3-eth";
import { Router } from './router';
export declare class Dex {
    protected web3: Web3;
    router: Router;
    constructor(web3: Web3, routerAddr?: string);
    getPrice(srcAmount: number, srcToken: Token, dstToken: Token): Promise<number>;
    getRate(srcAmount: number, srcToken: Token, dstToken: Token): Promise<number>;
    swap(srcAmount: number, srcToken: Token, dstMinReturn: number, dstToken: Token, to: string, deadline?: number): Promise<TransactionConfig>;
    approve(token: Token): Promise<TransactionConfig>;
    isApproved(sellerAddr: string, token: Token): Promise<boolean>;
}

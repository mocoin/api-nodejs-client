/**
 * コイン転送プロセス
 */
const moment = require('moment');
const mocoinapi = require('../../lib');
const auth = require('../auth');

async function main() {
    const authClient = await auth.login();
    await authClient.refreshAccessToken();
    const loginTicket = authClient.verifyIdToken({});
    console.log('username is', loginTicket.getUsername());

    const transferCoinService = new mocoinapi.service.transaction.TransferCoin({
        endpoint: process.env.MOCOIN_API_ENDPOINT,
        auth: authClient
    });
    const personService = new mocoinapi.service.Person({
        endpoint: process.env.MOCOIN_API_ENDPOINT,
        auth: authClient
    });

    // 取引に使用する口座を決定する
    console.log('口座を検索しています...');
    let coinAccounts = await personService.searchCoinAccounts({
        personId: 'me'
    });
    coinAccounts = coinAccounts.filter((a) => a.status === mocoinapi.factory.pecorino.accountStatusType.Opened);
    if (coinAccounts.length === 0) {
        throw new Error('コイン口座が存在しません。');
    }
    const coinAccount = coinAccounts[0];
    console.log('コイン口座', coinAccount.accountNumber, 'にコインを転送します...');

    console.log('取引を開始します...');
    const transaction = await transferCoinService.start({
        expires: moment().add(30, 'minutes').toDate(),
        agent: {
            typeOf: mocoinapi.factory.personType.Person,
            name: loginTicket.getUsername()
        },
        recipient: {
            typeOf: mocoinapi.factory.personType.Person,
            name: '振り込む口座の所有者'
        },
        amount: 100,
        notes: 'test from sample',
        fromLocation: {
            typeOf: mocoinapi.factory.ownershipInfo.AccountGoodType.Account,
            accountType: mocoinapi.factory.accountType.Coin,
            accountNumber: coinAccount.accountNumber
        },
        toLocation: {
            typeOf: mocoinapi.factory.ownershipInfo.AccountGoodType.Account,
            accountType: mocoinapi.factory.accountType.Coin,
            accountNumber: '08103100071'
        }
    });
    console.log('取引を開始しました。');

    // 取引を中止する場合はコチラ↓
    // console.log('取引を中止します...');
    // await transferCoinService.cancel(transaction);
    // console.log('取引を中止しました。');

    console.log('取引を確定します...');
    await transferCoinService.confirm(transaction);
    console.log('取引確定です。');
}

async function wait(waitInMilliseconds) {
    return new Promise((resolve) => setTimeout(resolve, waitInMilliseconds));
}

main().then(() => {
    console.log('success!');
}).catch(console.error);

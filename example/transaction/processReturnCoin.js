/**
 * コイン`返金プロセス
 */
const moment = require('moment');
const mocoinapi = require('../../lib');
const auth = require('../auth');

async function main() {
    const authClient = await auth.login();
    await authClient.refreshAccessToken();
    const loginTicket = authClient.verifyIdToken({});
    console.log('username is', loginTicket.getUsername());

    const returnCoinService = new mocoinapi.service.transaction.ReturnCoin({
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

    // 出金元を検索する
    console.log('決済方法を検索しています...');
    let paymentMethods = await personService.searchPaymentMethods({
        personId: 'me'
    });
    if (paymentMethods.length === 0) {
        throw new Error('決済方法が存在しません。');
    }
    const paymentMethod = paymentMethods[0];
    console.log(paymentMethod.paymentMethodType, 'からコインを転送します...');

    console.log('取引を開始します...');
    const transaction = await returnCoinService.start({
        expires: moment().add(30, 'minutes').toDate(),
        agent: {
            typeOf: mocoinapi.factory.personType.Person,
            name: loginTicket.getUsername()
        },
        recipient: {
            typeOf: mocoinapi.factory.personType.Person,
            name: '自分の口座に返金'
        },
        amount: 1,
        notes: 'test from sample',
        fromLocation: {
            typeOf: mocoinapi.factory.ownershipInfo.AccountGoodType.CoinAccount,
            accountNumber: coinAccount.accountNumber
        },
        toLocation: paymentMethod
    });
    console.log('取引を開始しました。');

    // 取引を中止する場合はコチラ↓
    // console.log('取引を中止します...');
    // await returnCoinService.cancel(transaction);
    // console.log('取引を中止しました。');

    console.log('取引を確定します...');
    await returnCoinService.confirm(transaction);
    console.log('取引確定です。');
}

async function wait(waitInMilliseconds) {
    return new Promise((resolve) => setTimeout(resolve, waitInMilliseconds));
}

main().then(() => {
    console.log('success!');
}).catch(console.error);

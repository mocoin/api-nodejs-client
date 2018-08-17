/**
 * コイン出金プロセス
 */
const moment = require('moment');
const mocoinapi = require('../../lib/index');
const auth = require('../auth');

async function main() {
    const authClient = await auth.login();
    await authClient.refreshAccessToken();
    const loginTicket = authClient.verifyIdToken({});
    console.log('username is', loginTicket.getUsername());

    const clientAuthClient = new mocoinapi.auth.ClientCredentials({
        domain: process.env.TEST_AUTHORIZE_SERVER_DOMAIN,
        clientId: process.env.TEST_CLIENT_ID,
        clientSecret: process.env.TEST_CLIENT_SECRET,
        scopes: [],
        state: ''
    });

    const withdrawCoinService = new mocoinapi.service.transaction.WithdrawCoin({
        endpoint: process.env.MOCOIN_API_ENDPOINT,
        auth: authClient
    });
    const withdrawCoinService4backend = new mocoinapi.service.transaction.WithdrawCoin({
        endpoint: process.env.MOCOIN_API_ENDPOINT,
        auth: clientAuthClient
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
    console.log('コイン口座', coinAccount.accountNumber, 'からコインを出金します...');

    console.log('取引を開始します...');
    const transaction = await withdrawCoinService.start({
        expires: moment().add(30, 'minutes').toDate(),
        agent: {
            typeOf: mocoinapi.factory.personType.Person,
            name: loginTicket.getUsername()
        },
        recipient: {
            typeOf: mocoinapi.factory.personType.Person,
            name: 'WithdrawCoinを受け取る相手'
        },
        amount: 1,
        notes: 'test from sample',
        fromLocation: {
            typeOf: mocoinapi.factory.ownershipInfo.AccountGoodType.Account,
            accountType: mocoinapi.factory.accountType.Coin,
            accountNumber: coinAccount.accountNumber
        }
    });
    console.log('取引を開始しました。');

    // 取引を中止する場合はコチラ↓
    // console.log('取引を中止します...');
    // await transferCoinService.cancel(transaction);
    // console.log('取引を中止しました。');

    console.log('取引を確定します...');
    await withdrawCoinService4backend.confirm(transaction);
    console.log('取引確定です。');
}

async function wait(waitInMilliseconds) {
    return new Promise((resolve) => setTimeout(resolve, waitInMilliseconds));
}

main().then(() => {
    console.log('success!');
}).catch(console.error);

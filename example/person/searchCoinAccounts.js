/**
 * コイン口座検索サンプル
 */
const util = require('util');
const mocoinapi = require('../../lib/');
const auth = require('../auth');

async function main() {
    const authClient = await auth.login();

    const personService = new mocoinapi.service.Person({
        endpoint: process.env.MOCOIN_API_ENDPOINT,
        auth: authClient
    });
    let accounts = await personService.searchCoinAccounts({
        personId: 'me'
    });
    console.log(accounts.length, 'accounts found.');

    accounts = accounts.filter((a) => a.status === 'Opened');
    console.log(accounts.length, 'opened accounts found.');

    const loginTicket = authClient.verifyIdToken({});
    console.log('username is', loginTicket.getUsername());

    // 口座未開設であれば開設
    if (accounts.length === 0) {
        const newAccount = await personService.openCoinAccount({
            personId: 'me',
            name: loginTicket.getUsername()
        });
        console.log('account opened.', newAccount.accountNumber);

        // 口座解約の場合
        // await personService.closeCoinAccount({
        //     personId: 'me',
        //     accountNumber: newAccount.accountNumber
        // });
        // console.log('account closed.');
    } else {
        const moneyTransferActions = await personService.searchCoinAccountMoneyTransferActions({
            personId: 'me',
            accountNumber: accounts[0].accountNumber
        });
        console.log(moneyTransferActions.length, 'moneyTransfer actions found.');
        console.log(moneyTransferActions.map((a) => {
            return util.format(
                '%s %s %s %s %s[%s] -> %s %s[%s] @%s ### %s',
                a.endDate,
                a.typeOf,
                a.amount,
                (a.agent !== undefined) ? a.agent.name : a.agent.id,
                a.fromLocation.typeOf,
                (a.fromLocation.accountNumber !== undefined) ? a.fromLocation.accountNumber : '',
                (a.recipient !== undefined) ? a.recipient.name : a.recipient.id,
                a.toLocation.typeOf,
                (a.toLocation.accountNumber !== undefined) ? a.toLocation.accountNumber : '',
                a.purpose.typeOf,
                a.description
            );
        }).join('\n'));
    }
}

main().then(() => {
    console.log('main processed.');
}).catch(console.error);

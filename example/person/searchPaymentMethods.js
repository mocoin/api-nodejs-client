/**
 * 決済方法検索サンプル
 */
const mocoinapi = require('../../lib/');
const auth = require('../auth');

async function main() {
    const authClient = await auth.login();

    const personService = new mocoinapi.service.Person({
        endpoint: process.env.MOCOIN_API_ENDPOINT,
        auth: authClient
    });
    let paymentMethods = await personService.searchPaymentMethods({
        personId: 'me'
    });
    console.log('paymentMethods found.', paymentMethods);
    console.log(paymentMethods.length, 'paymentMethods found.');

    if (paymentMethods.length === 0) {
        const newPaymentMethod = await personService.addPaymentMethod({
            personId: 'me',
            paymentMethodType: mocoinapi.factory.paymentMethodType.BankAccount,
            accountNumber: '41600880117'
            // accountNumber: '12345'
        });
        console.log('payment method added.', newPaymentMethod);
    }
}

main().then(() => {
    console.log('main processed.');
}).catch(console.error);

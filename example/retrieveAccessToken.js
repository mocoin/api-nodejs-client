/**
 * アクセストークン発行サンプル
 */
const open = require('open');
const readline = require('readline');
const mocoin = require('../lib/index');

async function main() {
    const scopes = [];

    const auth = new mocoin.auth.OAuth2({
        domain: process.env.TEST_AUTHORIZE_SERVER_DOMAIN,
        clientId: process.env.TEST_CLIENT_ID_OAUTH2,
        clientSecret: process.env.TEST_CLIENT_SECRET_OAUTH2,
        redirectUri: 'https://localhost/signIn',
        logoutUri: 'https://localhost/signOut'
    });

    const state = '12345';
    const codeVerifier = '12345';

    const authUrl = auth.generateAuthUrl({
        scopes: scopes,
        state: state,
        codeVerifier: codeVerifier
    });
    console.log('authUrl:', authUrl);

    open(authUrl);

    await new Promise((resolve, reject) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question('認可コードを入力してください:\n', async (code) => {
            rl.question('ステートを入力してください:\n', async (givenState) => {
                if (givenState !== state) {
                    reject(new Error('state not matched'));

                    return;
                }

                let credentials = await auth.getToken(code, codeVerifier);
                console.log('credentials published', credentials);
                auth.setCredentials(credentials);

                rl.close();
                resolve();
            });
        });
    });

    const logoutUrl = auth.generateLogoutUrl();
    console.log('logoutUrl:', logoutUrl);

    const loginTicket = auth.verifyIdToken({});
    console.log('username:', loginTicket.getUsername());

}

main().then(() => {
    console.log('main processed.');
}).catch((err) => {
    console.error(err);
});

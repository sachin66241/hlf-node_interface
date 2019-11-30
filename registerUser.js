/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { FileSystemWallet, Gateway, X509WalletMixin } = require('fabric-network');
const path = require('path');

const ccpPath = path.resolve(__dirname, '..', 'hlf-network', 'connection', 'profiles', 'connection-userOrg.json');

const user = process.argv.slice(2)[0];

async function main() {
    try {
        if(!user){
            console.log("Enter name");
            return;
        }
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);

        const userExists = await wallet.exists(user);
        if (userExists) {
            console.log('An identity for the ' + user + ' already exists in the wallet');
            return;
        }

        const adminExists = await wallet.exists('admin');
        if (!adminExists) {
            console.log('An identity for the admin user "admin" does not exist in the wallet');
            console.log('Run the enrollAdmin.js application before retrying');
            return;
        }

        const gateway = new Gateway();
        await gateway.connect(ccpPath, { wallet, identity: 'admin', discovery: { enabled: true, asLocalhost: true } });

        const ca = gateway.getClient().getCertificateAuthority();
        const adminIdentity = gateway.getCurrentIdentity();

        const secret = await ca.register({ enrollmentID: user, role: 'client' }, adminIdentity);
        const enrollment = await ca.enroll({ enrollmentID: user, enrollmentSecret: secret });
        const userIdentity = X509WalletMixin.createIdentity('Org2MSP', enrollment.certificate, enrollment.key.toBytes());
        await wallet.import(user, userIdentity);
        console.log('Successfully registered and enrolled admin user ' + user + ' and imported it into the wallet');

    } catch (error) {
        console.error(`Failed to register user ${user}: ${error}`);
        process.exit(1);
    }
}

main();
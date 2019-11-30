/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { FileSystemWallet, Gateway } = require('fabric-network');
const path = require('path');

const ccpPath = path.resolve(__dirname, '..', 'hlf-network', 'connection', 'profiles', 'connection-userOrg.json');

async function main() {
    try {
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);

        const user = 'contractAdmin';

        const userExists = await wallet.exists(user);
        if (!userExists) {
            console.log('An identity for the user ' + user + ' does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        const gateway = new Gateway();
        await gateway.connect(ccpPath, { wallet, identity: user, discovery: { enabled: true, asLocalhost: true } });
        const network = await gateway.getNetwork('mychannel');
        const contract = network.getContract('mytoken');

        await contract.submitTransaction('assignAdmin');
        // await contract.submitTransaction('allot', 'Org2MSP.user2', "100");
        console.log('Transaction has been submitted');

        await gateway.disconnect();
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }
}

main();
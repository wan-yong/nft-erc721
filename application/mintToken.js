'use strict';

const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const { buildCCPOrg1, buildWallet, prettyJSONString} = require('./src/enroll/utils/AppUtil.js');

const myChannel = 'mychannel';
const myChaincodeName = 'token_erc721';

async function mintToken(ccp,wallet,user,metadataURI) {
	try {

		const gateway = new Gateway();

		//connect using Discovery enabled
		await gateway.connect(ccp,
			{ wallet: wallet, identity: user, discovery: { enabled: true, asLocalhost: true } });

		const network = await gateway.getNetwork(myChannel);
		const contract = network.getContract(myChaincodeName);

		let statefulTxn = contract.createTransaction('MintWithTokenURI');

		// TODO - UUID generator for NFT
		const tokenId = `asset${Date.now()}`
		
		console.log('\n--> Submit Transaction: Propose a new auction');
		await statefulTxn.submit(tokenId, metadataURI);
		console.log('*** Result: committed');

		console.log('\n--> Evaluate Transaction: query the auction that was just created');
		let result = await contract.evaluateTransaction('TokenURI', tokenId);
		console.log('*** Result: Auction: ' + prettyJSONString(result.toString()));

		gateway.disconnect();
	} catch (error) {
		console.error(`******** FAILED to submit: ${error}`);
	}
}

async function main() {
	try {

		if (process.argv[2] === undefined || process.argv[3] === undefined ||
            process.argv[4] === undefined) {
			console.log('Usage: node mintToken.js org userID metadataURI');
			process.exit(1);
		}

		const org = process.argv[2];
		const user = process.argv[3];
		const metadataURI = process.argv[4];

		if (org === 'Org1' || org === 'org1') {
			const ccp = buildCCPOrg1();
			const walletPath = path.join(__dirname, 'wallet/org1');
			const wallet = await buildWallet(Wallets, walletPath);
			await mintToken(ccp,wallet,user,metadataURI);
		}  else {
			console.log('For now, Org must be Org1, coz there is a check in chaincode.');
		}
	} catch (error) {
		console.error(`******** FAILED to run the application: ${error}`);
	}
}


main();

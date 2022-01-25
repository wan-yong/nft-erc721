const config = {

    // The pinningService config tells minty what remote pinning service to use for pinning the IPFS data for a token.
    // The values are read in from environment variables, to discourage checking credentials into source control.
    // You can make things easy by creating a .env file with your environment variable definitions. See the example files
    // pinata.env.example and nft.storage.env.example in this directory for templates you can use to get up and running.
    pinningService: {
        name: '$$PINNING_SERVICE_NAME',
        endpoint: '$$PINNING_SERVICE_ENDPOINT',
        key: '$$PINNING_SERVICE_KEY'
    },

    // If you're running IPFS on a non-default port, update this URL. If you're using the IPFS defaults, you should be all set.
    //ipfsApiUrl: 'http://localhost:5001',
   
    // Using a external ipfs provider
    ipfsApiUrl: 'https://ipfs.infura.io:5001/api/v0',

    // If you're running the local IPFS gateway on a non-default port, or if you want to use a public gatway when displaying IPFS gateway urls, edit this.
    //ipfsGatewayUrl: 'http://localhost:8080/ipfs',
    
    // Using a external gateway
    ipfsGatewayUrl: 'https://ipfs.infura.io:8080/ipfs',
	
	
    // The connection profiles when the smart contract is deployed.
    channelName: 'mychannel',
    chaincodeName: 'token_erc721',

    mspOrg1: 'Org1MSP',
    org1UserId: 'minter',
	
    // For futher use
    caHostName: 'ca.org1.example.com',
    affiliation: 'org1.department1',
}

module.exports = config

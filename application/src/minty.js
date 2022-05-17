const fs = require('fs/promises')
const path = require('path')

const CID = require('multiformats/cid').CID
const { create } = require('ipfs-http-client')

const concatBuffers = require('concat-buffers')
const { utf8ArrayToString, base64Encode } = require('base64-utf8-array')

const { Gateway, Wallets } = require('fabric-network')
const { buildCCPOrg1, buildWallet } = require('./enroll/utils/AppUtil.js')


// The getconfig package loads configuration from files located in the the `config` directory.
// See https://www.npmjs.com/package/getconfig for info on how to override the default config for
// different environments (e.g. testnet, mainnet, staging, production, etc).
const config = require('getconfig')

// ipfs.add parameters for more deterministic CIDs
const ipfsAddOptions = {
  cidVersion: 1,
  hashAlg: 'sha2-256'
}

/**
 * Construct and asynchronously initialize a new Minty instance.
 * @returns {Promise<Minty>} a new instance of Minty, ready to mint NFTs.
 */
 async function MakeMinty() {
    const m = new Minty()
    await m.init()
    return m
}

/**
 * Minty is the main object responsible for storing NFT data and interacting with the smart contract.
 * Before constructing, make sure that the smart ontract has been deployed.
 * 
 * Minty requires async initialization, so the Minty class (and its constructor) are not exported. 
 * To make one, use the async {@link MakeMinty} function.
 */
class Minty {
    constructor() {
        this.ipfs = null
        this.ccp = null
		this.wallet = null
        this._initialized = false
    }

    async init() {
        if (this._initialized) {
            return
        }
		
	/*x---------Smart Contract
		
        this.hardhat = require('hardhat')

        // The Minty object expects that the contract has already been deployed, with
        // details written to a deployment info file. The default location is `./minty-deployment.json`,
        // in the config.
        this.deployInfo = await loadDeploymentInfo()

        // connect to the smart contract using the address and ABI from the deploy info
        const {abi, address} = this.deployInfo.contract
        this.contract = await this.hardhat.ethers.getContractAt(abi, address)
		
	y---------Smart Contract*/
		
	// connection
	const {ccp, wallet} = await this.createConnection()
        this.ipfs = create(config.ipfsApiUrl)
        this.ccp = ccp
        this.wallet = wallet
        this._initialized = true
    }

    //////////////////////////////////////////////
    // ------ NFT Creation
    //////////////////////////////////////////////

    /**
     * Create a new NFT from the given asset data.
     * 
     * @param {Buffer|Uint8Array} content - a Buffer or UInt8Array of data (e.g. for an image)
     * @param {object} options
     * @param {?string} path - optional file path to set when storing the data on IPFS
     * @param {?string} name - optional name to set in NFT metadata
     * @param {?string} description - optional description to store in NFT metadata
     * 
     * @typedef {object} CreateNFTResult
     * @property {string} tokenId - the unique ID of the new token
     * @property {object} metadata - the JSON metadata stored in IPFS and referenced by the token's metadata URI
     * @property {string} metadataURI - an ipfs:// URI for the NFT metadata
     * @property {string} metadataGatewayURL - an HTTP gateway URL for the NFT metadata
     * @property {string} assetURI - an ipfs:// URI for the NFT asset
     * @property {string} assetGatewayURL - an HTTP gateway URL for the NFT asset
     * 
     * @returns {Promise<CreateNFTResult>}
     */
    async createNFTFromAssetData(content, options) {
        // add the asset to IPFS
        const filePath = options.path
        const basename =  path.basename(filePath)

        // When you add an object to IPFS with a directory prefix in its path,
        // IPFS will create a directory structure for you. This is nice, because
        // it gives us URIs with descriptive filenames in them e.g.
        // 'ipfs://QmaNZ2FCgvBPqnxtkbToVVbK2Nes6xk5K4Ns6BsmkPucAM/cat-pic.png' instead of
        // 'ipfs://QmaNZ2FCgvBPqnxtkbToVVbK2Nes6xk5K4Ns6BsmkPucAM'
        const ipfsPath = '/nft/' + basename
        const { cid: assetCid } = await this.ipfs.add({ path: ipfsPath, content }, ipfsAddOptions)

        // make the NFT metadata JSON
        const assetURI = ensureIpfsUriPrefix(assetCid) + '/' + basename
        const metadata = await this.makeNFTMetadata(assetURI, options)

        // add the metadata to IPFS
        const { cid: metadataCid } = await this.ipfs.add({ path: '/nft/metadata.json', content: JSON.stringify(metadata)}, ipfsAddOptions)
        const metadataURI = ensureIpfsUriPrefix(metadataCid) + '/metadata.json'

        // TODO - UUID generator for NFT
        // mint a new token referencing the metadata URI
	    // the tokenId MUST be 'int' to follow the erc721 rule
	    // there is an 'int' check in the chaincode
        const tokenId = `${Date.now()}`
	    await this.mintToken(tokenId, metadataURI)
	
        // format and return the results
        return {
            tokenId,
            metadata,
            assetURI,
            metadataURI,
            assetGatewayURL: makeGatewayURL(assetURI),
            metadataGatewayURL: makeGatewayURL(metadataURI),
        }
    }

    /**
     * Create a new NFT from an asset file at the given path.
     * 
     * @param {string} filename - the path to an image file or other asset to use
     * @param {object} options
     * @param {?string} name - optional name to set in NFT metadata
     * @param {?string} description - optional description to store in NFT metadata
     * 
     * @returns {Promise<CreateNFTResult>}
     */
    async createNFTFromAssetFile(filename, options) {
        const content = await fs.readFile(filename)
        return this.createNFTFromAssetData(content, {...options, path: filename})
    }

    /**
     * Helper to construct metadata JSON for 
     * @param {string} assetCid - IPFS URI for the NFT asset
     * @param {object} options
     * @param {?string} name - optional name to set in NFT metadata
     * @param {?string} description - optional description to store in NFT metadata
     * @returns {object} - NFT metadata object
     */
    async makeNFTMetadata(assetURI, options) {
        const {name, description} = options;
        assetURI = ensureIpfsUriPrefix(assetURI)
        return {
            name,
            description,
            image: assetURI
        }
    }

    //////////////////////////////////////////////
    // -------- NFT Retreival
    //////////////////////////////////////////////

    /**
     * Get information about an existing token. 
     * By default, this includes the token id, owner address, metadata, and metadata URI.
     * ??To include info about when the token was created and by whom, set `opts.fetchCreationInfo` to true.
     * To include the full asset data (base64 encoded), set `opts.fetchAsset` to true.
     *
     * @param {string} tokenId
     * @param {object} opts
     * @param {?boolean} opts.fetchAsset - if true, asset data will be fetched from IPFS and returned in assetData (base64 encoded)
     * 
     * 
     * @typedef {object} NFTInfo
     * @property {string} tokenId
     * @property {string} ownerAddress
     * @property {object} metadata
     * @property {string} metadataURI
     * @property {string} metadataGatewayURI
     * @property {string} assetURI
     * @property {string} assetGatewayURL
     * @property {?string} assetDataBase64
     * @returns {Promise<NFTInfo>}
     */
    async getNFT(tokenId, opts) {
        const {ownerAddress, metadata, metadataURI} = await this.getNFTMetadata(tokenId)
        const metadataGatewayURL = makeGatewayURL(metadataURI)
        const nft = {tokenId, ownerAddress, metadata, metadataURI, metadataGatewayURL}
        const {fetchAsset} = (opts || {})
        if (metadata.image) {
            nft.assetURI = metadata.image
            nft.assetGatewayURL = makeGatewayURL(metadata.image)
            if (fetchAsset) {
                nft.assetDataBase64 = await this.getIPFSBase64(metadata.image)
            }
        }
        return nft
    }

    /**
     * Fetch the NFT metadata for a given token id.
     * 
     * @param tokenId - the id of an existing token
     * @returns {Promise<{ownerAddress: string, metadata: string, metadataURI: string}>} - resolves to an object containing the metadata
     * metadata URI. Fails if the token does not exist, or if fetching the data fails.
     */
    async getNFTMetadata(tokenId) {
		try {
			const gateway = new Gateway();
			await gateway.connect(this.ccp, {
				wallet: this.wallet,
				identity: config.org1UserId,
				discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
			});

			// Build a network instance based on the channel where the smart contract is deployed
			const network = await gateway.getNetwork(config.channelName)

			// Get the contract from the network.
			const contract = network.getContract(config.chaincodeName)
			
			console.log('\n--> Evaluate Transaction: TokenURI, returns metadataURI of a given tokenID')
			const resultMetadataURI = await contract.evaluateTransaction('TokenURI', tokenId)
                        const metadataURI = resultMetadataURI.toString()
			console.log(`*** Result metadataURI: ${metadataURI}`)

			console.log('\n--> Evaluate Transaction: OwnerOf, returns ownerAddress of a given tokenID')
			const resultOwner = await contract.evaluateTransaction('OwnerOf', tokenId)
                        const ownerAddress = resultOwner.toString()
			console.log(`*** Result ownerAddress: ${ownerAddress}`)
			
			// This will close all connections to the fabric network
			gateway.disconnect()
                        
			console.log('\n--> Evaluate Transaction: getIPFSJSON, returns metadata of a given tokenID')
			const metadata = await this.getIPFSJSON(metadataURI)
			console.log(`*** Result metadata: ${metadata}`)
                        
			return {ownerAddress, metadata, metadataURI}
	
		} catch (error) {
			console.error(`******** FAILED to show tokens: ${error}`)
		}
    }


    /**
     * Create a new NFT token that references the given metadata CID.
     * 
     * @param {String} tokenId - Unique ID of the non-fungible token to be minted
     * @param {String} metadataURI - URI containing metadata of the minted non-fungible token
     */
    async mintToken(tokenId, metadataURI) {
        // the smart contract adds an ipfs:// prefix to all URIs, so make sure it doesn't get added twice
        metadataURI = stripIpfsUriPrefix(metadataURI)

		try {
			const gateway = new Gateway();
			await gateway.connect(this.ccp, {
				wallet: this.wallet,
				identity: config.org1UserId,
				discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
			});

			// Build a network instance based on the channel where the smart contract is deployed
			const network = await gateway.getNetwork(config.channelName);

			// Get the contract from the network.
			const contract = network.getContract(config.chaincodeName);
			
			console.log('\n--> Submit Transaction: MintWithTokenURI, creates new NFT with tokenId, tokenURI arguments');
			const resultBuf = await contract.submitTransaction('MintWithTokenURI', tokenId, metadataURI);
			console.log('*** Result: committed');
			if (`${resultBuf}` !== '') {
				console.log(`*** Result: ${prettyJSONString(resultBuf.toString())}`);
			}
			
			// This will close all connections to the network
			gateway.disconnect();
		} catch (error) {
			console.error(`******** FAILED to mint tokens: ${error}`);
		}

		/*x---------Smart Contract

        // Call the mintToken method to issue a new token to the given address
        // This returns a transaction object, but the transaction hasn't been confirmed
        // yet, so it doesn't have our token id.
        const tx = await this.contract.mintToken(ownerAddress, metadataURI)

        // The OpenZeppelin base ERC721 contract emits a Transfer event when a token is issued.
        // tx.wait() will wait until a block containing our transaction has been mined and confirmed.
        // The transaction receipt contains events emitted while processing the transaction.
        const receipt = await tx.wait()
        for (const event of receipt.events) {
            if (event.event !== 'Transfer') {
                console.log('ignoring unknown event type ', event.event)
                continue
            }
            return event.args.tokenId.toString()
        }

        throw new Error('unable to get token id')

		*y---------Smart Contract*/
    }

    async transferToken(tokenId, fromAddress, toAddress) {
	    let result = false	
	    try {
			const gateway = new Gateway();
			await gateway.connect(this.ccp, {
				wallet: this.wallet,
				identity: config.org1UserId,
				discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
			});

			// Build a network instance based on the channel where the smart contract is deployed
			const network = await gateway.getNetwork(config.channelName);

			// Get the contract from the network.
			const contract = network.getContract(config.chaincodeName);
			
			console.log('\n--> Submit Transaction: TransferFrom, transfer token');
			result = await contract.submitTransaction('TransferFrom', fromAddress, toAddress, tokenId);
			// This will close all connections to the network
			gateway.disconnect()
		} catch (error) {
			console.error(`******** FAILED to transfer token: ${error}`)
		}

        return result	

        /*x---------Smart Contract
        const fromAddress = await this.getTokenOwner(tokenId)

        // because the base ERC721 contract has two overloaded versions of the safeTranferFrom function,
        // we need to refer to it by its fully qualified name.
        const tranferFn = this.contract['safeTransferFrom(address,address,uint256)']
        const tx = await tranferFn(fromAddress, toAddress, tokenId)

        // wait for the transaction to be finalized
        await tx.wait()
        *y---------Smart Contract*/

    }
	
    //////////////////////////////////////////////
    // --- Smart Contract Utils
    //////////////////////////////////////////////

    /**
     * Get the smart contract connection info for the gateway.
     * 
     * @returns {Promise<{ccp: object, wallet: object}>} - smart contract connection info
     */
    async createConnection() {
	    // This sample assumes Org1 is the issuer with privilege to mint a new token
	    const ccp = buildCCPOrg1();

	    // setup the wallet to hold the credentials of the application user
        const walletPath = path.join(__dirname, '..', 'wallet/org1');
	    console.log(`*** walletPath: ${walletPath}`);
	    const wallet = await buildWallet(Wallets, walletPath);
			
	return {ccp, wallet}
	}


    //////////////////////////////////////////////
    // --------- IPFS helpers
    //////////////////////////////////////////////

    /**
     * Get the full contents of the IPFS object identified by the given CID or URI.
     * 
     * @param {string} cidOrURI - IPFS CID string or `ipfs://<cid>` style URI
     * @returns {Promise<Uint8Array>} - contents of the IPFS object
     */
    async getIPFS(cidOrURI) {
        const cid = stripIpfsUriPrefix(cidOrURI)
        return concatBuffers(await iterator(this.ipfs.cat(cid)))
    }

    /**
     * Get the contents of the IPFS object identified by the given CID or URI, and return it as a string.
     * 
     * @param {string} cidOrURI - IPFS CID string or `ipfs://<cid>` style URI
     * @returns {Promise<string>} - the contents of the IPFS object as a string
     */
    async getIPFSString(cidOrURI) {
        const bytes = await this.getIPFS(cidOrURI)
        return utf8ArrayToString(bytes)
    }

    /**
     * Get the full contents of the IPFS object identified by the given CID or URI, and return it as a base64 encoded string.
     * 
     * @param {string} cidOrURI - IPFS CID string or `ipfs://<cid>` style URI
     * @returns {Promise<string>} - contents of the IPFS object, encoded to base64
     */
    async getIPFSBase64(cidOrURI) {
        const bytes = await this.getIPFS(cidOrURI)
        return base64Encode(bytes)
    }

    /**
     * Get the contents of the IPFS object identified by the given CID or URI, and parse it as JSON, returning the parsed object.
     *  
     * @param {string} cidOrURI - IPFS CID string or `ipfs://<cid>` style URI
     * @returns {Promise<string>} - contents of the IPFS object, as a javascript object (or array, etc depending on what was stored). Fails if the content isn't valid JSON.
     */
    async getIPFSJSON(cidOrURI) {
	const str = await this.getIPFSString(cidOrURI)
	return JSON.parse(str)
    }

    //////////////////////////////////////////////
    // -------- Pinning to remote services
    //////////////////////////////////////////////

    /**
     * Pins all IPFS data associated with the given tokend id to the remote pinning service.
     * 
     * @param {string} tokenId - the ID of an NFT that was previously minted.
     * @returns {Promise<{assetURI: string, metadataURI: string}>} - the IPFS asset and metadata uris that were pinned.
     * Fails if no token with the given id exists, or if pinning fails.
     */
    async pinTokenData(tokenId) {
        const {metadata, metadataURI} = await this.getNFTMetadata(tokenId)
        const {image: assetURI} = metadata
        
        console.log(`Pinning asset data (${assetURI}) for token id ${tokenId}....`)
        await this.pin(assetURI)

        console.log(`Pinning metadata (${metadataURI}) for token id ${tokenId}...`)
        await this.pin(metadataURI)

        return {assetURI, metadataURI}
    }

    /**
     * Request that the remote pinning service pin the given CID or ipfs URI.
     * 
     * @param {string} cidOrURI - a CID or ipfs:// URI
     * @returns {Promise<void>}
     */
    async pin(cidOrURI) {
        const cid = extractCID(cidOrURI)

        // Make sure IPFS is set up to use our preferred pinning service.
        await this._configurePinningService()

        // Check if we've already pinned this CID to avoid a "duplicate pin" error.
        const pinned = await this.isPinned(cid)
        if (pinned) {
            return
        }

        // Ask the remote service to pin the content.
        // Behind the scenes, this will cause the pinning service to connect to our local IPFS node
        // and fetch the data using Bitswap, IPFS's transfer protocol.
        await this.ipfs.pin.remote.add(cid, { service: config.pinningService.name })
    }


    /**
     * Check if a cid is already pinned.
     * 
     * @param {string|CID} cid 
     * @returns {Promise<boolean>} - true if the pinning service has already pinned the given cid
     */
    async isPinned(cid) {
        if (typeof cid === 'string') {
            cid = CID.parse(cid)
        }

        const opts = {
            service: config.pinningService.name,
            cid: [cid], // ls expects an array of cids
        }
        for await (const result of this.ipfs.pin.remote.ls(opts)) {
            if (result){
                return true
            }
        }
        return false
    }

    /**
     * Configure IPFS to use the remote pinning service from our config.
     * 
     * @private
     */
    async _configurePinningService() {
        if (!config.pinningService) {
            throw new Error(`No pinningService set up in minty config. Unable to pin.`)
        }

        // check if the service has already been added to js-ipfs
        for (const svc of await this.ipfs.pin.remote.service.ls()) {
            if (svc.service === config.pinningService.name) {
                // service is already configured, no need to do anything
                return
            }
        }

        // add the service to IPFS
        const { name, endpoint, key } = config.pinningService
        if (!name) {
            throw new Error('No name configured for pinning service')
        }
        if (!endpoint) {
            throw new Error(`No endpoint configured for pinning service ${name}`)
        }
        if (!key) {
            throw new Error(`No key configured for pinning service ${name}.` +
              `If the config references an environment variable, e.g. '$$PINATA_API_TOKEN', ` + 
              `make sure that the variable is defined.`)
        }
        await this.ipfs.pin.remote.service.add(name, { endpoint, key })
    }
}

//////////////////////////////////////////////
// -------- URI helpers
//////////////////////////////////////////////

/**
 * @param {string} cidOrURI either a CID string, or a URI string of the form `ipfs://${cid}`
 * @returns the input string with the `ipfs://` prefix stripped off
 */
 function stripIpfsUriPrefix(cidOrURI) {
    if (cidOrURI.startsWith('ipfs://')) {
        return cidOrURI.slice('ipfs://'.length)
    }
    return cidOrURI
}

function ensureIpfsUriPrefix(cidOrURI) {
    let uri = cidOrURI.toString()
    if (!uri.startsWith('ipfs://')) {
        uri = 'ipfs://' + cidOrURI
    }
    // Avoid the Nyan Cat bug (https://github.com/ipfs/go-ipfs/pull/7930)
    if (uri.startsWith('ipfs://ipfs/')) {
      uri = uri.replace('ipfs://ipfs/', 'ipfs://')
    }
    return uri
}

/**
 * Return an HTTP gateway URL for the given IPFS object.
 * @param {string} ipfsURI - an ipfs:// uri or CID string
 * @returns - an HTTP url to view the IPFS object on the configured gateway.
 */
function makeGatewayURL(ipfsURI) {
    return config.ipfsGatewayUrl + '/' + stripIpfsUriPrefix(ipfsURI)
}

/**
 * 
 * @param {string} cidOrURI - an ipfs:// URI or CID string
 * @returns {CID} a CID for the root of the IPFS path
 */
function extractCID(cidOrURI) {
    // remove the ipfs:// prefix, split on '/' and return first path component (root CID)
    const cidString = stripIpfsUriPrefix(cidOrURI).split('/')[0]
    console.log(`*****cidString: ${cidString}`)
    return CID.parse(cidString)
}

//////////////////////////////////////////////
// -------- JSON helpers
//////////////////////////////////////////////

function prettyJSONString(inputString) {
	return JSON.stringify(JSON.parse(inputString), null, 2);
}

//////////////////////////////////////////////
// -------- Iterator helpers
//////////////////////////////////////////////

/**
 *  * Collects all values from an (async) iterable into an array and returns it.
 *  
 *   @template T
 *   @param {AsyncIterable<T>|Iterable<T>} source
*/
async function iterator(source) {
  const arr = []

  for await (const entry of source) {
    arr.push(entry)
  }

  return arr
}


//////////////////////////////////////////////
// -------- Exports
//////////////////////////////////////////////

module.exports = {
    MakeMinty,
}

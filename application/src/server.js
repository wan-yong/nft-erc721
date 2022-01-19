var express = require('express');
var app = express();
const {MakeMinty} = require('./minty')

app.post('/add', function (req, res) {   
   const data = createNFT(req.params.path, req.params.options);
   res.end(data + "is created.");
})

app.get('/:id', function (req, res) {
   const data = getNFT(req.params.path, req.params.options);
   res.end(JSON.stringify(data));
})

app.post('/transfer', function (req, res) {   
   const data = transferNFT(req.params.path, req.params.from, req.params.to);
   res.end(JSON.stringify(data));
})

var server = app.listen(8081, function () {
   var host = server.address().address
   var port = server.address().port
   console.log("Example app listening at http://%s:%s", host, port)
})

async function createNFT(imagePath, options) {
    const minty = await MakeMinty()

    const nft = await minty.createNFTFromAssetFile(imagePath, answers)
    console.log('🌿 Minted a new NFT: ')
    console.log('NFT Metadata:')
    console.log(colorize(JSON.stringify(nft.metadata), colorizeOptions))

    return nft.tokenId
}

async function getNFT(tokenId, options) {
    const { assetInfo: fetchAsset } = options
    const minty = await MakeMinty()
    
    const nft = await minty.getNFT(tokenId, {fetchAsset})
    console.log('NFT Metadata:')
    console.log(colorize(JSON.stringify(nft.metadata), colorizeOptions))

    return nft
}

async function transferNFT(tokenId, fromAddress, toAddress) {
    const minty = await MakeMinty()

    await minty.transferToken(tokenId, fromAddress, toAddress)
    console.log(`🌿 Transferred token ${chalk.green(tokenId)} from ${chalk.yellow(fromAddress)} to ${chalk.yellow(toAddress)}`)
    return {
       tokenid:tokenId,
       from:fromAddress,
       to:toAddress
    }
}
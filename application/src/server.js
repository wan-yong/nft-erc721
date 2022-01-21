var express = require('express');
var app = express();
const {MakeMinty} = require('./minty')

app.use(express.json()) // 开启Express读取请求体JSON数据功能

app.get('assets/:id', function (req, res) {
   const options = {
      id: req.params.id,
      options: { assetInfo: Boolean(req.query.assetInfo==='true') }
   }
   const data = getNFT(req.params.id, options);
   res.end(JSON.stringify(data));
})

app.post('/transfer', function (req, res) {   
   const data = transferNFT(req.body.id, req.body.from, req.body.to);
   res.end(JSON.stringify(data));
})

var server = app.listen(8081, function () {
   var host = server.address().address
   var port = server.address().port
   console.log("Example app listening at http://%s:%s", host, port)
})

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
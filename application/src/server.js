var express = require('express');
var app = express();
const {MakeMinty} = require('./minty')

app.use(express.json()) // 开启Express读取请求体JSON数据功能

app.get('/assets/:id', async function (req, res) {
   const options = {
      assetInfo: Boolean(req.query.assetInfo==='true')
   }
   
   result = await getNFT(req.params.id, options) 
   res.end(JSON.stringify(result))
})

app.post('/transfer', async function (req, res) {   
   const data = await transferNFT(req.body.id, req.body.from, req.body.to)
   res.end(JSON.stringify(data))
})

var server = app.listen(8081, function () {
   var host = server.address().address
   var port = server.address().port
   console.log("Example app listening at http://%s:%s", host, port)
})

async function getNFT(tokenId, options) {
    const { assetInfo: fetchAsset } = options
    const minty = await MakeMinty()
    
    return(await minty.getNFT(tokenId, {fetchAsset}))
    
}

async function transferNFT(tokenId, fromAddress, toAddress) {
    const minty = await MakeMinty()

    if (await minty.transferToken(tokenId, fromAddress, toAddress)){
    
      return {
         tokenid:tokenId,
         from:fromAddress,
         to:toAddress
      }

    } else { 
	return { warnning: '*** Fail to transfer' } 
    }
}

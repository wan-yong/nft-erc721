var express = require('express');
var app = express();
const {MakeMinty} = require('./minty')

app.use(express.json()) // 开启Express读取请求体JSON数据功能

//all方法适用于所有的请求
app.all("*",function(req,res,next){
    //设置允许跨域的域名，*代表允许任意域名跨域
    res.header("Access-Control-Allow-Origin","*");
    //允许的header类型
    res.header("Access-Control-Allow-Headers","*");
    //跨域允许的请求方式
    res.header("Access-Control-Allow-Methods","DELETE,PUT,POST,GET,OPTIONS");
    if (req.method.toLowerCase() === 'options')
        res.send(200);  //让options尝试请求快速结束
    else
        next();
});

app.get('/assets/:id', async function (req, res) {
   const options = {
      assetInfo: Boolean(req.query.assetInfo==='true')
   }
   
   const result = await getNFT(req.params.id, options) 
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
    
    return(minty.getNFT(tokenId, {fetchAsset}))
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

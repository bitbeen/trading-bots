const axios = require('axios')

require('dotenv').config()

exports.getExchanges= async () => {
    //const url = `https://api.polygonscan.io/api?module=contract&action=getabi&address=${address}&apikey=${ETHERSCAN_API_KEY}`
    const url = `https://api.coingecko.com/api/v3/exchanges/list`
    
    const res = await axios.get(url)
    console.log(res.data[500])
    //const exchanges = JSON.parse(res.data)
   // return exchanges

}

exports.comparePrice= async () => {
    //const url = `https://api.polygonscan.io/api?module=contract&action=getabi&address=${address}&apikey=${ETHERSCAN_API_KEY}`
    const url = `https://api.coingecko.com/api/v3/exchanges/list`
    
    const res = await axios.get(url)
    console.log(res[0])
    //const exchanges = JSON.parse(res.data)
    //return exchanges
}

//coingecko market tickers also useful 
//https://api.coingecko.com/api/v3/exchanges/apeswap_polygon/tickers
//https://api.coingecko.com/api/v3/exchanges/balnacer_polygon/tickers
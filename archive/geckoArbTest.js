const axios = require('axios')

let pools = [] //list of pools for arbitrage

//you can use this as a long term tool to figure out which pools are best

const main = async() =>{


    
    

    let minute = await this_minute(pool)
    
    var close = minute[0][4]
    
    
   
}



/**
 * 
 * {
  liquidityPools(
    where: {inputTokens_: {symbol: "AAVE"}}
    orderBy: totalLiquidity
    orderDirection: desc
  ) {
    fees {
      feePercentage
    }
    name
    liquidityToken {
      name
      symbol
    }
  }
}

{
  liquidityPools(where: {name_contains: "Uniswap V3 Wrapped Matic/Aave (PoS)"}) {
    fees {
      feePercentage
    }
    id
    totalLiquidity
  }
}
 * 
 */

const this_minute = async() =>{
    let url = `https://api.geckoterminal.com/api/v2/networks/polygon_pos/pools//${pool}/ohlcv/minute?limit=5`
    let data 
    await axios.get(url)
        .then((result) =>{
            
            data = result.data.data.attributes.ohlcv_list
            
            
        })
        return data
}




main()
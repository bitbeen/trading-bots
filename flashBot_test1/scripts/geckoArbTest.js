const axios = require('axios')

let pools = [] //list of pools for arbitrage

//you can use this as a long term tool to figure out which pools are best

exports.getFeePools = async () => {
  const URL = 'https://api.thegraph.com/subgraphs/name/messari/uniswap-v3-polygon'
  let pools ={}
  /** Get pools from uniswap pools */
  
  
  query = `
  liquidityPools(where: {name_contains: "Uniswap V3 (PoS) Dai Stablecoin/(PoS) Tether USD"}) {
    fees {
      feePercentage
    }
    id
    totalLiquidity
  }
  `
  
  await axios.post(URL, {query: query})
      .then((result) =>{
          
          pools = result.data.data
         
          
      })
  return pools
      
  
}

/*
search for pools manually then find them by name
{
  liquidityPool(id: "0x254aa3a898071d6a2da0db11da73b02b4646078f") {
    name
  }
}*/



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
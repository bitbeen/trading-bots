const axios = require('axios')

//const URL = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3'

const URL = 'https://api.thegraph.com/subgraphs/name/messari/uniswap-v3-polygon'

const URLS = 'https://api.thegraph.com/subgraphs/name/sushi-v3/v3-polygon'

/*
query = `
    {
    pools(orderBy: volumeUSD, orderDirection:desc, first:10){
        id
        volumeUSD, 
        liquidity
        totalValueLockedUSD
        token0{
            symbol
        }
        token1{
            symbol
        }
        
    }
   
}
`*/

query = `
    {
  liquidityPools(orderBy: totalLiquidityUSD, first: 10) {
    activeLiquidityUSD
    id
    totalLiquidityUSD
    totalLiquidity
    totalValueLockedUSD
    inputTokens {
      name
      symbol
      id
    }
    
  }
}
`

queryS = `
{
    pools(first: 10, orderBy: liquidity) {
      id
      token0 {
        id
        symbol
      }
      token1 {
        id
        symbol
      }
      
    }
  
}

`

axios.post(URL, {query: query})
    .then((result) =>{
        console.log(result.data.data)
    })



    axios.post(URLS, {query: queryS})
    .then((result) =>{
        console.log(result.data.data)
    })
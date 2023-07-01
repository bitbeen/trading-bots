const ethers = require('ethers'); // connect to blockchain 
const { getAbi, getPoolData, getPoolFromTokens, _getAmountsOut, subgraphGetUniPools, subgraphGetSuhPools, matchingSushiPools } = require('./helpers')

const INFURA_URL = process.env.INFURA_URL
const provider = new ethers.providers.JsonRpcProvider(INFURA_URL); //init provider


const token0 = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'; // WMATIC
const token1 = '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'; // WETH

//const token0 = '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'; // WMATIC
//const token1 = '0xd6df932a45c0f255f85145f286ea0b292b21c90b'; // AAVE


//const uniRouterAddress = '0xE592427A0AEce92De3Edee1F18E0157C05861564'
//const sushiRouterAddress = '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506' //polygon address

const uniFactoryAddress = "0x1F98431c8aD98523631AE4a59f267346ea31F984";
const sushiFactoryAddress = "0x917933899c6a5F8E37F31E19f92CdBFF7e8FF0e2";

const UNI_SUBGRAPH_URL = 'https://api.thegraph.com/subgraphs/name/messari/uniswap-v3-polygon'
const SUH_SUBGRAPH_URL = 'https://api.thegraph.com/subgraphs/name/sushi-v3/v3-polygon'

const PATH = [token0, token1] //direction of swap ->

const poolFinder = async (UNI_SUBGRAPH_URL) => {
    console.log("working")
    //return list of all pool in Uni sushi with fee matched pairings
    const unipools = await subgraphGetUniPools()
    //const sushipools = await subgraphGetSuhPools()
 
    //check through list of unipools for matching token1, token 2 and fee tier
    //you can't find matching pools by pulling in both subgraphs it will on show top 99
    //this is why they wont match 


    //pull in the pools uniswap with the highest liquidity or trade volume
    //search the sushiswap sugraph for corresponding token pair and fee.
    //this ia the way to find matching trading pools.
    //console.log(sushipools.pools)
    matchingPools = []
   
    for (pool of unipools.liquidityPools){

      matchingpool = {
        sushiPoolID: "",
        tokenPath: [],
        tokenIDs:[],
        feeTier:"",
        uniPoolID:"",
        name:""
      }
        
        let id = pool.id
        let inputTokens = pool.inputTokens
        let fees = pool.fees
      
        let token0id = inputTokens[0].id
        let token1id = inputTokens[1].id
        let feeTier = pool.fees[1].feePercentage * 10000

        console.log(pool.name)
        console.log(id)
        console.log(token0id)
        console.log(token1id)
        console.log(feeTier) //3000 = 0.3 0.01 = 100 0.05
       

        let matchingSushiPool = await matchingSushiPools(token0id,token1id,feeTier)
        console.log(matchingSushiPool)
        console.log(matchingSushiPool.pools)
        if (matchingSushiPool.pools.length!==0){
          matchingpool.sushiPoolID = matchingSushiPool.pools[0].id
          matchingpool.uniPoolID = id
          matchingpool.name = pool.name
          matchingpool.tokenPath = [matchingSushiPool.pools[0].token0.symbol,matchingSushiPool.pools[0].token1.symbol]
          matchingpool.tokenIDs= [matchingSushiPool.pools[0].token0.id,matchingSushiPool.pools[0].token1.id]
          matchingpool.feeTier = feeTier
          matchingPools.push(matchingpool)
        }



    }
    console.log(matchingPools)

    /* Find a matching pool
      {
  pools(
    where: {token0_: {id: "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270"}, token1_: {id: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619"}}
  ) {
    id
    feeTier
  }
}
    
    
    */

    
}


const arbitrager = async (token0,token1,amountIn) => {
    //get pools on both uni and sushi swap 
    //help function pulls booth pull addresses from the subgraphs
    //subgraphs stop from the problem of needing fees.

    //UNISWAP SUBGRAPH
    //UNISWAP BASIC CALL
    /*
    {
        liquidityPools {
          inputTokens {
            id
            name
            symbol
            lastPriceUSD
            lastPriceBlockNumber
          }
          activeLiquidity
          activeLiquidityUSD
          id
          tick
          cumulativeWithdrawCount
          name
          fees {
            feePercentage
          }
        }
      }*/



}

poolFinder()
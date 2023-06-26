const ethers = require('ethers'); // connect to blockchain 
const { getAbi, getPoolData, getPoolFromTokens, _getAmountsOut, subgraphGetUniPools, subgraphGetSuhPools } = require('./helpers')

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
    //return list of all pool in Uni sushi with fee matched pairings
    const unipools = await subgraphGetUniPools()
    const sushipools = await subgraphGetSuhPools()
 
    //check through list of unipools for matching token1, token 2 and fee tier
    //you can't find matching pools by pulling in both subgraphs it will on show top 99
    //this is why they wont match 


    //pull in the pools uniswap with the highest liquidity or trade volume
    //search the sushiswap sugraph for corresponding token pair and fee.
    //this ia the way to find matching trading pools.
    
    matchingPools = []

    for (pool in sushipools.pools){
        console.log(pool)
        
    }

    /*

    for(pool in sushipools.pools){
        /*console.log(pool.token0.id)
        console.log(pool.token1.id)
        console.log(pool.feeTier)
        let _token0 = sushipools.pools[pool].token0.id
        let _token1 = sushipools.pools[pool].token1.id
        fee = sushipools.pools[pool].feeTier/10000 // divide by 10000
        console.log(_token0)
        console.log(_token1)
        //console.log(fee)
        
        matchingUniPool = unipools.liquidityPools.filter( pool => {
            return pool.inputTokens[0].id == _token1
                && pool.inputTokens[1].id == _token0  //TOKEN 1 ID
                //&& pool.fees[1].feePercentage === fee.toString()

        })
        console.log(matchingUniPool)
        


    }   */
    //console.log(matchingPools)

    
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
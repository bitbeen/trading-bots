const ethers = require('ethers'); // connect to blockchain 
const { getAbi, getPoolData, getPoolFromTokens, _getAmountsOut, subgraphGetUniPools, subgraphGetSuhPools, matchingSushiPools } = require('./helpers')
const { buyPoolTokens, uniSwapBasicTrade } = require('./tradehelpers')

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
       
   
      
        let token0id = pool.inputTokens[0].id
        let token1id = pool.inputTokens[1].id
        let feeTier = pool.fees[1].feePercentage * 10000

    
       

        let matchingSushiPool = await matchingSushiPools(token0id,token1id,feeTier)
        console.log(matchingSushiPool)
        console.log(matchingSushiPool.pools)
        if (matchingSushiPool.pools.length!==0){
          matchingpool.sushiPoolID = matchingSushiPool.pools[0].id
          matchingpool.uniPoolID = pool.id
          matchingpool.name = pool.name
          matchingpool.tokenPath = [matchingSushiPool.pools[0].token0.symbol,matchingSushiPool.pools[0].token1.symbol]
          matchingpool.tokenIDs= [matchingSushiPool.pools[0].token0.id,matchingSushiPool.pools[0].token1.id]
          matchingpool.feeTier = feeTier
          matchingPools.push(matchingpool)
        }



    }
    console.log(matchingPools)
    return(matchingPools)
    

    
}


const arbitrager = async (uniPool,sushiPool) => {
  const amountIn = 1
  
  const poolAbiU = await getAbi(uniPool) // 0xe592427a0aece92de3edee1f18e0157c05861564
  const poolAbiS = await getAbi(sushiPool)
  const uniImmutables =  await getPoolData(uniPool,poolAbiU)
  const sushiImmutables =  await getPoolData(sushiPool,poolAbiS)

  let path = [uniImmutables.token0,uniImmutables.token1]

  const uniPrice = await _getAmountsOut(amountIn, PATH, uniImmutables)
  const sushiPrice = await _getAmountsOut(amountIn, PATH, sushiImmutables)

  TX_FEE = uniImmutables.fee/(10**6) //the pool fee should comefrom immutables not manual
    //pool transaction fee is different


  let effUniPrice;
  let effSushiPrice;
  let spread;


    console.log(TX_FEE + "TX")
    if (uniPrice > sushiPrice){
      effUniPrice = uniPrice - (uniPrice * TX_FEE)
      effSushiPrice = sushiPrice +(sushiPrice * TX_FEE)
      spread = effUniPrice - effSushiPrice

      console.log(effUniPrice)
      console.log(effSushiPrice)
      console.log(spread)
      console.log('uni to sushi spread:', spread)

      if (spread > 0){
          console.log('sell on uni, buy on sushi')
      }else{
          console.log('no arb opportunity')
      }

  }else if (sushiPrice > uniPrice){
     effSushiPrice = sushiPrice - (sushiPrice * TX_FEE)
     effUniPrice = uniPrice + (uniPrice * TX_FEE)
     spread = effSushiPrice - effUniPrice
     console.log('sushi to uni spread', spread)
     console.log(effUniPrice)
      console.log(effSushiPrice)
      console.log(spread)

     if (spread > 0){
      console.log('sell on sushi, buy on uni') //should this be sushi
      }else{
      console.log('no arb opportunity')
      }
  }
  else{
      effSushiPrice = sushiPrice -(sushiPrice * TX_FEE)
      effUniPrice = uniPrice +(uniPrice * TX_FEE)
      spread = effSushiPrice - effUniPrice
      console.log(effUniPrice)
      console.log(effSushiPrice)
      console.log(spread)
      console.log('sushi to uni spread', spread)
      //console.log(spread) 
      console.log('price is the same')
      console.log('no arb opportunity')
  }




  //Quick project for after bot is complete
  //Get brand new pools
  //Buy token
  //Sell when it hits certain price
  //can do this on pancake too

  //Rewatch video and figure out best steps
  //Add Uni and sushiswap traders
  //run swapper
  //this would be sell token 1 for token0.

}

//poolFinder()
uniSwapBasicTrade()

//arbitrager('0x98b9162161164de1ed182a0dfa08f5fbf0f733ca','0x4c3c28962d327085b088782523c867f2e7db8790')

//Buy token 0 - tokens programmatically
//Create Uniswapper and helper functions
//Create Sushiswapper 

//https://www.youtube.com/watch?v=Ve8Kp7hFES8 - optimal swaps

//Create Swappers for Sell on Uni token 0 
//Create Swappers for Buy on Uni token 0 
//Create Swappers for Sell on Sushi token0
//Create Swappers for Buy on Sushi token0
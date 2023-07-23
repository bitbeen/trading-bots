const ethers = require('ethers'); // connect to blockchain 
const { getAbi, getPoolData, getPoolFromTokens, _getAmountsOut, subgraphGetUniPools, subgraphGetVolatileUniPools, matchingSushiPools } = require('../uniswapBot/helpers')
const { buyPoolTokens, uniSwapBasicTrade, sushiSwapBasicTrade } = require('./_tradehelpers')

const INFURA_URL = process.env.INFURA_URL
const provider = new ethers.providers.JsonRpcProvider(INFURA_URL); //init provider



const uniFactoryAddress = "0x1F98431c8aD98523631AE4a59f267346ea31F984";
const sushiFactoryAddress = "0x917933899c6a5F8E37F31E19f92CdBFF7e8FF0e2";

const UNI_SUBGRAPH_URL = 'https://api.thegraph.com/subgraphs/name/messari/uniswap-v3-polygon'
const SUH_SUBGRAPH_URL = 'https://api.thegraph.com/subgraphs/name/sushi-v3/v3-polygon'

const PATH = [token0, token1] //direction of swap ->

const poolFinder = async (UNI_SUBGRAPH_URL) => {
    console.log("working")
    //return list of all pool in Uni sushi with fee matched pairings
    const unipools = await subgraphGetVolatileUniPools()
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
        tokenDecimals:[],
        feeTier:"",
        uniPoolID:"",
        name:""
      }
       
   
      
        let token0id = pool.inputTokens[0].id
        let token1id = pool.inputTokens[1].id
        let feeTier = pool.fees[1].feePercentage * 10000

    
       

        let matchingSushiPool = await matchingSushiPools(token0id,token1id,feeTier)
        //console.log(matchingSushiPool)
        //console.log(matchingSushiPool.pools)
        if (matchingSushiPool.pools.length!==0){
          matchingpool.sushiPoolID = matchingSushiPool.pools[0].id
          matchingpool.uniPoolID = pool.id
          matchingpool.name = pool.name
          matchingpool.tokenDecimals= [matchingSushiPool.pools[0].token0.decimals,matchingSushiPool.pools[0].token1.decimals]
          matchingpool.tokenPath = [matchingSushiPool.pools[0].token0.symbol,matchingSushiPool.pools[0].token1.symbol]
          matchingpool.tokenIDs= [matchingSushiPool.pools[0].token0.id,matchingSushiPool.pools[0].token1.id]
          matchingpool.feeTier = feeTier
          matchingPools.push(matchingpool)
        }



    }
    
    return(matchingPools)
    

    
}


const arbitrager = async (choosenPool,amountIn) => {
   //CHANGE THIS ASAP!!!! PASS INTO FUNCTION
  
  const poolAbiU = await getAbi(choosenPool.uniPoolID) // 0xe592427a0aece92de3edee1f18e0157c05861564
  const poolAbiS = await getAbi(choosenPool.sushiPoolID)
  const uniImmutables =  await getPoolData(choosenPool.uniPoolID,poolAbiU)
  const sushiImmutables =  await getPoolData(choosenPool.sushiPoolID,poolAbiS)

  let path = [uniImmutables.token0,uniImmutables.token1]

  const uniPrice = await _getAmountsOut(amountIn, PATH, uniImmutables)
  const sushiPrice = await _getAmountsOut(amountIn, PATH, sushiImmutables)

  TX_FEE = uniImmutables.fee/(10**6) //the pool fee should comefrom immutables not manual
  
  SLIPPAGE = 0.05
    //pool transaction fee is different
  
  


  let effUniPrice;
  let effSushiPrice;
  let spread;


    console.log(TX_FEE + "TX")
    if (uniPrice > sushiPrice){
      //revisit arbitrager and getting prices
      /*effUniPrice = uniPrice - (uniPrice * TX_FEE) //account for slippage too be worth grabbing the slippage factors of both pools too
      effSushiPrice = sushiPrice +(sushiPrice * TX_FEE)*/
      effUniPrice = uniPrice - (uniPrice * TX_FEE) - (uniPrice * SLIPPAGE) //account for slippage too be worth grabbing the slippage factors of both pools too
      effSushiPrice = sushiPrice +(sushiPrice * TX_FEE) + (sushiPrice * SLIPPAGE)
      spread = effUniPrice - effSushiPrice

      console.log(effUniPrice)
      console.log(effSushiPrice)
      console.log(spread)
      console.log('uni to sushi spread:', spread)

      if (spread > 0){
          console.log('sell on uni, buy on sushi')


          console.log('SANITY TEST')
          let swapData = await uniSwapBasicTrade(amountIn, choosenPool.uniPoolID, choosenPool.tokenIDs, choosenPool.tokenPath, choosenPool.tokenDecimals)
          console.log("first trade")
          console.log(swapData)
          let fee = choosenPool.feeTier/ 10000
          amountInFeeAccount = swapData.amount1 + (swapData.amount1 *(fee/100))
          swapData = await sushiSwapBasicTrade(amountInFeeAccount, choosenPool.sushiPoolID, choosenPool.tokenIDs.reverse(), choosenPool.tokenPath.reverse(), choosenPool.tokenDecimals.reverse())
          console.log("second trade")
          console.log(swapData)
          
      }else{
          console.log('no arb opportunity')
      }

  }else if (sushiPrice > uniPrice){
     /*effSushiPrice = sushiPrice - (sushiPrice * TX_FEE)
     effUniPrice = uniPrice + (uniPrice * TX_FEE)*/
     effSushiPrice = sushiPrice - (sushiPrice * TX_FEE) - (sushiPrice * SLIPPAGE)
     effUniPrice = uniPrice + (uniPrice * TX_FEE) + (uniPrice * SLIPPAGE)
     spread = effSushiPrice - effUniPrice
     console.log('sushi to uni spread', spread)
     console.log(effUniPrice)
      console.log(effSushiPrice)
      console.log(spread)

     if (spread > 0){
      console.log('sell on sushi, buy on uni') //should this be sushi
      console.log('SANITY TEST')
          let swapData = await sushiSwapBasicTrade(amountIn, choosenPool.sushiPoolID, choosenPool.tokenIDs, choosenPool.tokenPath, choosenPool.tokenDecimals)
          console.log("first trade")
          console.log(swapData)
          let fee = choosenPool.feeTier/ 10000
          amountInFeeAccount = swapData.amount1 + (swapData.amount1 *(fee/100))

          swapData = await uniSwapBasicTrade(amountInFeeAccount, choosenPool.uniPoolID, choosenPool.tokenIDs.reverse(), choosenPool.tokenPath.reverse(), choosenPool.tokenDecimals.reverse())
          console.log("second trade")
          console.log(swapData)
          //Sell 0.1 of token 0 on uniswap more expensice for token 1
          //Buy 0.1 of token 0 on sushiswap with token 1
          /*
          await sushiSwapBasicTrade(amountIn, choosenPool.sushiPoolID, choosenPool.tokenIDs, choosenPool.tokenPath, choosenPool.tokenDecimals).then( results1 => {
            console.log("first trade")
            console.log(results1)
            

            uniSwapBasicTrade(results1.amount1, choosenPool.uniPoolID, choosenPool.tokenIDs.reverse(), choosenPool.tokenPath.reverse(), choosenPool.tokenDecimals.reverse()).then( results2 => {
              console.log("second trade")
              console.log(results2)

            })
            
            

          })*/
        


         
      }else{
      console.log('no arb opportunity')
      }
  }
  else{
    /*
      effSushiPrice = sushiPrice -(sushiPrice * TX_FEE)
      effUniPrice = uniPrice +(uniPrice * TX_FEE)*/
      effSushiPrice = sushiPrice -(sushiPrice * TX_FEE) - (sushiPrice * SLIPPAGE)
      effUniPrice = uniPrice +(uniPrice * TX_FEE)+ (uniPrice * SLIPPAGE)
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

//pools = poolFinder()
//console.log(pools[3])
//uniSwapBasicTrade(pools[3].uniPoolID, pools[3].tokenIDs, pools[3].tokenPath, pools[3].tokenDecimals)

//arbitrager('0x98b9162161164de1ed182a0dfa08f5fbf0f733ca','0x4c3c28962d327085b088782523c867f2e7db8790')

//Buy token 0 - tokens programmatically
//Create Uniswapper and helper functions
//Pass token and pool into basic
//Create Sushiswapper 
//Figure out gas for most recent trade and only trade at a profit of that

//https://www.youtube.com/watch?v=Ve8Kp7hFES8 - optimal swaps

//Create Swappers for Sell on Uni token 0 
//Create Swappers for Buy on Uni token 0 
//Create Swappers for Sell on Sushi token0
//Create Swappers for Buy on Sushi token0

const run = async () => {
  pools = await poolFinder()
  for  (choosenPool in pools){
    console.log(choosenPool)
    console.log(pools[choosenPool].tokenPath)
    console.log(pools[choosenPool].tokenIDs)
  }
    console.log(pools.length)
    
    choosenPool = pools[11]
    console.log(choosenPool)
    let fee = choosenPool.feeTier/ 10000
    const amountIn = 1
    const amountInFeeAccount = amountIn + (amountIn *(fee/100)) + (amountIn *0.05) //could worth calculating slippage


    //worth swapping back amount including fee too.
    //symbol1: 'AAVE', approve is not a function - get proxy time
    console.log(amountInFeeAccount) 

    arbitrager(choosenPool, amountInFeeAccount)
  /*
  for  (let choosenPool in pools){
    console.log(pools.length)
    console.log(choosenPool)
    let fee = choosenPool.feeTier/ 10000
    const amountIn = 1
    const amountInFeeAccount = amountIn + (amountIn *(fee/100))
  //const amountInFee = (0.01)
    console.log(amountInFeeAccount) 

    arbitrager(choosenPool, amountInFeeAccount)

  }*/
  //choosenPool = pools[2] //pool with highest liquidity or some other factor?
  
  //console.log(choosenPool)
  
  

  
  /*
  results = await uniSwapBasicTrade(0.01, choosenPool.uniPoolID, choosenPool.tokenIDs, choosenPool.tokenPath, choosenPool.tokenDecimals)
  console.log(results)
  */

  



  //results = await sushiSwapBasicTrade(0.01, choosenPool.sushiPoolID, choosenPool.tokenIDs, choosenPool.tokenPath, choosenPool.tokenDecimals)
  //console.log(results)

  

  

  /*
  swapsURev = await uniSwapBasicTrade(0.01, choosenPool.uniPoolID, choosenPool.tokenIDs, choosenPool.tokenPath, cho
    osenPool.tokenDecimals).then( swapDataUni => {
    console.log(swapDataUni)
  })*/

  /*let swapDataUni = await uniSwapBasicTrade(0.01, choosenPool.uniPoolID, choosenPool.tokenIDs, choosenPool.tokenPath, choosenPool.tokenDecimals).then( swapDataUni =>{
    console.log(swapDataUni)
  })*/
  
  /*
  let swapDataSushi = await sushiSwapBasicTrade(0.01, choosenPool.sushiPoolID, choosenPool.tokenIDs.reverse(), choosenPool.tokenPath.reverse(), choosenPool.tokenDecimals.reverse()).then( swapDataSushi =>{
    console.log(swapDataSushi)
  }
    
  )*/
  
  //arbitrager(choosenPool.uniPoolID, choosenPool.sushiPoolID)

}

run()
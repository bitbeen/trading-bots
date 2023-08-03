// monitor liquidity while you do swaps 
const UniswapV3Pool = require("@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json")
const { getAbi,  getFeePools,getTokenData, getPoolName } = require('./helpers')
const JSBI = require('jsbi')
const {TickMath, FullMath} = require('@uniswap/v3-sdk')
const { Contract, BigNumber } = require("ethers")
require('dotenv').config()
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY
const MAINNET_URL = process.env.MAINNET_URL
const provider = new ethers.providers.JsonRpcProvider(MAINNET_URL);


const UNIV3POOLCONTRACT='0x1F98431c8aD98523631AE4a59f267346ea31F984'



const POOL1=""




async function _getPoolData(poolContract,poolAddress) {
  
  const [tickSpacing, fee, liquidity, slot0, token0,token1] = await Promise.all([
    poolContract.tickSpacing(),
    poolContract.fee(),
    poolContract.liquidity(),
    poolContract.slot0(),
    poolContract.token0(),
    poolContract.token1()
  ])

  const sqrtPriceX96 = slot0[0]
  const numerator = BigNumber.from(sqrtPriceX96).pow(2) //the decimals are off
  const denominator = BigNumber.from(2).pow(192)       //the decimals are off
  console.log("numerator",ethers.utils.formatEther(numerator,18))
  console.log("denominator",ethers.utils.formatEther(denominator,6))

  let tokenData0 = await getTokenData(token0)
  let tokenData1 = await getTokenData(token1)
  //let tokenIDs = [token0,token1]
  //let tokenPaths = [tokenData0.symbol,tokenData1.symbol]
  //let tokenDecimals = [tokenData0.decimals,tokenData1.decimals] 

  let _inputAmount = 1
  let _tick = slot0[1]
  let baseTokenDecimals = tokenData0.decimals
  let quoteTokenDecimals = tokenData1.decimals

  let _sqrtRatioX96 = TickMath.getSqrtRatioAtTick(_tick)
  let _ratioX192 = JSBI.multiply(_sqrtRatioX96,_sqrtRatioX96)
  let _baseAmount = JSBI.BigInt(_inputAmount * (10**baseTokenDecimals)) //converts 1BTC to WEI
  let _shift = JSBI.leftShift(JSBI.BigInt(1), JSBI.BigInt(192))
  let _quoteAmount = FullMath.mulDivRoundingUp(_ratioX192, _baseAmount, _shift)
  let _priceRatio = _quoteAmount.toString() / (10**quoteTokenDecimals)
  let _ipriceRatio =  1/ _priceRatio



   
 
  return {
    tickSpacing: tickSpacing,
    fee: fee,
    liquidity: liquidity.toString(),
    sqrtPriceX96: sqrtPriceX96.toString(),
    priceRatio: _priceRatio.toString(),
    iPriceRatio: _ipriceRatio.toString(),
    tick: slot0[1],
    poolAddress: poolAddress,
    tokenData0:tokenData0,
    tokenData1:tokenData1,
    
  }
}


async function main() {
  //get the token adresses and ABIs before checking for opp then pass in together
  //poolName = "Uniswap V3 Wrapped Matic/Wrapped Ether"
  //poolName = "Uniswap V3 (PoS) Dai Stablecoin/(PoS) Tether USD"

  //poolName ="Uniswap V3 USD Coin (PoS)/BOB"
  //poolName="Uniswap V3 USD Coin (PoS)/Frax"
  //poolName="Uniswap V3 USD Coin (PoS)/Magic Internet Money"
  
  //poolName ="Uniswap V3 USD Coin (PoS)/(PoS) Tether USD" //*

  //find a method for scraping though as many ids with the circumstance as possible

  poolID = "0xbfac5c438c9938ae3260c023bcc859aa4315f671"
  

  poolName = await getPoolName(poolID)
  console.log(poolName)
  const feePools = await getFeePools(poolName) //when searching for pools (bank all the possible ids in one go with batch loading then only search for now triple pool)
  console.log(feePools.liquidityPools)
  let liquidityPools = feePools.liquidityPools
  let liquidityPoolIDs = []
  liquidityPools.map(lpool => liquidityPoolIDs.push(lpool.id))
  console.log(liquidityPoolIDs)
  if(liquidityPoolIDs.length<3){
    console.log("not enough pools for full swap")
    return
  }
 
  let UniswapV3PoolAbi = await getAbi(UNIV3POOLCONTRACT)
  let poolDataResults = []
  
  
  
  
  //get all the pool data
  for (var i=liquidityPoolIDs.length; i--;) {
    let poolContract = new Contract(liquidityPoolIDs[i], UniswapV3Pool.abi, provider)
    let poolData = await _getPoolData(poolContract,liquidityPoolIDs[i])
    if(poolData.liquidity>0){
      poolDataResults.push(poolData)

    }
    
  }

  let highestPoolData = Math.max(...poolDataResults.map(o => o.priceRatio))
  let lowestPoolData = Math.min(...poolDataResults.map(o => o.priceRatio))
  let ilowestPoolData = Math.min(...poolDataResults.map(o => o.iPriceRatio))
  let middlePoolData = findMiddlemostObject(poolDataResults);
  middlePoolData = middlePoolData.priceRatio
  let imiddlePoolData = middlePoolData.ipriceRatio
  let _middlePoolData = _findMiddlemostObject(poolDataResults);
  _middlePoolData = _middlePoolData.priceRatio //findMiddlemostElement(...poolDataResults.map(o => o.priceRatio))
  let _imiddlePoolData = _middlePoolData.ipriceRatio
  //just get the list and highest, middle, lowest

  //then pass in 1000 and 1000+30% and see if you profit


  /*
  This will be useful later to calculate values in one loop for faster bot
  for (var i=liquidityPoolIDs.length; i--;) {

    let poolContract = new Contract(liquidityPoolIDs[i], UniswapV3Pool.abi, provider)
    let poolData = await _getPoolData(poolContract,liquidityPoolIDs[i])
    poolDataResults.push(poolData)

    //is it worth using get qoute?
    if (poolData.liquidity>100){ //price ratio can shift if liquidity is off
      if (poolData.priceRatio > highestPoolData.priceRatio) {
        highestPoolData = poolData
      }

      if (poolData.priceRatio < lowestPoolData.priceRatio) {
        lowestPoolData = poolData
      }

      if (Math.abs(poolData.priceRatio - 1) < Math.abs(middlePoolData.priceRatio - 1)) {
        middlePoolData = poolData
      }
    }*/

    


    console.log(`poolData}`, poolDataResults)

  
  console.log("highest",highestPoolData)
  console.log("lowest - inverse pool",ilowestPoolData)
  console.log("middle1",middlePoolData)
  console.log("middle2",_middlePoolData)

  isOpportunity(0.3,highestPoolData,ilowestPoolData,middlePoolData,1000)
  isOpportunity(0.3,highestPoolData,ilowestPoolData,middlePoolData,1000)

  //calculate amount required for profit
  
}
/*
npx hardhat run --network mainnet scripts/checkLiquidity.js
*/

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

  /*
  *
  https://ethereum.stackexchange.com/questions/127458/prices-from-uniswap-and-sushiswap-inconstistent
  DECIMALS = 6

def calcSell(contract,from_token,to_token):
        oneToken = 10**DECIMALS
        price = contract.functions.getAmountsOut(oneToken, [from_token, to_token]).call()
        normalizedPrice = price[1] / 10**DECIMALS
        normalizedPrice  = f'{normalizedPrice:.30f}'
        return normalizedPrice
  //get tick js holds the secrets
  */

  function findMiddlemostElement(arr, high, low) {
    if (!Array.isArray(arr) || arr.length === 0) {
      throw new Error('Input must be a non-empty array.');
    }
  
    // Sort the array
    const sortedArr = arr.slice().sort((a, b) => a - b);
  
    // Calculate the index of the middle element(s)
    const middleIndex = Math.floor(sortedArr.length / 2);
  
    // Determine if the array length is even or odd
    const isEvenLength = sortedArr.length % 2 === 0;
  
    if (isEvenLength) {
      // For even-length arrays, return the two middlemost elements
      options =[sortedArr[middleIndex - 1], sortedArr[middleIndex]];
      if(option[0]==low){
        choice = option[1]

      }if(option[1]==high){
        choice = option[0]

      }else{
        console.log("something odd happened")
      }
      return choice
    } else {
      // For odd-length arrays, return the single middlemost element
      return sortedArr[middleIndex];
    }
  }

  function _findMiddlemostObject(arr) {
    let property = "priceRatio"
    if (!Array.isArray(arr) || arr.length === 0) {
      throw new Error('Input must be a non-empty array.');
    }
  
    if (typeof property !== 'string') {
      throw new Error('Property must be a valid string.');
    }
  
    // Sort the array of objects based on the specified property
    const sortedArr = arr.slice().sort((a, b) => a[property] - b[property]);
  
    // Calculate the index of the middle object(s)
    const middleIndex = Math.floor(sortedArr.length / 2);
  
    // Determine if the array length is even or odd
    const isEvenLength = sortedArr.length % 2 === 0;
  
    if (isEvenLength) {
      // For even-length arrays, return the two middlemost objects
      return sortedArr[middleIndex - 1];
    } else {
      // For odd-length arrays, return the single middlemost object
      return sortedArr[middleIndex];
    }
  }

  function findMiddlemostObject(arr) {
    let property = "priceRatio"
    if (!Array.isArray(arr) || arr.length === 0) {
      throw new Error('Input must be a non-empty array.');
    }
  
    if (typeof property !== 'string') {
      throw new Error('Property must be a valid string.');
    }
  
    // Sort the array of objects based on the specified property
    const sortedArr = arr.slice().sort((a, b) => a[property] - b[property]);
  
    // Calculate the index of the middle object(s)
    const middleIndex = Math.floor(sortedArr.length / 2);
  
    // Determine if the array length is even or odd
    const isEvenLength = sortedArr.length % 2 === 0;
  
    
      // For odd-length arrays, return the single middlemost object
      return sortedArr[middleIndex];
   
  }


  function isOpportunity(flashFee,high,low,mid,swapAmount){

    //amount purchased in Pool 1 for token 1 and 2
    let amount_purchased0 = swapAmount 
    let amount_purchased1 = swapAmount 
    
    

    //Minimum amount out to make arbitrage worth while
    let amount_Min0 = amount_purchased0 + (amount_purchased0*flashFee)
    let amount_Min1 = amount_purchased1 + (amount_purchased1*flashFee)

    //simulate swap
    let amount_returned0 = amount_purchased0 * high
    let amount_returned1 = amount_purchased1 * low //(low needs to be inverted - not mid)

    let profit0 = amount_returned0 -amount_Min0 
    let profit1 = amount_returned1 -amount_Min0

    //minimum amount we need to get out of the swap
        //take the amount we are borrowing plus the fee it would cost
        

    console.log("\npurchased", swapAmount)
    console.log("returnedMin", amount_Min0)
    console.log("returnedMin", amount_Min1)
    console.log("returned0", amount_returned0)
    console.log("returned1", amount_returned1)
    console.log("profit0", profit0)
    console.log("profit1", profit1)

    if(profit0> 0 && profit1 >0 ){
      console.log("opp")

    }else{
      console.log("no opp")
    }

  }
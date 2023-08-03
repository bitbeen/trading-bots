// monitor liquidity while you do swaps 
const UniswapV3Pool = require("@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json")
const { getAbi,  getFeePools,getTokenData } = require('./helpers')
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
  /*
  console.log("tick",_tick)
  console.log("sqrtRatioX96",_sqrtRatioX96)
  console.log("ratioX192",_ratioX192)
  console.log("baseAmount",_baseAmount)
  console.log("shift",_shift)
  console.log("quoteAmount",_quoteAmount)
  console.log("priceRatio",_priceRatio)
  */


  const priceRatio = numerator/denominator 
  return {
    tickSpacing: tickSpacing,
    fee: fee,
    liquidity: liquidity.toString(),
    sqrtPriceX96: sqrtPriceX96.toString(),
    priceRatio: _priceRatio.toString(),
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

  poolName = "Uniswap V3 USD Coin (PoS)/BUSD Token"
  const feePools = await getFeePools(poolName)
  console.log(feePools.liquidityPools)
  let liquidityPools = feePools.liquidityPools
  let liquidityPoolIDs = []
  liquidityPools.map(lpool => liquidityPoolIDs.push(lpool.id))
  console.log(liquidityPoolIDs)
 
  let UniswapV3PoolAbi = await getAbi(UNIV3POOLCONTRACT)
  let poolDataResults = []
  let highestPoolData = {priceRatio:0}
  let lowestPoolData = {priceRatio:2}
  let middlePoolData = {priceRatio:1000}
  //for (lpoolID in liquidityPoolIDs){
  
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
    }

    


    console.log(`poolData${i}`, poolData)

  }
  console.log("highest",highestPoolData)
  console.log("lowest",lowestPoolData)
  console.log("middle",middlePoolData)

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
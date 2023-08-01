// monitor liquidity while you do swaps 
const UniswapV3Pool = require("@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json")
const { getAbi,  getFeePools } = require('./helpers')
const { Contract, BigNumber } = require("ethers")
require('dotenv').config()
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY
const MAINNET_URL = process.env.MAINNET_URL
const provider = new ethers.providers.JsonRpcProvider(MAINNET_URL);


const UNIV3POOLCONTRACT='0x1F98431c8aD98523631AE4a59f267346ea31F984'



const POOL1=""




async function getPoolData(poolContract) {
  
  const [tickSpacing, fee, liquidity, slot0] = await Promise.all([
    poolContract.tickSpacing(),
    poolContract.fee(),
    poolContract.liquidity(),
    poolContract.slot0(),
  ])

  const sqrtPriceX96 = slot0[0]
  const numerator = BigNumber.from(sqrtPriceX96).pow(2)
  const denominator = BigNumber.from(2).pow(192)

  const priceRatio = numerator/denominator
  return {
    tickSpacing: tickSpacing,
    fee: fee,
    liquidity: liquidity.toString(),
    sqrtPriceX96: sqrtPriceX96.toString(),
    priceRatio: priceRatio.toString(),
    tick: slot0[1],
  }
}


async function main() {
  //get the token adresses and ABIs before checking for opp then pass in together
  //poolName = "Uniswap V3 Wrapped Matic/Wrapped Ether"
  //poolName = "Uniswap V3 (PoS) Dai Stablecoin/(PoS) Tether USD"

  //poolName ="Uniswap V3 USD Coin (PoS)/BOB"
  
  poolName ="Uniswap V3 USD Coin (PoS)/(PoS) Tether USD"
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
    let poolData = await getPoolData(poolContract)
    poolDataResults.push(poolData)

    
    if (poolData.priceRatio > highestPoolData.priceRatio) {
      highestPoolData = poolData
    }

    if (poolData.priceRatio < lowestPoolData.priceRatio) {
      lowestPoolData = poolData
    }

    if (Math.abs(poolData.priceRatio - 1) < Math.abs(middlePoolData.priceRatio - 1)) {
      middlePoolData = poolData
    }


    console.log(`poolData${i}`, poolData)

  }
  console.log(highestPoolData)
  console.log(lowestPoolData)
  console.log(middlePoolData)

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
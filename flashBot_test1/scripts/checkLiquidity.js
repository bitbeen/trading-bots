// monitor liquidity while you do swaps 
const UniswapV3Pool = require("@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json")
const { getAbi,  getFeePools } = require('./helpers')
const { Contract, BigNumber } = require("ethers")
require('dotenv').config()
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY
const MAINNET_URL = process.env.MAINNET_URL
const provider = new ethers.providers.JsonRpcProvider(MAINNET_URL);


const UNIV3POOLCONTRACT='0x1F98431c8aD98523631AE4a59f267346ea31F984'


USDT_USDC_500= '0x90D2547AC8dad5Ec2EE312B5be6dbc91f0816657'
USDT_USDC_3000= '0x72fB20A6a3525222e5CcEbc8D71cC259531C9310'
USDT_USDC_10000= '0x714dFdC840cc90B2b05c2A468AAE9D0Fbf20a325'

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
  //poolName = "Uniswap V3 Wrapped Matic/Wrapped Ether"
  //poolName = "Uniswap V3 (PoS) Dai Stablecoin/(PoS) Tether USD"
  
  poolName ="Uniswap V3 USD Coin (PoS)/(PoS) Tether USD"
  const feePools = await getFeePools(poolName)
  console.log(feePools.liquidityPools)
  let liquidityPools = feePools.liquidityPools
  let liquidityPoolIDs = []
  liquidityPools.map(lpool => liquidityPoolIDs.push(lpool.id))
  console.log(liquidityPoolIDs)
 
  let UniswapV3PoolAbi = await getAbi(UNIV3POOLCONTRACT)
  for (lpoolID in liquidityPoolIDs){
    
    let poolContract = new Contract(liquidityPoolIDs[lpoolID], UniswapV3Pool.abi, provider)
    let poolData = await getPoolData(poolContract)
    console.log(`poolData${lpoolID}`, poolData)

  }
   

  /*const poolContract500 = new Contract(USDT_USDC_500, UniswapV3PoolAbi, provider)
  const poolData500 = await getPoolData(poolContract500)
  console.log('poolData500', poolData500)

  const poolContract3000 = new Contract(USDT_USDC_3000, UniswapV3Pool.abi, provider)
  const poolData3000 = await getPoolData(poolContract3000)
  console.log('poolData3000', poolData3000)

  const poolContract10000 = new Contract(USDT_USDC_10000, UniswapV3Pool.abi, provider)
  const poolData10000 = await getPoolData(poolContract10000)
  console.log('poolData10000', poolData10000)*/
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
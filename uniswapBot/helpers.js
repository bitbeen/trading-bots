const axios = require('axios')
const ethers = require('ethers');
const JSBI = require('jsbi')
const {TickMath, FullMath} = require('@uniswap/v3-sdk')

require('dotenv').config()
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY
const INFURA_URL = process.env.INFURA_URL

const provider = new ethers.providers.JsonRpcProvider(INFURA_URL);

exports.getAbi = async (address) => {
    //const url = `https://api.polygonscan.io/api?module=contract&action=getabi&address=${address}&apikey=${ETHERSCAN_API_KEY}`
    const url = `https://api.polygonscan.com/api?module=contract&action=getabi&address=${address}&apikey=${ETHERSCAN_API_KEY}`
    
    const res = await axios.get(url)
    const abi = JSON.parse(res.data.result)
    return abi
}

exports.getPoolData= async (poolAddress,poolAbi) => {
    //get pool immutables just reads data from the pool contract
    //get more immutables instead of duplicating then pass immutables in for basetoken

    const poolContract = new ethers.Contract(
    poolAddress,
    poolAbi,
    provider
  )
    
    const [token0, token1, fee, slot0] = await Promise.all([
      poolContract.token0(),
      poolContract.token1(),
      poolContract.fee(),
      poolContract.slot0(),
    ])
  
    const immutables = {
      token0: token0,
      token1: token1,
      fee: fee,
      slot0: slot0
    }
  
    return immutables
  }
/*
exports.getPoolImsSushi = async (poolAddress,poolAbi) => {
    //get pool immutables just reads data from the pool contract
    //get more immutables instead of duplicating then pass immutables in for basetoken

    const poolContract = new ethers.Contract(
    poolAddress,
    poolAbi,
    provider
  )
    
    const [token0, token1, fee] = await Promise.all([
      poolContract.token0(),
      poolContract.token1(),
      poolContract.fee(),
    ])
  
    const immutables = {
      token0: token0,
      token1: token1,
      fee: fee
    }
  
    return immutables
  }*/


exports.getPoolImmutables = async (poolContract) => {
    //get pool immutables just reads data from the pool contract
    //get more immutables instead of duplicating then pass immutables in for basetoken

    const factoryContract = new ethers.Contract(
    factoryAddress,
    factoryAbi,
    provider
  )
    
    const [token0, token1, fee, slot0] = await Promise.all([
      poolContract.token0(),
      poolContract.token1(),
      poolContract.fee(),
      poolContract.slot0(),

    ])
  
    const immutables = {
      token0: token0,
      token1: token1,
      fee: fee,
      slot0: slot0
    }
  
    return immutables
  }

exports._getAmountsOut = async(amountIn,PATH, immutables) => {

const baseToken = PATH[0] //token being swapped in 
const quoteToken =PATH[1] //token being swapped out
const inputAmount = amountIn //1 WBTC



//pool address required for base token decimals and tick

const currentTick = immutables.slot0.tick //avialable form swap pool contract
//ticks could be negative not worth getting sqrt of negative
//const sqrtPriceX96 = immutables.slot0.sqrtPriceX96

//worth reading decimals from contract moving forward but for now just 18
const baseTokenDecimals = 18 //WBTC uses 8 decimal places
const quoteTokenDecimals = 18 //almost all ERC use 18 decem

const sqrtRatioX96 = TickMath.getSqrtRatioAtTick(currentTick) //gives us sqrt of tick value
const ratioX192 = JSBI.multiply(sqrtRatioX96,sqrtRatioX96) //multiply big int by itself to get sqaure value
const baseAmount = JSBI.BigInt(inputAmount * (10**baseTokenDecimals)) //converts 1BTC to WEI equivalent
const shift = JSBI.leftShift(JSBI.BigInt(1), JSBI.BigInt(192)) //shift 1 > 192 bits to the left

quoteAmount = FullMath.mulDivRoundingUp(ratioX192, baseAmount, shift) //returned in WEI
amountOut = quoteAmount.toString() / (10**quoteTokenDecimals)
return amountOut

}

exports.getPoolFromTokens = async (factoryAddress, factoryAbi, PATH,fee) =>{
  const factoryContract = new ethers.Contract(
    factoryAddress,
    factoryAbi,
    provider
  )

  _tokenAddress0 = PATH[0]
  _tokenAddress1 = PATH[1]

  try{
      var _poolAddress = await factoryContract.getPool(_tokenAddress0,_tokenAddress1, fee) //get from uniswap for now but later check subgraphs
      //console.log(_poolAddress)
      //better ways to handle but if its not uniswap then get pair 
      //although long term this might be effective for smaller swaps
  }catch(error){
      var _poolAddress = await factoryContract.getPair(_tokenAddress0,_tokenAddress1) //get from uniswap for now but later check subgraphs
      //console.log(_poolAddress)
  }
  
  //getPrice(1,_poolAddress)
  
  /*
  
    .then(poolAddress => console.log(poolAddress))
    */
  console.log("pool adress "+_poolAddress)
  return _poolAddress

}

exports.handleProxyTokenContract = async (tokenAddress, tokenAbi) =>{
    //get implementation contract address
    const tokenContract = new ethers.Contract(
      tokenAddress,
      tokenAbi,
      provider
    )
  
    const implementationTokenAddress = await tokenContract.implementation()
    console.log("implementation contract:" + implementationTokenAddress )
  
    //get implementation contract abi
    const implementationTokenAbi = await getAbi(implementationTokenAddress)
    tokenAbi = implementationTokenAbi //ressaigned variable
    let actualTokenData = {tokenAddress,tokenAbi}
    return actualTokenData
  
      //return imp ABI and original address as actual contract data
  
  
  }
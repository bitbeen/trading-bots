const { ethers } = require("ethers");
const { abi: IUniswapV3PoolABI } = require("@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json");
const { abi: FactoryAbi } = require('@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json')
const { abi: QuoterABI } = require("@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json");

const { getAbi, getPoolImmutables } = require('./helpers')

const { getExchanges} = require('./coingecko')

require('dotenv').config()
const INFURA_URL = process.env.INFURA_URL
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY

const provider = new ethers.providers.JsonRpcProvider(INFURA_URL)

//const poolAddress = '0x45dda9cb7c25131df268515131f647d726f50608' //usdc wrapped eth - usdc proxied
//const poolAddress = '0x50eaedb835021e4a108b7290636d62e9765cc6d7' //WBTC - WETH 0.05%

//const poolAddress = '0x167384319b41f7094e62f7506409eb38079abff8' //matic wrapped eth 0.3%

//const poolAddress = '0x98b9162161164de1ed182a0dfa08f5fbf0f733ca' //matic wrapped link 0.3%

const poolAddress = '0xa708d430656aa379b6b0b1d570be8ae1095530e5' //matic wrapped link 0.3%

const quoterAddress = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6"
const factoryAddress ="0x1F98431c8aD98523631AE4a59f267346ea31F984"



const _tokenAddress0 = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270"
const _tokenAddress1 = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619"



const getPrice = async (inputAmount) => {
    //init pool contracrt
    const poolContract = new ethers.Contract(
      poolAddress,
      IUniswapV3PoolABI,
      provider
    )

    //pull token addresses
  const tokenAddress0 = await poolContract.token0();
  const tokenAddress1 = await poolContract.token1();
  console.log(tokenAddress0)
  console.log(tokenAddress1)

  actualTokenData0 = await checkProxyTokenContract(tokenAddress0)
  actualTokenData1 = await checkProxyTokenContract(tokenAddress1)
  console.log(actualTokenData0.tokenAddress)
  console.log(actualTokenData1.tokenAddress)

  //to init contract we need Abis Abis returned during proxy check no need to repeat 
  const tokenAbi0 = await getAbi(tokenAddress0)
  const tokenAbi1 = await getAbi(tokenAddress1)
  //console.log(tokenAbi0)
  //console.log(tokenAbi1)
  
  //check if Abi contains proxy
  //if yes then get relevant data for debug.
  //filter on list of objects (faster than for loop)

  //init contracts for both tokens 

  const tokenContract0 = new ethers.Contract(
    actualTokenData0.tokenAddress,
    actualTokenData0.tokenAbi,
    provider
  )
  const tokenContract1 = new ethers.Contract(
    actualTokenData1.tokenAddress,
    actualTokenData1.tokenAbi,
    provider
  )

  
  const tokenSymbol0 = await tokenContract0.symbol()
  //const tokenSymbolX = await tokenContract0.functions()
  const tokenSymbol1 = await tokenContract1.symbol()
  //console.log(tokenSymbolX)
  console.log(tokenSymbol0)
  console.log(tokenSymbol1)
    //some contracts are proxy contracts we would need the original to get the actual symbol from the proxy
    //if you can't get the symbol [WBTC,USDC]
    // use the address of main contract and ABi of proxy contract
    //https://ethereum.stackexchange.com/questions/103143/how-do-i-get-the-implementation-contract-address-from-the-proxy-contract-address


  const tokenDecimals0 = await tokenContract0.decimals()
  const tokenDecimals1 = await tokenContract1.decimals()
  console.log(tokenDecimals0)
  console.log(tokenDecimals1)
  

  const quoterContract = new ethers.Contract(
    quoterAddress,
    QuoterABI,
    provider
  )

  const immutables = await getPoolImmutables(poolContract)

    //convert deciumals going in
  const amountIn = ethers.utils.parseUnits(
    inputAmount.toString(),
    tokenDecimals0
  )

  //quote data coming out
  const quotedAmountOut = await quoterContract.callStatic.quoteExactInputSingle(
    immutables.token0,
    immutables.token1,
    immutables.fee,
    amountIn,
    0
  )

  const amountOut = ethers.utils.formatUnits(quotedAmountOut, tokenDecimals1)


  //reverse amounts 

  const amountInRev = ethers.utils.parseUnits(
    inputAmount.toString(),
    tokenDecimals1
  )

  //quote data coming out
  const quotedAmountOutRev = await quoterContract.callStatic.quoteExactInputSingle(
    immutables.token1,
    immutables.token0,
    immutables.fee,
    amountIn,
    0
  )

  const amountOutRev = ethers.utils.formatUnits(quotedAmountOutRev, tokenDecimals0)

  console.log('=========')
  console.log(`${inputAmount} ${tokenSymbol0} can be swapped for ${amountOut} ${tokenSymbol1}`)
  console.log(`${inputAmount} ${tokenSymbol1} can be swapped for ${amountOutRev} ${tokenSymbol0}`)
  console.log('=========')


}  

const getPriceInverse = async (inputAmount) => {
  //init pool contracrt
  const poolContract = new ethers.Contract(
    poolAddress,
    IUniswapV3PoolABI,
    provider
  )

  //pull token addresses
const tokenAddress0 = await poolContract.token1();
const tokenAddress1 = await poolContract.token0();
console.log(tokenAddress0)
console.log(tokenAddress1)

//to init contract we need Abis
const tokenAbi0 = await getAbi(tokenAddress0)
const tokenAbi1 = await getAbi(tokenAddress1)

//init contracts for both tokens 

const tokenContract0 = new ethers.Contract(
  tokenAddress0,
  tokenAbi0,
  provider
)
const tokenContract1 = new ethers.Contract(
  tokenAddress1,
  tokenAbi1,
  provider
)
try {
const tokenSymbol0 = await tokenContract0.symbol()
const tokenSymbol1 = await tokenContract1.symbol()
console.log(tokenSymbol0)
console.log(tokenSymbol1)
  //some contracts are proxy contracts we would need the original to get the actual symbol from the proxy
  //if you can't get the symbol [WBTC,USDC]
  // use the address of main contract and ABi of proxy contract
  //https://ethereum.stackexchange.com/questions/103143/how-do-i-get-the-implementation-contract-address-from-the-proxy-contract-address


const tokenDecimals0 = await tokenContract0.decimals()
const tokenDecimals1 = await tokenContract1.decimals()
console.log(tokenDecimals0)
console.log(tokenDecimals1)
}catch(error){
  print("caught error")
}

const quoterContract = new ethers.Contract(
  quoterAddress,
  QuoterABI,
  provider
)

const immutables = await getPoolImmutables(poolContract)

  //convert deciumals going in
const amountIn = ethers.utils.parseUnits(
  inputAmount.toString(),
  tokenDecimals0
)


//if you can't get the symbol [WBTC,USDC] - might be problem here too ??
//quote data coming out
const quotedAmountOut = await quoterContract.callStatic.quoteExactInputSingle(
  immutables.token1,
  immutables.token0,
  immutables.fee,
  amountIn,
  0
)

const amountOut = ethers.utils.formatUnits(quotedAmountOut, tokenDecimals1)

console.log('=========')
console.log(`${inputAmount} ${tokenSymbol0} can be swapped for ${amountOut} ${tokenSymbol1}`)
console.log('=========')


}  



const getPoolFromTokens = async () =>{
  const factoryContract = new ethers.Contract(
    factoryAddress,
    FactoryAbi,
    provider
  )

  const _poolAddress = await factoryContract.getPool(_tokenAddress0,_tokenAddress1, 500) 
  console.log(_poolAddress)
  //getPrice(1,_poolAddress)
  
  /*
  
    .then(poolAddress => console.log(poolAddress))
    */

}

const getTokensFromPool = async() => {
  const poolContract = new ethers.Contract(
    poolAddress,
    IUniswapV3PoolABI,
    provider
  )

  //pull token addresses
  const tokenAddress0 = await poolContract.token0();
  const tokenAddress1 = await poolContract.token1();
  console.log(tokenAddress0)
  console.log(tokenAddress1)


}

const checkProxyTokenContract = async (tokenAddress) =>{
  const tokenAbi = await getAbi(tokenAddress)
  let actualTokenData
  /*tokenAbi.map(
    abitem => console.log(abitem)

  )*/
  const symboltest = tokenAbi.find(
    abitem => abitem.name === 'symbol'

  )
  //console.log(symboltest)
  if(!symboltest){
    console.log("test failed for :"+tokenAddress)
    actualTokenData = await handleProxyTokenContract(tokenAddress,tokenAbi)
    //console.log(actualTokenData)
    return(actualTokenData)
    
  }else{
    console.log("test succeed for :"+ tokenAddress)
    actualTokenData = {tokenAddress,tokenAbi}
    //console.log(actualTokenData)
    return(actualTokenData)
  }
}

const handleProxyTokenContract = async (tokenAddress, tokenAbi) =>{
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

getExchanges();
getPrice(1) //how may eth 1 Wrapped BTC is worth 
//getPriceInverse(1)

//getTokensFromPool()

//getPoolFromTokens()
//console.log(FactoryAbi)
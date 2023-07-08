const { ethers } = require("ethers");
const { abi: IUniswapV3PoolABI } = require("@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json");
const { abi: QuoterABI } = require("@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json");

const { getAbi, getPoolImmutables } = require('./helpers')

require('dotenv').config()
const INFURA_URL = process.env.INFURA_URL
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY

const provider = new ethers.providers.JsonRpcProvider(INFURA_URL)

//const poolAddress = '0x45dda9cb7c25131df268515131f647d726f50608' //usdc wrapped eth - usdc proxied
//const poolAddress = '0x50eaedb835021e4a108b7290636d62e9765cc6d7' //WBTC - WETH 0.05%

const poolAddress = '0x167384319b41f7094e62f7506409eb38079abff8' //matic wrapped eth 0.3%

const quoterAddress = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6"


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

  console.log('=========')
  console.log(`${inputAmount} ${tokenSymbol0} can be swapped for ${amountOut} ${tokenSymbol1}`)
  console.log('=========')


}  

getPrice(1) //how may eth 1 Wrapped BTC is worth 

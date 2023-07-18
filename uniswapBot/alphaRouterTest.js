const { ethers, BigNumber } = require('ethers')
const abiDecoder = require('abi-decoder')
const { abi: IUniswapV3PoolABI } = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json')
const { abi: SwapRouterABI} = require('@uniswap/v3-periphery/artifacts/contracts/interfaces/ISwapRouter.sol/ISwapRouter.json')
const {Quoter} = require('@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json')
const { getAbi, getPoolData, getTokenData } = require('./helpers')



const {AlphaRouter,ChainId,SwapOptionsSwapRouter02,SwapRoute,SwapType} = require('@uniswap/smart-order-router')
const { Token, CurrencyAmount, TradeType, Percent } = require('@uniswap/sdk-core')

const JSBI  = require('jsbi') // jsbi@3.2.5

const V3_SWAP_ROUTER_ADDRESS = '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45'



require('dotenv').config()
const INFURA_URL = process.env.INFURA_URL
const WALLET_ADDRESS = process.env.WALLET_ADDRESS
const WALLET_SECRET = process.env.WALLET_SECRET
const API_KEY = process.env.ETHERSCAN_API_KEY

const provider = new ethers.providers.JsonRpcProvider(INFURA_URL)
const QUOTER_ADDRESS = '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6'




const main = async() =>{
  //create a router instance

  console.log(" ")
    console.log("TRADING BOT STARTED")
    console.log("-------------------")
   
   
    //pooladdress = "0xa374094527e1673a86de625aa59517c5de346d32" //sand
    pooladdress = "0xdac8a8e6dbf8c690ec6815e0ff03491b2770255d" //usdc


    //NEW POOLS

    let poolABI = await getAbi(pooladdress)
    let poolData = await getPoolData(pooladdress,poolABI)
    
    let token0 = poolData.token0
    let token1 = poolData.token1
    let tokenData0 = await getTokenData(token0)
    let tokenData1 = await getTokenData(token1)
    let addressPath = [token0,token1]
    
    let symbolPath = [tokenData0.symbol,tokenData1.symbol]
    let decimalPath = [tokenData0.decimals,tokenData1.decimals] 
    let slippage = 0.75
    let BUY_AMOUNT = 1
    console.log(" ")
    console.log("INITITAL TRADE STARTED")
    console.log("-------------------")
    
    //let boughtPrice = await initialTrade(BUY_AMOUNT, pooladdress, tokenIDs, tokenPaths, tokenDecimals)

  const chainId = 137
  const router = new AlphaRouter({ chainId: chainId, provider: provider})

  const symbol0 = symbolPath[0]
  const decimals0 = decimalPath[0] 
  const address0 = addressPath[0]

 
  const symbol1 = symbolPath[1]
  const decimals1 = decimalPath[1]
  const address1 = addressPath[1]

 
  let TOKEN1 = new Token(chainId, address0, decimals0)
  let TOKEN2 = new Token(chainId, address1, decimals1)

  const wei = ethers.utils.parseUnits(BUY_AMOUNT.toString(), decimals0) //it could be that we need to convert it to decimal 1? !!! 18
  const inputAmount = CurrencyAmount.fromRawAmount(TOKEN1, JSBI.BigInt(wei)) //!!! WETH


  console.log("units missing")
  const route = await router.route(
    inputAmount,
    TOKEN2,
    TradeType.EXACT_INPUT,
    {
      recipient: WALLET_ADDRESS,
      slippageTolerance: new Percent(2, 100), //was running at 25%
      deadline: Math.floor(Date.now()/1000 + 1800),
      type: SwapType.SWAP_ROUTER_02
    }
  )
  
  console.log("units missing 2")

  //console.log(`${BUY_AMOUNT} ${symbol0} will be swapped for ${route.quote.toFixed(10)} ${symbol1}`)
  console.log(`${BUY_AMOUNT} ${symbol0} will be swapped for ${route.quote.toFixed()} ${symbol1}`)

  console.log("units missing 3")

  //const wei = ethers.utils.parseUnits(amountIn.toString(), decimals0) //it could be that we need to convert it to decimal 1? !!! 18
  //const inputAmount = CurrencyAmount.fromRawAmount(WETH, JSBI.BigInt(wei)) //!!! WETH

}

main()


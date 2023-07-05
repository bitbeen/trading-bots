const { ethers } = require('ethers')
const { abi: IUniswapV3PoolABI } = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json')
const { abi: SwapRouterABI} = require('@uniswap/v3-periphery/artifacts/contracts/interfaces/ISwapRouter.sol/ISwapRouter.json')
const { getPoolImmutables, getPoolState, getAbi } = require('./helpers')

require('dotenv').config()
const INFURA_URL = process.env.INFURA_URL
const WALLET_ADDRESS = process.env.WALLET_ADDRESS
const WALLET_SECRET = process.env.WALLET_SECRET

const provider = new ethers.providers.JsonRpcProvider(INFURA_URL)
const poolAddress = '0x86f1d8390222a3691c28938ec7404a1661e618e0'//passed into function from previous
const swapRouterAddress = '0xE592427A0AEce92De3Edee1F18E0157C05861564'


/*
{
    sushiPoolID: '0xf1a12338d39fc085d8631e1a745b5116bc9b2a32',
    tokenPath: [ 'WMATIC', 'WETH' ],
    tokenIDs: [
      '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
      '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619'
    ],
    feeTier: 500,
    uniPoolID: '0x86f1d8390222a3691c28938ec7404a1661e618e0',
    name: 'Uniswap V3 Wrapped Matic/Wrapped Ether 0.05%'
  }


*/

const name0 = 'WMATIC Token'
const symbol0 = 'WMATIC'
const decimals0 = 18
const address0 = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270' //mainnet

const name1 = ' WETH Token'
const symbol1 = 'WETH'
const decimals1 = 18
const address1 = '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619'

exports.uniSwapBasicTrade = async () => {
	//buyPoolTokens

	console.log("swap started")
    const poolContract = new ethers.Contract(
      poolAddress,
      IUniswapV3PoolABI,
      provider
    )

	const immutables = await getPoolImmutables(poolContract)
  	const state = await getPoolState(poolContract)
  	console.log("pool contract works ")

	
	  const wallet = new ethers.Wallet(WALLET_SECRET)
	  const connectedWallet = wallet.connect(provider)
	  console.log("wallet connected ")

	  const swapRouterContract = new ethers.Contract(
		swapRouterAddress,
		SwapRouterABI,
		provider
	  )

	  console.log("connected to smart router contract")
  const inputAmount = 0.01 //this is the amount being swapped DO NOT LEAVE THIS FOR WETH
  // .001 => 1 000 000 000 000 000
  const amountIn = ethers.utils.parseUnits(
    inputAmount.toString(),
    decimals0
  )

  const approvalAmount = (amountIn * 10).toString()//do not give access to everything in real versiom
  const ERC20ABI = await getAbi(address0)
  console.log(ERC20ABI)
  console.log("connected to smart router contract")
  const tokenContract0 = new ethers.Contract(
    address0,
    ERC20ABI,
    //UNIABI,
    provider
  )

  gasPrice = await provider.getGasPrice()


  const approvalResponse = await tokenContract0.connect(connectedWallet).approve(
    swapRouterAddress,
    amountIn,
    {gasLimit: ethers.utils.hexlify(200000), //this is optimum gas for approval
      gasPrice: ethers.utils.parseUnits("200", "gwei")}
  ).then(


  )

  console.log(approvalResponse)
  console.log(ethers.constants.MaxUint256)

  const params = {
    tokenIn: immutables.token0,
    tokenOut: immutables.token1,
    fee: immutables.fee,
    recipient: WALLET_ADDRESS,
    deadline: Math.floor(Date.now() / 1000) + (60 * 10),//(60*5)(reduce to 2 mins)
    amountIn: amountIn,
    amountOutMinimum: 0,//proper version change this
    sqrtPriceLimitX96: 0,
  }
  
  const transaction = swapRouterContract.connect(connectedWallet).exactInputSingle(
    params,
    {
      gasLimit: ethers.utils.hexlify(200000), //20000000
      gasPrice: ethers.utils.parseUnits("178", "gwei")
    }
  ).then(transaction => {
    console.log(transaction)
  })

  console.log("swap completed")



}

exports.uniSwapOptimumTrade = async () => {
	//buyPoolTokens

}

exports.sushiSwapBasicTrade = async () => {
	//buyPoolTokens

}

exports.sushiSwapOptimumTrade = async () => {
	//buyPoolTokens

}

exports.buyPoolTokens= async () => {
	//buyPoolTokens

}
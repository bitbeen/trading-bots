const { ethers } = require('ethers')
const { abi: IUniswapV3PoolABI } = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json')
const { abi: SwapRouterABI} = require('@uniswap/v3-periphery/artifacts/contracts/interfaces/ISwapRouter.sol/ISwapRouter.json')
const { getPoolImmutables, getPoolState } = require('./helpers')
const ERC20ABI = require('./abi.json')
const UNIABI = require('./abi-uni.json')

require('dotenv').config()
const INFURA_URL = process.env.INFURA_URL
const WALLET_ADDRESS = process.env.WALLET_ADDRESS
const WALLET_SECRET = process.env.WALLET_SECRET


const provider = new ethers.providers.JsonRpcProvider(INFURA_URL) // Mumbai
//const poolAddress = "0x4D7C363DED4B3b4e1F954494d2Bc3955e49699cC" // UNI/WETH - Get address by getting pool from tokens 
//const poolAddress = "0x357faf5843c7fd7fb4e34fbeabdac16eabe8a5bc"
//const poolAddress = "0xE3E03601DED8C4AE350351C54ce2cB07450e715d" //MATIC + WRAPPED ETH main net 
//const poolAddress = "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45" //MATIC + WRAPPED ETH Testnet - we need the test need pool 
const poolAddress = '0x7f9121b4f4e040fd066e9dc5c250cf9b4338d5bc' //MATIC + WRAPPED ETH Testnet - we need the test need pool 

const swapRouterAddress = '0xE592427A0AEce92De3Edee1F18E0157C05861564' //this remains the same 
/*
const name0 = 'Wrapped Ether'
const symbol0 = 'WETH'
const decimals0 = 18
//const address0 = '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619' //mainnet
const address0 = '0xa6fa4fb5f76172d178d61b04b0ecd319c5d1c0aa' //testnet
*/
/*const name0 = 'Matic Token'
const symbol0 = 'MATIC'
const decimals0 = 18
const address0 = '0x0000000000000000000000000000000000001010'*/

/*
const name0 = 'Wrapped Ether'
const symbol0 = 'WETH'
const decimals0 = 18
const address0 = '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619' //mainnet


const name1 = 'WMATIC Token'
const symbol1 = 'WMATIC'
const decimals1 = 18
const address1 = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'*/


const name0 = 'WMATIC Token'
const symbol0 = 'WMATIC'
const decimals0 = 18
const address0 = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270' //mainnet


const name1 = ' UNI Token'
const symbol1 = 'UNI'
const decimals1 = 18
const address1 = '0xb33EaAd8d922B1083446DC23f610c2567fB5180f'


//0x86f1d8390222A3691C28938eC7404A1661E618e0 WMATIC / WETH 

/*
const name1 = 'Uniswap Token'
const symbol1 = 'UNI'
const decimals1 = 18
const address1 = '0xb33EaAd8d922B1083446DC23f610c2567fB5180f'*/




//traded wrapped eth for wrapped matic instead

async function main() {
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

  const swapRouterContract = new ethers.Contract(
    swapRouterAddress,
    SwapRouterABI,
    provider
  )
  console.log("connected to smart router contract")
  const inputAmount = 0.1 //this is the amount being swapped DO NOT LEAVE THIS FOR WETH
  // .001 => 1 000 000 000 000 000
  const amountIn = ethers.utils.parseUnits(
    inputAmount.toString(),
    decimals0
  )


 
  //const approvalAmount = (amountIn * 200000).toString() //ETH
  //const approvalAmount = (amountIn * 100000).toString()
  const approvalAmount = (amountIn * 10).toString()
  
  console.log(approvalAmount)
  const tokenContract0 = new ethers.Contract(
    address0,
    ERC20ABI,
    //UNIABI,
    provider
  )


  console.log("not approved")

  gasPrice = await provider.getGasPrice()


  // ...often this gas price is easier to understand or
  // display to the user in gwei
  console.log(ethers.utils.formatUnits(gasPrice, "gwei"))

  /*const approvalResponse = await tokenContract0.connect(connectedWallet).approve(
    swapRouterAddress,
    approvalAmount.toString(),
    {gasLimit: ethers.utils.hexlify(2000000), //this is optimum gas for approval
      gasPrice: ethers.utils.parseUnits("168", "gwei")
    
    }
  )*/

  const approvalResponse = await tokenContract0.connect(connectedWallet).approve(
    swapRouterAddress,
    amountIn,
    {gasLimit: ethers.utils.hexlify(200000), //this is optimum gas for approval
      gasPrice: ethers.utils.parseUnits("200", "gwei")}
  ).then(


  )

  console.log(approvalResponse)
  console.log(ethers.constants.MaxUint256)

    //HERE


  const params = {
    tokenIn: immutables.token0,
    tokenOut: immutables.token1,
    fee: immutables.fee,
    recipient: WALLET_ADDRESS,
    deadline: Math.floor(Date.now() / 1000) + (60 * 10),
    amountIn: amountIn,
    amountOutMinimum: 0,
    sqrtPriceLimitX96: 0,
  }
  
  const transaction = swapRouterContract.connect(connectedWallet).exactInputSingle(
    params,
    {
      gasLimit: ethers.utils.hexlify(200000), //20000000
      gasPrice: ethers.utils.parseUnits("168", "gwei")
    }
  ).then(transaction => {
    console.log(transaction)
  })

  console.log("swap completed")
}

main()
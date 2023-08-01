const UniswapV3Pool = require("@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json")
const { getAbi,  getFeePools, handleProxyTokenContract } = require('./helpers')
const { Contract, BigNumber } = require("ethers")
require('dotenv').config()
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY
const MAINNET_URL = process.env.MAINNET_URL
const provider = new ethers.providers.JsonRpcProvider(MAINNET_URL);
const wallet = process.env.WALLET_ADDRESS



TETHER_ADDRESS= '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'
USDC_ADDRESS= '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'
FLASH_ADDRESS="0x2Ef541781439D88eBb484cd9c18bBFC561d19354"


WETH_ADDRESS= '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619' //this is just wrapped Eth
FACTORY_ADDRESS= '0x1F98431c8aD98523631AE4a59f267346ea31F984'
SWAP_ROUTER_ADDRESS= '0xE592427A0AEce92De3Edee1F18E0157C05861564'
NFT_DESCRIPTOR_ADDRESS= '0x42B24A95702b9986e82d421cC3568932790A48Ec'
POSITION_DESCRIPTOR_ADDRESS= '0x91ae842A5Ffd8d12023116943e72A606179294f3'
POSITION_MANAGER_ADDRESS= '0xC36442b4a4522E871399CD717aBDD847Ab11FE88'


const artifacts = {
  /*UniswapV3Factory: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json"),
  SwapRouter: require("@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json"),
  NFTDescriptor: require("@uniswap/v3-periphery/artifacts/contracts/libraries/NFTDescriptor.sol/NFTDescriptor.json"),
  NonfungibleTokenPositionDescriptor: require("@uniswap/v3-periphery/artifacts/contracts/NonfungibleTokenPositionDescriptor.sol/NonfungibleTokenPositionDescriptor.json"),
  NonfungiblePositionManager: require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json"),*/
  Usdt: require("../abis/Tether.json"),
  Usdc: require("../abis/UsdCoin.json"),
  //WETH9,
};

const toEth = (wei) => ethers.utils.formatEther(wei) //helper function convert WEI to ether

async function main() {
  
  //const T2ABI = await getAbi("0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174")
  
  const [owner, signer2] = await ethers.getSigners(); //connect to provider

  //you want to do all the token contract grabbing too before you get the contract tbh

  let usdtContract
  let usdcContract
  let usdtBalance
  let usdcBalance
  try{
    let T1ABI = await getAbi(TETHER_ADDRESS)
    usdtContract = new Contract(TETHER_ADDRESS,T1ABI,provider)
    usdtBalance = await usdtContract.connect(provider).balanceOf(wallet)
   
    

  }catch{
    let T1ABI = await getAbi(TETHER_ADDRESS)
    console.log(T1ABI)
    console.log("debug")
    proxyContractData = await handleProxyTokenContract(TETHER_ADDRESS,T1ABI)
    console.log("debug")
    usdtContract = new ethers.Contract(
      proxyContractData.tokenAddress,
      proxyContractData.tokenAbi,
      provider
    )
    console.log("debug")
    usdtBalance = await usdtContract.connect(provider).balanceOf(wallet)
    console.log("debug")
 

  }

  try{
    let  T2ABI = await getAbi(USDC_ADDRESS)
    usdcContract = new Contract(USDC_ADDRESS,T2ABI,provider)
    usdcBalance = await usdcContract.connect(provider).balanceOf(wallet)
    

  }catch{
    let  T2ABI = await getAbi(USDC_ADDRESS)
    console.log(T2ABI)
    proxyContractData = await handleProxyTokenContract(USDC_ADDRESS,T2ABI)
    usdcContract = new ethers.Contract(
      proxyContractData.tokenAddress,
      proxyContractData.tokenAbi,
      provider
    )
    usdcBalance = await usdcContract.connect(provider).balanceOf(wallet)
 

  }
  
  
  /*
  let usdtBalance = await usdtContract.connect(provider).balanceOf(wallet)
  let usdcBalance = await usdcContract.connect(provider).balanceOf(wallet)*/
  console.log('-------------------- BEFORE') //print balance before you do the swap
  console.log('usdtBalance', toEth(usdtBalance.toString()))
  console.log('usdcBalance', toEth(usdcBalance.toString()))
  console.log('--------------------')
  //Stop here




  /*
  const tx = await flash.connect(signer2).initFlash( //call init flash from the flash pair contract
    [
      TETHER_ADDRESS, //token0
      USDC_ADDRESS, //token1
      500, //fee tier of first borrow (borrow both tokens 1:1)
      ethers.utils.parseEther('1'), //amounts borrowed of token 0 and token 1
      ethers.utils.parseEther('1'),
      3000, //fee tier of pool where token1 is higher
      10000 //fee tier of pool where token0 is higher
    ],
    { gasLimit: ethers.utils.hexlify(1000000) }
  );
  await tx.wait() //wait for the transaction to complete

  //get balance again to see if things worked
  usdtBalance = await usdtContract.connect(provider).balanceOf(signer2.address)
  usdcBalance = await usdcContract.connect(provider).balanceOf(signer2.address)
  console.log('-------------------- AFTER')
  console.log('usdtBalance', toEth(usdtBalance.toString()))
  console.log('usdcBalance', toEth(usdcBalance.toString()))
  console.log('--------------------')*/
}

/*
npx hardhat run --network localhost scripts/06_flashSwap.js
*/

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
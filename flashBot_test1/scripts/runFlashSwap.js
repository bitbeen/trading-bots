const UniswapV3Pool = require("@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json")
const { getAbi,  getFeePools, handleProxyTokenContract } = require('./helpers')
const { Contract, BigNumber, Signer } = require("ethers")
require('dotenv').config()
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY
const MAINNET_URL = process.env.MAINNET_URL
const provider = new ethers.providers.JsonRpcProvider(MAINNET_URL);
const wallet = process.env.WALLET_ADDRESS



//addresses of uniswap router pools
WETH_ADDRESS= '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619' //this is just wrapped Eth
FACTORY_ADDRESS= '0x1F98431c8aD98523631AE4a59f267346ea31F984'
SWAP_ROUTER_ADDRESS= '0xE592427A0AEce92De3Edee1F18E0157C05861564'
NFT_DESCRIPTOR_ADDRESS= '0x42B24A95702b9986e82d421cC3568932790A48Ec'
POSITION_DESCRIPTOR_ADDRESS= '0x91ae842A5Ffd8d12023116943e72A606179294f3'
POSITION_MANAGER_ADDRESS= '0xC36442b4a4522E871399CD717aBDD847Ab11FE88'
FLASH_ADDRESS="0x41E6e2D5235ae8922E80808D4bEdaaDC75B39f38"



//token addresses
TETHER_ADDRESS= '0x104592a158490a9228070e0a8e5343b499e125d0' //TOKEN 0
USDC_ADDRESS= '0x2791bca1f2de4661ed88a30c99a7a9449aa84174' //TOKEN 1

//const WETH9 = getAbi('0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619')
//the various uniswap abis
const artifacts = {
  UniswapV3Factory: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json"),
  SwapRouter: require("@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json"),
  NFTDescriptor: require("@uniswap/v3-periphery/artifacts/contracts/libraries/NFTDescriptor.sol/NFTDescriptor.json"),
  NonfungibleTokenPositionDescriptor: require("@uniswap/v3-periphery/artifacts/contracts/NonfungibleTokenPositionDescriptor.sol/NonfungibleTokenPositionDescriptor.json"),
  NonfungiblePositionManager: require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json"),
  flashAbi: require("../artifacts/contracts/FlashSwapTest.sol/FlashSwapTest.json"),
  
};

//helper function convert wei to Either 
const toEth = (wei) => ethers.utils.formatEther(wei) //helper function convert WEI to ether

async function main() {

  //set up signers and final abi data
  const WETH9 = await getAbi(WETH_ADDRESS) //WETH9, pass this in inside of the other one
  
  let usdtContract
  let usdcContract
  let usdtBalance
  
 
  const [owner, signer2] = await ethers.getSigners(); //signer 2 doesn't work for reasons
  console.log(owner.address)

  //things got abit odd
  let TOKEN0ABI = await getAbi(TETHER_ADDRESS)
  try{
    
    usdtContract = new Contract(TETHER_ADDRESS,WETH9,provider)
    usdtBalance = await usdtContract.connect(provider).balanceOf(owner.address)
  }catch(err){
    console.log("debug")
    console.log(err)
    proxyContractData = await handleProxyTokenContract(TETHER_ADDRESS,TOKEN0ABI)
    usdtContract = new Contract(
          proxyContractData.tokenAddress,
          proxyContractData.tokenAbi,
          provider
        )
    usdtBalance = await usdtContract.connect(provider).balanceOf(owner.address)
  }

  //back on track 
  try{
    
    usdcContract = new Contract(USDC_ADDRESS,WETH9,provider)
    usdcBalance = await usdcContract.connect(provider).balanceOf(owner.address)
  }catch(err){
    console.log("debug")
    console.log(err)
    proxyContractData = await handleProxyTokenContract(USDC_ADDRESS,TOKEN1ABI)
    usdcContract = new Contract(
          proxyContractData.tokenAddress,
          proxyContractData.tokenAbi,
          provider
        )
    usdcBalance = await usdcContract.connect(provider).balanceOf(owner.address)
  }
  console.log('-------------------- BEFORE') //print balance before you do the swap
  console.log('usdtBalance', toEth(usdtBalance.toString()))
  console.log('usdcBalance', toEth(usdcBalance.toString()))
  console.log('--------------------')

  flash = new Contract(FLASH_ADDRESS,artifacts.flashAbi.abi,provider)

  const tx = await flash.connect(owner).initFlash( //call init flash from the flash pair contract
    [
      TETHER_ADDRESS, //token0
      USDC_ADDRESS, //token1
      100, //fee tier of first borrow (borrow both tokens 1:1) REMEBER TO CHANGE
      ethers.utils.parseEther('1000000'), //amounts borrowed of token 0 and token 1
      ethers.utils.parseEther('1000000'),
      3000, //fee tier of pool where token1 is higher REMEBER TO CHANGE - highest
      500 //fee tier of pool where token0 is higher REMEBER TO CHANGE - lowest
    ],
    { gasLimit: ethers.utils.hexlify(1000000) }
  );
  await tx.wait() //wait for the transaction to complete
  usdtBalance = await usdtContract.connect(provider).balanceOf(owner.address)
  usdcBalance = await usdcContract.connect(provider).balanceOf(owner.address)
  console.log('-------------------- AFTER')
  console.log('usdtBalance', toEth(usdtBalance.toString()))
  console.log('usdcBalance', toEth(usdcBalance.toString()))
  console.log('--------------------')


  

 
}


//npx hardhat run --network mainnet scripts/runFlashSwap.js

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
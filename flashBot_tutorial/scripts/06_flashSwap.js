const { Contract } = require("ethers")

// Uniswap contract address
/*WETH_ADDRESS= '0x5FbDB2315678afecb367f032d93F642f64180aa3'
FACTORY_ADDRESS= '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'
SWAP_ROUTER_ADDRESS= '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0'
NFT_DESCRIPTOR_ADDRESS= '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9'
POSITION_DESCRIPTOR_ADDRESS= '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9'
POSITION_MANAGER_ADDRESS= '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707'

// Token addresses
TETHER_ADDRESS= '0x0165878A594ca255338adfa4d48449f69242Eb8F'
USDC_ADDRESS= '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853'*/

TETHER_ADDRESS= '0x610178dA211FEF7D417bC0e6FeD39F05609AD788'
USDC_ADDRESS= '0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e'


WETH_ADDRESS= '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9'
FACTORY_ADDRESS= '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707'
SWAP_ROUTER_ADDRESS= '0x0165878A594ca255338adfa4d48449f69242Eb8F'
NFT_DESCRIPTOR_ADDRESS= '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853'
POSITION_DESCRIPTOR_ADDRESS= '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6'
POSITION_MANAGER_ADDRESS= '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318'

const WETH9 = require("../WETH9.json")
const artifacts = {
  UniswapV3Factory: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json"),
  SwapRouter: require("@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json"),
  NFTDescriptor: require("@uniswap/v3-periphery/artifacts/contracts/libraries/NFTDescriptor.sol/NFTDescriptor.json"),
  NonfungibleTokenPositionDescriptor: require("@uniswap/v3-periphery/artifacts/contracts/NonfungibleTokenPositionDescriptor.sol/NonfungibleTokenPositionDescriptor.json"),
  NonfungiblePositionManager: require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json"),
  Usdt: require("../artifacts/contracts/Tether.sol/Tether.json"),
  Usdc: require("../artifacts/contracts/UsdCoin.sol/UsdCoin.json"),
  WETH9,
};

const toEth = (wei) => ethers.utils.formatEther(wei) //helper function convert WEI to ether

async function main() {
  const provider = waffle.provider;
  const [owner, signer2] = await ethers.getSigners(); //connect to provider

  Flash = await ethers.getContractFactory('PairFlash', signer2);
  //!!!!!!!!
  flash = await Flash.deploy(SWAP_ROUTER_ADDRESS, FACTORY_ADDRESS, WETH_ADDRESS); //this delpoys a new contract everytime you flashswap bad idea!
  console.log('flash', flash.address)

  const usdtContract = new Contract(TETHER_ADDRESS,artifacts.Usdt.abi,provider)
  const usdcContract = new Contract(USDC_ADDRESS,artifacts.Usdc.abi,provider)

  let usdtBalance = await usdtContract.connect(provider).balanceOf(signer2.address)
  let usdcBalance = await usdcContract.connect(provider).balanceOf(signer2.address)
  console.log('-------------------- BEFORE') //print balance before you do the swap
  console.log('usdtBalance', toEth(usdtBalance.toString()))
  console.log('usdcBalance', toEth(usdcBalance.toString()))
  console.log('--------------------')

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
  console.log('--------------------')
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
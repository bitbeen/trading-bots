const { Contract, BigNumber } = require("ethers")
require('dotenv').config()
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY
const MAINNET_URL = process.env.MAINNET_URL
const provider = new ethers.providers.JsonRpcProvider(MAINNET_URL);

const hre = require("hardhat");

async function main() {
//const [owner, signer2] = await ethers.getSigners(); //connect to provider

WETH_ADDRESS= '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619' //this is just wrapped Eth
FACTORY_ADDRESS= '0x1F98431c8aD98523631AE4a59f267346ea31F984'
SWAP_ROUTER_ADDRESS= '0xE592427A0AEce92De3Edee1F18E0157C05861564'

Flash = await ethers.getContractFactory('PairFlash');
flash = await Flash.deploy(SWAP_ROUTER_ADDRESS, FACTORY_ADDRESS, WETH_ADDRESS); //this delpoys a new contract everytime you flashswap bad idea!
console.log('flash', flash.address)

 
}

/*
npx hardhat run --network mainnet scripts/checkLiquidity.js
*/
 main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
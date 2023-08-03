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


  Flash = await ethers.getContractFactory('FlashSwapTest');
  flash = await Flash.deploy(SWAP_ROUTER_ADDRESS, FACTORY_ADDRESS, WETH_ADDRESS); //this delpoys a new contract everytime you flashswap bad idea!
  console.log('flash', flash.address)
  

 
}

/*
npx hardhat run --network mainnet scripts/deployFlashSwapTest.js
0x41E6e2D5235ae8922E80808D4bEdaaDC75B39f38
https://hardhat.org/hardhat-runner/plugins/nomicfoundation-hardhat-verify -- verify with params
npx hardhat verify --constructor-args scripts/arguments.js 0x41E6e2D5235ae8922E80808D4bEdaaDC75B39f38 --network mainnet
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan"); 
*/
 main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
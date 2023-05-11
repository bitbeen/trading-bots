const ethers = require('ethers')
const factoryArtifact = require('@uniswap/v2-core/build/UniswapV2Factory.json')
const { getAbi, getPoolImmutables } = require('./helpers')

const INFURA_URL = process.env.INFURA_URL
const provider = new ethers.providers.JsonRpcProvider(INFURA_URL)


const SUSHI_FACTORY = '0xc35DADB65012eC5796536bD9864eD8773aBc74C4'
const UNI_FACTORY = '0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32'
const USDC = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'
const WETH = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619"

//get pOOL  from sushi swap based on uniswap

const getPairs = async() => {
    //const sushiAbi = await getAbi(SUSHI_FACTORY)
   //const uniAbi = await getAbi(UNI_FACTORY)
    console.log(factoryArtifact.abi)

//const _tokenAddress0 = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270"
//const _tokenAddress1 = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619"

    const sushiFactory = new ethers.Contract(SUSHI_FACTORY, factoryArtifact.abi, provider)
    const uniFactory = new ethers.Contract(UNI_FACTORY, factoryArtifact.abi, provider)
    const sushiPair = await sushiFactory.getPair(USDC, WETH)
    const uniPair = await uniFactory.getPair(USDC, WETH)

    console.log('sushiPair', sushiPair)
    console.log('uniPair', uniPair)

}

getPairs()

//returns pool addresses for uniswap and sushi swap 
//get prices for sushi swap
//get the pair pools for ape and other swaps 
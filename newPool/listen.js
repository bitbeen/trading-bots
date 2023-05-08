//run first script deploying uniswap V3 contracts 
const ethers = require('ethers')
const factoryArtifact = require('@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json')
const factoryAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'

const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545/')
const factory = new ethers.Contract(factoryAddress, factoryArtifact.abi, provider)

factory.on('PoolCreated', (token0, token1, fee, tickSpacing, pool) => {
    console.log(`Pool created with ${token0} & ${token1} at ${pool}`)
})
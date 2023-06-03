const ethers = require('ethers');
//const { getAbi, getPoolImmutables, handleProxyTokenContract } = require('./helpers')

const { getAbi, getPoolData, getPoolFromTokens, _getAmountsOut } = require('./helpers')
const { getExchanges} = require('./coingecko')

const INFURA_URL = process.env.INFURA_URL

const provider = new ethers.providers.JsonRpcProvider(INFURA_URL);


const token0 = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'; // WMATIC
const token1 = '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'; // WETH

//const token0 = '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'; // WMATIC
//const token1 = '0xd6df932a45c0f255f85145f286ea0b292b21c90b'; // AAVE


//const uniRouterAddress = '0xE592427A0AEce92De3Edee1F18E0157C05861564'
//const sushiRouterAddress = '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506' //polygon address

const uniFactoryAddress = "0x1F98431c8aD98523631AE4a59f267346ea31F984";
const sushiFactoryAddress = "0x917933899c6a5F8E37F31E19f92CdBFF7e8FF0e2";

const PATH = [token0, token1] //direction of swap ->


const _routerAbi = [
    'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
]
//run get Abi on router contracts to get actual ABI (useful for other swaps)


const main = async () => {

    //get relevant ABIS
    /*
    const routerAbiU = await getAbi(uniRouterAddress) // 0xe592427a0aece92de3edee1f18e0157c05861564
    const routerAbiS = await getAbi(sushiRouterAddress)*/

    const factoryAbiU = await getAbi(uniFactoryAddress) // 0xe592427a0aece92de3edee1f18e0157c05861564
    const factoryAbiS = await getAbi(sushiFactoryAddress)

    //const actual_contract_data = await g

    /*
    const uniRouter = new ethers.Contract(uniRouterAddress, routerAbiU, provider);
    const sushiRouter = new ethers.Contract(sushiRouterAddress, routerAbiS, provider);
    */

    //amount being passed into arbitraged - parse ether converts to wei (10^18)
    //const amountIn = ethers.utils.parseEther('1'); if you parse ether it reads it in wei 
    const amountIn = 1
   

    //get the respective uniswap and sushi swap pools for each token path
    const uniPool = await getPoolFromTokens(uniFactoryAddress,factoryAbiU, PATH,500) //500 for sushi uni
    const uniPool1 = await getPoolFromTokens(uniFactoryAddress,factoryAbiU, PATH,3000) //500 for sushi uni
    //const uniPool2 = await getPoolFromTokens(uniFactoryAddress,factoryAbiU, PATH,500) //500 for sushi uni


    const sushiPool = await getPoolFromTokens(sushiFactoryAddress,factoryAbiS,PATH,500) //500

    const poolAbiU = await getAbi(uniPool) // 0xe592427a0aece92de3edee1f18e0157c05861564
    const poolAbiU1 = await getAbi(uniPool1) // 0xe592427a0aece92de3edee1f18e0157c05861564
    const poolAbiS = await getAbi(sushiPool)

    const uniImmutables =  await getPoolData(uniPool,poolAbiU)
    const uniImmutables1 =  await getPoolData(uniPool1,poolAbiU1)
    const sushiImmutables =  await getPoolData(sushiPool,poolAbiS)
    //const sushiImmutables = await getPoolData(sushiPool,poolAbiS)

    //this is where things get weird
    //we need to get the price from the sushi router and uniPool
    //

    //console.log(uniImmutables)

    
    //console.log(sushiImmutables)

    //use sushi router to get V2 sushi price 
    //use unitick to get V3 uni price

    const uniPrice = await _getAmountsOut(amountIn, PATH, uniImmutables)
    const uniPrice1 = await _getAmountsOut(amountIn, PATH, uniImmutables1)
    const sushiPrice = await _getAmountsOut(amountIn, PATH, sushiImmutables)
    //const sushiAmount = await sushiRouter.getAmountsOut(amountIn, PATH)
    //const sushiPrice = Number(sushiAmount[1]/sushiAmount[0])

    //console.log(uniAmount) 
    //console.log(sushiAmount)

    TX_FEE = uniImmutables.fee/(10**6) //the pool fee should comefrom immutables not manual


    let effUniPrice;
    let effSushiPrice;
    let spread;
    console.log(TX_FEE)

    //once subgraphs installed no need for this and manually grabbing fee


    //console.log(`${uniPool} ${sushiPool}`)

    //get swapped amount in ether from each swapped pool
    //const uniAmount = await uniRouter.getAmountsOut(amountIn,PATH) 
    //const sushiAmount = await sushiRouter.getAmountsOut(amountIn,PATH)
   
    
    if (uniPrice > sushiPrice){
        effUniPrice = uniPrice - (uniPrice * TX_FEE)
        effSushiPrice = sushiPrice +(sushiPrice * TX_FEE)
        spread = effUniPrice - effSushiPrice

        console.log(effUniPrice)
        console.log(effSushiPrice)
        console.log(spread)
        console.log('uni to sushi spread:', spread)

        if (spread > 0){
            console.log('sell on uni, buy on sushi')
        }else{
            console.log('no arb opportunity')
        }

    }else if (sushiPrice > uniPrice){
       effSushiPrice = sushiPrice - (sushiPrice * TX_FEE)
       effUniPrice = uniPrice + (uniPrice * TX_FEE)
       spread = effSushiPrice - effUniPrice
       console.log('sushi to uni spread', spread)
       console.log(effUniPrice)
        console.log(effSushiPrice)
        console.log(spread)

       if (spread > 0){
        console.log('sell on uni, buy on sushi')
        }else{
        console.log('no arb opportunity')
        }
    }
    else{
        effSushiPrice = sushiPrice -(sushiPrice * TX_FEE)
        effUniPrice = uniPrice +(uniPrice * TX_FEE)
        spread = effSushiPrice - effUniPrice
        console.log(effUniPrice)
        console.log(effSushiPrice)
        console.log(spread)
        console.log('sushi to uni spread', spread)
        //console.log(spread) 
        console.log('price is the same')
        console.log('no arb opportunity')
    }
   
        //calculate gas fee of making transaction 


     console.log('uniPrice', uniPrice)
     console.log('uniPrice', uniPrice1)
     //console.log('sushiPrice', sushiPrice)


     //get price from pools not router 

}

main ()

//getExchanges()

//https://stackoverflow.com/questions/69233678/using-web3js-get-coin-price-on-uniswap-and-sushiswap-exchange-without-using-thei
//I think this is the solution tbh

//get price from the tick value in slot 
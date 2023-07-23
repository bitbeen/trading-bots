//get access to a pool 
//buy  a token 
//wait 

const ethers = require('ethers'); // connect to blockchain 
const { getAbi, getPoolData, getTokenData, getRecentSwapData } = require('../uniswapBot/helpers')
const { getCurrentPriceUni } = require('../uniswapBot/tradehelpers')

const INFURA_URL = process.env.INFURA_URL
const provider = new ethers.providers.JsonRpcProvider(INFURA_URL); //init provider




const uniFactoryAddress = "0x1F98431c8aD98523631AE4a59f267346ea31F984";
const sushiFactoryAddress = "0x917933899c6a5F8E37F31E19f92CdBFF7e8FF0e2";

//https://www.geckoterminal.com/polygon_pos/pools/0xa33f2ec45035658c26a47c356706e9e506f867d0
//use this to find pools


/**
 * 0.1 of token 0 return the amount bought
 *if token 0 price goes up by 5% sell the amount bought. 
 * 5 % should be enough to cover for goes, slippage and tax fees
 * 
 * 
 */

const main = async() =>{
    //get and print data about the trading pool
    const INCREASE_VALUE = 2 //tx 0.1% max
    const TRADE_AMOUNT = 0.1
    console.log(" ")
    console.log("TRADING BOT STARTED")
    console.log("-------------------")
    
    let swaps = await getPositiveIO()
    console.log(await swaps)

    let pooladdress = swaps[0].pool.id

    let poolABI = await getAbi(pooladdress)
    let poolData = await getPoolData(pooladdress,poolABI)
    
    let token0 = poolData.token0
    let token1 = poolData.token1
    let tokenData0 = await getTokenData(token0)
    let tokenData1 = await getTokenData(token1)
    let tokenIDs = [token0,token1]
    
    let tokenPaths = [tokenData0.symbol,tokenData1.symbol]
    let tokenDecimals = [tokenData0.decimals,tokenData1.decimals] 
    let slippage = 0.75
    const BUY_AMOUNT = 0.1

    //GET most recent pool from list of swaps
    //This is how you find pools to make the youtube video work
    //Make a single trade but don't swap back
    //For now this wont make sense but long term when you do a flash swap you can keep the profits.

    console.log(" ")
    console.log("TRADING BOT STARTED")
    console.log("-------------------")

    potentialOutputPrice = await getCurrentPriceUni(tokenIDs.reverse(),tokenPaths.reverse(),tokenDecimals.reverse(), BUY_AMOUNT)

    
   


    
}



const getPositiveIO = async() =>{
    let recentSwapData = await getRecentSwapData()
    //console.log(recentSwapData)
    let swaps = []

    for (let swap in recentSwapData){
        //console.log(false)
        if(
            recentSwapData[swap].amountOutUSD !=0 
            && recentSwapData[swap].amountInUSD !=0 
            &&  recentSwapData[swap].amountOutUSD > recentSwapData[swap].amountInUSD
            /*
            &&  recentSwapData[swap].tokenOut.symbol != 'WMATIC' 
            &&  recentSwapData[swap].tokenIn.symbol != 'WMATIC' 
            &&  recentSwapData[swap].tokenOut.symbol != 'WETH' 
            &&  recentSwapData[swap].tokenIn.symbol != 'WETH' 
            &&  recentSwapData[swap].tokenOut.symbol != 'AAVE' 
            &&  recentSwapData[swap].tokenIn.symbol != 'AAVE' 
            &&  recentSwapData[swap].tokenOut.symbol != 'WBTC' 
            &&  recentSwapData[swap].tokenIn.symbol != 'WBTC' 
            &&  recentSwapData[swap].tokenOut.symbol != 'LINK' 
            &&  recentSwapData[swap].tokenIn.symbol != 'LINK'*/
            
            
            
            ){
            swaps.push(recentSwapData[swap])
            //console.log(true)

        }

    }

    return swaps

}

main()



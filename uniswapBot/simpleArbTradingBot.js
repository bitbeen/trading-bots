

const ethers = require('ethers'); // connect to blockchain 
const { getAbi, getPoolData, getTokenData } = require('./helpers')

const { arbPollingTrade } = require('./tradehelpers')

const INFURA_URL = process.env.INFURA_URL
const provider = new ethers.providers.JsonRpcProvider(INFURA_URL); //init provider



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
    
    console.log(" ")
    console.log("ARBITRAGE BOT STARTED")
    console.log("-------------------")
 

    //pooladdress = "0x5f69c2ec01c22843f8273838d570243fd1963014" //USDC/DAI 0.05%
    //pooladdress = "0xdac8a8e6dbf8c690ec6815e0ff03491b2770255d" //USDT/USDC 0.01%
    pooladdress ="0x99799d0e96d4e436f4b8d2e125f0b1ce8e1770a7" //USDC/MIM 0.3% - worth looking into bot that trades out of at decent peak
    //pooladdress ="0x254aa3a898071d6a2da0db11da73b02b4646078f" //USDT/DAI 0.3%
    //pooladdress ="0x0a63d3910ffc1529190e80e10855c4216407cc45" //USDT/BOB 0.01% - worth looking into bot that trades out of at decent peak
    //pooladdress = "0x2c9706d421ddd566fd487628592b2451898eb77f" //BUSD USDC



    //NEW POOLS

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
    let maticPrice = 0.75
    const BUY_AMOUNT = 1
    console.log(" ")
    console.log("ARB POLLING STARTED")
    console.log("-------------------")

    let priceMonitor = setInterval(async () => { 
        console.log(" ")
        console.log("ARB POLLING RUNNING")
        console.log("-------------------")
        let pollingres
        
        
        
        
        
        pollingres = await arbPollingTrade(BUY_AMOUNT, pooladdress, tokenIDs, tokenPaths, tokenDecimals)
        try{
            console.log(pollingres)
            console.log(" ")
            console.log("NEXT POLL")
            console.log("-------------------")
        }
        catch{
            pollingres = {status: false}
            console.log("")
            console.log("NEXT PRICE POLL - STATUS FAILED")
            console.log("-------------------")
        }

        if(pollingres.status===true){
            
            clearInterval(priceMonitor)
          
            console.log(" ")
            console.log("POLLING STOPPED COMPLETE")
            console.log("-------------------")
            profit = pollingres.amount1 - pollingres.amount0
            totalGasCost = (pollingres.tx1Cost + pollingres.tx2Cost) * maticPrice
            profitAfterGas = profit - totalGasCost 
            console.log(`started: ${BUY_AMOUNT}, 
                            ended: ${pollingres.amount1}, 
                            profit: ${profit }, 
                            total gas cost ${totalGasCost}, 
                            profit after gas ${ profitAfterGas} `)

        
            console.log(" ")
            console.log("TRADE COMPLETE")
            console.log("-------------------")
            }

    }, 20000)



    /**
     * 
     * 
     * Check the price 
     * If there is a large enough variance
     * Then Make a since trade depending on direction
     */


    /*

    let swapData = await initialTrade(BUY_AMOUNT, pooladdress, tokenIDs, tokenPaths, tokenDecimals)
    

    console.log(" ")
    console.log("INITAL TRADE COMPLETE")
    console.log("-------------------")

    let tokenIDsR= tokenIDs.reverse()
    let tokenPathsR= tokenPaths.reverse()
    let tokenDecimalsR = tokenDecimals.reverse()
    

    let priceMonitor = setInterval(async () => { 
        console.log(" ")
        console.log("PRICE POLLING RUNNING")
        console.log("-------------------")
        let pollingres
        try{
            pollingres = await pollingTrade(swapData.amount1, pooladdress, tokenIDsR, tokenPathsR, tokenDecimalsR, BUY_AMOUNT)
            console.log(" ")
            console.log("NEXT PRICE POLL")
            console.log("-------------------")
        }
        catch{
            pollingres = {status: false}
            console.log("")
            console.log("NEXT PRICE POLL - LAST ONE FAILED")
            console.log("-------------------")
        }

        if(pollingres.status===true){
            
            clearInterval(priceMonitor)
            console.log(" ")
            console.log("POLLING STOPPED COMPLETE")
            console.log("-------------------")
            let totalGasCost = swapData.tx1Cost + swapData.tx2Cost + pollingres.tx1Cost + pollingres.tx2Cost
            let profit = pollingres.amount1 - BUY_AMOUNT
            let profitAfterGas = profit - totalGasCost
            console.log(`started: ${BUY_AMOUNT}, 
                            ended: ${pollingres.amount1}, 
                            profit: ${profit }, 
                            total gas cost ${totalGasCost}, 
                            profit after gas ${ profitAfterGas} `)


            console.log(" ")
            console.log("TRADE COMPLETE")
            console.log("-------------------")
            }

    }, 30000)*/

    




    
}








main()





const ethers = require('ethers'); // connect to blockchain 
const { getAbi, getPoolData, getPoolFromTokens, _getAmountsOut, subgraphGetUniPools, subgraphGetVolatileUniPools, matchingSushiPools, handleProxyTokenContract, getTokenData } = require('../uniswapBot/helpers')
const { buyPoolTokens, uniSwapInitTrade, uniSwapOptimumTrade, getCurrentPriceUni } = require('./_tradehelpers')

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
    const INCREASE_VALUE = 2 //tx 0.1% max
    const TRADE_AMOUNT = 0.1
    console.log(" ")
    console.log("TRADING BOT STARTED")
    console.log("-------------------")
    //https://www.geckoterminal.com/polygon_pos/pools/ chart link
    pooladdress = "0xa9077cdb3d13f45b8b9d87c43e11bce0e73d8631" // Aave/Matic
    //pooladdress = "0x98b9162161164de1ed182a0dfa08f5fbf0f733ca" // Link/Matic
    //pooladdress = "0xe6c36eed27c2e8ecb9a233bf12da06c9730b5955" // Naka/Matic 
    //pooladdress = "0xfe530931da161232ec76a7c3bea7d36cf3811a0d" // DAI/Matic 
    //pooladdress = "0x7f9121b4f4e040fd066e9dc5c250cf9b4338d5bc" // UNI/Matic - Errors
    //pooladdress = "0x2a08c38c7e1fa969325e2b64047abb085dec3756" //VOXEL/MATIC
    //pooladdress = "0xbcbd83ee490ba845a7a5bc14cdfeae52606475d6" //MIM / MATIC - low liquidity
    //pooladdress = "0xbd69844b26a78565987335904e234c84971e8034" //CAT
    //pooladdress = "0x09d0a53282c5076b206e2d59b7010d736609f177" //CINE
    //pooladdress = "0x9520dbd4c8803f5c6850742120b471cda0aac954" // PODO
    //pooladdress = "0xa374094527e1673a86de625aa59517c5de346d32" //USDC
    //pooladdress = "0xcb518d14589c27297b476892343950b2af041a4f" //Factr
    //pooladdress = "0xde92e7fbe021344ba02d9225792d219d3a2ddd58" //sand


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
    const BUY_AMOUNT = TRADE_AMOUNT 
    console.log(" ")
    console.log("INITITAL TRADE STARTED")
    console.log("-------------------")
    
    let boughtPrice = await initialTrade(BUY_AMOUNT, pooladdress, tokenIDs, tokenPaths, tokenDecimals)

    console.log(" ")
    console.log("INITAL TRADE COMPLETE")
    console.log("-------------------")
   
        //console.log(`tokens1Bought ${tokens1Bought}`)
    
    //BUY TOKEN 1 with TOKEN 0
    
    let updatedPrice
    
   
    let price_diff_perc_test = 0
    let priceMonitor = setInterval(async () => { 

        console.log(" ")
        console.log("PRICE POLLING RUNNING")
        console.log("-------------------")
        let price_diff_perc 
        
        var currentdate = new Date();
        price_diff_perc_test++
        console.log(price_diff_perc_test)
        //worth using try catch here
        //if an error ouput 0 then set price difference to error and continue
        try{
            updatedPrice = await getCurrentPriceUni(tokenIDs,tokenPaths,tokenDecimals, BUY_AMOUNT) 
            console.log(`boughtPrice: ${boughtPrice}`)
            console.log(`updatedPrice: ${updatedPrice}`)
            console.log(`price difference: ${boughtPrice-updatedPrice}`)
           
        
            console.log(currentdate)
            //price_diff_perc = ((updatedPrice - boughtPrice)/ boughtPrice)*100
            price_diff_perc = ((boughtPrice - updatedPrice)/ updatedPrice)*100
        
        console.log(`price change since purchase in ${pooladdress} ${price_diff_perc}%`)

        }catch{
            
            console.log(`boughtPrice: ${boughtPrice}`)
            console.log(`updatedPrice: ${0}`)
            console.log(`price difference: Not avialable`)
            
            console.log(currentdate)
            //price_diff_perc = ((updatedPrice - boughtPrice)/ boughtPrice)*100  //It needs to be inverted
            price_diff_perc = ((boughtPrice - updatedPrice)/ updatedPrice)*100
            
            console.log(`price% change since purchase in : Not avialable`)

        }
        
       
        
            
            
        
        if (price_diff_perc>=INCREASE_VALUE){
            //if price increases above 2% long term we will use 5% 
            //stop the interval 
            console.log(" ")
            console.log("PRICE STOP CHECK")
            console.log("-------------------")
            
           let potentialOutputPrice = await getCurrentPriceUni(tokenIDs.reverse(),tokenPaths.reverse(),tokenDecimals.reverse(), boughtPrice)
           console.log("potentialOutputPrice")
            console.log(potentialOutputPrice) //this is the check for accidental flips
            console.log(boughtPrice)

            if(potentialOutputPrice>BUY_AMOUNT){
            
                clearInterval(priceMonitor)
                console.log(" ")
                console.log("PRICE POLLING STOPPED")
                console.log("-------------------")

                console.log(" ")
                console.log("REVERT TRADE STARTED")
                console.log("-------------------")
                let swapData = await uniSwapOptimumTrade(boughtPrice, pooladdress, tokenIDs.reverse(), tokenPaths.reverse(), tokenDecimals.reverse())
                
                console.log(swapData)
                console.log(`started: ${BUY_AMOUNT}, ended: ${swapData.amount1},  profit: ${ swapData.amount1 - BUY_AMOUNT}, total gas cost ${swapData.tx1Cost + swapData.tx2Cost}, profit after gas ${ swapData.amount1 - BUY_AMOUNT - (swapData.tx1Cost + swapData.tx2Cost)} `)
                console.log("UPLOAD trade data to csv")
                
                //trade data: input, output, profit, time,
                //eventually will change up to up date trade data
                //if swap data in and out then restart the interval
                }
            /*else if(price_diff_perc_test>4){
                console.log(" ")
                console.log("PRICE POLLING TEST STOPPED")
                console.log("-------------------")
                
                
            }*/

            console.log(" ")
            console.log("PRICE POLLING CONTINUED")
            console.log("-------------------")
            
        }
       

    }, 30000)

    




    
}


const initialTrade = async(BUY_AMOUNT, pooladdress, tokenIDs, tokenPaths, tokenDecimals) => {
   
    let swapData = await uniSwapOptimumTrade(BUY_AMOUNT, pooladdress, tokenIDs, tokenPaths, tokenDecimals)
    console.log(swapData)
    let boughtPrice = swapData.amount1
    console.log(`bought Price: ${boughtPrice}`)
    

    return boughtPrice
}

const getTokenContract = async(address) =>{
    ERC20ABI = await getAbi(address)
    const tokenContract = new ethers.Contract(
        address,
        ERC20ABI,
   
        provider
      )

    if(tokenContract.decimals == undefined){
       tokenContract = await handleProxyTokenContract(address,ERC20ABI)
       return tokenContract
    }
    
    return tokenContract

      //if proxy contract handle as proxy
}




main()



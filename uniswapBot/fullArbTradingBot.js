

const ethers = require('ethers'); // connect to blockchain 
const { getAbi, getPoolData, getTokenData } = require('./helpers')

const { arbPolling, initQuote, makeTrade, revertQuote, revertPollingTrade } = require('./arbhelpers')
const { csvOutPutArb } = require('./csvhelper')

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
 


    //pooladdress ="0x99799d0e96d4e436f4b8d2e125f0b1ce8e1770a7" //USDC/MIM 0.3% - the shift daily rather than hourly
    pooladdress ="0x254aa3a898071d6a2da0db11da73b02b4646078f" //USDT/DAI - daily smaller swings £20 test
  


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

  
    
    
    
    //token details for swapping mim -> usdc
    let mim_usdc ={
        name: "mim_usdc",
        address: [token1,token0] ,
        symbol:[tokenData1.symbol,tokenData0.symbol],
        decimals: [tokenData1.decimals,tokenData0.decimals] 

    }

    //this otherwise it stays reversed 
    let usdc_mim = {
        name: "usdc_mim",
        address:  [token0,token1],
        symbol:[tokenData0.symbol,tokenData1.symbol],
        decimals: [tokenData0.decimals,tokenData1.decimals] 

    }

  
    let spread = 0.03 //TEST
    let slippage = 0.75
    let maticPrice = 0.75
    const BUY_AMOUNT = 20 //!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    console.log(" ")
    console.log("INIT POLLING STARTED")
    console.log("-------------------")

    let test = 0
    let tradeState = {
        status : false,
        process: 0
    }
    let initTradeState 

    let initPolling = setInterval(async () => { 
        
        

        if(tradeState.status===false){
            console.log(" ")
            console.log("INIT POLLING RUNNING")
            console.log("-------------------")

            //Process 1 get qoute and return quote data
            //Update the tradeStatus with relevant result data
            tradeState = await initQuote(BUY_AMOUNT, pooladdress, tokenIDs, tokenPaths, tokenDecimals,usdc_mim, mim_usdc, tradeState)
            
            
           
            console.log("process:", tradeState.process)
            console.log("status:", tradeState.status)
            console.log("pair:", tradeState.pair.name)
            console.log("message:", tradeState.message)
            console.log("amountIn:", tradeState.amount0)
            console.log("amountOut:", tradeState.amount1)

            price_diff = parseFloat(tradeState.amount0)-parseFloat(tradeState.amount1)
            console.log(price_diff)
            

            //Process 2 run price check
          
            if(tradeState.amount1>100000){
                clearInterval(initPolling)
                tradeState.process = 2 //set process step to one after you make a trade
                tradeState.status = false
                tradeState.txStatus = 0
                
                console.log(" ")
                console.log("TO HIGH FOR NORMAL POTENTIAL ERROR - TRY AGAIN LATER ")
                console.log("-------------------")
                
            }else{    


            
                if(price_diff>spread){
                    //
                    //tradeData = initTradeResult
                    tradeState.process = 2 //set process step to one after you make a trade
                    tradeState.status = true
                    console.log(" ")
                    console.log("PRICE DIFFERENCE FOUND - MAKE TRADE usdc_mim ")
                    console.log("-------------------")
                    console.log("price difference",price_diff)

                    
                    
            
            
            
                }else if(price_diff<-spread){
                    //
                    //tradeData = initTradeResult
                    tradeState.process = 2 //set process step to one after you make a trade
                    tradeState.status = true

                
                    console.log(" ")
                    console.log("PRICE DIFFERENCE FOUND - mim_usdc")
                    console.log("-------------------")
                    console.log("price difference",price_diff)
            
                    
            
            
            
                }
                
                else{

                    tradeState.process = 2 //set process step to one after you make a trade
                    tradeState.status = false
                    console.log(" ")
                    console.log("NO PRICE DIFFERENCE")
                    console.log("-------------------")
            
            
                    
            
                }
            }

            
            /*
            test++
            if(test==3){
                tradeState.status=true
                tradeState.process=3

            }*/

        }


        //TEST
        if(tradeState.status===true){
            
            clearInterval(initPolling)
            console.log(" ")
            console.log("INIT PRICE COMPLETE")
            console.log("-------------------")
            console.log("process:", tradeState.process)
            console.log("status:", tradeState.status)
            console.log("pair:", tradeState.pair.name)
            console.log("message:", tradeState.message)
            console.log("amountIn:", tradeState.amount0)
            console.log("amountOut:", tradeState.amount1)
            console.log("TxCost:", tradeState.txCost)


            tradeState =  await makeTrade(tradeState.pair, tradeState.route, tradeState.amount0, tradeState.amount1)


            if(tradeState.txStatus === 0){
                tradeState.process = 2 //set process step to one after you make a trade
                tradeState.status = false
                clearInterval(revertPolling)
                console.log(" ")
                console.log("INIT TRADE FAILED")
                console.log("-------------------")



            }

            tradeState.status = false
            tradeState.process = 3
            initTradeState = tradeState

            console.log(" ")
            console.log("TRADE COMPLETE")
            console.log("-------------------")
            console.log("process:", tradeState.process)
            console.log("status:", tradeState.status)
            console.log("pair:", tradeState.pair.name)
            console.log("message:", tradeState.message)
            console.log("amountIn:", tradeState.amount0)
            console.log("amountOut:", tradeState.amount1)
            console.log("TxCost:", tradeState.txCost)

            tradeState.status = false
            tradeState.process = 3
            initTradeState = tradeState

            //Process 3 make trade



           
            




            /*
            *Set Status and process here
            *
            */
            
        }

    }, 30000)
console.log(tradeState.process)


let revertPolling = setInterval(async () => { 
    console.log("attempt revert")
    if(tradeState.process==2 && tradeState.txStatus == 0){
        //stop polling if the tx has failed
        clearInterval(revertPolling)
        console.log(" ")
        console.log("INIT TRANSACTION FAILED - GOODBYE ")
        console.log("-------------------")

    }


    if( tradeState.process>2 && tradeState.status===false){

        
            console.log(" ")
            console.log("REVERT POLLING RUNNING")
            console.log("-------------------")



            //Process 1 get qoute and return quote data
            //Update the tradeStatus with relevant result data
            
            tradeState = await revertQuote(initTradeState.amount1,pooladdress, tokenIDs, tokenPaths, tokenDecimals,usdc_mim, mim_usdc, initTradeState)
            
            
           
            console.log("process:", tradeState.process)
            console.log("status:", tradeState.status)
            console.log("pair:", tradeState.pair.name)
            console.log("message:", tradeState.message)
            console.log("amountIn:", tradeState.amount0)
            console.log("amountOut:", tradeState.amount1)



            price_diff = (tradeState.amount1 /initTradeState.amount1 ) - 1 //value ratio if input was 1
            console.log("amount out if input1", tradeState.amount1 / initTradeState.amount1 )
            console.log(price_diff)
            console.log("price_diff_unshifted", tradeState.amount1- tradeState.amount0)
            /*
            if(tradeState.amount1>10000){ //TBH Just risk it lol
                //keep interval polling running here
                tradeState.process = 2 //set process step to one after you make a trade
                tradeState.status = false
                
                console.log(" ")
                console.log("TO HIGH FOR NORMAL POTENTIAL ERROR - TRY AGAIN LATER ")
                console.log("-------------------")
                
            }else{ */
            if(price_diff>spread){
                tradeState.process = 4 //set process step to one after you make a trade
                tradeState.status = true
                console.log(" ")
                console.log("PRICE DIFFERENCE ENOUGH TO REVERT")
                console.log("-------------------")
        

            }else if(tradeState.amount0>10000){
                tradeState.process = 4 //set process step to one after you make a trade
                tradeState.status = false
                console.log(" ")
                console.log("TO HIGH FOR NORMAL POTENTIAL ERROR")
                console.log("-------------------")


            }
            
            else{

                tradeState.process = 4 
                tradeState.status = false
                console.log(" ")
                console.log("NO PRICE DIFFERENCE")
                console.log("-------------------")
        
        
                
        
            }

            /*
            //wheels off
            test++
            if(test==3){
                tradeState.status=true

            }*/
            }



            /*
            price_diff = parseFloat(tradeState.amount0)-parseFloat(tradeState.amount1)
            console.log(price_diff)*/
            //console.log(initTradeState)


            //swaps back the full amount returned from the first trade 
            //only pole for inverse of first trade.

            






            
        
    

        
        //TEST
        if(tradeState.process===4 &&tradeState.status===true){
            
            clearInterval(revertPolling)
            console.log(" ")
            console.log("REVERT PRICE COMPLETE")
            console.log("-------------------")

            tradeState =  await makeTrade(tradeState.pair, tradeState.route, tradeState.amount0, tradeState.amount1)

            tradeState.status = false
            tradeState.process = 5
            initTradeState = tradeState
            

            console.log(" ")
            console.log("TRADE COMPLETE")
            console.log("-------------------")
            console.log("process:", tradeState.process)
            console.log("status:", tradeState.status)
            console.log("pair:", tradeState.pair.name)
            console.log("message:", tradeState.message)
            console.log("amountIn:", tradeState.amount0)
            console.log("amountOut:", tradeState.amount1)
            console.log("TxCost:", tradeState.txCost)

            profit = tradeState.amount1 - BUY_AMOUNT 
            totalGasCost = initTradeState.txCost + tradeState.txCost
            profitAfterGas = profit - totalGasCost


            console.log(" ")
            console.log("CLOSING OUT")
            console.log("-------------------")

            console.log(`started: ${BUY_AMOUNT}, 
            ended: ${tradeState.amount1}, 
            profit: ${profit }, 
            total gas cost ${totalGasCost}, 
            profit after gas ${ profitAfterGas} `)
            
        }

    }, 30000)
}

//if revertPolling fails try again use a while true loop

    


    







main()





const ethers = require('ethers'); // connect to blockchain 
const { getAbi, getPoolData, getTokenData } = require('../uniswapBot/helpers')

const { initialTrade, pollingTrade, checkQuote, makeTrade } = require('../uniswapBot/tradehelpers')
const { csvOutPut, csvOutPutClosed, csvOutPutOpen } = require('../uniswapBot/csvhelper');



const INFURA_URL = process.env.INFURA_URL
const provider = new ethers.providers.JsonRpcProvider(INFURA_URL); //init provider



//https://www.geckoterminal.com/polygon_pos/pools/0xa33f2ec45035658c26a47c356706e9e506f867d0
//use this to find pools


    //CHAINING TRANSACTION AFTER APPROVAL REPONSE with .then STOPS STF ERROR FROM HAPPENING put trade transaction in it's own external function 
    //then you can put it into the try catch
    //also handle error output

const main = async() =>{
    //get and print data about the trading pool
    const INCREASE_VALUE = 0.5 //tx 0.1% max
    //const TRADE_AMOUNT = 2
    console.log(" ")
    console.log("TRADING BOT STARTED")
    console.log("-------------------")
    //https://www.geckoterminal.com/polygon_pos/pools/ chart link
    //pooladdress = "0xa9077cdb3d13f45b8b9d87c43e11bce0e73d8631" // Aave/Matic - make sure you find lowest point in day
    pooladdress = "0x98b9162161164de1ed182a0dfa08f5fbf0f733ca" // Link/Matic
    //pooladdress = "0xfe530931da161232ec76a7c3bea7d36cf3811a0d" // DAI/Matic 
    //pooladdress = "0x7f9121b4f4e040fd066e9dc5c250cf9b4338d5bc" // UNI/Matic - make sure to find lowest point in day
    //pooladdress = "0x2a08c38c7e1fa969325e2b64047abb085dec3756" //VOXEL/MATIC - get a daily average
    //pooladdress = "0xbcbd83ee490ba845a7a5bc14cdfeae52606475d6" //MIM / MATIC - hella volatile but low liquidity
    //pooladdress = "0xbd69844b26a78565987335904e234c84971e8034" //CAT * lo
    //pooladdress = "0x09d0a53282c5076b206e2d59b7010d736609f177" //CINE
    //pooladdress = "0x9520dbd4c8803f5c6850742120b471cda0aac954" // PODO *
    //pooladdress = "0xa374094527e1673a86de625aa59517c5de346d32" //USDC
    //pooladdress = "0xcb518d14589c27297b476892343950b2af041a4f" //Factr
    //pooladdress = "0xde92e7fbe021344ba02d9225792d219d3a2ddd58" //sand *
    //pooladdress = "0xd90d522211f7a887fd833ececed83a3019e0fc6c" //BOB
    //pooladdress = "0x167384319b41f7094e62f7506409eb38079abff8" //WETH
    //pooladdress ="0x495b3576e2f67fa870e14d0996433fbdb4015794" //COMP
    
    //pooladdress ="0x31c832486573e25fe3c4f03d9c2c28c4a48e9d6f" //GRT



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
    let t1_t0 ={
        name: "t1_t0",
        address: [token1,token0],
        symbol:[tokenData1.symbol,tokenData0.symbol],
        decimals: [tokenData1.decimals,tokenData0.decimals] 

    }

    //this otherwise it stays reversed 
    let t0_t1 = {
        name: "t0_t1",
        address:  [token0,token1],
        symbol:[tokenData0.symbol,tokenData1.symbol],
        decimals: [tokenData0.decimals,tokenData1.decimals] 

    }

    const BUY_AMOUNT = 1
    let increaseAmount = BUY_AMOUNT + (BUY_AMOUNT* INCREASE_VALUE/100)
    console.log(" ")
    console.log("INITITAL TRADE STARTED")
    console.log("-------------------")


    let initQuoteData = await checkQuote(BUY_AMOUNT, t0_t1)
    initQuoteData.process = 1
    console.log(initQuoteData.message)
        let initTradeState = await makeTrade(initQuoteData.pair, initQuoteData.route, initQuoteData.amount0, initQuoteData.amount1).then( async initTradeState =>{
            if(initTradeState.txStatus==0){
                

                console.log("TX failed")
                onsole.log(initTradeState.message) //worth console.logging the reason
                console.log("Gas Cost",initTradeState.txCost)
                console.log("INITAL TRADE FAILED")
                console.log("-------------------")
            }else{
                console.log(initTradeState.message)
                initTradeState.process = 2
                console.log("Gas Cost",initTradeState.txCost)
                console.log(" ")
                console.log("INITAL TRADE COMPLETE")
                console.log("-------------------")

                

                console.log(" ")
                console.log("STARTING PRICE POLL")
                console.log("-------------------")
                let priceMonitor = setInterval(async () => { 
                    console.log(" ")
                    console.log("PRICE POLLING RUNNING")
                    console.log("-------------------")
                    initTradeState.process = 3
                    let pollingQuoteData
                    try {
                        pollingQuoteData = await checkQuote(initTradeState.amount1, t1_t0)
                        console.log(pollingQuoteData.message)
                        console.log(pollingQuoteData.amount0)
                        console.log(pollingQuoteData.amount1)
                        console.log(increaseAmount)
                        price_diff_perc = ((pollingQuoteData.amount1 - BUY_AMOUNT)/ BUY_AMOUNT)*100
                        console.log(`${price_diff_perc}%`)


                        if(increaseAmount<pollingQuoteData.amount1){
                            //make revert trade 
                            //set status to true and stop polling 
                            pollingQuoteData.status = true 
                            if(pollingQuoteData.status===true){
            
                                clearInterval(priceMonitor)
                                console.log(" ")
                                console.log("POLLING STOPPED ")
                                console.log("-------------------")
                                //CHAINING TRANSACTION AFTER APPROVAL REPONSE with .then STOPS STF ERROR FROM HAPPENING put trade transaction in it's own external function 
                                

                                let finalTradeState = await makeTrade(pollingQuoteData.pair, pollingQuoteData.route, pollingQuoteData.amount0, pollingQuoteData.amount1).then( async finalTradeState =>{ 
                                    if(finalTradeState.txStatus==0){
                

                                        console.log("TX failed")
                                        console.log(finalTradeState.message) //worth console.logging the reason
                                        console.log("Gas Cost",finalTradeState.txCost)
                                        console.log("INITAL TRADE FAILED")
                                        console.log("-------------------")

                                        //Try again ??
                                    }else{
                                        console.log(finalTradeState.message)
                                        finalTradeState.process = 4
                                        console.log("Gas Cost",initTradeState.txCost)
                                        console.log(" ")
                                        console.log("INITAL TRADE COMPLETE")
                                        console.log("-------------------")


                                        let totalGasCost = initTradeState.txCost + finalTradeState.txCost
                                        let profit = finalTradeState.amount1 - BUY_AMOUNT
                                        let profitAfterGas = profit - totalGasCost
                                        let endTime = new Date();
                                        console.log(`started: ${BUY_AMOUNT}, 
                                                        ended: ${finalTradeState.amount1}, 
                                                        profit: ${profit }, 
                                                        total gas cost ${totalGasCost}, 
                                                        profit after gas ${ profitAfterGas} `)
                                    }

                                })

                            }





                        }

                        //do the check here 
                        //reverse the trade too
                    }catch{
                        pollingQuoteData = {
                            message:"quote not available",
                            status:false,
                        }
                        console.log(pollingQuoteData.message)

                    }
                    pollingQuoteData.process = 3
                    
                    



                }, 30000)
                
            }

        }

    )
   
   
    
    /*
    if(initTradeState.txStatus==1){
        console.log(initTradeState.message)
        console.log("Gas Cost",initTradeState.txCost)
        console.log(" ")
        console.log("INITAL TRADE COMPLETE")
        console.log("-------------------")

        
        console.log(" ")
        console.log("STARTING PRICE POLL")
        console.log("-------------------")
        let priceMonitor = setInterval(async () => { 
            console.log(" ")
            console.log("PRICE POLLING RUNNING")
            console.log("-------------------")
            let pollingQuoteData = await checkQuote(BUY_AMOUNT, t0_t1)
            pollingQuoteData.process = 3
            console.log(pollingQuoteData.message)

        }, 30000)


    }*/
    
    /*let initTradeData = 

            {
                pair : tokenPaths.toString(),
                start: startTime,
                in: BUY_AMOUNT,
                gasCost:swapData.tx1Cost + swapData.tx2Cost,
                
             
            }*/
/*
    csvOutPutOpen(initTradeData)

    //reverse paths for inverse trade

    let tokenIDsR= tokenIDs.reverse()
    let tokenPathsR= tokenPaths.reverse()
    let tokenDecimalsR = tokenDecimals.reverse()
    

    let priceMonitor = setInterval(async () => { 
        console.log(" ")
        console.log("PRICE POLLING RUNNING")
        console.log("-------------------")
        let pollingres
        try{
            //get quote here and pass out the result but don't make the trade
            //if polling result is about then set status to true to make the trade
            pollingres = await pollingTrade(swapData.amount1, pooladdress, tokenIDsR, tokenPathsR, tokenDecimalsR, BUY_AMOUNT,INCREASE_VALUE)
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
            //make trade here but pass out the route. - plus with the route no node for extra values 
            console.log(" ")
            console.log("POLLING STOPPED COMPLETE")
            console.log("-------------------")
            let totalGasCost = swapData.tx1Cost + swapData.tx2Cost + pollingres.tx1Cost + pollingres.tx2Cost
            let profit = pollingres.amount1 - BUY_AMOUNT
            let profitAfterGas = profit - totalGasCost
            let endTime = new Date();
            let finalTradeData = 

            {
                pair : tokenPaths.toString(),
                start: startTime,
                end: endTime,
                in: BUY_AMOUNT,
                out:pollingres.amount1,
                profit:profit,
                gasCost:totalGasCost,
                profitAfterGas: profitAfterGas,
                type:"simple"
            }
            console.log(`started: ${BUY_AMOUNT}, 
                            ended: ${pollingres.amount1}, 
                            profit: ${profit }, 
                            total gas cost ${totalGasCost}, 
                            profit after gas ${ profitAfterGas} `)

            csvOutPutClosed(finalTradeData)
            console.log(" ")
            console.log("TRADE COMPLETE")
            console.log("-------------------")
            }

    }, 30000)

    


*/

    
}








main()



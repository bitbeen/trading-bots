
const ethers = require('ethers'); // connect to blockchain 
const { getAbi, getPoolData, getTokenData } = require('./helpers')

const { checkQuote, makeTrade } = require('./tradehelpers')
const { csvWriteFullTrade, jsonWriteInitTrade, jsonReadInitTrade, jsonExists } = require('./csvhelper')

const INFURA_URL = process.env.INFURA_URL
const provider = new ethers.providers.JsonRpcProvider(INFURA_URL); //init provider


const main = async() =>{

    
    console.log(" \nTRADING BOT STARTED\n-------------------")
    
    
    //pooladdress ="0x254aa3a898071d6a2da0db11da73b02b4646078f" //USDT/DAI
   //pooladdress = "0xab4b63bd6c214ce8409fa1b31afa50d4e17597f9" //USDT BOB
   //pooladdress = "0xeb1c641d49da59b9a5c7c30c373b31fe6b0ed3a7" //USDT FRAX
   //pooladdress= "0x99799d0e96d4e436f4b8d2e125f0b1ce8e1770a7" //USDC MIM
   //pooladdress="0x2c9706d421ddd566fd487628592b2451898eb77f" //BUSD USDC
   pooladdress = "0xddd919428330369186d27df0848b23908f1f4c24" //USDC FRAX
   //pooladdress="0xd2d71d27923f07eab4dad6d1d21e3fcffa997562" //USDT USDT Wormhole
   //pooladdress="0xbfac5c438c9938ae3260c023bcc859aa4315f671"  //USDT USDT Outbridge
   //pooladdress="0x59ea21a628311dada9de0e20230602ab2567ee58" //BUSD USDC0.05%
   //pooladdress="0x59ea21a628311dada9de0e20230602ab2567ee58" //BUSD USDC1%
   //pooladdress="0x3c5bb2a0041b8db9511f28152e30ab142b784e50" //BUSD DAI 
   //pooladdress="0xa3aa659394974533f050910f2a27d6d685ca2a8c" //BitKong Dollar
   



    
    let poolABI = await getAbi(pooladdress)
    let poolData = await getPoolData(pooladdress,poolABI)
    
    let token0 = poolData.token0
    let token1 = poolData.token1
    let tokenData0 = await getTokenData(token0)
    let tokenData1 = await getTokenData(token1)
    let tokenIDs = [token0,token1]
    
    let tokenPaths = [tokenData0.symbol,tokenData1.symbol]
    let tokenDecimals = [tokenData0.decimals,tokenData1.decimals] 
    let existing_trade_file = `trade_running_${tokenPaths[0]}_${tokenPaths[1]}.json`
    let completed_trade_file = `trade_${tokenPaths[0]}_${tokenPaths[1]}.csv`

    jsonExists(existing_trade_file)


    
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

    const BUY_AMOUNT = 200
    let spread = 0.03 //TEST
    
    
    console.log(" \nTRADING BOT RUNNING\n-------------------")
    
    let tradeState = {
        amount0:0,
        amount1:0,
        tx1Cost:0,
        tx2Cost:0,
        txCost:0,
        pollStatus:false, //pollingStat
        message:"not started",
        pair:{},
        process:0,
        txStatus:false, //tx Status
        finalStatus:false //fultrade status
    
      }
    let initTradeState 
    let finalTradeState
    
    let existingTrade =  await jsonReadInitTrade(existing_trade_file)
        try{
            if(existingTrade.finalStatus===false){
                console.log(" \nEXISTING TRADE INITIALISED\n-------------------")
                initTradeState = existingTrade
                tradeState = initTradeState
                tradeState.process = 3
                tradeState.pollStatus = false
                tradeState.message="starting revert polling"
                console.log(tradeState.message)
                console.log(tradeState.amount1)
        
            }
            else{
                console.log(" \nNEW TRADE STARTED\n-------------------")
                tradeState.process=1
                tradeState.message="init polling running"
                console.log(tradeState.message)

            }}
            catch{
                console.log("error ")
            }


   
    
    

    let initPolling = setInterval(async () => { 
        if(tradeState.pollStatus==false && tradeState.process==1){
           
            console.log(" \nINIT POLL RUNNING\n-------------------")
            console.log(`-- POOL: ${t0_t1.symbol[0]}-${t0_t1.symbol[1]} `)
           
            let tradeStateCore = await checkQuote(BUY_AMOUNT, t0_t1)
            let tradeStateInv = await checkQuote(BUY_AMOUNT, t1_t0)
            let price_diffCore = parseFloat(tradeStateCore.amount1) - parseFloat(tradeStateCore.amount0)
            let price_diffInv = parseFloat(tradeStateInv.amount1)-parseFloat(tradeStateInv.amount0)

            if(price_diffCore>spread){
                tradeStateCore.message="opportunity found make init trade"
                console.log("pair:", tradeStateCore.pair.name)
                console.log("message:", tradeStateCore.message)
                console.log("amountIn:", tradeStateCore.amount0)
                console.log("amountOut:", tradeStateCore.amount1)
                console.log("price diff:", price_diffCore)
                tradeStateCore.pollStatus = true
                tradeState = tradeStateCore

            }else if(price_diffInv>spread){
                tradeState.message="opportunity found make init trade - inverse"
                console.log("pair:", tradeStateInv.pair.name)
                console.log("message:", tradeStateInv.message)
                console.log("amountIn:", tradeStateInv.amount0)
                console.log("amountOut:", tradeStateInv.amount1)
                console.log("price diff:", price_diffInv)
                tradeStateInv.pollStatus = true
                tradeState = tradeStateInv

            }else{
                tradeState.message="no opportunity found"
                
                console.log("message:", tradeState.message)
                console.log("pair:", tradeStateCore.pair.name)
                console.log("amountIn:", tradeStateCore.amount0)
                console.log("amountOut:", tradeStateCore.amount1)
                console.log("pair:", tradeStateInv.pair.name)
                console.log("amountInInv:", tradeStateInv.amount0)
                console.log("amountOutInv:", tradeStateInv.amount1)
                console.log("price diff:", price_diffCore)
                console.log("price diff Inv:", price_diffInv)
                tradeState.pollStatus = false

            }
            if(tradeState.pollStatus==true){
                clearInterval(initPolling)
                console.log(" \nINIT POLLING STOPPED\n-------------------")
                tradeState.process=2
                
                //tradeState.message="opportunity found make init trade"
                
                console.log(tradeState.pair.name)
                tradeState.message="make trade"
                initTradeState = tradeState //TEST!!!!!!!!!!!
                console.log(" \nINITAL TRADE COMPLETE\n-------------------")
      
                jsonWriteInitTrade(existing_trade_file,initTradeState)
                //CSV Output init trade result
                //------------------------------------------------
                
                
                tradeState.process = 3
                tradeState.pollStatus = false
                //write csv here = as open
                tradeState.message="starting revert polling"
                console.log(tradeState.message)
                console.log(tradeState.amount1)
    
            }



        }
        

    }, 30000)

    let revertPolling = setInterval(async () => { 
        if(tradeState.pollStatus==false && tradeState.process==3){
            console.log(" \nREVERT POLL RUNNING\n-------------------")
            if(initTradeState.pair.name=="t0_t1"){
                
                console.log("regular revert")
                console.log(`-- POOL: ${t0_t1.symbol[1]}-${t0_t1.symbol[0]} `)
                tradeState = await checkQuote(initTradeState.amount1, t1_t0)
                let price_diff = parseFloat(tradeState.amount1) - parseFloat(tradeState.amount0)
                console.log("pair:", tradeState.pair.name)
                console.log("message:", tradeState.message)
                console.log("amountIn:", tradeState.amount0)
                console.log("amountOut:", tradeState.amount1)
                console.log("price diff:", price_diff)

                if(price_diff>spread){
                    tradeState.message="opportunity found make revert"
                    
                    tradeState.pollStatus = true
                    
    
                }else{
                    tradeState.process=3
                    tradeState.pollStatus=false
                }

            }else{
                //let tradeState = await checkQuote(BUY_AMOUNT, t0_t1)
                //invert revert
                console.log("inverted revert")
                console.log(`-- POOL: ${t0_t1.symbol[0]}-${t0_t1.symbol[1]} `)
                tradeState = await checkQuote(initTradeState.amount1, t0_t1)
                let price_diff = parseFloat(tradeState.amount1) - parseFloat(tradeState.amount0)
                console.log("pair:", tradeState.pair.name)
                console.log("message:", tradeState.message)
                console.log("amountIn:", tradeState.amount0)
                console.log("amountOut:", tradeState.amount1)
                console.log("price diff:", price_diff)
                if(price_diff>spread){
                    tradeState.message="opportunity found make revert"
                    tradeState.pollStatus = true
                    
    
                }else{
                    tradeState.process=3
                    tradeState.pollStatus=false
                }
                //else trade status doesnt change and the process continues

            }

            if(tradeState.pollStatus==true){
                clearInterval(revertPolling)
                console.log(" \nREVERT POLLING STOPPED\n-------------------")
                tradeState.process=4
                
                //tradeState.message="opportunity found make init trade"
                
                console.log(tradeState.pair.name)
                tradeState.message="make trade"
                finalTradeState = tradeState
                console.log(tradeState.message)
                console.log(finalTradeState)
                console.log(" \nFINAL TRADE COMPLETE\n-------------------")
                //------------------------------------------------
                //CSV Output init trade result
                //Reset find the given ID then reset 
                
                tradeState.process = 5
                tradeState.pollStatus = false
                
                

                console.log(" \nWRITING RESULTS TO TRADE CSV\n-------------------")
                
                handleFinalTradeResults(initTradeState,finalTradeState)
                tradeState.message="finished process"
                console.log(tradeState.message)
               

                console.log(" \nBOT CLOSING DOWN\n-------------------")




                
    
            }


        }
       
    

    }, 30000)

    //arbitrage found make trade
    //revert polling
    //arbitrage found revert trade (dont actually make the trades today)
    //trades tomorrow

    //bot on Flash swap tuesday
}

const handleFinalTradeResults = (initTradeState,finalTradeState, completed_trade_file) =>{
    let totalGasCost = initTradeState.txCost + finalTradeState.txCost
    let profit = finalTradeState.amount1 - initTradeState.amount0
    let profitAfterGas = profit - totalGasCost

    let tradeResult = {
        input: initTradeState.amount0,
        output: finalTradeState.amount1,
        profit: profit,
        totalGasCost: totalGasCost,
        profitAfterGas: profitAfterGas

    }
    
    console.log(tradeResult)
    
    csvWriteFullTrade(completed_trade_file,tradeResult)

    

}

main()



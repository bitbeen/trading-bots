
const ethers = require('ethers'); // connect to blockchain 
const { getAbi, getPoolData, getTokenData } = require('../uniswapBot/helpers')

const { initialTrade, pollingTrade, checkQuote, makeTrade } = require('../uniswapBot/tradehelpers')
const { csvOutPutArb } = require('../uniswapBot/csvhelper')

const INFURA_URL = process.env.INFURA_URL
const provider = new ethers.providers.JsonRpcProvider(INFURA_URL); //init provider


const main = async() =>{
    //get and print data about the trading pool
    //const INCREASE_VALUE = 0.5 //tx 0.1% max
    //const TRADE_AMOUNT = 2
    console.log(" ")
    console.log("TRADING BOT STARTED")
    console.log("-------------------")
    
    //pooladdress ="0x254aa3a898071d6a2da0db11da73b02b4646078f" //USDT/DAI
   //pooladdress = "0xab4b63bd6c214ce8409fa1b31afa50d4e17597f9" //USDT BOB
   pooladdress = "0xeb1c641d49da59b9a5c7c30c373b31fe6b0ed3a7" //USDT FRAX

    



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

    const BUY_AMOUNT = 200
    let spread = 0.03 //TEST
    
    console.log(" ")
    console.log("RUNNING")
    console.log("-------------------")
    
    let tradeState = {
        amount0:0,
        amount1:0,
        tx1Cost:0,
        tx2Cost:0,
        txCost:0,
        status:false,
        message:"not started",
        pair:{},
        process:0,
        txStatus:false,
    
      }
    
    //initial polling process 1
    //before setting up the tradestate the initial poll will tell you which direction to trade in 

    //1 SET TRADE STATE PROCESS TO ONE TO CONFIRM THE STAR and THE MESSAGE.
    tradeState.process=1
    tradeState.message="init polling running"

    let initPolling = setInterval(async () => { 
        if(tradeState.status==false && tradeState.process==1){
            console.log(" ")
            console.log("INIT POLL RUNNING")
            console.log("-------------------")
           
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
                tradeStateCore.status = true
                tradeState = tradeStateCore

            }else if(price_diffInv>spread){
                tradeState.message="opportunity found make init trade - inverse"
                console.log("pair:", tradeStateInv.pair.name)
                console.log("message:", tradeStateInv.message)
                console.log("amountIn:", tradeStateInv.amount0)
                console.log("amountOut:", tradeStateInv.amount1)
                console.log("price diff:", price_diffInv)
                tradeStateInv.status = true
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
                tradeState.status = false

            }
            if(tradeState.status==true){
                clearInterval(initPolling)
                tradeState.process=2
                
                //tradeState.message="opportunity found make init trade"
                
                console.log(tradeState.pair.name)
                tradeState.message="make trade"
                //initTradeResult = 
                console.log(tradeState.message)
                //------------------------------------------------
                
                
                tradeState.process = 3
                tradeState.status = false
                tradeState.message="starting revert polling"
                console.log(tradeState.message)
                console.log(tradeState.amount1)
    
            }



        }
        

    }, 30000)

    let revertPolling = setInterval(async () => { 
        if(tradeState.status==false && tradeState.process==3){
            if(tradeState.pair.name=="t0_t1"){
                //let tradeState = await checkQuote(BUY_AMOUNT, t1_t0)
                //regular revert
                console.log("regular revert")
                tradeState = await checkQuote(tradeState.amount1, t1_t0)
                let price_diff = parseFloat(tradeState.amount1) - parseFloat(tradeState.amount0)
                console.log("pair:", tradeState.pair.name)
                console.log("message:", tradeState.message)
                console.log("amountIn:", tradeState.amount0)
                console.log("amountOut:", tradeState.amount1)
                console.log("price diff:", price_diff)

                if(price_diff>spread){
                    tradeState.message="opportunity found make revert"
                    
                    tradeState.status = true
                    
    
                }//else trade status doesnt change and the process continues

            }else{
                //let tradeState = await checkQuote(BUY_AMOUNT, t0_t1)
                //invert revert
                console.log("invert revert")
                tradeState = await checkQuote(tradeState.amount1, t1_t0)
                let price_diff = parseFloat(tradeState.amount1) - parseFloat(tradeState.amount0)
                console.log("pair:", tradeState.pair.name)
                console.log("message:", tradeState.message)
                console.log("amountIn:", tradeState.amount0)
                console.log("amountOut:", tradeState.amount1)
                console.log("price diff:", price_diff)
                if(price_diff>spread){
                    tradeState.message="opportunity found make revert"
                    tradeState.status = true
                    
    
                }//else trade status doesnt change and the process continues

            }

            if(tradeState.status==true){
                clearInterval(revertPolling)
                tradeState.process=4
                
                //tradeState.message="opportunity found make init trade"
                
                console.log(tradeState.pair.name)
                tradeState.message="make trade"
                console.log(tradeState.message)
                //------------------------------------------------
                
                
                tradeState.process = 5
                tradeState.status = false
                tradeState.message="finished process"
                console.log(tradeState.message)
                console.log(tradeState.amount1)
                //finalTradeResult =

                /*console.log()
                * inital Trade Result - profit 
                  inital Trade Result - gas
                  final Trade result - profit
                  final Trade Result - profit
                  Total profit after gas.
                */
    
            }


        }
       
    

    }, 30000)

    //arbitrage found make trade
    //revert polling
    //arbitrage found revert trade (dont actually make the trades today)
    //trades tomorrow

    //bot on Flash swap tuesday
}

main()
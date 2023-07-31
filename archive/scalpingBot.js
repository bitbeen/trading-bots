const ethers = require('ethers'); // connect to blockchain 
const { getAbi, getPoolData, getTokenData} = require('./helpers')

const { initialTrade, pollingTrade, checkQuote, makeTrade } = require('./tradehelpers')
const { csvOutPut, csvOutPutClosed, csvOutPutOpen } = require('./csvhelper');
const { geckoPredict } = require('./geckohelper');




const INFURA_URL = process.env.INFURA_URL
const provider = new ethers.providers.JsonRpcProvider(INFURA_URL); //init provider
const pooladdress ="0xa9077cdb3d13f45b8b9d87c43e11bce0e73d8631" 
var tradeStatus = {
   
    amount0:0,
    amount1:0,
    tx1Cost:0,
    tx2Cost:0,
    txCost:0,
    message:"not started",
    pair:[], //trading in the regular direction
    process:0,
    geckoStatus:false,
    tradeReadyStatus:false,
    txCompleteStatus:false
    


  }

const main = async() =>{
    const INCREASE_VALUE = 0.5
    const BUY_AMOUNT = 1

    let pairs = await poolToPair(pooladdress)
    tradeStatus.pair = pairs[0]
    tradeStatus.amount0 =BUY_AMOUNT
    console.log(tradeStatus.pair.symbol[1])
    let changeData30 = await geckoPredict(pooladdress,30,tradeStatus.pair.symbol[1])
    let changeData60 = await geckoPredict(pooladdress,60,tradeStatus.pair.symbol[1])
    
    
    
     
        //tradeStatus.process==0 && geckoStatus==false
        let runEveryXminutes = setInterval(async () => { 
            if(tradeStatus.process==0 && tradeStatus.geckoStatus==false){
                console.log("\nGECKO PREDICT STARTED\n-------------------")
                
                let changeData30 = await geckoPredict(pooladdress,30,tradeStatus.pair.symbol[1])
                let changeData60 = await geckoPredict(pooladdress,60,tradeStatus.pair.symbol[1]).then(async changeData60 =>  {
                    if(changeData30.makeTrade==true && changeData60.makeTrade==true ){
                        clearInterval(runEveryXminutes)
                        console.log("\nGECKO PREDICT STOPPED\n-------------------")
                        tradeStatus.message="oppurtunity found"
                        tradeStatus.process=1
                        tradeStatus.geckoStatus=true
                    
                    }
        
                })
                
                //if both are true then make the trade
        
                
                
            }
        
            
        }, (7200000))

    
        //tradeStatus.process==1 && geckoStatus==true
        let testVal = 0

        let makeTradeTest= setInterval(async () => { 
            if(tradeStatus.process==1 && tradeStatus.geckoStatus==true){
            
                console.log("makeTrade")
                testVal++
                if(testVal>2 ){
                    clearInterval(makeTradeTest)
                }
            }

        

    
}, 5000)
    
        

    
    
    
    

    


}

const poolToPair = async(pooladdress) =>{
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

    let pairs = [t0_t1,t1_t0]

    return pairs
}





main()

//Set pool 

//Import refactor and export polling gecko helper
//Run Trade if it works otherwise continue
//Output each tradeStatus to as an appeneded row to a csv then the final with Profit or Loss
//figure out clean reverse


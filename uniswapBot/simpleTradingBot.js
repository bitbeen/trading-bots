

const ethers = require('ethers'); // connect to blockchain 
const { getAbi, getPoolData, getTokenData } = require('./helpers')

const { initialTrade, pollingTrade } = require('./tradehelpers')
const { csvOutPut, csvOutPutClosed, csvOutPutOpen } = require('./csvhelper')


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
    const INCREASE_VALUE = 5 //tx 0.1% max
    //const TRADE_AMOUNT = 2
    console.log(" ")
    console.log("TRADING BOT STARTED")
    console.log("-------------------")
    //https://www.geckoterminal.com/polygon_pos/pools/ chart link
    pooladdress = "0xa9077cdb3d13f45b8b9d87c43e11bce0e73d8631" // Aave/Matic - make sure you find lowest point in day
    //pooladdress = "0x98b9162161164de1ed182a0dfa08f5fbf0f733ca" // Link/Matic
    //pooladdress = "0xe6c36eed27c2e8ecb9a233bf12da06c9730b5955" // Naka/Matic - almost always down (lowest point of week with upturn?)
    //pooladdress = "0xfe530931da161232ec76a7c3bea7d36cf3811a0d" // DAI/Matic 
    //pooladdress = "0x7f9121b4f4e040fd066e9dc5c250cf9b4338d5bc" // UNI/Matic - make sure to find lowest point in day
    //pooladdress = "0x2a08c38c7e1fa969325e2b64047abb085dec3756" //VOXEL/MATIC - get a daily average
    //pooladdress = "0xbcbd83ee490ba845a7a5bc14cdfeae52606475d6" //MIM / MATIC - hella volatile but low liquidity
    //pooladdress = "0xbd69844b26a78565987335904e234c84971e8034" //CAT
    //pooladdress = "0x09d0a53282c5076b206e2d59b7010d736609f177" //CINE
    //pooladdress = "0x9520dbd4c8803f5c6850742120b471cda0aac954" // PODO
    //pooladdress = "0xa374094527e1673a86de625aa59517c5de346d32" //USDC
    //pooladdress = "0xcb518d14589c27297b476892343950b2af041a4f" //Factr
    //pooladdress = "0xde92e7fbe021344ba02d9225792d219d3a2ddd58" //sand
    //pooladdress = "0xd90d522211f7a887fd833ececed83a3019e0fc6c" //BOB
    //pooladdress = "0x86f1d8390222a3691c28938ec7404a1661e618e0" //WETH
    //pooladdress ="0x495b3576e2f67fa870e14d0996433fbdb4015794" //COMP
    
    



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
    const BUY_AMOUNT = 4
    console.log(" ")
    console.log("INITITAL TRADE STARTED")
    console.log("-------------------")

    let swapData = await initialTrade(BUY_AMOUNT, pooladdress, tokenIDs, tokenPaths, tokenDecimals)
    let startTime = new Date();
    

    console.log(" ")
    console.log("INITAL TRADE COMPLETE")
    console.log("-------------------")
    let initTradeData = 

            {
                pair : tokenPaths.toString(),
                start: startTime,
                in: BUY_AMOUNT,
                gasCost:swapData.tx1Cost + swapData.tx2Cost,
                
             
            }

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

    




    
}








main()



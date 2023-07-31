const { ethers, BigNumber } = require('ethers')
const abiDecoder = require('abi-decoder')
const { abi: IUniswapV3PoolABI } = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json')
const { abi: SwapRouterABI} = require('@uniswap/v3-periphery/artifacts/contracts/interfaces/ISwapRouter.sol/ISwapRouter.json')
const {Quoter} = require('@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json')
const { getPoolImmutables, getPoolState, getAbi, handleProxyTokenContract } = require('../uniswapBot/helpers')


const {AlphaRouter,ChainId,SwapOptionsSwapRouter02,SwapRoute,SwapType} = require('@uniswap/smart-order-router')
const { Token, CurrencyAmount, TradeType, Percent } = require('@uniswap/sdk-core')

const JSBI  = require('jsbi') // jsbi@3.2.5

const V3_SWAP_ROUTER_ADDRESS = '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45'



require('dotenv').config()
const INFURA_URL = process.env.INFURA_URL
const WALLET_ADDRESS = process.env.WALLET_ADDRESS
const WALLET_SECRET = process.env.WALLET_SECRET
const API_KEY = process.env.ETHERSCAN_API_KEY

const provider = new ethers.providers.JsonRpcProvider(INFURA_URL)
const QUOTER_ADDRESS = '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6'
const chainId = 137

exports.makeTrade =  async (pair, route, amountIn, amountOut) =>{
    let symbol0 = pair.symbol[0]
    let decimals0 = pair.decimals[0] //https://ethereum.stackexchange.com/questions/133589/uniswap-v2-getamountsout-and-towei-fromwei
    let address0 = pair.address[0]
   
 
    let symbol1 =  pair.symbol[1]
    let decimals1 = pair.decimals[1]
    let address1 = pair.address[1]
    let message = "trade not completed"
    let tradeStatus 

    const transaction = {
        data: route.methodParameters.calldata,
        to: V3_SWAP_ROUTER_ADDRESS,
        value: BigNumber.from(route.methodParameters.value),
        from: WALLET_ADDRESS,
        gasPrice: BigNumber.from(route.gasPriceWei),
        gasLimit: ethers.utils.hexlify(1000000)
      }

      const wallet = new ethers.Wallet(WALLET_SECRET)
      const connectedWallet = wallet.connect(provider)
  
      const ERC20ABI = await getAbi(address0)
      //console.log(ERC20ABI)
  
      let tokenContract0 = new ethers.Contract(
        address0,
        ERC20ABI,
        //UNIABI,
        provider
      )
      const approvalAmount = ethers.utils.parseUnits(amountIn.toString(), 18).toString()
      let gasPrice = await provider.getGasPrice()
      let gasPriceGWEI = ethers.utils.formatUnits(gasPrice, "gwei")
      let gasBuffered = Math.round(gasPriceGWEI + 25)
      console.log(`gas price ${gasBuffered.toString()}`)
  
      try{
        const approvalResponse = await tokenContract0.connect(connectedWallet).approve(
          V3_SWAP_ROUTER_ADDRESS,
          approvalAmount,
          {gasLimit: ethers.utils.hexlify(200000), //this is optimum gas for approval
            gasPrice: ethers.utils.parseUnits(gasBuffered.toString(), "gwei")}
        )}catch{
          
          proxyContractData = await handleProxyTokenContract(address0,ERC20ABI)
  
          tokenContract0 = new ethers.Contract(
            proxyContractData.tokenAddress,
            proxyContractData.tokenAbi,
            provider
          )
  
          const approvalResponse = await tokenContract0.connect(connectedWallet).approve(
            V3_SWAP_ROUTER_ADDRESS,
            approvalAmount,
            {gasLimit: ethers.utils.hexlify(200000), //this is optimum gas for approval
              gasPrice: ethers.utils.parseUnits(gasBuffered.toString(), "gwei")}
          )}
      let tx1GasCost = (gasBuffered * 200000)/ 10**9
      let tx2GasCost = 0

      const tradeTransaction = await connectedWallet.sendTransaction(transaction).then(async transaction => {
        console.log(`transaction hash ${transaction.hash}`);
      
        const transactionReceipt = await provider.waitForTransaction(transaction.hash).then(
          transactionReceipt => {
            
            
            tx2GasCost = ethers.utils.formatEther(transactionReceipt.gasUsed.mul(transactionReceipt.effectiveGasPrice))
            tradeStatus = transactionReceipt.status
  
            console.log("swap processing")
            

            if(tradeStatus==0){
                message = "trade not completed"

            }else{
                console.log(`Swap  ${amountIn} ${symbol0} for ${amountOut} ${symbol1} Symbol on Uniswap V3`)
                message = `Swap  ${amountIn} ${symbol0} for ${amountOut} ${symbol1} Symbol on Uniswap V3`

            }
            
          })})
      
  
      swapData = {
        token0:address0,
        token1:address1,
        symbol0:symbol0,
        symbol1:symbol1,
        amount0:parseFloat(amountIn),
        amount1:parseFloat(amountOut),
        tx1Cost:tx1GasCost,
        tx2Cost:parseFloat(tx2GasCost),
        txCost:tx1GasCost + parseFloat(tx2GasCost),
        status:false,
        message:message,
        pair:pair,
        process:0,
        txStatus:tradeStatus
        

  
      }


      ///FINISH MAKING TRADE

      return swapData

}
const getQuote =  async (pair, router, amountIn) =>{
    

    /*
    * check the current price  of a trading pair
    * chain id for polycon 
    * */
    
    let amountOut = 0
   
    let symbol0 = pair.symbol[0]
    let decimals0 = pair.decimals[0] //https://ethereum.stackexchange.com/questions/133589/uniswap-v2-getamountsout-and-towei-fromwei
    let address0 = pair.address[0]
   
 
    let symbol1 =  pair.symbol[1]
    let decimals1 = pair.decimals[1]
    let address1 = pair.address[1]
    
  
    
    let token0 = new Token(chainId, address0, decimals0)
    let token1 = new Token(chainId, address1, decimals1)
   

    const wei = ethers.utils.parseUnits(amountIn.toString(), decimals0) //just do this
    const inputAmount = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(wei)) 
    let route 
    try{
        route = await router.route(
            inputAmount,
            token1,
            TradeType.EXACT_INPUT,
            {
            recipient: WALLET_ADDRESS,
            slippageTolerance: new Percent(2, 100), //was running at 25%
            deadline: Math.floor(Date.now()/1000 + 1800),
            type: SwapType.SWAP_ROUTER_02
            
        })
        
      

        amountOut = route.quote.toFixed(6)  //get the amoun out from the route
        message = `${amountIn} ${symbol0} could be swapped for ${route.quote.toFixed(6)} ${symbol1}`
        //console.log(`${amountIn} ${symbol0} could be swapped for ${route.quote.toFixed(6)} ${symbol1}`) //no necessaary
    
    
    
    }catch{
        
        message = "no price quote"
        console.log(message)

    }

    

    let quoteData = {
       
        symbol0:symbol0,
        symbol1:symbol1,
        amount0:parseFloat(amountIn),
        amount1:parseFloat(amountOut),
        message:message,
        pair:pair,
        status:false,
        process:0,
        route: route,
        
        

    }

    return quoteData


}


exports.initQuote = async(amountIn, poolAddress, tokenIDs, tokenPaths, tokenDecimals, usdc_mim, mim_usdc) =>{
    let quoteData
    let initQuoteResult
    let tradeData //out of a swap also return object that saves data out side the poll and helps with exit
    let router
    //let initTradeResult
      //this is where the try catch goes. 
  //if catch fails just output null data and set status to false
    try{
         router = new AlphaRouter({ chainId: chainId, provider: provider}) //router object
    }catch{
        quoteData = {
       
            symbol0:symbol0,
            symbol1:symbol1,
            amount0:parseFloat(amountIn),
            amount1:parseFloat(amountOut),
            message:"router not available",
            pair:pair,
            status:false,
            process:0,
           
            
            
    
        }

    }
    


    initQuoteResult = await getQuote(usdc_mim,router,amountIn)

    quoteData = initQuoteResult
    quoteData.process = 1 //set process step to one after you get a quote not inside the quoter

   
        
    return(quoteData)



    



}


exports.revertQuote = async(amountIn, poolAddress, tokenIDs, tokenPaths, tokenDecimals, usdc_mim, mim_usdc,initTradeState) =>{
    let quoteData
    
    let tradeData //out of a swap also return object that saves data out side the poll and helps with exit
    let router
    //let initTradeResult
      //this is where the try catch goes. 
  //if catch fails just output null data and set status to false
    try{
        router = new AlphaRouter({ chainId: chainId, provider: provider}) //router object
    }catch{
        quoteData = {
    
            symbol0:symbol0,
            symbol1:symbol1,
            amount0:parseFloat(amountIn),
            amount1:parseFloat(amountOut),
            message:"router not available",
            pair:pair,
            status:false,
            process:0,
        
            
            

        }

    }
  
    //initQuoteResult = await getQuote(usdc_mim,router,amountIn)

    

    if(initTradeState.pair.name=="usdc_mim"){
        console.log("debug 2")
        let initQuoteResult = await getQuote(mim_usdc,router,amountIn) //swap pair for trading out
       
        quoteData = initQuoteResult
        quoteData.process = 4
        
        
        


    }

    if(initTradeState.pair.name=="mim_usdc"){ //mim_usdc
        console.log("debug 2b")
        let initQuoteResult = await getQuote(usdc_mim,router,amountIn) //swap pair for trading out

        quoteData = initQuoteResult
        quoteData.process = 4


       


    }

    return(quoteData)






    



}

exports.initTrade = async(amountIn, poolAddress, tokenIDs, tokenPaths, tokenDecimals, usdc_mim, mim_usdc, tradeState) =>{
    let quoteData
    let initQuoteResult
    let tradeData //out of a swap also return object that saves data out side the poll and helps with exit
    let spread = 0.02
    //let initTradeResult
    const router = new AlphaRouter({ chainId: chainId, provider: provider}) //router object


  
    initQuoteResult = await getQuote(usdc_mim,router,amountIn)

    quoteData = initQuoteResult
    quoteData.process = 1 //set process step to one after you get a quote not inside the quoter

    price_diff = parseFloat(initQuoteResult.amount1)-parseFloat(initQuoteResult.amount0)
    console.log(price_diff)
        /*
        console.log("process:", quoteData.process)
        console.log("status:", quoteData.status)
        console.log("pair:", quoteData.pair.name)*/

 


    if(price_diff>spread){
        let initTradeResult = await makeTrade(usdc_mim, initQuoteResult.route, amountIn, initQuoteResult.amount1)
        tradeData = initTradeResult
        tradeData.process = 2 //set process step to one after you make a trade
        tradeData.status = true

        return(tradeData)



    }else if(price_diff<-spread){
        let initTradeResult = await makeTrade(mim_usdc, initQuoteResult.route, amountIn, initQuoteResult.amount1)
        tradeData = initTradeResult
        tradeData.process = 2 //set process step to one after you make a trade
        tradeData.status = true

        return(tradeData)



    }else{


        return(quoteData)

    }
        



    



}

exports.revertPollingTrade = async(poolAddress, tokenIDs, tokenPaths, tokenDecimals, usdc_mim, mim_usdc, initTradeState) =>{
    let quoteData
    let tradeData
    let spread = 0.02
    let amountIn = initTradeState.amount1
    //let initTradeResult
    const router = new AlphaRouter({ chainId: chainId, provider: provider}) //router object

    console.log(initTradeState)
    //this one also check for arbitrage but only one way

    if(initTradeState.pair.name=="usdc_mim"){
        let initQuoteResult = await getQuote(mim_usdc,router,amountIn) //swap pair for trading out

        quoteData = initQuoteResult
        quoteData.process = 4
        
        



    }
    else{ //mim_usdc
        let initQuoteResult = await getQuote(usdc_mim,router,amountIn) //swap pair for trading out

        quoteData = initQuoteResult
        quoteData.process = 4





    }

    return(quoteData)


}

exports.arbPolling = async (amountIn, poolAddress, tokenIDs, tokenPaths, tokenDecimals, usdc_mim, mim_usdc) => {
    
    let tradeData //out of a swap also return object that saves data out side the poll and helps with exit
    let initTradeResult
    let revertTradeResult
     //polygon chain ID
    const router = new AlphaRouter({ chainId: chainId, provider: provider}) //router object
    

    swapData = {
        process:1,
        status:false,
        message:"starting"
    
    }

    let initQuoteResult = await getInitQuote(usdc_mim,router,amountIn)

    price_diff = parseFloat(initQuoteResult.amount1)-parseFloat(initQuoteResult.amount0)
    console.log(price_diff)
    spread = 0.01 //based on amount in to get 0.02 (for testing just use but once testing with 1s use 0.02 or inverse or average gas?)
  
    tradeData=initQuoteResult

    /**
     * 
     * Checks if there is an aribrtage in either direction it will keep returning the initally quote result with status updated to
     * 
     */
    if(parseFloat(initQuoteResult.amount1)-parseFloat(initQuoteResult.amount0)>spread){
        console.log("Make trade usdc -> mim")
        
        //start polling on the reverse to make the inverse trade
        
        

        initTradeResult = await makeTrade(usdc_mim, initQuoteResult.route, amountIn, initQuoteResult.amount1)
        
        tradeData.process = 2
        tradeData.message = "Made trade usdc -> mim"
        
        let revertQuoteResult = await getInitQuote(mim_usdc,router, initTradeResult.amount1)


        price_diff = parseFloat(revertQuoteResult.amount1)-parseFloat(revertQuoteResult.amount0)
        console.log(price_diff)
        tradeData.process = 3
        if(price_diff>spread){
            revertTradeResult = await makeTrade(mim_usdc, revertQuoteResult.route, initTradeResult.amount1, revertQuoteResult.amount1 )
            
            tradeData=revertTradeResult
            tradeData.status = true

            profit = revertTradeResult.amount1 - amountIn
            totalGasCost = initTradeResult.tx1Cost + initTradeResult.tx2Cost + revertTradeResult.tx1Cost + revertTradeResult.tx2Cost
            profitAfterGas = profit -totalGasCost
            console.log(`started: ${amountIn}, 
                            ended: ${revertTradeResult.amount1}, 
                            profit: ${profit }, 
                            total gas cost ${totalGasCost}, 
                            profit after gas ${ profitAfterGas} `)

        }

        //make inverse trade

    
    }else if (parseFloat(initQuoteResult.amount0)-parseFloat(initQuoteResult.amount1)>spread){

        console.log("Make trade mim -> usdc")
         //start polling on the reverse to make the inverse trade
        
        
        initTradeResult = await makeTrade(mim_usdc, initQuoteResult.route, amountIn, initQuoteResult.amount1)
        tradeData.process = 2
        tradeData.message = "Made trade mim -> usdc"

        let revertQuoteResult = await getInitQuote(usdc_mim,router,amountIn)
        price_diff = parseFloat(revertQuoteResult.amount1)-parseFloat(revertQuoteResult.amount0)
        tradeData.process = 3
        if(price_diff>spread){
            revertTradeResult = await makeTrade(usdc_mim, revertQuoteResult.route, initTradeResult.amount1, revertQuoteResult.amount1)
            tradeData=revertTradeResult
            tradeData.status = true

            profit = revertTradeResult.amount1 - amountIn
            totalGasCost = initTradeResult.tx1Cost + initTradeResult.tx2Cost + revertTradeResult.tx1Cost + revertTradeResult.tx2Cost
            profitAfterGas = profit -totalGasCost
            console.log(`started: ${amountIn}, 
                            ended: ${revertTradeResult.amount1}, 
                            profit: ${profit }, 
                            total gas cost ${totalGasCost}, 
                            profit after gas ${ profitAfterGas} `)
        }

        //make inverse trade

    }else{
        
        tradeData.status = false
        tradeData.message = "No Arb Oppurtinity"
    }
    /*
    profit = revertTradeResult - amountIn
    totalGasCost = initTradeResult.tx1Cost + initTradeResult.tx2Cost + revertTradeResult.tx1Cost + revertTradeResult.tx2Cost
    profitAfterGas = profit -totalGasCost
    console.log(`started: ${amountIn}, 
                            ended: ${revertTradeResult.amount1}, 
                            profit: ${profit }, 
                            total gas cost ${totalGasCost}, 
                            profit after gas ${ profitAfterGas} `)

    /*
    * Process list
    * 1 - finding initial oppurtinity
    * 2 - first swap made
    * 3 - finding second oppurtinity
    * 4 - reverse swap made
    */
    

    return(tradeData)

      




}

/*
exports.initPolling = async (amountIn, poolAddress, tokenIDs, tokenPaths, tokenDecimals, usdc_mim, mim_usdc) => {
    
}


exports.revertPolling = async (amountIn, poolAddress, tokenIDs, tokenPaths, tokenDecimals, usdc_mim, mim_usdc) => {

}*/



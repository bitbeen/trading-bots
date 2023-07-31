const { ethers, BigNumber } = require('ethers')
const abiDecoder = require('abi-decoder')
const { abi: IUniswapV3PoolABI } = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json')
const { abi: SwapRouterABI} = require('@uniswap/v3-periphery/artifacts/contracts/interfaces/ISwapRouter.sol/ISwapRouter.json')
const {Quoter} = require('@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json')
const { getPoolImmutables, getPoolState, getAbi, handleProxyTokenContract } = require('./helpers')


const {AlphaRouter,ChainId,SwapOptionsSwapRouter02,SwapRoute,SwapType} = require('@uniswap/smart-order-router')
const { Token, CurrencyAmount, TradeType, Percent } = require('@uniswap/sdk-core')

const JSBI  = require('jsbi') // jsbi@3.2.5

const V3_SWAP_ROUTER_ADDRESS = '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45'
const chainId = 137


require('dotenv').config()
const INFURA_URL = process.env.INFURA_URL
const WALLET_ADDRESS = process.env.WALLET_ADDRESS
const WALLET_SECRET = process.env.WALLET_SECRET
const API_KEY = process.env.ETHERSCAN_API_KEY

const provider = new ethers.providers.JsonRpcProvider(INFURA_URL)
const QUOTER_ADDRESS = '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6'






exports.makeTrade =  async (pair, route, amountIn, amountOut) =>{
  let symbol0 = pair.symbol[0]
  let decimals0 = pair.decimals[0] //https://ethereum.stackexchange.com/questions/133589/uniswap-v2-getamountsout-and-towei-fromwei
  let address0 = pair.address[0]
 

  let symbol1 =  pair.symbol[1]
  let decimals1 = pair.decimals[1]
  let address1 = pair.address[1]
  let message = "trade not completed"
  let tradeStatus 
  let swapData

  swapData = {
    token0:address0,
    token1:address1,
    symbol0:symbol0,
    symbol1:symbol1,
    amount0:parseFloat(amountIn),
    amount1:parseFloat(amountOut),
    tx1Cost:0,
    tx2Cost:0,
    txCost:0,
    status:false,
    message:message,
    pair:pair,
    process:0,
    txStatus:tradeStatus
    


  }

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
    let gasBuffered = Math.round(gasPriceGWEI + 20)
    console.log(`gas price ${gasBuffered.toString()}`)

    //CHAINING TRANSACTION AFTER APPROVAL REPONSE with .then STOPS STF ERROR FROM HAPPENING put trade transaction in it's own external function 
    //then you can put it into the try catch
    //also handle error output

    try{
      const approvalResponse = await tokenContract0.connect(connectedWallet).approve(
        V3_SWAP_ROUTER_ADDRESS,
        approvalAmount,
        {gasLimit: ethers.utils.hexlify(200000), //this is optimum gas for approval
          gasPrice: ethers.utils.parseUnits(gasBuffered.toString(), "gwei")}
      ).then( async approvalResponse => {
        console.log("tx approved")
        let tradeTransaction = await this.runTx(transaction,swapData,connectedWallet, gasBuffered)
        swapData = tradeTransaction
      })
    
    }catch(error){
        console.log(error)
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
        ).then( async approvalResponse => {
          console.log("tx approved")
          let tradeTransaction = await this.runTx(transaction,swapData,connectedWallet, gasBuffered)
          swapData = tradeTransaction
  
        })
      
      
      }
    
    

    return swapData

}


exports.runTx =  async (transaction, swapData, connectedWallet, gasBuffered) =>{
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
            
            message = `Swap  ${swapData.amount0} ${swapData.symbol0} for ${swapData.amount1} ${swapData.symbol1} Symbol on Uniswap V3`
            console.log(message)

        }
        
      })})
      swapData.tx1Cost = tx1GasCost
      swapData.tx2Cost = tx2GasCost
      swapData.txCost = parseFloat(tx1GasCost) + parseFloat(tx2GasCost)
      swapData.tradeStatus = tradeStatus
      swapData.message = message
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
     

      amount0:parseFloat(amountIn),
      amount1:parseFloat(amountOut),
      message:message,
      pair:pair,
      pollStatus:false,
      process:1,
      route: route,
      txStatus:false,
      finalStatus:false
      
      

  }

  return quoteData


}
exports.checkQuote = async(amountIn, pair) =>{
  let quoteData
  let initQuoteResult
  let router
  //let initTradeResult
    //this is where the try catch goes. 
//if catch fails just output null data and set status to false
  try{
       router = new AlphaRouter({ chainId: chainId, provider: provider}) //router object
  }catch{
      quoteData = {
     

          amount0:parseFloat(amountIn),
          amount1:0,
          message:"router not available",
          pair:pair,
          status:false,
          process:0,
         
          
          
  
      }

  }
  


  initQuoteResult = await getQuote(pair,router,amountIn)

  quoteData = initQuoteResult
  quoteData.process = 1 //set process step to one after you get a quote not inside the quoter

 
      
  return(quoteData)



  



}
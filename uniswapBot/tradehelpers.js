const { ethers, BigNumber } = require('ethers')
const abiDecoder = require('abi-decoder')
const { abi: IUniswapV3PoolABI } = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json')
const { abi: SwapRouterABI} = require('@uniswap/v3-periphery/artifacts/contracts/interfaces/ISwapRouter.sol/ISwapRouter.json')
const {Quoter} = require('@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json')
const { getPoolImmutables, getPoolState, getAbi } = require('./helpers')


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

exports.getCurrentPriceUni = async (addressPath,symbolPath,decimalPath, amountIn ) => {
  //tokenIds,tokenPath, tokenDecimals,amountIn,token1,fee,sqrtPriceLimitX96, decimals0
  const chainId = 137
  const router = new AlphaRouter({ chainId: chainId, provider: provider})

  
  
  const symbol0 = symbolPath[0]
  const decimals0 = decimalPath[0]
  const address0 = addressPath[0]

 
  const symbol1 = symbolPath[1]
  const decimals1 = decimalPath[1]
  const address1 = addressPath[1]

//const WETH = new Token(chainId, address0, decimals0, symbol0, name0)
//const UNI = new Token(chainId, address1, decimals1, symbol1, name1)
const WETH = new Token(chainId, address0, decimals0)
const UNI = new Token(chainId, address1, decimals1)

  const wei = ethers.utils.parseUnits(amountIn.toString(), 18)
  const inputAmount = CurrencyAmount.fromRawAmount(WETH, JSBI.BigInt(wei))

  const route = await router.route(
    inputAmount,
    UNI,
    TradeType.EXACT_INPUT,
    {
      recipient: WALLET_ADDRESS,
      slippageTolerance: new Percent(25, 100),
      deadline: Math.floor(Date.now()/1000 + 1800),
      type: SwapType.SWAP_ROUTER_02
    }
  )

  console.log(`Quote Exact In: ${route.quote.toFixed(10)}`)
  console.log(`1 ${symbol0} can be swapped for ${route.quote.toFixed(10)} ${symbol1}`)
  return(route.quote.toFixed(10))


}
/*
exports.uniSwapOptimumTrade = async (addressPath,symbolPath,decimalPath, amountIn ) => {
  //tokenIds,tokenPath, tokenDecimals,amountIn,token1,fee,sqrtPriceLimitX96, decimals0
  const chainId = 137
  const router = new AlphaRouter({ chainId: chainId, provider: provider})

  
  
  const symbol0 = symbolPath[0]
  const decimals0 = decimalPath[0]
  const address0 = addressPath[0]

 
  const symbol1 = symbolPath[1]
  const decimals1 = decimalPath[1]
  const address1 = addressPath[1]

//const WETH = new Token(chainId, address0, decimals0, symbol0, name0)
//const UNI = new Token(chainId, address1, decimals1, symbol1, name1)




  const wei = ethers.utils.parseUnits(amountIn.toString(), 18)
  const inputAmount = CurrencyAmount.fromRawAmount(WETH, JSBI.BigInt(wei))

  const route = await router.route(
    inputAmount,
    UNI,
    TradeType.EXACT_INPUT,
    {
      recipient: WALLET_ADDRESS,
      slippageTolerance: new Percent(25, 100),
      deadline: Math.floor(Date.now()/1000 + 1800),
      type: SwapType.SWAP_ROUTER_02
    }
  )

  console.log(`Quote Exact In: ${route.quote.toFixed(10)}`)
  console.log(`1 ${symbol0} can be swapped for ${route.quote.toFixed(10)} ${symbol1}`)
  //return(route.quote.toFixed(10))





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

  const approvalAmount = ethers.utils.parseUnits('1', 18).toString()
  const ERC20ABI = await getAbi(address0)
  const contract0 = new ethers.Contract(address0, ERC20ABI, provider)
  await contract0.connect(connectedWallet).approve(
    V3_SWAP_ROUTER_ADDRESS,
    approvalAmount
  )

  const tradeTransaction = await connectedWallet.sendTransaction(transaction)


}*/



exports.uniSwapBasicTrade = async (inputAmount, poolAddress, tokenIDs, tokenPath, tokenDecimals) => {
	//buyPoolTokens
  var symbol0 = tokenPath[0]
  var decimals0 =  tokenDecimals[0]
  var address0 = tokenIDs[0] //mainnet

  var symbol1 = tokenPath[1]
  var decimals1 =  tokenDecimals[1]
  var address1 = tokenIDs[1] 
  const swapRouterAddress = '0xE592427A0AEce92De3Edee1F18E0157C05861564'
  var amounts = []
  var swapData = {}
  
  //var swapData 

	console.log("swap started")
    const poolContract = new ethers.Contract(
      poolAddress,
      IUniswapV3PoolABI,
      provider
    )

	const immutables = await getPoolImmutables(poolContract)
  	const state = await getPoolState(poolContract)
  	console.log("pool contract works ")

	
	  const wallet = new ethers.Wallet(WALLET_SECRET)
	  const connectedWallet = wallet.connect(provider)
	  console.log("wallet connected ")

	  const swapRouterContract = new ethers.Contract(
		swapRouterAddress,
		SwapRouterABI,
		provider
	  )

	  console.log("connected to smart router contract")
    //const inputAmount = 0.01 //this is the amount being swapped DO NOT LEAVE THIS FOR WETH
  // .001 => 1 000 000 000 000 000
    const amountIn = ethers.utils.parseUnits(
      inputAmount.toString(),
      decimals0
    )

  const approvalAmount = (amountIn * 10).toString()//do not give access to everything in real versiom
  const ERC20ABI = await getAbi(address0)
  //console.log(ERC20ABI)

  const tokenContract0 = new ethers.Contract(
    address0,
    ERC20ABI,
    //UNIABI,
    provider
  )

  //HANDLE PROXY CONTRACTS HERE 

  let gasPrice = await provider.getGasPrice()
  let gasPriceGWEI = ethers.utils.formatUnits(gasPrice, "gwei")
  let gasBuffered = Math.round(gasPriceGWEI + 25)
  console.log(`gas price ${gasBuffered.toString()}`)


  const approvalResponse = await tokenContract0.connect(connectedWallet).approve(
    swapRouterAddress,
    amountIn,
    {gasLimit: ethers.utils.hexlify(200000), //this is optimum gas for approval
      gasPrice: ethers.utils.parseUnits(gasBuffered.toString(), "gwei")}
  ).then(

    
  )

  //console.log(approvalResponse)
  //console.log(ethers.constants.MaxUint256)

  const params = {
    tokenIn: address0,
    tokenOut: address1,
    fee: immutables.fee,
    recipient: WALLET_ADDRESS,
    deadline: Math.floor(Date.now() / 1000) + (60 * 10),//(60*5)(reduce to 2 mins)
    amountIn: amountIn,
    amountOutMinimum: 0,//proper version change this maybe pull in arb data
    sqrtPriceLimitX96: 0,
  }
 
  gasPrice = await provider.getGasPrice()
  gasPriceGWEI = ethers.utils.formatUnits(gasPrice, "gwei")
  gasBuffered = Math.round(gasPriceGWEI + 25)
  console.log(`gas price ${gasBuffered.toString()}`)
  
  const transaction = await swapRouterContract.connect(connectedWallet).exactInputSingle(
    params,
    {
      gasLimit: ethers.utils.hexlify(200000), //20000000
      gasPrice: ethers.utils.parseUnits(gasBuffered.toString(), "gwei")
    }
  ).then(async transaction => {
    //console.log("transaction metadata")
    console.log(`transaction hash ${transaction.hash}`);
   
    const transactionReceipt = await provider.waitForTransaction(transaction.hash).then(
      transactionReceipt => {
        console.log("transaction reciept")
        //console.log(transactionReceipt);
        amounts = handleTxReciept(transactionReceipt)
        /*
        swapData.token0 = address0
        swapData.token1 = address1
        swapData.symbol0 = symbol0
        swapData.symbol1 = symbol1
        swapData.amount0 = amounts[0]/ (10**decimals0)
        swapData.amount1 = amounts[1]/ (10**decimals1)*/
        swapData = {
          token0:address0,
          token1:address1,
          symbol0:symbol0,
          symbol1:symbol1,
          amount0:amounts[0]/ (10**decimals0),
          amount1:amounts[1]/ (10**decimals1)
      
        }
        
        
        console.log("swap completed")
        console.log(`Swap  ${amounts[0]/ (10**decimals0)} ${symbol0} for ${amounts[1]/ (10**decimals1)} ${symbol1} Symbol on Uniswap V3`)
        //console.log(swapData)
        
      }
    )

  })

  //return swapData
  //return swapData

  return swapData

  

 


 

  
  



}



exports.sushiSwapBasicTrade = async (inputAmount, poolAddress, tokenIDs, tokenPath, tokenDecimals) => {
  const symbol0 = tokenPath[0]
  const decimals0 =  tokenDecimals[0]
  const address0 = tokenIDs[0] //mainnet

  const symbol1 = tokenPath[1]
  const decimals1 =  tokenDecimals[1]
  const address1 = tokenIDs[1] 

  const swapRouterAddress = '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506'
  const swapRouterABI = await getAbi(swapRouterAddress)
  var swapData = {}
  
	//buyPoolTokens
  console.log("swap started")
  
  const poolContract = new ethers.Contract(
      poolAddress,
      IUniswapV3PoolABI,
      provider
  )

  const immutables = await getPoolImmutables(poolContract)
  	const state = await getPoolState(poolContract)
  	console.log("pool contract works ")

	
	  const wallet = new ethers.Wallet(WALLET_SECRET)
	  const connectedWallet = wallet.connect(provider)
	  console.log("wallet connected ")

	  const swapRouterContract = new ethers.Contract(
		swapRouterAddress,
		swapRouterABI,
		provider
	  )

	  console.log("connected to smart router contract")

    //const inputAmount = 0.01 //this is the amount being swapped DO NOT LEAVE THIS FOR WETH
  // .001 => 1 000 000 000 000 000
    const amountIn = ethers.utils.parseUnits(
      inputAmount.toString(),
      decimals0
    )

    const approvalAmount = (amountIn * 10).toString()//do not give access to everything in real versiom
    const ERC20ABI = await getAbi(address0)
    
    console.log("connected to smart router contract")
    const tokenContract0 = new ethers.Contract(
      address0,
      ERC20ABI,
      //UNIABI,
      provider
    )
  
    gasPrice = await provider.getGasPrice()
  
  
    const approvalResponse = await tokenContract0.connect(connectedWallet).approve(
      swapRouterAddress,
      amountIn,
      {gasLimit: ethers.utils.hexlify(200000), //this is optimum gas for approval
        gasPrice: ethers.utils.parseUnits("178", "gwei")}
    ).then(
  
  
    )
  
    console.log(approvalResponse)
    console.log(ethers.constants.MaxUint256)
      
   
    
    const  transaction =  await swapRouterContract.connect(connectedWallet).swapExactTokensForTokensSupportingFeeOnTransferTokens(
      amountIn,
      0,
      [address0,address1],
      WALLET_ADDRESS,
      Math.floor(Date.now() / 1000) + (60 * 10),
      {gasLimit: ethers.utils.hexlify(200000), //this is optimum gas for approval
        gasPrice: ethers.utils.parseUnits("178", "gwei")}
      

    ).then(async transaction => {
      console.log(transaction);
      console.log("transaction metadata")
      
      const transactionReceipt = await provider.waitForTransaction(transaction.hash).then(
        transactionReceipt => {
          console.log("transaction reciept")
          //console.log(transactionReceipt);
          amounts = handleTxReciept(transactionReceipt)
          /*
          swapData.token0 = address0
          swapData.token1 = address1
          swapData.symbol0 = symbol0
          swapData.symbol1 = symbol1
          swapData.amount0 = amounts[0]/ (10**decimals0)
          swapData.amount1 = amounts[1]/ (10**decimals1)*/
          swapData = {
            token0:address0,
            token1:address1,
            symbol0:symbol0,
            symbol1:symbol1,
            amount0:amounts[1]/ (10**decimals0), //for some reason sushiswap reverses out put
            amount1:amounts[0]/ (10**decimals1) //for some reason sushiswap reverses out put
        
          }
          
          
          console.log("swap completed")
          console.log(`Swap  ${amounts[1]/ (10**decimals0)} ${symbol0} for ${amounts[0]/ (10**decimals1)} ${symbol1} Symbol on Uniswap V3`)
         
          
        }

      );
      
      
    })

    console.log(transaction)

    //const receipt = await transaction.wait();
    //console.log('Transaction receipt', receipt);
    //const transactionReceipt = provider.waitForTransaction(transaction.hash);
    //console.log(transactionReceipt);

   
    //await logBalance(trader)

    console.log("swap completed")
    return swapData
   

}






const handleTxReciept = (txRec) =>{
   let logs = txRec.logs
   //console.log(logs)
   //console.log(logs[0])
   //console.log(logs[0].data)
   txRec.status==1 ?
    console.log("Succss")
    :
    console.log("Failed - most likely due to spend higher than avialable in wallet")
  
   if(txRec.to === "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506"){
    console.log("Sushi Style")

    let amountOutEncoded = logs[0].data
    let amountOut = ethers.utils.defaultAbiCoder.decode(['uint256'],amountOutEncoded)[0].toString()
    //console.log(amountOut)
    
 
 
    let amountInEncoded = logs[1].data
    
    let amountIn = ethers.utils.defaultAbiCoder.decode(['uint256'],amountInEncoded)[0].toString()
     if (amountIn == 0 ){
      amountInEncoded = logs[2].data
    
      amountIn = ethers.utils.defaultAbiCoder.decode(['uint256'],amountInEncoded)[0].toString()

     }
      

    amounts = [amountIn, amountOut]

    return amounts


   }else{
    console.log("Uni Style")

    let amountOutEncoded = logs[0].data
    let amountOut = ethers.utils.defaultAbiCoder.decode(['uint256'],amountOutEncoded)[0].toString()
   //console.log(amountOut)
   


    let amountInEncoded = logs[1].data
    let amountIn = ethers.utils.defaultAbiCoder.decode(['uint256'],amountInEncoded)[0].toString()

    amounts = [amountIn, amountOut]

    return amounts

   }
 
   //console.log(amountIn)

  
   

   //let ABI  = await getAbi(txContractAddress)



  //abiDecoder.addABI(ABI)
  //const decodedData = abiDecoder.decodeMethod(amountOut)
  //console.log(decodedData)
  //return amountOut


}


const { ethers } = require('ethers')
const abiDecoder = require('abi-decoder')
const { abi: IUniswapV3PoolABI } = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json')
const { abi: SwapRouterABI} = require('@uniswap/v3-periphery/artifacts/contracts/interfaces/ISwapRouter.sol/ISwapRouter.json')
const { getPoolImmutables, getPoolState, getAbi } = require('./helpers')

require('dotenv').config()
const INFURA_URL = process.env.INFURA_URL
const WALLET_ADDRESS = process.env.WALLET_ADDRESS
const WALLET_SECRET = process.env.WALLET_SECRET
const API_KEY = process.env.ETHERSCAN_API_KEY

const provider = new ethers.providers.JsonRpcProvider(INFURA_URL)
//const poolAddress = '0x86f1d8390222a3691c28938ec7404a1661e618e0'//passed into function from previous



/*
{
    sushiPoolID: '0xf1a12338d39fc085d8631e1a745b5116bc9b2a32',
    tokenPath: [ 'WMATIC', 'WETH' ],
    tokenIDs: [
      '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
      '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619'
    ],
    feeTier: 500,
    uniPoolID: '0x86f1d8390222a3691c28938ec7404a1661e618e0',
    name: 'Uniswap V3 Wrapped Matic/Wrapped Ether 0.05%'
  }





const symbol0 = 'WMATIC'
const decimals0 = 18
const address0 = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270' //mainnet

const symbol1 = 'WETH'
const decimals1 = 18
const address1 = '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619'
*/

exports.uniSwapBasicTrade = async (inputAmount, poolAddress, tokenIDs, tokenPath, tokenDecimals,swapData) => {
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

  gasPrice = await provider.getGasPrice()


  const approvalResponse = await tokenContract0.connect(connectedWallet).approve(
    swapRouterAddress,
    amountIn,
    {gasLimit: ethers.utils.hexlify(200000), //this is optimum gas for approval
      gasPrice: ethers.utils.parseUnits("200", "gwei")}
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
  console.log(params)
  
  const transaction = await swapRouterContract.connect(connectedWallet).exactInputSingle(
    params,
    {
      gasLimit: ethers.utils.hexlify(200000), //20000000
      gasPrice: ethers.utils.parseUnits("178", "gwei")
    }
  ).then(async transaction => {
    console.log("transaction metadata")
    console.log(transaction);
   
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

exports.uniSwapOptimumTrade = async () => {
	//buyPoolTokens

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


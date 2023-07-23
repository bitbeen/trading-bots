const {ethers, BigNumber} = require('ethers')
const { getAbi} = require('../uniswapBot/helpers')

const INFURA_URL = process.env.INFURA_URL
const provider = new ethers.providers.JsonRpcProvider(INFURA_URL)


const WETHAddress = '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'
const WMATICAddress = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'
const MATICAddress = '0x0000000000000000000000000000000000001010'

const getGasPrice = async() =>{
    const WEthABI = await getAbi(WETHAddress)
    const WMaticABI = await getAbi(WMATICAddress)
    const MaticABI = await getAbi(MATICAddress)

    const wethContract = new ethers.Contract(WETHAddress, WEthABI, provider)
    const wmaticContract = new ethers.Contract(WMATICAddress,  WMaticABI, provider)

    //encoded function call  
    //this calls the data for running the transaction but not the actual transaction we're estimating the gas for
    //const encodedFunction = wethContract.interface.encodeFunctionData('withdraw',[ethers.utils.parseEther('1')])
    const encodedFunction = wmaticContract.interface.encodeFunctionData('withdraw',[ethers.utils.parseEther('1')])


    //estimate gas for previous transaction
    /*
    const gas1E = await provider.estimateGas({
        to: WETHAddress,
        data: encodedFunction

    })*/

    //UNITS OF GAS USED
    const gas1 = await provider.estimateGas({
        to: WMATICAddress,
        data: encodedFunction

    })
    //console.log(gas1.toNumber())

    console.log(`${gas1.toNumber()} units of gas`)
    //units of gas -> 
    // gas price?

    //easy mode
    //UNITS OF GAS USED
    const gas2 = await wmaticContract.estimateGas.withdraw(ethers.utils.parseEther('1')) //its a unit not a price 1=1
    gasUsed = gas2.toNumber()

    //hardmode is better for separating funtionality
    //easy mode is cleaner
    console.log("gas used")
    console.log(gasUsed)

    
    gasPrice = await provider.getGasPrice(); //gets gas price in WEI but hex mode
    gasPriceWEI = gasPrice.toNumber()
    console.log("gas price WEIMATIC")
    console.log(gasPriceWEI)

    console.log("gas price GWEIMATIC")
    gasPriceGWEI = ethers.utils.formatUnits(gasPrice, "gwei")
    console.log(gasPriceGWEI)

    console.log("gas price MATIC")
    gasPriceMATIC = ethers.utils.formatUnits(gasPrice, "ether")
    console.log(gasPriceMATIC)

    transactionCostWEI = gasUsed * gasPriceWEI
    console.log("tx cost WEIMatic")
    console.log(transactionCostWEI)


    transactionCostMatic = gasUsed * gasPriceMATIC
    console.log("tx cost Matic")
    console.log(transactionCostMatic)



    

    /*
    gasPrice = await provider.getGasPrice();
    gasFees = gas2
    const finalGasPrice = (gasPrice.toNumber()) * (gas2.toNumber());
    console.log(gasPrice.toNumber())
    console.log(finalGasPrice)*/

    //gas price GWEI() - 1billion GWEI = 1 ETH
    //gas limit - max amount of gas used for operation
    //if you don't use it all it's refunded

    //gas fee - 
    //gas units - amount of gas units a specific transaction would cost to run
    //base fee 
    //priority fee -

    
    //The total fee is calculated as "units of gas used * (base fee + priority fee)"
    //TX FEE COST = GAS USED X GASPRICE

}

getGasPrice()
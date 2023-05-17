//0x50eaEDB835021E4A108B7290636d62E9765cc6d7 wbtc + Eth 0.05%

//convert tick value to human readable price 

const {ethers} = require ('ethers')
const JSBI = require('jsbi')
const {TickMath, FullMath} = require('@uniswap/v3-sdk')
require('dotenv').config()



const INFURA_URL = process.env.INFURA_URL
const provider = new ethers.providers.JsonRpcProvider(INFURA_URL)

//token addresses can be found either with scripting or by visiting the polygon scan page
//token0 0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6 WBTC

//token1 0x7ceb23fd6bc0add59e62ac25578270cff1b9f619 WETH

const baseToken ='0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6' //WTBC input
const quoteToken ='00x7ceb23fd6bc0add59e62ac25578270cff1b9f619' //WETH output
const inputAmount = 1 //1 WBTC
const currentTick = 257263 //avialable form swap pool contract
const baseTokenDecimals = 8 //WBTC uses 8 decimal places
const quoteTokenDecimals = 18 //almost all ERC use 18 decem

async function main(){
    //rationX192 price ration between two tokens (192 bits)
    //baseAmount - amount in WEI of input token 
    //shift - value 1 shifted 192 bits left 

    //pass tick to tickmath function 
    //uniswap uses sqrt of value instead of value to save space
    const sqrtRatioX96 = TickMath.getSqrtRatioAtTick(currentTick) //gives us sqrt of tick value
    const ratioX192 = JSBI.multiply(sqrtRatioX96,sqrtRatioX96) //multiply big int by itself to get sqaure value
    const baseAmount = JSBI.BigInt(inputAmount * (10**baseTokenDecimals)) //converts 1BTC to WEI equivalent
    const shift = JSBI.leftShift(JSBI.BigInt(1), JSBI.BigInt(192)) //shift 1 > 192 bits to the left

    quoteAmount = FullMath.mulDivRoundingUp(ratioX192, baseAmount, shift) //returned in WEI
    console.log(quoteAmount.toString() / (10**quoteTokenDecimals))
    //https://github.com/Uniswap/v3-periphery/blob/main/contracts/libraries/OracleLibrary.sol //this helps with reverse functionality
}

main()


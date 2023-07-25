const { geckoTestExport } = require('./csvhelper')
const axios = require('axios')
const { makeTrade } = require('./tradehelpers')

let pool = "0xa9077cdb3d13f45b8b9d87c43e11bce0e73d8631"
let _minutes = 60 //[10,30,60]
let poolName ="AAVE"
const smoothingFactor = 0.2;
let filename = "gecko_test_" + poolName + "_" + _minutes + "mins_" + smoothingFactor + "smF.csv"


const main = async() =>{
    var result
    var historicalDatas = []
    var time
    var changeData = {}

    console.log(`${_minutes} minutes - GECKO TEST`)
    
    var data = await lastXMinutes().then(async data =>{
       
        data = data.reverse()
        for (d in data){
            let historicalData = {
                time: 0,
                open:0,
                high:0,
                low:0,
                close:0,
                volume:0
    
            }
            historicalData.time = data[d][0]
            historicalData.close = data[d][4] 
    
            historicalDatas.push(historicalData)
    
    
    
        }
        
        //console.log(historicalDatas)
        result = await runEMACalc(historicalDatas)
        time = new Date()
        console.log(`Predicted potential price change in ${_minutes} mins ${round(result.predictedChange)}`);
        console.log(`Predicted potential price change% in ${_minutes} mins: ${round(result.predictedChangePercentage)}%`);
        console.log(`Original price: ${round(result.originalPrice)}`);
        console.log(`Potential new price: ${round(result.originalPrice + result.predictedChange)}`)
        console.log(`Run at: ${new Date()}`);
        changeData = {
            oPrice:round(result.originalPrice),
            run1:new Date(),
            pNPrice:round(result.originalPrice + result.predictedChange),
            pChange: round(result.predictedChange),
            pChangePercentage:round(result.predictedChangePercentage)
            
            
        }

    })
    //const transactionReceipt = await provider.waitForTransaction(transaction.hash).then(

    //make the objects then 
  

    await delay(_minutes*60000); //3600000
    let _data = await this_minute(pool).then(async _data =>{
        newPrice = _data[0][4]
        time = new Date()
        console.log(`Actual new price: ${round(newPrice)}`)
        console.log(`Actual price change: ${round(newPrice - result.originalPrice)}`)
        console.log(`Actual price% change: ${round((newPrice - result.originalPrice)/result.originalPrice*100)}%`)
        console.log(`Run at: ${new Date()}`);
        changeData.run2=new Date()
        changeData.aNPrice = round(newPrice)
        changeData.aChange = round(newPrice - result.originalPrice)
        changeData.aChangePercentage = round((newPrice - result.originalPrice)/result.originalPrice*100)
        
        if(result.predictedChangePercentage>0.5){
            changeData.makeTrade = true
        }else{
            changeData.makeTrade = false
        }

        if(changeData.makeTrade==true && (changeData.aChangePercentage>=changeData.pChangePercentage) ){
            changeData.tradetestResult = "Profit"

        }else if(changeData.makeTrade==true && (changeData.aChangePercentage>=changeData.pChangePercentage) ){
            changeData.tradetestResult = "Loss"
        }else if (changeData.makeTradee==false){
            changeData.tradetestResult = "No trade"
        }else{
            changeData.tradetestResult = "Something wrong"
        }
            
        

        //console.log(changeData)
        geckoTestExport(filename,changeData)


    })
    

    

    

    

}






const runEMACalc = async(historicalData) =>{
    // Call the function with a smoothing factor (0.2 is a common choice) and log the predicted potential price change

const predictedChangeData = predictPriceChange(historicalData, smoothingFactor);

 return predictedChangeData
   
}



// Function to calculate the Exponential Moving Average (EMA) for a given dataset
function calculateEMA(data, _minutes) {
    let ema = data[0].close;
    for (let i = 1; i < data.length; i++) {
      const timeDifference = data[i].time - data[i - 1].time;
      const alpha = 1 - Math.exp(-timeDifference / (_minutes * 60 * 1000 * smoothingFactor)); // Convert smoothingFactor to 10-minute intervals
      ema = data[i].close * alpha + ema * (1 - alpha);
    }
    return ema;
  }
  
  // Function to predict potential price change within the next hour using EMA
  function predictPriceChange(ohlcvData) {
    // Clone the OHLCV data to avoid modifying the original data
    // Clone the OHLCV data to avoid modifying the original data
    const clonedData = ohlcvData.slice();

    // Calculate the EMA for the historical data within the past 30 minutes
    const lastTimestamp = clonedData[clonedData.length - 1].time;
    const thirtyMinutesAgo = lastTimestamp - (_minutes * 60 * 1000);
    const dataWithinThirtyMinutes = clonedData.filter(data => data.time >= thirtyMinutesAgo);
    const ema = calculateEMA(dataWithinThirtyMinutes, smoothingFactor);

    // Calculate the current price and the potential price change percentage in the next hour
    const currentPrice = clonedData[clonedData.length - 1].close;
    const predictedPriceChange = ema - currentPrice;
    const predictedPriceChangePercentage = ((ema - currentPrice) / currentPrice) * 100;
    let predictedChangeData = {
        predictedChange: predictedPriceChange,
        predictedChangePercentage: predictedPriceChangePercentage,
        originalPrice:currentPrice

    }
  
    return predictedChangeData;
  }





  const delay = ms => new Promise(res => setTimeout(res, ms));

const this_minute = async(pool) =>{
    let url = `https://api.geckoterminal.com/api/v2/networks/polygon_pos/pools//${pool}/ohlcv/minute?limit=1`
    let data 
    await axios.get(url)
        .then((result) =>{
            
            data = result.data.data.attributes.ohlcv_list
            
            
        })
        return data
}






const lastXMinutes = async() =>{
    let url = `https://api.geckoterminal.com/api/v2/networks/polygon_pos/pools//${pool}/ohlcv/minute?aggregate=1&limit=${_minutes}`
    let data 
    await axios.get(url)
        .then((result) =>{
            
            data = result.data.data.attributes.ohlcv_list
           
            
        })
        return data

        //48*12 = 756 can be accurate up to 5 minutes if needed
}

const round = (float) =>{
    
    float = parseFloat(float).toFixed(2)
    return(float)

}


    
main()
let runEveryX2minutes= setInterval(async () => { 
    
    main()
        

    
}, _minutes*2*60000)



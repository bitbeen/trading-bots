
const axios = require('axios')

let pool = "0xa9077cdb3d13f45b8b9d87c43e11bce0e73d8631"


const main = async() =>{
    var result
    var historicalDatas = []
    var time
    var pchangeData = {}

    
    
    var data = await last30Minutes(pool).then(async data =>{
       
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
        console.log(`Predicted potential price change in 30 mins ${round(result.predictedChange)}`);
        console.log(`Predicted potential price change% in 30 mins: ${round(result.predictedChangePercentage)}%`);
        console.log(`Original price: ${round(result.originalPrice)}`);
        console.log(`Potential new price: ${round(result.originalPrice + result.predictedChange)}`)
        console.log(`Run at: ${new Date()}`);
        pchangeData = {
            prChange
        }

    })
    //const transactionReceipt = await provider.waitForTransaction(transaction.hash).then(

    //make the objects then 
    console.log(`Predicted potential price change in 30 mins ${round(result.predictedChange)}`);
    console.log(`Predicted potential price change% in 30 mins: ${round(result.predictedChangePercentage)}%`);
    console.log(`Original price: ${round(result.originalPrice)}`);
    console.log(`Potential new price: ${round(result.originalPrice + result.predictedChange)}`)
    console.log(`Run at: ${new Date()}`);


    await delay(1800000); //3600000
    let _data = await this_minute(pool).then(async _data =>{
        newPrice = _data[0][4]
    })
    time = new Date()
    console.log(`Actual new price: ${round(newPrice)}`)
    console.log(`Actual price change: ${round(newPrice - result.originalPrice)}`)
    console.log(`Actual price% change: ${round((newPrice - result.originalPrice)/result.originalPrice*100)}%`)
    console.log(`Run at: ${new Date()}`);


    

    

}






const runEMACalc = async(historicalData) =>{
    // Call the function with a smoothing factor (0.2 is a common choice) and log the predicted potential price change
const smoothingFactor = 0.25;
const predictedChangeData = predictPriceChange(historicalData, smoothingFactor);

 return predictedChangeData
   
}



// Function to calculate the Exponential Moving Average (EMA) for a given dataset
function calculateEMA(data, smoothingFactor) {
    let ema = data[0].close;
    for (let i = 1; i < data.length; i++) {
      const timeDifference = data[i].time - data[i - 1].time;
      const alpha = 1 - Math.exp(-timeDifference / (30 * 60 * 1000 * smoothingFactor)); // Convert smoothingFactor to 10-minute intervals
      ema = data[i].close * alpha + ema * (1 - alpha);
    }
    return ema;
  }
  
  // Function to predict potential price change within the next hour using EMA
  function predictPriceChange(ohlcvData, smoothingFactor) {
    // Clone the OHLCV data to avoid modifying the original data
    // Clone the OHLCV data to avoid modifying the original data
    const clonedData = ohlcvData.slice();

    // Calculate the EMA for the historical data within the past 30 minutes
    const lastTimestamp = clonedData[clonedData.length - 1].time;
    const thirtyMinutesAgo = lastTimestamp - (30 * 60 * 1000);
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






const last30Minutes = async() =>{
    let url = `https://api.geckoterminal.com/api/v2/networks/polygon_pos/pools//${pool}/ohlcv/minute?aggregate=1&limit=30`
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
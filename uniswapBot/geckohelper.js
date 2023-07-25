//convert results to match historical data
//get hourly data from the last 2days

const axios = require('axios')

let pool = "0xa9077cdb3d13f45b8b9d87c43e11bce0e73d8631"


const main = async() =>{
    var result
    var historicalDatas = []
    var time
    
    
    var data = await last60Minutes(pool).then(async data =>{
        console.log(data)
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

    })
    //const transactionReceipt = await provider.waitForTransaction(transaction.hash).then(
    console.log(`Predicted potential price change% in the next 10 minutes hour: ${round(result.predictedChange)}`);
    console.log(`Predicted potential price change% in the next 1 hour: ${round(result.predictedChangePercentage)}%`);
    console.log(`Original price: ${round(result.originalPrice)}`);
    console.log(`Potential new price: ${round(result.originalPrice + result.predictedChange)}`)
    console.log(`Run at: ${time}`);

    

}






const runEMACalc = async(historicalData) =>{
    // Call the function with a smoothing factor (0.2 is a common choice) and log the predicted potential price change
const smoothingFactor = 0.27;
const predictedChangeData = predictPriceChangeWithinHour(historicalData, smoothingFactor);

 return predictedChangeData
   
}



// Function to calculate the Exponential Moving Average (EMA) for a given dataset
function calculateEMA(data, smoothingFactor) {
    let ema = data[0].close;
    for (let i = 1; i < data.length; i++) {
      const timeDifference = data[i].time - data[i - 1].time;
      const alpha = 1 - Math.exp(-timeDifference / (60 * 1000 * smoothingFactor)); // Convert smoothingFactor to 1-minute intervals
      ema = data[i].close * alpha + ema * (1 - alpha);
    }
    return ema;
  }
  
  // Function to predict potential price change within the next hour using EMA
  function predictPriceChangeWithinHour(ohlcvData, smoothingFactor) {
    // Clone the OHLCV data to avoid modifying the original data
    const clonedData = ohlcvData.slice();

    // Calculate the EMA for the historical data within the past hour
    const lastTimestamp = clonedData[clonedData.length - 1].time;
    const oneHourAgo = lastTimestamp - (60 * 60 * 1000);
    const dataWithinOneHour = clonedData.filter(data => data.time >= oneHourAgo);
    const ema = calculateEMA(dataWithinOneHour, smoothingFactor);

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


function _calculateEMA(data, smoothingFactor) {
    let ema = data[0].close;
    console.log(ema)
    for (let i = 1; i < data.length; i++) {
      ema = data[i].close * smoothingFactor + ema * (1 - smoothingFactor);
    }
    return ema;
  }
  
// Function to predict potential price change in the next 1 hour using EMA
function predictPriceChangeEMA(historicalData, smoothingFactor) {
// Convert time strings to Date objects for time calculations
const parsedData = historicalData.map(item => ({
    ...item,
    time: new Date(item.time)
}));

// Calculate the time difference in milliseconds between data points
const timeInterval = parsedData[1].time - parsedData[0].time;

// Calculate the EMA for the historical data
const ema = calculateEMA(parsedData, smoothingFactor);

// Predict the potential price change in the next 1 hour (3600000 milliseconds)
const predictedPriceChange = ema * 3600000;

return predictedPriceChange;
}

/*
const historicalData = [
    { time: "2023-07-15 00:00:00", close: 100 },
    { time: "2023-07-15 01:00:00", close: 110 },
    { time: "2023-07-15 02:00:00", close: 120 },
    // ... Add more historical data ...
  ];*/





const get = async(pool) =>{
    let url = `https://api.geckoterminal.com/api/v2/networks/polygon_pos/pools/${pool}/ohlcv/day`
    let data 
    await axios.get(url)
        .then((result) =>{
            
            data = result.data.data.attributes.ohlcv_list
            
            
        })
        return data
}


const get_recent_days = async(pool) =>{
    let url = `https://api.geckoterminal.com/api/v2/networks/polygon_pos/pools/${pool}/ohlcv/day?limit=7`
    let data 
    await axios.get(url)
        .then((result) =>{
            
            data = result.data.data.attributes.ohlcv_list
            
            
        })
        return data
}

const this_minute = async() =>{
    let url = `https://api.geckoterminal.com/api/v2/networks/polygon_pos/pools//${pool}/ohlcv/minute?limit=5`
    let data 
    await axios.get(url)
        .then((result) =>{
            
            data = result.data.data.attributes.ohlcv_list
            
            
        })
        return data
}


const last10DaysByHour = async() =>{
    let url = `https://api.geckoterminal.com/api/v2/networks/polygon_pos/pools//${pool}/ohlcv/hour?aggregate=1&limit=240`
    let data 
    await axios.get(url)
        .then((result) =>{
            
            data = result.data.data.attributes.ohlcv_list
            
            
        })
        return data
}

const last2DaysByHour = async() =>{
    let url = `https://api.geckoterminal.com/api/v2/networks/polygon_pos/pools//${pool}/ohlcv/hour?aggregate=1&limit=48`
    let data 
    await axios.get(url)
        .then((result) =>{
            
            data = result.data.data.attributes.ohlcv_list
            
            
        })
        return data

        //48*12 = 756 can be accurate up to 5 minutes if needed
}

const last60Minutes = async() =>{
    let url = `https://api.geckoterminal.com/api/v2/networks/polygon_pos/pools//${pool}/ohlcv/minute?aggregate=1&limit=60`
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
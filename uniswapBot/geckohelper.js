//convert results to match historical data
//get hourly data from the last 2days

const axios = require('axios')

let pool = "0x495b3576e2f67fa870e14d0996433fbdb4015794"

const main = async() =>{
    // Call the function with a smoothing factor (0.2 is a common choice) and log the predicted potential price change
const smoothingFactor = 0.2;
const predictedChange = predictPriceChangeEMA(historicalData, smoothingFactor);
console.log(`Predicted potential price change in the next 1 hour: ${predictedChange}`);
 
   
}

function calculateEMA(data, smoothingFactor) {
    let ema = data[0].close;
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


const get_recent_hours = async() =>{
    let url = `https://api.geckoterminal.com/api/v2/networks/polygon_pos/pools//${pool}/ohlcv/hour?aggregate=1&limit=6`
    let data 
    await axios.get(url)
        .then((result) =>{
            
            data = result.data.data.attributes.ohlcv_list
            
            
        })
        return data
}



main()
const { geckoTestExport } = require('./csvhelper')
const axios = require('axios')
const { makeTrade } = require('./tradehelpers')

//let pool = "0x98b9162161164de1ed182a0dfa08f5fbf0f733ca"
//let _minutes = 60 //[10,30,60]

const smoothingFactor = 0.2;



exports.geckoPredict = async(pool,_minutes,pairName) =>{
    var result
    var historicalDatas = []
    var time
    var changeData = {}
    let filename = "gecko_test_" + pairName + "_" + _minutes + "mins_" + smoothingFactor + "smF.csv"

    console.log(`${_minutes} minutes - GECKO TEST`)
    
    var data = await lastXMinutes(pool,_minutes).then(async data =>{
       
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
        result = await runEMACalc(historicalDatas,_minutes)
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
        }else if (changeData.makeTrade==false){
            changeData.tradetestResult = "No trade"
        }else{
            changeData.tradetestResult = "Something wrong"
        }
        geckoTestExport(filename,changeData)
        return(changeData)

        //console.log(changeData)
       


    })
    return(changeData)
    

    

    

    

}






const runEMACalc = async(historicalData,_minutes) =>{
    // Call the function with a smoothing factor (0.2 is a common choice) and log the predicted potential price change

const predictedChangeData = predictPriceChange(historicalData,_minutes);

 return predictedChangeData
   
}



// Function to calculate the Exponential Moving Average (EMA) for a given dataset
function calculateEMA(data,_minutes) {
    let ema = data[0].close;
    for (let i = 1; i < data.length; i++) {
      const timeDifference = data[i].time - data[i - 1].time;
      // Volume-Based Weighting: Increase the smoothing factor based on volume
        //const volumeFactor = data[i].volume / 1000; // Normalize volume by dividing by a suitable factor (e.g., 1000)
        //const adjustedSmoothingFactor = smoothingFactor + (smoothingFactor * volumeFactor * 0.1); // Modify the factor as per preference
      //const alpha = 1 - Math.exp(-timeDifference / (60 * 1000 * adjustedSmoothingFactor)); // Convert smoothingFactor to 10-minute intervals (_minutes * 60 * 1000 * smoothingFactor)
      
      const alpha = 1 - Math.exp(-timeDifference / (_minutes * 60 * 1000 * smoothingFactor))
      ema = data[i].close * alpha + ema * (1 - alpha);
    }
    return ema;
  }
  
  // Function to predict potential price change within the next hour using EMA
  function predictPriceChange(ohlcvData,_minutes) {
    // Clone the OHLCV data to avoid modifying the original data
    // Clone the OHLCV data to avoid modifying the original data
    const clonedData = ohlcvData.slice();

    // Calculate the EMA for the historical data within the past 30 minutes
    const lastTimestamp = clonedData[clonedData.length - 1].time;
    const thirtyMinutesAgo = lastTimestamp - (_minutes * 60 * 1000);
    const dataWithinThirtyMinutes = clonedData.filter(data => data.time >= thirtyMinutesAgo);
    const ema = calculateEMA(dataWithinThirtyMinutes,_minutes);

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






const lastXMinutes = async(pool,_minutes) =>{
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

/*
    
main()
let runEveryX+5minutes= setInterval(async () => { 
    
    main()
        

    
}, _minutes+60000)

*/

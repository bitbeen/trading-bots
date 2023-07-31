const axios = require('axios')

let pool = "0x495b3576e2f67fa870e14d0996433fbdb4015794"

const main = async() =>{

    let days = 7
    let last7Days = await get_recent_days(pool)
    let sum7Days = 0
    

    /*LAST 7 DAYS */
    console.log("last 7 days list")
    for (result in last7Days){
        var date = new Date(last7Days[result][0]*1000)
        var close = last7Days[result][4]
        console.log(date)
        console.log(close)
        sum7Days = sum7Days + close
   


    }

    let average7Days = sum7Days / last7Days.length

   
    
   

    let last6Hours = await get_recent_hours(pool)
    let sum6Hours = 0
    

    /*LAST 7 DAYS */
    console.log("last 6 hours list")
    for (result in last6Hours){
        var date = new Date(last6Hours[result][0]*1000)
        var close = last6Hours[result][4]
        console.log(date)
        console.log(close)
        sum6Hours = sum6Hours + close
   


    }
    let average6Hours = sum6Hours/ last6Hours.length

    let last10Days = await last10DaysByHour(pool)
    let sum10Days = 0
    let closes = []
    for (result in last10Days){
        //var date = new Date(last6Hours[result][0]*1000)
        var close = last10Days[result][4]
        //console.log(close)
        sum10Days = sum10Days + close
        closes.push(close)
   


    }
    
    let average10Days = sum10Days/ last10Days.length
    
    

    let minute = await this_minute(pool)
    var date = new Date(minute[0][0]*1000)
    var close = minute[0][4]
    
    console.log("7 day average",average7Days)
    console.log("6 hour average",average6Hours)
    console.log("last 10 days", average10Days)
    console.log("max 10 days", Math.max(...closes))
    console.log("max 10 days % diff", ( ( Math.max(...closes) - average10Days )/average10Days) * 100)
    console.log("min 10 days", Math.min(...closes))
    console.log("min 10 days % diff", ((average10Days - Math.min(...closes)) )/Math.min(...closes) * 100)
    console.log("current price",close)
   
}


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

/*
const post = async() =>{

    URL = ""
    let data
    await axios.post(URL, {query: query})
        .then((result) =>{
            
            data= result
            
            
        })
        return data
}*/

main()
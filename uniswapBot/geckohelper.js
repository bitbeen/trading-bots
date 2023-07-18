const axios = require('axios')

let pool = "0xd90d522211f7a887fd833ececed83a3019e0fc6c"

const main = async() =>{

    let days = 7
    let get_result = await get_recent_days(pool)
    let sum = 0
    let average = 0
   
    for (result in get_result.slice(get_result.length-days)){
        var date = new Date(get_result[result][0]*1000)
        var close = get_result[result][4]
        console.log(date)
        console.log(close)
        /*
        console.log(get_result[result][0]) //timestamp
        console.log(get_result[result][1]) //open
        console.log(get_result[result][2]) //low
        console.log(get_result[result][3]) //high
        console.log(get_result[result][4])//close 
        console.log(get_result[result][5])//volume*/
        sum = sum + close



    }

    average = sum / days
    console.log("average",average)
    //let post_result = await post()
    //console.log(post_result)

    let minute = await this_minute(pool)
    var date = new Date(minute[0][0]*1000)
    var close = minute[0][4]
    console.log(date)
    console.log(close)
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
    let url = `https://api.geckoterminal.com/api/v2/networks/polygon_pos/pools/${pool}/ohlcv/day`
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
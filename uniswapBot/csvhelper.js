const fs = require("fs");
var csvWriter = require('csv-write-stream');






exports.csvWriteFullTrade = async (file,tradeData) => {
   
    writer = csvWriter({sendHeaders: false});
    writer.pipe(fs.createWriteStream(file, {flags: 'a'}));
    writer.write(tradeData);
    writer.end();
    //append a new trade


}

exports.jsonWriteInitTrade = async (file,tradeData) => {
    fs.writeFileSync(file, JSON.stringify(tradeData));
    console.log("initial trade written to JSON")


}

exports.jsonReadInitTrade = async (file) => {
    let rawDataTrade = fs.readFileSync(file);
    let jsonTrade = JSON.parse(rawDataTrade);
    
    
    return(jsonTrade)

}




exports.jsonExists = async (file) => {
   

    if (fs.existsSync(file)) {
        console.log("file exists")
        //file exists
    }else{
        fs.writeFileSync(file, JSON.stringify([]));
        console.log("file created")
        return
    }
    
    
    


}

exports.jsonReadTrades = async (file) => {
   

    let rawdataTrades = fs.readFileSync(file);
    let jsonTrades = JSON.parse(rawdataTrades);
    //console.log(jsonTrades);

    return(jsonTrades)


}








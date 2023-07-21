const fs = require("fs");

var csvWriter = require('csv-write-stream');
var writer = csvWriter({sendHeaders: false}); //Instantiate var
var csvFilename = "./trades/july.csv";


exports.csvOutPutArb = async (finalTradeData) => {
    var csvFilename = "./trades/arbitrage.csv";

    //Start Date,End Date,Amount In,Amount Out,Profit,Total Gas Cost,Profit After Gas
    writer = csvWriter({sendHeaders: false});
    writer.pipe(fs.createWriteStream(csvFilename, {flags: 'a'}));
    writer.write({
        pair: finalTradeData.pair,
        start: finalTradeData.start,
        end: finalTradeData.end,
        in: finalTradeData.in,
        out:finalTradeData.out,
        profit:finalTradeData.profit,
        gasCost:finalTradeData.gasCost,
        profitAfterGas: finalTradeData.profitAfterGas,
        type: "arbitrage"

    });
writer.end();



}


exports.csvOutPutOpen= async (initTradeData) => {
    var csvFilename = "./trades/open.csv";

    //Start Date,End Date,Amount In,Amount Out,Profit,Total Gas Cost,Profit After Gas
    writer = csvWriter({sendHeaders: false});
    writer.pipe(fs.createWriteStream(csvFilename, {flags: 'a'}));
    writer.write({
        pair: initTradeData.pair,
        start: initTradeData.start,
        end: 0,
        in: initTradeData.in,
        out: 0,
        profit:0,
        gasCost:initTradeData.gasCost,
        profitAfterGas: 0,
        type: "simple open"
    });
writer.end();



}


exports.csvOutPutClosed = async (finalTradeData) => {
    var csvFilename = "./trades/closed.csv";

    //Start Date,End Date,Amount In,Amount Out,Profit,Total Gas Cost,Profit After Gas
    writer = csvWriter({sendHeaders: false});
    writer.pipe(fs.createWriteStream(csvFilename, {flags: 'a'}));
    writer.write({
        pair: finalTradeData.pair,
        start: finalTradeData.start,
        end: finalTradeData.end,
        in: finalTradeData.in,
        out:finalTradeData.out,
        profit:finalTradeData.profit,
        gasCost:finalTradeData.gasCost,
        profitAfterGas: finalTradeData.profitAfterGas,
        type: "simple closed"

    });
writer.end();



}
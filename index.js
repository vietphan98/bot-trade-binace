const ccxt = require("ccxt");
const moment = require("moment");
const delay = require('delay')
 const bb = require('trading-indicator').bb
  const binance = new ccxt.binance({
        apiKey : 'LqE8ynLONeG4hCtScdGyVzLWNcjwWxiesizBkyyRDxhHs6BtCHAii6xNYNaBZcI1',
        secret: 'oCxbfd13eUxwDPizE3joefHM7Kn8Ix1kwEqGEisYWjK6aciV7xUkQk5Wv5OT5vDl',
          enableRateLimit: true,
            options: {
                defaultType: 'future',
            },
    });

async function printBalance(){
    const balance = await binance.fetchBalance();
    const total = balance.total;
    
    console.log(`Tổng giá trị tài sản :${(total.BUSD) + (total.USDT)}\n`)
}

let order = [];

async function Tick(coin,volcoin){
    const prices = await binance.fetchOHLCV(`${coin}/USDT`,'15m',undefined,5)
     console.log(prices)
    const bPrices = prices.map(price => {
        return{
            timestamp : moment(price[0]).format(),
            open : price[1],
            high : price[2],
            low : price[3],
            close : price [4],
            volume : price[5]
        }
    })

   
     let bbData_BTC = await bb(21, 2, "close", "binance", `${coin}/USDT`, "1h", true)


    let entryLow = (bbData_BTC[bbData_BTC.length - 2].lower).toFixed(1);


    let entryHigh = (bbData_BTC[bbData_BTC.length - 2].upper).toFixed(1);


    let lastPrice = (bPrices[bPrices.length -1].close).toFixed(1);

    let paramsL = {
        'positionSide': 'LONG',
    }
    let paramsS = {
        'positionSide': 'SHORT',
    }
 

    let stoplossPriceLong =  Number(lastPrice) - Number(lastPrice)*2/100

    let tPPriceLong  =    Number(lastPrice) + Number(lastPrice)/100

    let stoplossPriceShort =   Number(lastPrice) + Number(lastPrice)*2/100

    let tPPriceShort  =   Number(lastPrice) - Number(lastPrice)/100

    let ParamSLLong  = {
        'positionSide': 'LONG',
        'stopPrice' : stoplossPriceLong,
    }
   
   
    let ParamTpLong  = {
        'positionSide': 'LONG',
        'stopPrice' : tPPriceLong
    }
   
 

    let ParamSLShort  = {
        'positionSide': 'SHORT',
        'stopPrice' : stoplossPriceShort
    }
    let ParamTpShort  = {
        'positionSide': 'SHORT',
        'stopPrice' : tPPriceShort
    }
    
    
  
    console.log(`Gia cuoi cung BTC : ${lastPrice} . | gia cal tren : ${entryHigh} | gia cal duoi : ${entryLow}`)

 
   
    if(lastPrice> entryHigh && lastPrice > entryLow ){
        let checkO = await binance.fetchOpenOrders(`${coin}/BUSD`);
        console.log(checkO.length)
        if(checkO.length > 0){
            for(let j = 0 ; j < checkO.length;j++){
                await binance.cancelOrder(checkO[j].id,`${coin}/BUSD`)
            }
        }
       
    //   let  canceled = await binance.cancelOrders(`${coin}/BUSD`)
    //   console.log(canceled)
        order = await binance.createOrder(`${coin}/BUSD`, 'market', 'buy',volcoin,lastPrice,paramsL)
            await binance.createOrder(`${coin}/BUSD`,'STOP_MARKET','sell',volcoin,null,ParamSLLong)
            await binance.createOrder(`${coin}/BUSD`,'TAKE_PROFIT_MARKET','sell',volcoin,null,ParamTpLong)
        console.log(`${moment().format()} : long ở giá ${lastPrice} | stoploss : ${stoplossPriceLong} | tp: ${tPPriceLong} `)
    }else if(lastPrice < entryHigh && lastPrice > entryLow){
        let valH = entryHigh - lastPrice ;
        let valL = lastPrice - entryLow ;
        if(valH > valL){
            let checkO = await binance.fetchOpenOrders(`${coin}/BUSD`);
            if(checkO.length > 0){
                for(let j = 0 ; j < checkO.length;j++){
                    console.log(checkO[j])
                    await binance.cancelOrder(checkO[j].id,`${coin}/BUSD`)
                }
            }
            
    //         let  canceled = await binance.cancelOrders(`${coin}/BUSD`)
    //   console.log(canceled)
         order = await binance.createOrder(`${coin}/BUSD`, 'market', 'buy',volcoin,lastPrice,paramsL)
            await binance.createOrder(`${coin}/BUSD`,'STOP_MARKET','sell',volcoin,null,ParamSLLong)
            await binance.createOrder(`${coin}/BUSD`,'TAKE_PROFIT_MARKET','sell',volcoin,null,ParamTpLong)
        
        console.log(`${moment().format()} : long ở giá ${lastPrice} | stoploss : ${stoplossPriceLong} | tp: ${tPPriceLong} `)
        }else{
            let checkO = await binance.fetchOpenOrders(`${coin}/USDT`);
            if(checkO.length > 0){

            for(let j = 0 ; j < checkO.length;j++){
                await binance.cancelOrder(checkO[j].id,`${coin}/USDT`)
            }
        }
           order = await binance.createOrder(`${coin}/USDT`, 'market', 'sell',volcoin,lastPrice,paramsS)
            await binance.createOrder(`${coin}/USDT`,'STOP_MARKET','buy',volcoin,null,ParamSLShort)
            await binance.createOrder(`${coin}/USDT`,'TAKE_PROFIT_MARKET','buy',volcoin,null,ParamTpShort)
          
          console.log(`${moment().format()} : short ở giá ${lastPrice} | stoploss : ${stoplossPriceShort} | tp: ${tPPriceShort} `)
        }
    }else{
        let checkO = await binance.fetchOpenOrders(`${coin}/USDT`);
        if(checkO.length > 0){

        for(let j = 0 ; j < checkO.length;j++){
            await binance.cancelOrder(checkO[j].id,`${coin}/USDT`)
        }
    }
         order = await binance.createOrder(`${coin}/USDT`, 'market', 'sell',volcoin,lastPrice,paramsS)
            await binance.createOrder(`${coin}/USDT`,'STOP_MARKET','buy',volcoin,null,ParamSLShort)
            await binance.createOrder(`${coin}/USDT`,'TAKE_PROFIT_MARKET','buy',volcoin,null,ParamTpShort)
        console.log(`${moment().format()} : short ở giá ${lastPrice} | stoploss : ${stoplossPriceShort} | tp: ${tPPriceShort} `)
    }

  
    printBalance()
}

async function main(){
    while (true){
            await Tick('BTC',0.001);
             await Tick('ETH',0.015);
             await Tick('BNB',0.1);
             await Tick('LTC',0.3);
             await Tick('LINK',4);
             await Tick('AVAX',2);
             await Tick('ETC',2);
            await delay(300 * 1000)
    }
    
}

// async function main1(){
//     const order = await binance.fetchPosition('BTC/USDT',{type: 'future'});
//     console.log(order)
// }

main()
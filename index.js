const ccxt = require("ccxt");
const bb = require('trading-indicator').bb
const rsiA = require('trading-indicator').rsi
const ema = require('trading-indicator').ema
const macd_ = require('trading-indicator').macd
  const binance = new ccxt.binance({
        apiKey : 'LqE8ynLONeG4hCtScdGyVzLWNcjwWxiesizBkyyRDxhHs6BtCHAii6xNYNaBZcI1',
        secret: 'oCxbfd13eUxwDPizE3joefHM7Kn8Ix1kwEqGEisYWjK6aciV7xUkQk5Wv5OT5vDl',
          enableRateLimit: true,
            options: {
                defaultType: 'future',
                timeout: 30000,

            },
    });

async function printBalance(){
    const balance = await binance.fetchBalance();
    const total = balance.total;
    console.log(`Tổng giá trị tài sản :${(total.BUSD)}\n`)
}

let order = [];

async function Tick(coin,volcoin){
    const prices = await binance.fetchOHLCV(`${coin}/USDT`,'1m',undefined,1)
    let lastPrice = prices[0][4]

    let emaData = await ema(99, "close", "binance", `${coin}/USDT`, "15m", true)
    let macdData = await macd_(12, 26, 9, "close", "binance", `${coin}/USDT`, "15m", true);
    let rsiData = await rsiA(14, "close", "binance", `${coin}/USDT`, "15m", true)
    let bbData_BTC = await bb(21, 2, "close", "binance", `${coin}/USDT`, "15m", true)
   
    let entryLow = (bbData_BTC[bbData_BTC.length - 2].lower);
    let entryMiD = (bbData_BTC[bbData_BTC.length - 2].middle);
    let entryHigh = (bbData_BTC[bbData_BTC.length - 2].upper);

    let paramsL = {
        'positionSide': 'LONG',
    }
    let paramsS = {
        'positionSide': 'SHORT',
    }
 
        console.log(`Gia cuoi cung ${coin} , đang tìm điềm vào lệnh: ${lastPrice}`)
        let currentPrice = lastPrice;
        let ema100 = emaData[emaData.length - 1];
        let upperBB = entryHigh;
        let lowerBB = entryLow;
        let rsi = rsiData[rsiData.length - 1];
        let macd = macdData[macdData.length -1].MACD;

         //xu hướng tăng 
         if(currentPrice > ema100 && upperBB > ema100 && lowerBB > ema100){
            if(rsi < 30 ){
                if(currentPrice < lowerBB){
                           let checkO = await binance.fetchOpenOrders(`${coin}/BUSD`);
                        if(checkO.length <= 1){
                                for(let j = 0 ; j < checkO.length;j++){
                                        await binance.cancelOrder(checkO[j].id,`${coin}/BUSD`)
                                }
                            order = await binance.createOrder(`${coin}/BUSD`, 'market', 'buy',volcoin,lastPrice,paramsL)
                            if(lastPrice > (Number(entryLow) - Number(entryLow)*0.2/100)){
                                await binance.createOrder(`${coin}/BUSD`,'STOP_MARKET','sell',volcoin,null,{
                                    'positionSide': 'LONG',
                                    'stopPrice' :  Number(entryLow) - Number(entryLow)*0.2/100,
                                })
                            }
                            if(lastPrice <= entryMiD){
                                await binance.createOrder(`${coin}/BUSD`,'TAKE_PROFIT_MARKET','sell',volcoin,null,{
                                    'positionSide': 'LONG',
                                    'stopPrice' : entryMiD
                                })
                            }
                        }else{
                            console.log('đã có vị thế long')
                        }
                  console.log('Buy');
                }
            }
         } else if(currentPrice < ema100 && upperBB <  ema100 && lowerBB < ema100){
            if(rsi > 70 ){
                if(currentPrice > upperBB){
                           let checkO = await binance.fetchOpenOrders(`${coin}/USDT`);
            if( checkO.length <= 1){
                for(let j = 0 ; j < checkO.length;j++){
                            await binance.cancelOrder(checkO[j].id,`${coin}/USDT`)
                }
                order = await binance.createOrder(`${coin}/USDT`, 'market', 'sell',volcoin,lastPrice,paramsS)
                if(lastPrice < (Number(entryHigh) + Number(entryHigh)*0.2/100)){
                await binance.createOrder(`${coin}/USDT`,'STOP_MARKET','buy',volcoin,null,{
                    'positionSide': 'SHORT',
                    'stopPrice' :  (Number(entryHigh) + Number(entryHigh)*0.2/100),
                })
                }
                if(lastPrice >= entryMiD){
                    await binance.createOrder(`${coin}/USDT`,'TAKE_PROFIT_MARKET','buy',volcoin,null,{
                        'positionSide': 'SHORT',
                        'stopPrice' : entryMiD,
                    })
                }
                }else{
                    console.log('đã có vị thế short')
                }
                console.log('Sell');
                }
            }
         } else if(currentPrice > ema100 && upperBB > ema100 && lowerBB < ema100){
            // kiểm tra đường trung bình
            if(rsi > 50 && rsi < 70){
                // kiểm tra đường trung bình BB và ema100
                if(entryMiD > ema100 ){
                    if(currentPrice > entryMiD){
                        if(macd > 0){
                            // kiểm tra giá hiện tại tới high và mid
                            let valH = entryHigh - currentPrice;
                            let valL = currentPrice - entryMiD
                            if(valH > valL){
                                let checkO = await binance.fetchOpenOrders(`${coin}/BUSD`);
                                        if(checkO.length <= 1){
                                                for(let j = 0 ; j < checkO.length;j++){
                                                        await binance.cancelOrder(checkO[j].id,`${coin}/BUSD`)
                                                }
                                            order = await binance.createOrder(`${coin}/BUSD`, 'market', 'buy',volcoin,lastPrice,paramsL)
                                            if(lastPrice > (Number(entryMiD) - Number(entryMiD)*0.2/100)){
                                                await binance.createOrder(`${coin}/BUSD`,'STOP_MARKET','sell',volcoin,null,{
                                                    'positionSide': 'LONG',
                                                    'stopPrice' : Number(entryMiD) - Number(entryMiD)*0.2/100
                                                })
                                            }
                                            if(lastPrice <= entryHigh){
                                                await binance.createOrder(`${coin}/BUSD`,'TAKE_PROFIT_MARKET','sell',volcoin,null,{
                                                    'positionSide': 'LONG',
                                                    'stopPrice' : entryHigh
                                                })
                                            }
                                        }else{
                                            console.log('đã có vị thế long')
                                        }
                                    console.log('Buy');
                            }
                     
                        }
                    }
                }
            }
         }else if(currentPrice < ema100 && upperBB > ema100 && lowerBB < ema100){
             if(rsi < 40 && rsi > 30){
                if(entryMiD < ema100){
                    if(currentPrice < entryMiD){
                        if(macd < 0){
                            let valH = entryMiD - currentPrice;
                            let valL = currentPrice - entryLow
                            if(valH < valL){
                                let checkO = await binance.fetchOpenOrders(`${coin}/USDT`);
                                if( checkO.length <= 1){
                                    for(let j = 0 ; j < checkO.length;j++){
                                                await binance.cancelOrder(checkO[j].id,`${coin}/USDT`)
                                    }
                                    order = await binance.createOrder(`${coin}/USDT`, 'market', 'sell',volcoin,lastPrice,paramsS)
                                    if(lastPrice < Number(entryMiD) + Number(entryMiD)*0.2/100){
                                    await binance.createOrder(`${coin}/USDT`,'STOP_MARKET','buy',volcoin,null,{
                                        'positionSide': 'SHORT',
                                        'stopPrice' : Number(entryMiD) + Number(entryMiD)*0.2/100,
                                    })
                                    }
                                    if(lastPrice >= entryLow){
                                        await binance.createOrder(`${coin}/USDT`,'TAKE_PROFIT_MARKET','buy',volcoin,null,{
                                            'positionSide': 'SHORT',
                                            'stopPrice' : entryLow,
                                        })
                                    }
                                    }else{
                                        console.log('đã có vị thế short')
                                    }
                                    console.log('Sell');
                            }
                                  
                        }
                    }
                }
             }
         }
    printBalance()
}

async function main(){
    while (true){
          
            await Tick('BTC',0.002);
            await Tick('ETH',0.10);
            await Tick('BNB',0.2);
            await Tick('LTC',1);
            await Tick('LINK',10);
            await Tick('AVAX',4);
            await Tick('UNI',10);
            await Tick('GMT',250);
            await Tick('APE',15);
            await Tick('NEAR',35);
            await Tick('ICP',10);
            await Tick('CVX',15);
            await Tick('FIL',15);
            await Tick('DOT',15);
            await Tick('APT',15);
            await Tick('TRX',1000);
            await Tick('DOGE',750);
            await Tick('MATIC',60);
            await Tick('GALA',2500);
            await Tick('NEAR',30);
            await Tick('SAND',125);
    }
    
}
main()

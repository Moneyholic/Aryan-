const fs = require('fs');
let code = fs.readFileSync('bot_extracted.js', 'utf8');

const oldProcessHistoricalCandle = `    function processHistoricalCandle(candleData) {
        const cVal = parseFloat(candleData.close || candleData.c);
        if (isNaN(cVal)) return;

        const oVal = parseFloat(candleData.open || candleData.o || cVal);
        const hVal = parseFloat(candleData.high || candleData.h || cVal);
        const lVal = parseFloat(candleData.low || candleData.l || cVal);
        
        let tVal = candleData.time || candleData.t;
        if (tVal > 10000000000) tVal = Math.floor(tVal / 1000); 
        if (!tVal) tVal = Math.floor(Date.now()/1000) - (state.candles.length * 60);

        const c = { time: tVal, open: oVal, high: hVal, low: lVal, close: cVal };
        
        if (state.candles.length > 0 && c.time <= state.candles[state.candles.length - 1].time) return; 

        state.candles.push(c);
        if (state.candles.length > 150) state.candles.shift();
        
        if (tvSeries) tvSeries.update(c);
        updateIndicators();
    }`;

const newProcessHistoricalCandle = `    function processHistoricalCandle(candleData) {
        const cVal = parseFloat(candleData.close || candleData.c);
        if (isNaN(cVal)) return;

        const oVal = parseFloat(candleData.open || candleData.o || cVal);
        const hVal = parseFloat(candleData.high || candleData.h || cVal);
        const lVal = parseFloat(candleData.low || candleData.l || cVal);
        
        let tVal = candleData.time || candleData.t;
        if (tVal > 10000000000) tVal = Math.floor(tVal / 1000); 
        if (!tVal) tVal = Math.floor(Date.now()/1000) - (state.candles.length * 60);

        // Aggregate into 1-minute candles
        const currentMinute = Math.floor(tVal / 60) * 60;
        
        if (state.candles.length > 0) {
            const lastCandle = state.candles[state.candles.length - 1];
            if (lastCandle.time === currentMinute) {
                lastCandle.close = cVal;
                lastCandle.high = Math.max(lastCandle.high, hVal);
                lastCandle.low = Math.min(lastCandle.low, lVal);
                if (tvSeries) tvSeries.update(lastCandle);
                updateIndicators();
                return;
            } else if (currentMinute < lastCandle.time) {
                return; // Ignore older candles
            }
        }

        const c = { time: currentMinute, open: oVal, high: hVal, low: lVal, close: cVal };
        state.candles.push(c);
        if (state.candles.length > 150) state.candles.shift();
        
        if (tvSeries) tvSeries.update(c);
        updateIndicators();
    }`;

if (code.includes(oldProcessHistoricalCandle)) {
    code = code.replace(oldProcessHistoricalCandle, newProcessHistoricalCandle);
    fs.writeFileSync('bot_extracted.js', code);
    console.log("Successfully updated processHistoricalCandle to aggregate 1m candles!");
} else {
    console.log("Could not find oldProcessHistoricalCandle!");
}

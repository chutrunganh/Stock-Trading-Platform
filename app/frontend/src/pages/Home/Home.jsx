import React, { useState } from 'react';
import Tables from './HomeComponents/Tables';
import CardGraph from './HomeComponents/CardGraph';
import TradingStatus from './HomeComponents/TradingStatus';
import Chart from './HomeComponents/Chart';
import './Home.css';

function Home() {
    const [selectedStock, setSelectedStock] = useState(null);

    return (
        <div className="home">
            <CardGraph />
            <TradingStatus />
            <Tables onStockSelect={setSelectedStock} selectedSymbol={selectedStock?.Symbol} />
            <Chart selectedStock={selectedStock} />
        </div>
    );
}

export default Home;

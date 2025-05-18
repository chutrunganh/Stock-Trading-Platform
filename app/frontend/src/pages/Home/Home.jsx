import React from 'react';
import Tables from './HomeComponents/Tables';
import CardGraph from './HomeComponents/CardGraph';
import TradingStatus from './HomeComponents/TradingStatus';
import Chart from './HomeComponents/Chart';
import './Home.css';

function Home() {
    return(
        <div className="home">
            <CardGraph />
            <TradingStatus />
            <Tables />
            <Chart />
        </div>
    );
}

export default Home;

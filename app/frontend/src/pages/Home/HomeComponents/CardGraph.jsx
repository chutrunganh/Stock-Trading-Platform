import React from 'react';
import './CardGraph.css';
import stockGif from '../../../assets/images/stock.gif';

function CardGraph(){    return(
        <div className="CardGraph">
            <img src="https://fakeimg.pl/400x300" alt="Placeholder" />
            <img src={stockGif} alt="Stock Animation" width="400" height="300" style={{ objectFit: 'contain' }} />
            <img src="https://fakeimg.pl/400x300" alt="Placeholder" />
        </div>
    );
}

export default CardGraph;
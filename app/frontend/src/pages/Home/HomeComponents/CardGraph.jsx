import React from 'react';
import './CardGraph.css';
import stockGif from '../../../assets/images/stock1.gif';
import PlaceHolderImage from '../../../assets/images/PlaceHolder.png';

function CardGraph(){    return(
        <div className="CardGraph">
            <img src={PlaceHolderImage} alt="Stock Animation" width="400" height="300" style={{ objectFit: 'contain' }} />
            <img src={PlaceHolderImage} alt="Stock Animation" width="400" height="300" style={{ objectFit: 'contain' }} />
            <img src={PlaceHolderImage} alt="Stock Animation" width="400" height="300" style={{ objectFit: 'contain' }} />
        </div>
    );
}

export default CardGraph;
import React from 'react';
import { Link } from 'react-router-dom';
        



function Tutorial(props) {
    return(
        <div className="tutorial-container">
            <h1 className="tutorial-title">Tutorial</h1>
            <div className="tutorial-content">
                <p>Welcome to the tutorial page! Here you can learn how to use the stock market simulator.</p>
                {/* <Link to="/home" className="home-link">Go to Home</Link> */}
            </div>
        </div>
    );
    
}

export default Tutorial;
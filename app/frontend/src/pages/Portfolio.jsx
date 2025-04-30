import React from 'react';
import { Link } from 'react-router-dom';




function Portfolio(props) {
    return(
        <div className="portfolio-container">
            <h1 className="portfolio-title">Portfolio</h1>
            <div className="portfolio-content">
                <p>Your portfolio details will be displayed here.</p>
                {/* <Link to="/trade" className="trade-link">Go to Trade</Link> */}
            </div>
        </div>
    );
    
}

export default Portfolio;
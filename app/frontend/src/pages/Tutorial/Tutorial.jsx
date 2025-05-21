import React, { useState } from 'react';
import Modal from '../../components/Modal';
import './Tutorial.css';

function Tutorial() {
    const [modalOpen, setModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState({
        title: '',
        content: ''
    });

    const strategies = {
        market: {
            title: "Market Orders - Lệnh thị trường",
            content: (
                <div className="order-content">
                    <section className="order-section">
                        <h3>Định nghĩa</h3>
                        <p>Market Order là lệnh giao dịch được thực hiện ngay lập tức với mức giá tốt nhất hiện có trên thị trường.</p>
                    </section>
                    <section className="order-section">
                        <h3>Đặc điểm</h3>
                        <ul>
                            <li>Thực hiện ngay lập tức</li>
                            <li>Ưu tiên tốc độ thực hiện</li>
                            <li>Không đảm bảo mức giá cụ thể</li>
                        </ul>
                    </section>
                    <section className="order-section">
                        <h3>Khi nào sử dụng</h3>
                        <ul>
                            <li>Muốn thực hiện giao dịch ngay lập tức</li>
                            <li>Cổ phiếu có tính thanh khoản cao</li>
                            <li>Thị trường ổn định</li>
                        </ul>
                    </section>
                </div>
            )
        },
        limit: {
            title: "Limit Orders - Lệnh giới hạn",
            content: (
                <div className="order-content">
                    <section className="order-section">
                        <h3>Định nghĩa</h3>
                        <p>Limit Order là lệnh đặt mua hoặc bán với một mức giá cụ thể do nhà đầu tư xác định.</p>
                    </section>
                    <section className="order-section">
                        <h3>Đặc điểm</h3>
                        <ul>
                            <li>Kiểm soát được giá giao dịch</li>
                            <li>Có thể không được thực hiện ngay</li>
                            <li>Bảo vệ nhà đầu tư khỏi biến động giá</li>
                        </ul>
                    </section>
                    <section className="order-section">
                        <h3>Khi nào sử dụng</h3>
                        <ul>
                            <li>Muốn kiểm soát giá mua/bán</li>
                            <li>Thị trường biến động mạnh</li>
                            <li>Có chiến lược giá cụ thể</li>
                        </ul>
                    </section>
                </div>
            )
        },
        portfolio: {
            title: "Portfolio Management - Quản lý danh mục",
            content: (
                <div className="order-content">
                    <section className="order-section">
                        <h3>Định nghĩa</h3>
                        <p>Portfolio Management là chiến lược quản lý và phân bổ vốn đầu tư vào nhiều loại cổ phiếu khác nhau.</p>
                    </section>
                    <section className="order-section">
                        <h3>Nguyên tắc cơ bản</h3>
                        <ul>
                            <li>Đa dạng hóa danh mục đầu tư</li>
                            <li>Phân bổ tài sản hợp lý</li>
                            <li>Cân bằng rủi ro và lợi nhuận</li>
                        </ul>
                    </section>
                    <section className="order-section">
                        <h3>Lợi ích</h3>
                        <ul>
                            <li>Giảm thiểu rủi ro</li>
                            <li>Tối ưu hóa lợi nhuận</li>
                            <li>Quản lý hiệu quả dòng tiền</li>
                        </ul>
                    </section>
                </div>
            )
        }
    };

    const handleStrategyClick = (strategyType) => {
        setModalContent(strategies[strategyType]);
        setModalOpen(true);
    };

    return (
        <div className="tutorial-container">
            <h1 className="tutorial-title">Getting Started with Stock Trading</h1>
            
            <div className="tutorial-sections">
                {/* Basic Section */}
                <section className="tutorial-section">
                    <h2>1. Understanding the Basics</h2>
                    <div className="tutorial-content">
                        <div className="tutorial-card">
                            <h3>What is Stock Trading?</h3>
                            <p>Stock trading involves buying and selling shares of publicly traded companies. When you buy a stock, you're purchasing a small ownership stake in a company.</p>
                        </div>
                        <div className="tutorial-card">
                            <h3>Key Terms to Know</h3>
                            <ul>
                                <li><strong>Stock/Share:</strong> A piece of ownership in a company</li>
                                <li><strong>Buy/Long:</strong> Purchasing shares expecting the price to rise</li>
                                <li><strong>Sell/Short:</strong> Selling shares expecting the price to fall</li>
                                <li><strong>Market Price:</strong> Current trading price of a stock</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* How to Trade Section */}
                <section className="tutorial-section">
                    <h2>2. How to Trade</h2>
                    <div className="tutorial-content">
                        <div className="tutorial-card">
                            <h3>Step-by-Step Guide</h3>
                            <div className="steps-container">
                                <div className="step">
                                    <div className="step-number">1</div>
                                    <div className="step-content">
                                        <h4>Create an Account</h4>
                                        <p>Sign up and get $100,000 in virtual money to start trading</p>
                                    </div>
                                </div>
                                <div className="step">
                                    <div className="step-number">2</div>
                                    <div className="step-content">
                                        <h4>Research Stocks</h4>
                                        <p>Browse available stocks and analyze their performance</p>
                                    </div>
                                </div>
                                <div className="step">
                                    <div className="step-number">3</div>
                                    <div className="step-content">
                                        <h4>Place Orders</h4>
                                        <p>Choose your stocks and execute trades at your preferred price</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Trading Strategies Section */}
                <section className="tutorial-section">
                    <h2>3. Trading Strategies</h2>
                    <div className="strategy-grid">
                        <div 
                            className="strategy-card clickable"
                            onClick={() => handleStrategyClick('market')}
                        >
                            <div className="strategy-icon">📈</div>
                            <h3>Market Orders</h3>
                            <p>Buy or sell stocks immediately at the current market price</p>
                            <span className="learn-more">Learn more →</span>
                        </div>

                        <div 
                            className="strategy-card clickable"
                            onClick={() => handleStrategyClick('limit')}
                        >
                            <div className="strategy-icon">⏰</div>
                            <h3>Limit Orders</h3>
                            <p>Set a specific price at which you want to buy or sell</p>
                            <span className="learn-more">Learn more →</span>
                        </div>

                        <div 
                            className="strategy-card clickable"
                            onClick={() => handleStrategyClick('portfolio')}
                        >
                            <div className="strategy-icon">📊</div>
                            <h3>Portfolio Management</h3>
                            <p>Diversify your investments to manage risk</p>
                            <span className="learn-more">Learn more →</span>
                        </div>
                    </div>
                </section>

                <Modal 
                    isOpen={modalOpen} 
                    onClose={() => setModalOpen(false)}
                    className="large"
                >
                    <div className="modal-header">
                        <h2>{modalContent.title}</h2>
                        <button 
                            className="close-button"
                            onClick={() => setModalOpen(false)}
                        >×</button>
                    </div>
                    <div className="modal-body">
                        {modalContent.content}
                    </div>
                </Modal>
            </div>
        </div>
    );
}

export default Tutorial;
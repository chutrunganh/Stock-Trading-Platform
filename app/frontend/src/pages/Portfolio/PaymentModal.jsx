import React, { useState, useEffect } from 'react';
import { verifyPayment} from '../../api/payment';
import { getPortfolioDetails } from '../../api/portfolio';
import './PaymentModal.css';

function PaymentModal({ isOpen, onClose, onPaymentSuccess }) {
    const [transactionId, setTransactionId] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        // Reset states when modal opens
        if (isOpen) {
            setTransactionId('');
            setVerifying(false);
            setError(null);
            setSuccess(false);
        }
    }, [isOpen]);

    const handleVerifyPayment = async () => {
        if (!transactionId.trim()) {
            setError('Please enter the transaction ID');
            return;
        }

        setVerifying(true);
        setError(null);

        try {
            console.log('Verifying payment with ID:', transactionId);
            const result = await verifyPayment(transactionId);
            console.log('Payment verification result:', result);

            if (result.success) {
                setSuccess(true);
                // Fetch updated portfolio details
                const portfolioData = await getPortfolioDetails();
                console.log('Updated portfolio data:', portfolioData);
                
                // Notify parent component about successful payment
                onPaymentSuccess(portfolioData.data);
                
                // Close modal after 3 seconds on success
                setTimeout(() => {
                    onClose();
                }, 3000);
            } else {
                console.error('Payment verification failed:', result);
                setError(result.message || 'Payment verification failed');
            }
        } catch (err) {
            console.error('Payment verification error:', err);
            setError(err.message || 'Failed to verify payment');
        } finally {
            setVerifying(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content payment-modal" onClick={(e) => e.stopPropagation()}>
                <h2>Add Funds to Your Account</h2>
                
                <div className="payment-content">
                    <div className="payment-left">
                        <div className="qr-container">
                            <img 
                                src="https://qr.sepay.vn/img?acc=VQRQACJBQ9436&bank=MBBank" 
                                alt="Payment QR Code"
                                className="qr-code"
                            />
                            <p className="bank-info">MB Bank - Account: VQRQACJBQ9436</p>
                            <p className="bank-support-notice"></p>
                        </div>
                    </div>

                    <div className="payment-right">
                        <div className="payment-info">
                            <p>Transfer money to add virtual funds to your portfolio:</p>
                            <ul>
                                <li>1,000 VND = 1,000 USD in virtual money</li>
                                <li>Minimum transfer: 10,000 VND</li>
                                <li>Maximum transfer: 1,000,000 VND</li>
                            </ul>
                        </div>

                        <div className="payment-instructions">
                            <h3>How to pay:</h3>
                            <ol>
                                <li>Open your banking app</li>
                                <li>Scan the QR code</li>
                                <li>Enter the amount you want to transfer</li>
                                <li>Complete the transfer</li>
                                <li>Enter your transaction reference number below</li>
                            </ol>
                        </div>

                        {!success ? (
                            <div className="verification-section">
                                <input
                                    type="text"
                                    placeholder="Enter transaction reference number from banking app"
                                    value={transactionId}
                                    onChange={(e) => setTransactionId(e.target.value)}
                                    className="transaction-input"
                                />
                                {error && <p className="error-message">{error}</p>}
                                <button 
                                    className="verify-button"
                                    onClick={handleVerifyPayment}
                                    disabled={verifying}
                                >
                                    {verifying ? 'Verifying...' : 'Verify Payment'}
                                </button>
                                <button className="close-button" onClick={onClose}>Close</button>
                            </div>
                        ) : (
                            <div className="success-message">
                                Payment verified successfully! Your balance will be updated shortly.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PaymentModal; 
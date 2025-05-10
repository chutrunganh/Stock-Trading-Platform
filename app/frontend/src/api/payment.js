import apiClient from './apiClient';

// Function to verify payment and update balance
export const verifyPayment = async (transactionId) => {
    try {
        const response = await apiClient.post('payments/verify', { referenceNumber: transactionId });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};


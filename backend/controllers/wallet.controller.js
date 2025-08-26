const axios = require('axios');

// Get wallet balance and SMS count
const getWalletBalance = async (req, res) => {
  try {
    // Call external API to get balance
    const balanceResponse = await axios.get(`https://www.fast2sms.com/dev/wallet?authorization=${process.env.WALLET_API_URL}`, {
      headers: {
        'Authorization': `Bearer ${process.env.API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    // console.log('Wallet balance response:', balanceResponse.data);

    // Extract balance from response (assuming the API returns { balance: 100 })
    const balance = balanceResponse.data.wallet || 0;

    // Calculate SMS count (balance / 0.20)
    const smsCount = Math.floor(+balance / 0.20);

    console.log('Calculated SMS count:', smsCount);

    res.json({
      success: true,
      data: {
        balance: balance,
        smsCount: smsCount,
        pricePerSms: 0.20,
        currency: 'INR',
      }
    });

  } catch (error) {
    console.error('Wallet balance error:', error);
    
    // Return mock data if API fails (for development)
    const mockBalance = 100;
    const mockSmsCount = Math.floor(mockBalance / 0.20);
    
    res.json({
      success: true,
      data: {
        balance: mockBalance,
        smsCount: mockSmsCount,
        pricePerSms: 0.20,
        currency: 'USD',
        isMockData: true
      }
    });
  }
};

module.exports = {
  getWalletBalance,
};

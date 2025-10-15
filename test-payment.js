const fetch = require('node-fetch');

async function testPayment() {
  try {
    const response = await fetch('https://folsme-bck.onrender.com/create-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        paymentMethod: 'paystack',
        formData: {
          fullName: 'Test User',
          email: 'test@example.com',
          phone: '1234567890',
          street: 'Test Street',
          city: 'Test City',
          state: 'Test State',
          country: 'Nigeria'
        },
        cartItems: [{
          name: 'Test Product',
          price: 100000,
          quantity: 1
        }],
        amount: 100000
      })
    });

    const data = await response.json();
    console.log('Payment response:', data);
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testPayment();
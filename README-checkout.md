Local testing for checkout page

1) Install dependencies (Node.js required):

   npm install

2) Start the mock server (serves static files and a /create-payment endpoint):

   npm start

3) Open the checkout page in your browser:

   http://localhost:3000/checkout.html?product=household&quantity=1

Notes:
- The mock server is intentionally minimal. It responds with { success: true, orderId } for valid requests.
- For production payment integration, replace the processPayment flow with your chosen provider (Stripe, Paystack, Flutterwave, PayPal) and secure server-side endpoints.

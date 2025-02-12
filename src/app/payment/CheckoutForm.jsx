'use client';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { useState } from 'react';

export default function CheckoutForm({ clientSecret }) {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    const cardElement = elements.getElement(CardElement);

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
      },
    });

    if (error) {
      setMessage(error.message);
    } else if (paymentIntent.status === 'succeeded') {
      setMessage('Payment successful!');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit" disabled={!stripe}>
        Pay
      </button>
      <p>{message}</p>
    </form>
  );
}

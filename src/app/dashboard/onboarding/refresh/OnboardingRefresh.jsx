'use client';
import { useEffect, useState } from 'react';

const OnboardingRefresh = () => {
  const [loading, setLoading] = useState(true);    // For loading state
  const [accountStatus, setAccountStatus] = useState(null); // To store account status
  const [error, setError] = useState(null);    // To store any error that occurs

  // Function to fetch the connected account status from the backend or Stripe API
  const refreshAccount = async () => {
    try {
      setLoading(true);  // Set loading state to true while we are fetching data

      // Call your API or directly Stripe API to get the connected account status
      const response = await fetch('/api/get-connected-account-status');  // Example API endpoint
      if (!response.ok) {
        throw new Error('Failed to fetch account status');
      }

      const data = await response.json();
      setLoading(false);
      setAccountStatus(data.status);   // Assuming `status` is a field in the response

      // You can customize the messages based on account status
      if (data.isComplete) {
        setAccountStatus('Account successfully onboarded!');
      } else {
        setAccountStatus('Account needs further information');
      }
    } catch (error) {
      setLoading(false);
      setError(error.message);
    }
  };

  // Use useEffect to trigger the refresh when the component loads
  useEffect(() => {
    refreshAccount();
  }, []);  // Empty array means this runs only once after the component mounts

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Account Onboarding</h1>

      {/* Show loading state */}
      {loading && <div>Refreshing your account details...</div>}

      {/* Show error if there's an issue */}
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}

      {/* If account is successfully onboarded, show success message */}
      {accountStatus && !loading && !error && (
        <div>
          <h2>Status: {accountStatus}</h2>
          {accountStatus === 'Account successfully onboarded!' && (
            <div>
              <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer">
                Go to your Stripe Dashboard
              </a>
            </div>
          )}
        </div>
      )}

      {/* Provide next steps if account is incomplete */}
      {accountStatus && accountStatus !== 'Account successfully onboarded!' && (
        <div>
          <h3>Please upload the missing information to complete your onboarding:</h3>
          {/* Example: Instructions or redirect to another page */}
          <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer">
            Complete your onboarding
          </a>
        </div>
      )}
    </div>
  );
};

export default OnboardingRefresh;

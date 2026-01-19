"use client"
import React, { useState } from 'react';

const DataDeletion = () => {
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (email && confirmed) {
      // In a real application, this would send the deletion request to your backend
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-500 via-pink-500 to-pink-400 p-8">
      {/* Header with Logo */}
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-black mb-2">
            <img src="/reelogo.png" className="w-[92px] mx-auto py-[12px]" />
          </h1>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-lg shadow-2xl p-8 md:p-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">User Data Deletion</h2>
          
          {!submitted ? (
            <>
              <div className="space-y-6 text-gray-700 mb-8">
                <section>
                  <p className="leading-relaxed mb-4">
                    We respect your right to control your personal data. You can request the deletion of your 
                    account and associated data from REE marketplace at any time.
                  </p>
                </section>

                <section>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">What Will Be Deleted</h3>
                  <p className="leading-relaxed mb-3">
                    When you request data deletion, we will remove:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Your account profile and personal information</li>
                    <li>Login credentials and authentication data</li>
                    <li>Your product listings and selling history</li>
                    <li>Transaction records (subject to legal retention requirements)</li>
                    <li>Communication history and preferences</li>
                    <li>Any other data associated with your account</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">Important Information</h3>
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                    <p className="text-yellow-800 leading-relaxed">
                      <strong>Warning:</strong> Data deletion is permanent and cannot be undone. You will lose 
                      access to your account, active listings, and transaction history.
                    </p>
                  </div>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Deletion requests are typically processed within 30 days</li>
                    <li>Some data may be retained for legal or regulatory compliance purposes</li>
                    <li>Active transactions must be completed before deletion</li>
                    <li>You will receive a confirmation email once deletion is complete</li>
                  </ul>
                </section>
              </div>

              {/* Deletion Request Form */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Request Data Deletion</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your registered email"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for Deletion (Optional)
                    </label>
                    <textarea
                      id="reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows="4"
                      placeholder="Please share why you're leaving (optional)"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>

                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="confirm"
                      checked={confirmed}
                      onChange={(e) => setConfirmed(e.target.checked)}
                      className="mt-1 h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                    />
                    <label htmlFor="confirm" className="ml-2 text-sm text-gray-700 cursor-pointer">
                      I understand that this action is permanent and my data cannot be recovered after deletion.
                    </label>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={!email || !confirmed}
                    className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Submit Deletion Request
                  </button>
                </div>
              </div>

              <section>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">Alternative Options</h3>
                <p className="leading-relaxed mb-3">
                  If you're not ready to delete your account permanently, consider these alternatives:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Temporarily deactivate your account</li>
                  <li>Update your privacy settings to limit data collection</li>
                  <li>Remove specific listings or information</li>
                  <li>Contact our support team for assistance</li>
                </ul>
              </section>

              <section className="mt-6">
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">Need Help?</h3>
                <p className="leading-relaxed">
                  If you have questions about data deletion or need assistance, please contact our support team:
                </p>
                <div className="mt-3">
                  <a href="/contact-support" className="text-pink-600 underline hover:text-pink-700">
                    Contact support
                  </a>
                  <span className="text-gray-500 mx-2">|</span>
                  <a href="mailto:support@ree-marketplace.com" className="text-pink-600 underline hover:text-pink-700">
                    support@ree-marketplace.com
                  </a>
                </div>
              </section>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="mb-6">
                <svg className="mx-auto h-16 w-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Request Submitted Successfully</h3>
              <p className="text-gray-700 leading-relaxed mb-6">
                Your data deletion request has been received. We will process your request within 30 days 
                and send a confirmation email to <strong>{email}</strong> once completed.
              </p>
              <p className="text-gray-600 text-sm mb-8">
                Reference ID: DEL-{Date.now().toString().slice(-8)}
              </p>
              <a 
                href="/" 
                className="inline-block bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Return to Home
              </a>
            </div>
          )}

          {!submitted && (
            <div className="mt-10 pt-6 border-t border-gray-200">
              <a 
                href="/" 
                className="inline-block bg-black text-white px-6 py-3 rounded hover:bg-gray-800 transition-colors"
              >
                Back to Login
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-white text-sm">
          <p>© 2026 REE Marketplace. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default DataDeletion;
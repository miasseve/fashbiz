import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-500 via-pink-500 to-pink-400 p-8">
      {/* Header with Logo */}
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-black mb-2">
           <img src="/fashlogo.svg" className="w-[132px] mx-auto" />
          </h1>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-lg shadow-2xl p-8 md:p-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Privacy Policy</h2>
          
          <div className="space-y-6 text-gray-700">
            <section>
              <p className="text-sm text-gray-500 mb-4">Last updated: January 7, 2026</p>
              <p className="leading-relaxed">
                Welcome to REE. We respect your privacy and are committed to protecting your personal data. 
                This privacy policy will inform you about how we handle your personal data when you visit our 
                marketplace and tell you about your privacy rights.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">Information We Collect</h3>
              <p className="leading-relaxed mb-3">
                We collect several types of information from and about users of our marketplace:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Personal identification information (name, email address, phone number)</li>
                <li>Account credentials and authentication information</li>
                <li>Transaction and payment information</li>
                <li>Product listings and selling activity</li>
                <li>Communication preferences and history</li>
              </ul>
            </section>

            <section>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">How We Use Your Information</h3>
              <p className="leading-relaxed mb-3">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide, operate, and maintain our marketplace services</li>
                <li>Process your transactions and manage your orders</li>
                <li>Send you important updates about your account and transactions</li>
                <li>Improve and personalize your experience on our platform</li>
                <li>Detect and prevent fraud or unauthorized activities</li>
                <li>Comply with legal obligations and enforce our terms</li>
              </ul>
            </section>

            <section>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">Data Security</h3>
              <p className="leading-relaxed">
                We implement appropriate technical and organizational security measures to protect your 
                personal data against unauthorized access, alteration, disclosure, or destruction. However, 
                no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">Your Rights</h3>
              <p className="leading-relaxed mb-3">
                You have the right to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Access and receive a copy of your personal data</li>
                <li>Correct inaccurate or incomplete information</li>
                <li>Request deletion of your personal data</li>
                <li>Withdraw consent for data processing</li>
                <li>Object to processing of your personal data</li>
                <li>Export your data in a portable format</li>
              </ul>
            </section>

            <section>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">Cookies and Tracking</h3>
              <p className="leading-relaxed">
                We use cookies and similar tracking technologies to enhance your experience, analyze site 
                traffic, and understand user behavior. You can control cookie settings through your browser 
                preferences.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">Third-Party Services</h3>
              <p className="leading-relaxed">
                We may share your information with trusted third-party service providers who assist us in 
                operating our marketplace, processing payments, or analyzing site usage. These parties are 
                obligated to keep your information confidential and use it only for the purposes we specify.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">Contact Us</h3>
              <p className="leading-relaxed">
                If you have any questions about this Privacy Policy or our data practices, please contact us at:
              </p>
              <div className="mt-3 text-pink-600">
                <a href="/contact-support" className="underline hover:text-pink-700">Contact support</a>
              </div>
            </section>
          </div>

          {/* Back to Login Button */}
          <div className="mt-10 pt-6 border-t border-gray-200">
            <a 
              href="/" 
              className="inline-block bg-black text-white px-6 py-3 rounded hover:bg-gray-800 transition-colors"
            >
              Back to Login
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-white text-sm">
          <p>© 2026 REE Marketplace. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
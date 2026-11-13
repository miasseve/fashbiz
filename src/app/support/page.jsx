import React from 'react';

const Support = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-500 via-pink-500 to-pink-400 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Main Content Card */}
        <div className="bg-white rounded-lg shadow-2xl p-8 md:p-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Support</h2>

          <div className="space-y-6 text-gray-700">
            <section>
              <p className="leading-relaxed">
                Need help with leStores AI? Reach out to us directly using the contact details below
                and we'll get back to you as soon as possible.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">Phone</h3>
              <p className="leading-relaxed">
                <a href="tel:+458193826" className="text-pink-600 underline hover:text-pink-700">
                  +458193826
                </a>
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">Email</h3>
              <p className="leading-relaxed">
                <a href="mailto:mia@le-stores.com" className="text-pink-600 underline hover:text-pink-700">
                  mia@le-stores.com
                </a>
              </p>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-white text-sm">
          <p>© 2026 leStores AI Marketplace. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Support;

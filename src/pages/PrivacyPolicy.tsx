import React from 'react';
import { Helmet } from 'react-helmet-async';

const PrivacyPolicy: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Privacy Policy - Memora Music</title>
        <meta name="description" content="Memora Music Privacy Policy - How we collect, use and protect your personal data" />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-lg rounded-2xl p-8 md:p-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 text-center">
              Privacy Policy
            </h1>
            
            <p className="text-gray-300 text-center mb-8">
              Last updated: {new Date().toLocaleDateString('en-US')}
            </p>
            
            <div className="text-gray-200 space-y-8">
              <p className="text-lg leading-relaxed">
                Memora Music by Twing values your privacy. This Policy clearly explains how we collect, use, store and protect your personal data, including Google account data when you choose to use Google login.
              </p>
              
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">1. Data Collected</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-medium text-white mb-2">1.1 Data provided by the user:</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Name, email and password when creating an account directly.</li>
                      <li>Briefing information, musical preferences and styles chosen to generate personalized songs.</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-medium text-white mb-2">1.2 Data collected via Google login (Google OAuth):</h3>
                    <p className="mb-2">When you choose to register or access your account with Google, we may access:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>First and last name.</li>
                      <li>Email address.</li>
                      <li>Profile picture (if available).</li>
                    </ul>
                    <p className="mt-2">This data is used only for authentication and creating your Memora Music account.</p>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-medium text-white mb-2">1.3 Usage and technical data:</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Information about interactions with the platform (songs created, versions chosen).</li>
                      <li>Technical data such as IP address, device type, browser and cookies.</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-medium text-white mb-2">1.4 Payment data:</h3>
                    <p>In case of purchases, payment data is processed by partners (e.g.: Stripe). Memora Music does not store complete card information.</p>
                  </div>
                </div>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">2. How We Use the Data</h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Authentication and access:</strong> name, email and profile picture from Google are used exclusively to authenticate your account.</li>
                  <li><strong>Experience personalization:</strong> we use data provided in the briefing to generate personalized songs.</li>
                  <li><strong>Communication:</strong> we may send notifications about orders, updates and improvements.</li>
                  <li><strong>Platform improvement:</strong> we analyze usage metrics to enhance the experience.</li>
                  <li><strong>Legal compliance:</strong> we use data when necessary to comply with applicable laws.</li>
                </ul>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">3. Data Sharing</h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>We do not sell or rent personal data to third parties.</li>
                  <li>Data may be shared with:
                    <ul className="list-disc list-inside space-y-1 ml-6 mt-2">
                      <li>Service providers (hosting, payment processing, technical support).</li>
                      <li>Authentication partners (Google, only for secure login).</li>
                      <li>Legal authorities when required by law.</li>
                    </ul>
                  </li>
                </ul>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">4. Data Storage and Protection</h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>All data is stored on secure servers in compliance with LGPD (Brazil) and GDPR (Europe).</li>
                  <li>We implement technical and organizational measures, including encryption in transit (TLS/SSL) and at rest.</li>
                  <li>Access to data is restricted only to authorized employees or service providers.</li>
                </ul>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">5. Data Retention and Deletion</h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Account data and created songs are kept while your account is active.</li>
                  <li>If you request deletion, all your personal data (including data obtained via Google login) will be permanently deleted from our systems, except when retention is necessary due to legal obligation.</li>
                  <li>To request deletion, contact us at: <a href="mailto:contato@memora.music" className="text-blue-300 hover:text-blue-200 underline">contato@memora.music</a> or use the "Delete account" function on the platform itself.</li>
                </ul>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">6. User Rights</h2>
                <p className="mb-2">You can, at any time:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Request access, correction or deletion of your data.</li>
                  <li>Withdraw consent for certain uses.</li>
                  <li>Request data portability.</li>
                  <li>Object to processing in certain situations.</li>
                </ul>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">7. Cookies and Technologies</h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>We use functional, analytical and preference cookies.</li>
                  <li>You can manage cookies in your browser settings or in our consent banner.</li>
                </ul>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">8. International Data Transfer</h2>
                <p>Your data may be processed outside Brazil or the European Union. We ensure that any transfer will be made in accordance with LGPD and GDPR, with adequate safeguards.</p>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">9. Changes to this Policy</h2>
                <p>We may update this Policy periodically. The most recent version will always be available at <a href="https://memora.music/privacy-policy" className="text-blue-300 hover:text-blue-200 underline">https://memora.music/privacy-policy</a>.</p>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">10. Contact</h2>
                <p>For questions or requests related to this Policy, please contact:</p>
                <p className="mt-2">
                  <a href="mailto:contato@memora.music" className="text-blue-300 hover:text-blue-200 underline">
                    contato@memora.music
                  </a>
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PrivacyPolicy;
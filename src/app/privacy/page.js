"use client";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-16 px-6 mt-20">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">Privacy Policy</h1>
        <p className="text-gray-600 mb-4">
          At 625Tutor, we are committed to protecting your privacy. This Privacy Policy outlines how we collect, use, and safeguard your personal information. By using our website, you agree to the terms of this Privacy Policy.
        </p>

        <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-4">1. Information We Collect</h2>
        <p className="text-gray-600 mb-4">
          We collect the following personal information from users:
        </p>
        <ul className="list-disc list-inside text-gray-600 mb-4">
          <li>Email address</li>
          <li>Username</li>
        </ul>
        <p className="text-gray-600">
          This information is collected through forms on our website and may be provided by children. If you are under the age of 13, please ensure you have parental consent before providing any personal information.
        </p>

        <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-4">2. How We Use Your Information</h2>
        <p className="text-gray-600 mb-4">
          The information we collect is used solely for account creation and management purposes. We do not use your data for advertising or marketing purposes.
        </p>

        <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-4">3. Data Sharing and Selling</h2>
        <p className="text-gray-600 mb-4">
          We do not share or sell your personal information to any third parties.
        </p>

        <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-4">4. Cookies and Tracking</h2>
        <p className="text-gray-600 mb-4">
          We do not use cookies or any tracking technologies on our website.
        </p>

        <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-4">5. User Rights</h2>
        <p className="text-gray-600 mb-4">
          You have the right to access, edit, or delete your personal information at any time. To make such a request, please contact us at <a href="mailto:625tutor@gmail.com" className="text-blue-600 underline">625tutor@gmail.com</a>.
        </p>

        <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-4">6. Data Retention</h2>
        <p className="text-gray-600 mb-4">
          We retain your personal information for up to one year of inactivity. After this period, your data will be permanently deleted from our systems.
        </p>

        <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-4">7. Data Security</h2>
        <p className="text-gray-600 mb-4">
          We store all user data securely on our Supabase database. We take reasonable measures to protect your data from unauthorized access, alteration, or disclosure.
        </p>

        <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-4">8. Third-Party Services</h2>
        <p className="text-gray-600 mb-4">
          We do not use any third-party services to process or store your data.
        </p>

        <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-4">9. Changes to This Privacy Policy</h2>
        <p className="text-gray-600 mb-4">
          We may update this Privacy Policy from time to time. Any changes will be posted on this page, and we encourage you to review it periodically.
        </p>

        <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-4">10. Contact Us</h2>
        <p className="text-gray-600">
          If you have any questions or concerns about this Privacy Policy, please contact us at <a href="mailto:625tutor@gmail.com" className="text-blue-600 underline">625tutor@gmail.com</a>.
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
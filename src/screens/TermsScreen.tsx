import { useState } from "react";
import { motion } from "framer-motion";

interface TermsScreenProps {
  onAccept: () => void;
  onDecline: () => void;
}

const TermsScreen = ({ onAccept, onDecline }: TermsScreenProps) => {
  const [activeTab, setActiveTab] = useState<"privacy" | "terms">("privacy");

  return (
    <div className="min-h-screen flex justify-center" style={{ background: "hsl(var(--bg))" }}>
      <div className="w-full max-w-[430px] flex flex-col">
        {/* Header */}
        <div className="px-6 pt-14 pb-4">
          <h1 className="font-serif text-[24px] text-center" style={{ color: "hsl(var(--dark))" }}>
            Welcome to TendherMom
          </h1>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab("privacy")}
              className="flex-1 py-2 rounded-xl text-[13px] font-sans font-semibold transition-colors"
              style={{
                background: activeTab === "privacy" ? "hsl(var(--green))" : "hsl(var(--surface))",
                color: activeTab === "privacy" ? "white" : "hsl(var(--text-muted))",
              }}
            >
              Privacy Policy
            </button>
            <button
              onClick={() => setActiveTab("terms")}
              className="flex-1 py-2 rounded-xl text-[13px] font-sans font-semibold transition-colors"
              style={{
                background: activeTab === "terms" ? "hsl(var(--green))" : "hsl(var(--surface))",
                color: activeTab === "terms" ? "white" : "hsl(var(--text-muted))",
              }}
            >
              Terms of Use
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div
          className="flex-1 overflow-y-auto px-6 pb-4"
          style={{ maxHeight: "calc(100vh - 240px)" }}
        >
          <div
            className="rounded-2xl p-4 text-[13px] font-sans leading-relaxed"
            style={{ background: "hsl(var(--surface))", color: "hsl(var(--dark))" }}
          >
            {activeTab === "privacy" ? <PrivacyPolicy /> : <TermsOfUse />}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4" style={{ background: "hsl(var(--bg))" }}>
          <p className="text-[12px] font-sans text-center mb-3" style={{ color: "hsl(var(--text-muted))" }}>
            By clicking Agree, you consent to the above agreements
          </p>
          <div className="flex gap-3">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onDecline}
              className="flex-1 py-3 rounded-2xl text-[15px] font-semibold font-sans"
              style={{ background: "hsl(var(--surface))", color: "hsl(var(--text-muted))" }}
            >
              Disagree
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onAccept}
              className="flex-1 py-3 rounded-2xl text-[15px] font-semibold font-sans"
              style={{ background: "hsl(var(--green))", color: "white" }}
            >
              Agree
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="font-semibold text-[14px] mt-4 mb-1" style={{ color: "hsl(var(--dark))" }}>{children}</h3>
);

const PrivacyPolicy = () => (
  <div>
    <h2 className="font-serif text-[16px] font-bold mb-3" style={{ color: "hsl(var(--dark))" }}>Data Privacy Policy</h2>
    <p className="text-[11px] mb-3" style={{ color: "hsl(var(--text-muted))" }}>Effective Date: March 14, 2026</p>

    <SectionTitle>1. Introduction</SectionTitle>
    <p>Welcome to TendherMom ("we," "our," "us"). We are committed to protecting your privacy and ensuring you have a safe and secure experience while using our maternal health app. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our app.</p>

    <SectionTitle>2. Information We Collect</SectionTitle>
    <ul className="list-disc pl-4 space-y-1">
      <li><strong>Personal Information:</strong> Name, email address, phone number, date of birth, pregnancy status, and other health-related information you provide.</li>
      <li><strong>Health Data:</strong> Pregnancy tracking, appointment reminders, symptoms, and other health-related inputs.</li>
      <li><strong>Usage Data:</strong> App interactions, log data, device information, and analytics.</li>
      <li><strong>Location Data:</strong> If you enable location services, we may collect your location to connect you with nearby clinics and emergency services.</li>
    </ul>

    <SectionTitle>3. How We Use Your Information</SectionTitle>
    <ul className="list-disc pl-4 space-y-1">
      <li>To provide and personalize our services (e.g., health tips, appointment reminders).</li>
      <li>To connect you with verified healthcare professionals and clinics.</li>
      <li>To improve our app's functionality and user experience.</li>
      <li>To communicate with you about updates, promotions, and health information.</li>
      <li>To comply with legal obligations and protect our users.</li>
      <li>We reserve the right to use your information for any lawful purpose, including marketing and research, without further notice to you.</li>
    </ul>

    <SectionTitle>4. Sharing Your Information</SectionTitle>
    <p>We do not sell your personal information. We may share your information with:</p>
    <ul className="list-disc pl-4 space-y-1">
      <li><strong>Healthcare Providers:</strong> To facilitate consultations and appointments.</li>
      <li><strong>Service Providers:</strong> For analytics, hosting, and customer support.</li>
      <li><strong>Legal Authorities:</strong> If required by law or to protect our rights.</li>
    </ul>

    <SectionTitle>5. Data Security</SectionTitle>
    <p>We implement reasonable security measures to protect your information from unauthorized access, alteration, disclosure, or destruction. However, we do not guarantee that your information will remain secure and we are not liable for any unauthorized access or use of your information.</p>

    <SectionTitle>6. Data Retention and Deletion</SectionTitle>
    <ul className="list-disc pl-4 space-y-1">
      <li>We retain your personal information and health data for as long as your account is active or as needed to provide our services.</li>
      <li>You can request deletion of your data at any time by contacting us.</li>
      <li>We will delete or anonymize your information within 30 days of your request, unless required to retain it for legal or regulatory reasons.</li>
      <li>Backup and archival copies may retain data for up to 90 days before being permanently deleted.</li>
    </ul>

    <SectionTitle>7. Your Rights</SectionTitle>
    <ul className="list-disc pl-4 space-y-1">
      <li>You can access, update, or delete your personal information through the app settings.</li>
      <li>You can opt-out of promotional communications.</li>
      <li>You can request data export or deletion by contacting us.</li>
    </ul>

    <SectionTitle>8. Children's Privacy</SectionTitle>
    <p>Our app is not intended for children under 18. We do not knowingly collect data from children.</p>

    <SectionTitle>9. Third-Party Services and Links</SectionTitle>
    <p>Our app may contain links to third-party websites or services. We are not responsible for the privacy practices or content of these third-party services. We encourage you to review their privacy policies.</p>

    <SectionTitle>10. Data Breach Notification</SectionTitle>
    <p>In the event of a data breach that affects your personal information, we will notify you via email or through the app within 72 hours of discovering the breach, as required by applicable law.</p>

    <SectionTitle>11. Cookie Policy</SectionTitle>
    <p>We use cookies and similar tracking technologies to enhance your experience. You can control cookies through your device settings. By using the app, you consent to our use of cookies.</p>

    <SectionTitle>12. International Data Transfers</SectionTitle>
    <p>Your information may be transferred to and processed in countries outside of Nigeria. We ensure that such transfers comply with applicable data protection laws.</p>

    <SectionTitle>13. Changes to This Policy</SectionTitle>
    <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page. Your continued use of the app after any changes constitutes your acceptance of the new policy.</p>

    <SectionTitle>14. Contact Us</SectionTitle>
    <p>If you have any questions about this Privacy Policy, please contact us at: support@tendhermom.com</p>
  </div>
);

const TermsOfUse = () => (
  <div>
    <h2 className="font-serif text-[16px] font-bold mb-3" style={{ color: "hsl(var(--dark))" }}>Terms of Use</h2>
    <p className="text-[11px] mb-3" style={{ color: "hsl(var(--text-muted))" }}>Effective Date: March 14, 2026</p>

    <SectionTitle>1. Acceptance of Terms</SectionTitle>
    <p>By accessing or using TendherMom, you agree to be bound by these Terms of Use and our Privacy Policy. If you do not agree, please do not use the app.</p>

    <SectionTitle>2. Use of the App</SectionTitle>
    <ul className="list-disc pl-4 space-y-1">
      <li>You must be at least 18 years old to use this app.</li>
      <li>You agree to provide accurate and complete information.</li>
      <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
      <li>We reserve the right to refuse service to anyone at any time.</li>
    </ul>

    <SectionTitle>3. Health Information Disclaimer</SectionTitle>
    <p>The app provides general health information (articles, tips, reminders) for educational purposes. This general information is not a substitute for personalized medical advice, diagnosis, or treatment from a qualified healthcare professional.</p>
    <p className="mt-1">When you consult with a verified doctor, midwife, or healthcare provider through our app, you are receiving professional medical advice tailored to your individual situation.</p>
    <p className="mt-1">If you think you may have a medical emergency, call your local emergency number immediately.</p>

    <SectionTitle>4. User Conduct</SectionTitle>
    <ul className="list-disc pl-4 space-y-1">
      <li>You agree not to use the app for any unlawful or prohibited purpose.</li>
      <li>You will not upload or transmit any harmful or malicious code.</li>
      <li>You will not harass, threaten, or harm other users or healthcare providers.</li>
    </ul>

    <SectionTitle>5. Intellectual Property</SectionTitle>
    <p>All content, features, and functionality of the app are owned by TendherMom and are protected by copyright, trademark, and other intellectual property laws.</p>

    <SectionTitle>6. User-Generated Content</SectionTitle>
    <p>You retain ownership of any content you submit to the app. By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and display such content.</p>

    <SectionTitle>7. Payment Terms</SectionTitle>
    <p>Certain features may require payment. You agree to pay all fees associated with your use of such features. All payments are non-refundable, except as required by law.</p>

    <SectionTitle>8. Refund Policy</SectionTitle>
    <p>We may offer refunds at our sole discretion. To request a refund, please contact us at support@tendhermom.com.</p>

    <SectionTitle>9. Termination</SectionTitle>
    <p>We may terminate or suspend your account at any time for violation of these Terms or for any other reason, with or without notice.</p>

    <SectionTitle>10. Limitation of Liability</SectionTitle>
    <p>To the fullest extent permitted by law, TendherMom shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your use of the app.</p>

    <SectionTitle>11. Third-Party Services</SectionTitle>
    <p>We are not responsible for any damages or losses resulting from your use of third-party services linked to our app.</p>

    <SectionTitle>12. Indemnification</SectionTitle>
    <p>You agree to indemnify and hold harmless TendherMom, its officers, directors, employees, and agents from any claims arising out of your use of the app or violation of these Terms.</p>

    <SectionTitle>13. Governing Law</SectionTitle>
    <p>These Terms shall be governed by and construed in accordance with the laws of Nigeria. You agree that any legal action shall be brought exclusively in the courts of Nigeria.</p>

    <SectionTitle>14. Dispute Resolution</SectionTitle>
    <p>Any dispute shall be resolved through good-faith negotiations. If unresolved, it shall be submitted to mediation in Nigeria under the rules of the Lagos Court of Arbitration (LCA). If mediation fails, the dispute shall be resolved by arbitration under the Arbitration and Conciliation Act.</p>

    <SectionTitle>15. Force Majeure</SectionTitle>
    <p>We shall not be liable for any failure or delay in performance due to causes beyond our reasonable control.</p>

    <SectionTitle>16. Severability</SectionTitle>
    <p>If any provision of these Terms is found invalid, the remaining provisions shall remain in full force and effect.</p>

    <SectionTitle>17. Entire Agreement</SectionTitle>
    <p>These Terms and our Privacy Policy constitute the entire agreement between you and TendherMom regarding your use of the app.</p>

    <SectionTitle>18–26. General Provisions</SectionTitle>
    <ul className="list-disc pl-4 space-y-1">
      <li>Our failure to enforce any right shall not be deemed a waiver.</li>
      <li>You may not assign your rights without our consent.</li>
      <li>You agree to comply with all applicable laws.</li>
      <li>We strive to make our app accessible to all users.</li>
      <li>These Terms are written in English; the English version prevails.</li>
      <li>Notices shall be delivered via email or through the app.</li>
      <li>Nothing in these Terms creates a partnership or employment relationship.</li>
      <li>These Terms do not confer rights upon any third party.</li>
      <li>Provisions that should survive termination shall remain in effect.</li>
    </ul>

    <SectionTitle>27. Contact Information</SectionTitle>
    <p>If you have any questions about these Terms, please contact us at: support@tendhermom.com</p>

    <div className="mt-4 p-3 rounded-xl" style={{ background: "hsl(var(--light-green))" }}>
      <p className="font-semibold text-[12px] mb-1" style={{ color: "hsl(var(--green))" }}>Disclaimer of Medical Liability</p>
      <p className="text-[11px]" style={{ color: "hsl(var(--dark))" }}>
        The information, tools, and services provided by TendherMom are for general informational and educational purposes only and are not intended to replace professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified healthcare provider. If you think you may have a medical emergency, call your local emergency number immediately.
      </p>
    </div>

    <SectionTitle>30. Acknowledgment</SectionTitle>
    <p>By using the app, you acknowledge that you have read, understood, and agree to be bound by these Terms of Use and our Privacy Policy. You affirm that you are of legal age and capacity to enter into these Terms.</p>
  </div>
);

export default TermsScreen;

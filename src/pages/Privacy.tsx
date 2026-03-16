import { useNavigate } from "react-router-dom";

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--bg))" }}>
      <div className="max-w-2xl mx-auto px-5 py-10">
        <button
          onClick={() => navigate(-1)}
          className="text-[14px] font-sans font-medium mb-6 flex items-center gap-1"
          style={{ color: "hsl(var(--green))" }}
        >
          ← Back
        </button>

        <h1 className="text-[28px] font-serif font-bold mb-2" style={{ color: "hsl(var(--dark))" }}>
          Privacy Policy
        </h1>
        <p className="text-[13px] font-sans mb-8" style={{ color: "hsl(var(--text-muted))" }}>
          Last updated: March 16, 2026
        </p>

        <div className="space-y-6 text-[15px] leading-relaxed font-sans" style={{ color: "hsl(var(--text-secondary))" }}>
          <section>
            <h2 className="text-[18px] font-semibold mb-2" style={{ color: "hsl(var(--dark))" }}>1. Information We Collect</h2>
            <p>TendherMom collects the following personal information to provide maternal health support:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Account data:</strong> Name, email address, phone number</li>
              <li><strong>Health data:</strong> Last menstrual period (LMP) date, due date, pregnancy stage, triage symptom responses</li>
              <li><strong>Emergency contacts:</strong> Names, phone numbers, email addresses, and WhatsApp numbers of designated contacts</li>
              <li><strong>Community data:</strong> Posts, comments, and likes within trimester communities</li>
              <li><strong>Device data:</strong> Device type, OS version, and push notification tokens</li>
              <li><strong>Location data:</strong> Only when you trigger an SOS emergency alert (latitude/longitude)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold mb-2" style={{ color: "hsl(var(--dark))" }}>2. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide personalized pregnancy tracking and health triage guidance</li>
              <li>Deliver SOS emergency alerts to your designated contacts</li>
              <li>Enable participation in trimester-specific community groups</li>
              <li>Send push notifications for health reminders and community activity</li>
              <li>Improve our services through aggregated, anonymized analytics</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold mb-2" style={{ color: "hsl(var(--dark))" }}>3. Data Sharing</h2>
            <p>We do not sell your personal data. We share information only with:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Your emergency contacts:</strong> When you trigger an SOS alert</li>
              <li><strong>Infrastructure providers:</strong> Secure cloud hosting and database services</li>
              <li><strong>Communication providers:</strong> SMS and WhatsApp delivery for emergency alerts</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold mb-2" style={{ color: "hsl(var(--dark))" }}>4. Data Security</h2>
            <p>All data is encrypted in transit (TLS 1.3) and at rest. Access is protected by row-level security policies ensuring users can only access their own data. Health information is never exposed to other users.</p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold mb-2" style={{ color: "hsl(var(--dark))" }}>5. Data Retention & Deletion</h2>
            <p>Your data is retained for as long as your account is active. You can permanently delete your account and all associated data at any time from your Profile settings. Upon deletion, all personal data, posts, health records, and emergency contacts are immediately and irreversibly removed.</p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold mb-2" style={{ color: "hsl(var(--dark))" }}>6. Your Rights</h2>
            <p>Under the Nigeria Data Protection Act (NDPA) 2023, you have the right to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Access your personal data</li>
              <li>Correct inaccurate information</li>
              <li>Delete your account and data</li>
              <li>Withdraw consent for data processing</li>
              <li>Object to automated decision-making</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold mb-2" style={{ color: "hsl(var(--dark))" }}>7. Children's Privacy</h2>
            <p>TendherMom is not intended for users under 16 years of age. We do not knowingly collect data from minors.</p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold mb-2" style={{ color: "hsl(var(--dark))" }}>8. Contact Us</h2>
            <p>For privacy-related inquiries, contact us at <strong>privacy@tendhermom.com</strong></p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Privacy;

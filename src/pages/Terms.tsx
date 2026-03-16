import { useNavigate } from "react-router-dom";

interface TermsProps {
  onBack?: () => void;
}

const Terms = ({ onBack }: TermsProps = {}) => {
  const navigate = useNavigate();
  const handleBack = onBack || (() => navigate(-1));

  return (
    <div className="min-h-0" style={{ background: "hsl(var(--bg))" }}>
      <div className="max-w-2xl mx-auto px-5 py-10">
        {!onBack && (
          <button
            onClick={handleBack}
            className="text-[14px] font-sans font-medium mb-6 flex items-center gap-1"
            style={{ color: "hsl(var(--green))" }}
          >
            ← Back
          </button>
        )}

        <h1 className="text-[28px] font-serif font-bold mb-2" style={{ color: "hsl(var(--dark))" }}>
          Terms of Service
        </h1>
        <p className="text-[13px] font-sans mb-8" style={{ color: "hsl(var(--text-muted))" }}>
          Last updated: March 16, 2026
        </p>

        <div className="space-y-6 text-[15px] leading-relaxed font-sans" style={{ color: "hsl(var(--text-secondary))" }}>
          <section>
            <h2 className="text-[18px] font-semibold mb-2" style={{ color: "hsl(var(--dark))" }}>1. Acceptance of Terms</h2>
            <p>By creating an account or using TendherMom, you agree to these Terms of Service. If you do not agree, do not use the app.</p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold mb-2" style={{ color: "hsl(var(--dark))" }}>2. Description of Service</h2>
            <p>TendherMom is a maternal health companion application that provides:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Pregnancy tracking and trimester-based health guidance</li>
              <li>Symptom triage assessment (not a substitute for professional medical advice)</li>
              <li>Emergency SOS alerts to designated contacts</li>
              <li>Trimester-specific community forums</li>
              <li>Baby shower celebration features</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold mb-2" style={{ color: "hsl(var(--dark))" }}>3. Medical Disclaimer</h2>
            <p><strong>TendherMom is NOT a substitute for professional medical advice, diagnosis, or treatment.</strong> The triage feature provides general guidance only. Always consult a qualified healthcare provider for medical concerns. In a medical emergency, call your local emergency services immediately.</p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold mb-2" style={{ color: "hsl(var(--dark))" }}>4. User Accounts</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>You must provide accurate information when creating an account</li>
              <li>You are responsible for maintaining the security of your account credentials</li>
              <li>You must be at least 16 years old to use TendherMom</li>
              <li>One account per person — duplicate accounts may be terminated</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold mb-2" style={{ color: "hsl(var(--dark))" }}>5. Community Guidelines</h2>
            <p>When participating in community forums, you agree to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Be respectful and supportive of other mothers</li>
              <li>Not post medical advice or diagnoses</li>
              <li>Not share harmful, hateful, or misleading content</li>
              <li>Not engage in spam, harassment, or commercial solicitation</li>
              <li>Not share other users' personal information</li>
            </ul>
            <p className="mt-2">We reserve the right to remove content and suspend accounts that violate these guidelines.</p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold mb-2" style={{ color: "hsl(var(--dark))" }}>6. SOS Emergency Feature</h2>
            <p>The SOS feature sends alerts to your designated emergency contacts. TendherMom is not an emergency service and does not guarantee message delivery. You are responsible for maintaining accurate emergency contact information. Do not rely solely on this feature in life-threatening situations — always call emergency services.</p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold mb-2" style={{ color: "hsl(var(--dark))" }}>7. Account Termination</h2>
            <p>You may delete your account at any time from Profile settings. We may suspend or terminate accounts that violate these terms. Upon termination, all your data will be permanently deleted.</p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold mb-2" style={{ color: "hsl(var(--dark))" }}>8. Limitation of Liability</h2>
            <p>TendherMom is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the app, including but not limited to health outcomes, missed emergency alerts, or community interactions.</p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold mb-2" style={{ color: "hsl(var(--dark))" }}>9. Changes to Terms</h2>
            <p>We may update these terms at any time. Continued use of TendherMom after changes constitutes acceptance of the updated terms.</p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold mb-2" style={{ color: "hsl(var(--dark))" }}>10. Contact</h2>
            <p>Questions about these terms? Contact us at <strong>legal@tendhermom.com</strong></p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Terms;

import { Link } from "@tanstack/react-router";

/* ═══════════════════════════════════════════════════════════
   Static legal / support pages (Help, About, Terms, Privacy,
   Refund) — needed for Play Store / Razorpay compliance.
   ═══════════════════════════════════════════════════════════ */

const PAGES: Record<string, { title: string; body: string[] }> = {
  "/help": {
    title: "Help & Support",
    body: [
      "Welcome to परीक्षा — your exam practice platform. Here's how to make the most of it:",
      "1. Start a test: Go to the Exams tab, choose any exam (SSC, Banking, Railway, UPSC, etc.), and press Start. The test opens with a timer; answer questions and submit when done (or it auto-submits on expiry).",
      "2. Results & Review: After submitting, your score, accuracy and question-wise review are shown instantly.",
      "3. Mark for Review: Use the palette to mark questions for review and revisit them before submitting.",
      "4. AI Chat: Use the AI Chat assistant (bottom nav / sidebar) to clear doubts or get study tips.",
      "5. Progress: Track your analytics, accuracy and streak on the Dashboard.",
      "For any issue, please contact support at the email provided on this page. We usually respond within 24–48 hours.",
    ],
  },
  "/about": {
    title: "About Us",
    body: [
      "परीक्षा is a free competitive-exam practice platform built by students, for students.",
      "We provide SSC, Banking, Railway, UPSC, Defence, Teaching and many more exams' mock tests and previous-year questions to help aspirants prepare effectively — completely free.",
      "Our goal is to make high-quality exam preparation accessible to every student in India, regardless of budget.",
      "If you find our tests helpful, a small donation helps us keep the platform running and add more features.",
    ],
  },
  "/terms": {
    title: "Terms & Conditions",
    body: [
      "By accessing or using परीक्षा (the \"Platform\"), you agree to these Terms & Conditions.",
      "1. Use of Service: The Platform provides practice tests, mock exams and study material for personal, non-commercial educational use only.",
      "2. No Guarantee: While we strive for accuracy, we do not guarantee that all questions, answers or results are error-free. The Platform is provided \"as is\" without warranties of any kind.",
      "3. Accounts: You are responsible for safeguarding your login credentials and for all activity under your account.",
      "4. Content: Exam content is intended for practice. We respect all applicable copyright laws and do not host unauthorized paid material.",
      "5. Acceptable Use: You agree not to misuse, scrape, resell, or reverse-engineer the Platform or its content.",
      "6. Changes: We may update these Terms at any time. Continued use constitutes acceptance of the revised Terms.",
      "7. Governing Law: These Terms are governed by the laws of India.",
    ],
  },
  "/privacy": {
    title: "Privacy Policy",
    body: [
      "Your privacy matters to us. This policy explains what we collect and how we use it.",
      "1. Information We Collect: Basic account details (name, email) if you register, and anonymized usage data (which exams you attempt, scores) to improve your experience.",
      "2. How We Use It: To provide and improve the service, show progress/analytics, and send important notifications. We do NOT sell your personal data.",
      "3. Guest Access: You can use the platform as a guest without providing personal details.",
      "4. Third Parties: We may use trusted services (e.g. payment processor Razorpay for donations). Payments are handled by them under their own privacy policies.",
      "5. Security: We use reasonable safeguards to protect your data. No method is 100% secure.",
      "6. Contact: For privacy questions, email us at the address on this page.",
    ],
  },
  "/refund": {
    title: "Refund & Cancellation Policy",
    body: [
      "Since all mock tests and study material on परीक्षा are provided free of charge, there are no mandatory paid subscriptions.",
      "1. Donations: Any donations made are voluntary contributions to support the platform. Donations are non-refundable once processed.",
      "2. Payment Failures: If a payment is deducted in error or a transaction fails after charge, contact us with the transaction details and we will assist you in processing a refund through Razorpay within a reasonable time.",
      "3. How to Request: Email us your name, email, transaction ID and issue description. We will verify and respond within 7–10 working days.",
      "4. This policy applies only to voluntary donations; there are no paid exam packs currently.",
    ],
  },
};

export function LegalPage({ path }: { path: string }) {
  const page = PAGES[path] || { title: "Page", body: [] };
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
      <Link to="/dashboard" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
        ← Back to Dashboard
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight mt-3 mb-4">{page.title}</h1>
      <div className="space-y-3">
        {page.body.map((para, i) => (
          <p key={i} className="text-sm leading-relaxed text-muted-foreground">
            {para}
          </p>
        ))}
      </div>
      <div className="mt-8 pt-6 border-t text-xs text-muted-foreground/70">
        Questions or concerns? Reach us at{" "}
        <a href="mailto:support@examos.local" className="text-primary underline">support@examos.local</a>
      </div>
    </div>
  );
}

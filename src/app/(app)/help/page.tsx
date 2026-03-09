"use client";

import { useState } from "react";
import {
  HelpCircle,
  ChevronDown,
  Mail,
  Send,
  BookOpen,
  Users,
  Briefcase,
  CalendarClock,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";

const faqSections = [
  {
    title: "Getting Started",
    icon: BookOpen,
    questions: [
      {
        q: "How do I create my first case?",
        a: "Navigate to Cases from the sidebar, then click 'New Case'. Fill in the case title, type, and any relevant details, then click 'Create Case'. Your case will appear in the cases list.",
      },
      {
        q: "How do I add clients?",
        a: "Go to the Clients section and click 'New Client'. Enter the client's name, contact information, and any notes. Clients can then be associated with cases.",
      },
      {
        q: "Can I import existing data?",
        a: "Bulk data import is coming soon. For now, you can add cases and clients one at a time through the respective forms.",
      },
    ],
  },
  {
    title: "Case Management",
    icon: Briefcase,
    questions: [
      {
        q: "What case statuses are available?",
        a: "Cases can have the following statuses: Open, Active, On Hold, Pending, Closed, and Archived. You can change a case's status at any time from the case detail view.",
      },
      {
        q: "How do I assign a case to a team member?",
        a: "Open the case detail page and use the assignment section to add team members. Partners, Associates, and Paralegals can all be assigned to cases.",
      },
    ],
  },
  {
    title: "Deadlines & Calendar",
    icon: CalendarClock,
    questions: [
      {
        q: "How do deadline reminders work?",
        a: "LawFlow sends notifications 24 hours before a deadline is due. You can customize notification preferences in Settings > Notifications.",
      },
      {
        q: "Can I set recurring deadlines?",
        a: "Recurring deadlines are planned for a future release. Currently, each deadline is set individually with a specific due date.",
      },
    ],
  },
  {
    title: "Billing & Invoicing",
    icon: DollarSign,
    questions: [
      {
        q: "What billing types are supported?",
        a: "LawFlow supports Hourly, Flat Fee, and Contingency billing types. You can set the billing type when creating a new invoice.",
      },
      {
        q: "How do I track billable hours?",
        a: "Use the time entry feature within each case to log billable hours. These can then be compiled into invoices from the Billing section.",
      },
    ],
  },
  {
    title: "Team & Roles",
    icon: Users,
    questions: [
      {
        q: "What user roles are available?",
        a: "LawFlow has four roles: Admin (full access), Partner (case and billing management), Associate (case management), and Paralegal (limited access to assigned cases).",
      },
      {
        q: "How do I invite team members?",
        a: "Admins can invite team members from Settings > Firm Details. Enter the team member's email and select their role. They'll receive an invitation to join.",
      },
    ],
  },
];

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [contactForm, setContactForm] = useState({
    subject: "",
    message: "",
  });

  const toggleFaq = (id: string) =>
    setOpenFaq((prev) => (prev === id ? null : id));

  async function handleContact(e: React.FormEvent) {
    e.preventDefault();
    if (!contactForm.subject.trim() || !contactForm.message.trim()) {
      toast.error("Please fill in both subject and message");
      return;
    }
    setSending(true);
    // Simulate sending
    await new Promise((r) => setTimeout(r, 1000));
    toast.success("Support request submitted. We'll get back to you within 24 hours.");
    setContactForm({ subject: "", message: "" });
    setSending(false);
  }

  return (
    <div className="space-y-6">
      <div className="lf-page-header -mx-6 -mt-6 mb-6 px-6">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-heading)", color: "var(--navy)" }}
        >
          Help &amp; Support
        </h1>
        <p className="mt-0.5 text-sm" style={{ color: "var(--text-secondary)" }}>
          Find answers to common questions or contact our support team
        </p>
      </div>

      {/* FAQ Sections */}
      <div className="space-y-6">
        {faqSections.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.title} className="lf-card">
              <div className="flex items-center gap-2.5 mb-4">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ background: "rgba(15,27,51,0.06)" }}
                >
                  <Icon style={{ width: 16, height: 16, color: "var(--navy)" }} />
                </div>
                <h2
                  className="text-base font-bold"
                  style={{ fontFamily: "var(--font-heading)", color: "var(--navy)" }}
                >
                  {section.title}
                </h2>
              </div>
              <div className="space-y-0">
                {section.questions.map((faq, idx) => {
                  const faqId = `${section.title}-${idx}`;
                  const isOpen = openFaq === faqId;
                  return (
                    <div
                      key={idx}
                      style={{ borderBottom: idx < section.questions.length - 1 ? "1px solid var(--border-light)" : "none" }}
                    >
                      <button
                        onClick={() => toggleFaq(faqId)}
                        className="flex w-full items-center justify-between py-3 text-left text-sm font-semibold transition-colors"
                        style={{ color: "var(--navy)" }}
                      >
                        <span>{faq.q}</span>
                        <ChevronDown
                          style={{
                            width: 16,
                            height: 16,
                            color: "var(--text-muted)",
                            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                            transition: "transform 0.2s ease",
                            flexShrink: 0,
                            marginLeft: 8,
                          }}
                        />
                      </button>
                      {isOpen && (
                        <p
                          className="pb-3 text-sm animate-fade-in"
                          style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}
                        >
                          {faq.a}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Contact Support */}
      <div className="lf-card max-w-2xl">
        <div className="flex items-center gap-2.5 mb-4">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: "rgba(196,154,46,0.12)" }}
          >
            <Mail style={{ width: 16, height: 16, color: "var(--gold)" }} />
          </div>
          <h2
            className="text-base font-bold"
            style={{ fontFamily: "var(--font-heading)", color: "var(--navy)" }}
          >
            Contact Support
          </h2>
        </div>
        <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
          Can&apos;t find what you&apos;re looking for? Send us a message and we&apos;ll respond within 24 hours.
        </p>
        <form onSubmit={handleContact} className="space-y-4">
          <div>
            <label className="lf-label">Subject</label>
            <input
              type="text"
              className="lf-input"
              placeholder="What do you need help with?"
              value={contactForm.subject}
              onChange={(e) => setContactForm((p) => ({ ...p, subject: e.target.value }))}
            />
          </div>
          <div>
            <label className="lf-label">Message</label>
            <textarea
              className="lf-input"
              rows={4}
              placeholder="Describe your issue or question in detail..."
              value={contactForm.message}
              onChange={(e) => setContactForm((p) => ({ ...p, message: e.target.value }))}
              style={{ resize: "vertical" }}
            />
          </div>
          <div className="flex justify-end">
            <button type="submit" className="lf-btn lf-btn-gold" disabled={sending}>
              <Send style={{ width: 16, height: 16 }} />
              {sending ? "Sending..." : "Send Message"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

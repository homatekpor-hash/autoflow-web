"use client";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, Card } from "@/components/ui";

const PLANS = [
  { name:"Starter",      price:299,  features:["1 workshop","Up to 5 staff","Jobs & WIP","Estimates & invoices","QR check-in","WhatsApp notifications"], color:"border-gray-200" },
  { name:"Professional", price:599,  features:["1 workshop","Up to 20 staff","Everything in Starter","Full inventory","Customer XP suite","Reports & analytics","Offline mode"], color:"border-orange-400", popular:true },
  { name:"Enterprise",   price:null, features:["Unlimited workshops","Unlimited staff","Multi-branch management","Custom branding","Priority support","On-site training"], color:"border-purple-400" },
];

export default function BillingPage() {
  const { user } = useAuth();

  function subscribe(plan: string) {
    if (!process.env.NEXT_PUBLIC_PAYSTACK_KEY) {
      alert("Paystack not configured. Contact support to subscribe.");
      return;
    }
    const handler = (window as any).PaystackPop.setup({
      key:      process.env.NEXT_PUBLIC_PAYSTACK_KEY,
      email:    user?.email,
      amount:   plan === "Starter" ? 29900 * 100 : 59900 * 100, // kobo
      currency: "GHS",
      ref:      `autoflow-${Date.now()}`,
      metadata: { workshop_id: user?.workshopId, plan },
      callback: (response: any) => {
        alert(`✅ Payment successful! Reference: ${response.reference}`);
      },
      onClose: () => {},
    });
    handler.openIframe();
  }

  return (
    <div className="fade-up">
      <PageHeader title="Billing & Plans" subtitle="Manage your AutoFlow subscription" />

      <div className="grid gap-6 sm:grid-cols-3 mb-8">
        {PLANS.map(plan => (
          <Card key={plan.name} className={`p-6 border-2 relative ${plan.color}`}>
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                Most popular
              </div>
            )}
            <p className="text-xs font-bold uppercase tracking-widest text-ink-faint mb-4">{plan.name}</p>
            {plan.price ? (
              <div className="mb-4">
                <span className="text-3xl font-bold text-ink">GHS {plan.price}</span>
                <span className="text-ink-faint text-sm">/month</span>
              </div>
            ) : (
              <div className="mb-4"><span className="text-3xl font-bold text-ink">Custom</span></div>
            )}
            <ul className="space-y-2 mb-6">
              {plan.features.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-ink-subtle">
                  <span className="text-green-500 flex-shrink-0">✓</span>{f}
                </li>
              ))}
            </ul>
            {plan.price ? (
              <button onClick={() => subscribe(plan.name)}
                className={`w-full rounded-xl py-2.5 text-sm font-semibold transition ${plan.popular?"bg-orange-500 text-white hover:bg-orange-600":"border border-ink-ghost text-ink hover:bg-ink-paper"}`}>
                Subscribe — GHS {plan.price}/mo
              </button>
            ) : (
              <a href="mailto:hello@autoflowghana.com"
                className="block w-full rounded-xl border border-purple-200 text-purple-600 py-2.5 text-sm font-semibold text-center hover:bg-purple-50 transition">
                Contact us
              </a>
            )}
          </Card>
        ))}
      </div>

      <Card className="p-5 border-amber-200 bg-amber-50">
        <p className="text-sm font-semibold text-amber-800 mb-1">💳 Payment powered by Paystack</p>
        <p className="text-xs text-amber-700">Secure payments in Ghana Cedis. Cancel anytime. No hidden fees.</p>
        <p className="text-xs text-amber-700 mt-1">To enable live payments, add your Paystack public key to the environment variables.</p>
      </Card>

      {/* Add Paystack script */}
      <script src="https://js.paystack.co/v1/inline.js" async />
    </div>
  );
}

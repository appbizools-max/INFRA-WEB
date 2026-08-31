import React, { useState, useEffect } from 'react';
import { Edit2, Send, Briefcase, Building2, Gem, Check, Star, Zap, Save, X, Server, Shield, Layers, FileText, Globe, Headphones, Truck, Users, BarChart3, ChevronRight, Percent } from 'lucide-react';

export default function PlansManagementPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(1); // Default Starter

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [saveLoading, setSaveLoading] = useState(false);

  const fetchPlans = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/plans');
      const data = await res.json();
      setPlans(data);
    } catch (err) {
      console.error('Failed to fetch plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleEditClick = (plan: any) => {
    setEditingId(plan.id);
    setEditForm({
      name: plan.name,
      description: plan.description,
      price_monthly: plan.price_monthly,
      included_tonnage: plan.included_tonnage,
      included_equipment: plan.included_equipment,
      additional_tonnage_price: plan.additional_tonnage_price,
      additional_equipment_price: plan.additional_equipment_price,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSave = async (id: number) => {
    setSaveLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/admin/plans/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (!res.ok) throw new Error('Failed to update');
      
      await fetchPlans();
      setEditingId(null);
      setEditForm({});
    } catch (err) {
      console.error(err);
      alert('Error updating plan');
    } finally {
      setSaveLoading(false);
    }
  };

  // Fallback default plans if API is loading or empty
  const defaultPlans = [
    {
      id: 1,
      name: 'Starter',
      subtitle: 'Perfect for small fleets',
      price_monthly: 2999,
      feats: ['2,500 Tons/month', '5 Vehicles', '3 User seats', 'Trip & fuel logs', 'Basic reports', 'Email support']
    },
    {
      id: 2,
      name: 'Professional',
      subtitle: 'Growing businesses',
      price_monthly: 9999,
      feats: ['25,000 Tons/month', '20 Vehicles', '10 User seats', 'Advanced analytics', 'GPS tracking', 'Priority support']
    },
    {
      id: 3,
      name: 'Enterprise',
      subtitle: 'Large operations',
      price_monthly: 24999,
      volumeLimit: '1,00,000 Tons/month',
      includedFleet: '20 Vehicles',
      feats: ['Custom workflows', 'Multi-site operations', 'Dedicated manager', 'Email support']
    },
    {
      id: 4,
      name: 'Corporate',
      subtitle: 'Enterprise grade',
      price_monthly: 49999,
      feats: ['5,00,000 Tons/month', 'Unlimited vehicles', 'Unlimited users', 'White-label portal', 'API & Integrations', '24/7 SLA support']
    }
  ];

  const displayPlans = plans.length > 0 ? plans.map(p => {
    const d = defaultPlans.find(dp => dp.name.toLowerCase() === p.name.toLowerCase()) || {};
    return { ...d, ...p };
  }) : defaultPlans;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans pb-16">
      
      {/* Top Bar with Free Trial Notice */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md mb-2">
            STEP 3 OF 3
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Choose the right plan for your operations</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Select the subscription tier that best matches your fleet and tonnage needs. Upgrade or downgrade anytime.</p>
        </div>

        {/* Free trial promo box */}
        <div className="bg-emerald-50/60 border border-emerald-200/70 rounded-2xl p-3.5 flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
            %
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-slate-900">Subscription Plans</h4>
            <p className="text-[11px] text-slate-500 font-medium">All plans include 14-day free trial. Cancel anytime.</p>
          </div>
        </div>
      </div>

      {/* 4 Core Pricing Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 items-stretch mb-8">
        {displayPlans.map((plan: any) => {
          const isSelected = selectedPlanId === plan.id;
          const isEnterprise = plan.name.toLowerCase() === 'enterprise';
          const isPopular = plan.name.toLowerCase() === 'professional';

          // Icon cfg
          const cfgMap: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
            Starter: { icon: <Send size={20} className="text-blue-600" />, color: 'text-blue-600', bg: 'bg-blue-50' },
            Professional: { icon: <BarChart3 size={20} className="text-indigo-600" />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            Enterprise: { icon: <Building2 size={20} className="text-emerald-600" />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            Corporate: { icon: <CrownIcon size={20} className="text-amber-600" />, color: 'text-amber-600', bg: 'bg-amber-50' },
          };
          const cfg = cfgMap[plan.name] || { icon: <Briefcase size={20} className="text-blue-600" />, color: 'text-blue-600', bg: 'bg-blue-50' };

          return (
            <div
              key={plan.id}
              onClick={() => setSelectedPlanId(plan.id)}
              className={`relative flex flex-col rounded-3xl bg-white cursor-pointer transition-all duration-200 p-6 ${isSelected
                  ? `ring-2 ring-emerald-500 border-transparent shadow-lg shadow-emerald-500/10`
                  : 'border border-slate-200/80 hover:border-slate-300 hover:shadow-md'
                }`}
            >
              {isEnterprise && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[9px] font-extrabold uppercase tracking-widest px-3.5 py-0.5 rounded-full shadow-md whitespace-nowrap">
                  BEST VALUE
                </div>
              )}
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[9px] font-extrabold uppercase tracking-widest px-3 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                  ★ MOST POPULAR
                </div>
              )}

              <div className="flex items-center gap-3 mb-4 mt-1">
                <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center`}>
                  {cfg.icon}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wider leading-tight">{plan.name}</h3>
                  <p className="text-[11px] text-slate-400 font-medium">{plan.subtitle || 'Perfect for small fleets'}</p>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900 tracking-tight">₹{Number(plan.price_monthly).toLocaleString()}</span>
                  <span className="text-xs font-semibold text-slate-400">/ month</span>
                </div>
                <span className="text-[11px] font-semibold text-slate-400 block mt-0.5">+ GST</span>
              </div>

              <div className="space-y-2.5 flex-1 mb-6 border-t border-slate-100 pt-4">
                {(plan.feats || []).map((feat: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-xs font-semibold text-slate-600">
                    <span className="text-emerald-500 font-bold shrink-0">✓</span>
                    <span className="leading-snug">{feat}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className={`w-full py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${isSelected
                    ? 'bg-blue-50 border-2 border-blue-600 text-blue-600 font-extrabold'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
              >
                {isSelected ? (
                  <>
                    <Check size={14} className="text-blue-600 stroke-[3]" />
                    SELECTED
                  </>
                ) : (
                  'Select Plan'
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Two Grid Cards: Additional Charges & Extra Revenue Services */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Left Card: Additional Charges (Per Additional Unit) */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
              <Server size={18} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Additional Charges (Per Additional Unit)</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50/70 border border-slate-200/60 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Zap size={14} />
                </div>
                <h4 className="text-xs font-bold text-slate-800">Additional Tonnage</h4>
              </div>
              <div className="mb-2">
                <span className="text-2xl font-black text-slate-900 tracking-tight">₹0.50</span>
                <span className="text-xs text-slate-400 font-semibold"> / per ton</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug font-medium">
                Charge for every tonnage beyond your plan limit.
              </p>
            </div>

            <div className="bg-slate-50/70 border border-slate-200/60 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Truck size={14} />
                </div>
                <h4 className="text-xs font-bold text-slate-800">Additional Vehicle</h4>
              </div>
              <div className="mb-2">
                <span className="text-2xl font-black text-slate-900 tracking-tight">₹500</span>
                <span className="text-xs text-slate-400 font-semibold"> / vehicle/month</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug font-medium">
                Add more vehicles to your fleet seamlessly.
              </p>
            </div>
          </div>
        </div>

        {/* Right Card: Extra Revenue Services */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Layers size={18} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Extra Revenue Services</h3>
              <p className="text-[11px] text-slate-400 font-medium">Boost your business with value-added services</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { title: 'Multi-location Management', icon: <Globe size={15} className="text-purple-600" /> },
              { title: 'Advanced Analytics', icon: <BarChart3 size={15} className="text-blue-600" /> },
              { title: 'OCR Document Scanning', icon: <FileText size={15} className="text-emerald-600" /> },
              { title: 'API Integrations', icon: <Zap size={15} className="text-amber-600" /> },
              { title: 'Customer Portal', icon: <Headphones size={15} className="text-indigo-600" /> },
            ].map((srv, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-200/60">
                <div className="w-8 h-8 rounded-lg bg-white shadow-xs flex items-center justify-center shrink-0">
                  {srv.icon}
                </div>
                <span className="text-xs font-bold text-slate-800">{srv.title}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom Metric Definitions Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-4 px-6 bg-slate-50/80 rounded-2xl border border-slate-200/60 text-xs text-slate-500 font-medium">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            🛡️
          </div>
          <div>
            <strong className="text-slate-900 font-bold block leading-none mb-0.5">Volume</strong>
            <span className="text-slate-400 text-[11px]">Monthly freight tonnage limit</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            🚛
          </div>
          <div>
            <strong className="text-slate-900 font-bold block leading-none mb-0.5">Fleet</strong>
            <span className="text-slate-400 text-[11px]">Tracked equipment units</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            👤
          </div>
          <div>
            <strong className="text-slate-900 font-bold block leading-none mb-0.5">Users</strong>
            <span className="text-slate-400 text-[11px]">Included active team logins</span>
          </div>
        </div>
      </div>

    </div>
  );
}

function CrownIcon({ size, className }: { size: number; className?: string }) {
  return <Gem size={size} className={className} />;
}

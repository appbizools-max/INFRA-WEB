import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, MapPin, Users, Layers, Briefcase, 
  FileText, CheckCircle2, AlertCircle,
  TrendingUp, TrendingDown, Wallet, ShieldCheck,
  Building2, Search, ArrowUpRight, ArrowDownLeft,
  Copy, Check, HardHat, RefreshCw,
  Truck, Train, Ship, Plane, ArrowRight, Scale
} from 'lucide-react';

interface WorkOrderDossier {
  id: number;
  orderNumber: string;
  title: string;
  description: string;
  notes: string;
  projectId: string;
  worksiteName: string;
  assignedStaffName: string;
  divisionName: string;
  priority: string;
  status: string;
  startDate: string;
  dueDate: string;
  endDate: string;
  estimatedCost: string | number;
  actualCost: string | number;
  clientName: string;
  clientCode: string;
  projectLocationAddress: string;
  loadingLocation?: string;
  unloadingLocation?: string;
  transportModes?: string;
  isLossApplicable?: boolean;
  allowedLossPercent?: number;
  rateType?: string;
  ratePerUnit?: number;
  paymentTerms?: string;
  commodity: string;
  contractQuantity: string;
  contractQuantityUnit: string;
  createdAt: string;
}

interface FinancialSummary {
  estimatedBudget: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfitLoss: number;
  isNetProfit: boolean;
  profitMargin: number;
  budgetUtilization: number;
  expenseBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
}

interface ProjectTransaction {
  id: string;
  date: string;
  type: string;
  category: string;
  amount: number | string;
  partyName: string;
  entryFlow: 'debit' | 'credit';
  voucherNo: string;
  note: string;
  status: string;
  source: string;
  createdAt?: string;
}

interface AssignedHead {
  name: string;
  role: string;
  division: string;
}

interface ProjectTeamMember {
  id: string;
  name: string;
  role: string;
  email?: string;
  mobile?: string;
  assignedAt?: string;
}

interface Project {
  id: string;
  projectId: string;
  name: string;
  location: string;
  locationBlock: string;
  customer: string;
  commodity: string;
  contractQuantity: string;
  contractQuantityUnit: string;
  contractStartDate: string;
  contractEndDate: string;
  otherData?: string;
  status: 'Active' | 'Completed' | 'Planning' | 'On Hold';
  is_pinned?: boolean;
  customFields?: Record<string, any>;
  createdAt?: string;
  workOrder?: WorkOrderDossier | null;
  financialSummary?: FinancialSummary;
  transactions?: ProjectTransaction[];
  assignedHead?: AssignedHead;
  teamMembers?: ProjectTeamMember[];
}

export default function ProjectDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Simple clean tabs: 'overview' or 'transactions'
  const [viewMode, setViewMode] = useState<'overview' | 'transactions'>('overview');

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Transaction filters
  const [txFilter, setTxFilter] = useState<'all' | 'credit' | 'debit' | 'vendor' | 'petty'>('all');
  const [txSearch, setTxSearch] = useState('');

  const host = (() => {
    const b = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return b.startsWith('http://localhost:3001') ? 'http://localhost:5000' : b;
  })();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const formatINR = (val: number | string | undefined | null) => {
    const num = typeof val === 'number' ? val : parseFloat(String(val || '0')) || 0;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(num);
  };

  const fetchProjectData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch(`${host}/api/tenant/project/${id}`);
      if (res.ok) {
        const data: Project = await res.json();
        setProject(data);
      } else {
        console.error('Failed to fetch project details');
      }
    } catch (err) {
      console.error('Error fetching project:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (id) fetchProjectData();
  }, [id]);

  const handleCopyProjectId = () => {
    if (!project) return;
    navigator.clipboard.writeText(project.projectId || project.id);
    setCopiedId(true);
    showToast('Project ID copied');
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    if (!project?.transactions) return [];
    return project.transactions.filter(t => {
      if (txFilter === 'credit' && t.entryFlow !== 'credit') return false;
      if (txFilter === 'debit' && t.entryFlow !== 'debit') return false;
      if (txFilter === 'vendor' && !t.source.toLowerCase().includes('vendor') && !t.type.toLowerCase().includes('vendor')) return false;
      if (txFilter === 'petty' && !t.source.toLowerCase().includes('petty') && !t.category.toLowerCase().includes('petty')) return false;

      if (txSearch.trim()) {
        const q = txSearch.toLowerCase();
        const vch = (t.voucherNo || '').toLowerCase();
        const party = (t.partyName || '').toLowerCase();
        const note = (t.note || '').toLowerCase();
        const cat = (t.category || '').toLowerCase();
        const typ = (t.type || '').toLowerCase();
        return vch.includes(q) || party.includes(q) || note.includes(q) || cat.includes(q) || typ.includes(q);
      }
      return true;
    });
  }, [project?.transactions, txFilter, txSearch]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-9 h-9 border-4 border-[#1E3A8A] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider animate-pulse">Loading Project Details...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-md mx-auto py-16 text-center bg-white border border-slate-200 rounded-3xl shadow-sm p-8">
        <AlertCircle size={36} className="text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-black text-slate-900">Project Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">This project does not exist or has been removed.</p>
        <button 
          onClick={() => navigate('/tenant/project-management')} 
          className="mt-5 px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider"
        >
          Back to Projects
        </button>
      </div>
    );
  }

  const fin = project.financialSummary || {
    estimatedBudget: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    netProfitLoss: 0,
    isNetProfit: true,
    profitMargin: 0,
    budgetUtilization: 0,
    expenseBreakdown: []
  };

  const wo = project.workOrder;
  const head = project.assignedHead || {
    name: wo?.assignedStaffName || 'Unassigned',
    role: 'Project Head',
    division: wo?.divisionName || project.locationBlock || 'Operations'
  };

  const durationDays = project.contractStartDate && project.contractEndDate
    ? Math.max(0, Math.ceil((new Date(project.contractEndDate).getTime() - new Date(project.contractStartDate).getTime()) / 86400000))
    : 0;

  return (
    <div className="animate-in fade-in duration-200 pb-16 space-y-6">
      
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-2xl shadow-xl border border-slate-700 animate-in slide-in-from-top-2">
          <CheckCircle2 size={15} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-5">
        {/* Navigation & Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button 
            onClick={() => navigate('/tenant/project-management')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-xl transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Projects</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchProjectData(true)}
              title="Refresh project data"
              className="p-2 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Project Title & Status */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-slate-100 pt-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {project.name}
              </h1>
              
              {/* Status Badge */}
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                project.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                project.status === 'Completed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                project.status === 'On Hold' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                'bg-slate-50 text-slate-600 border-slate-200'
              }`}>
                {project.status}
              </span>

              {wo && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  WO #{wo.orderNumber}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 font-medium mt-1.5">
              <button
                onClick={handleCopyProjectId}
                className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-lg font-mono text-[11px] font-bold text-slate-700 transition-colors"
                title="Click to copy Project ID"
              >
                <span>ID: {project.projectId}</span>
                {copiedId ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} className="text-slate-400" />}
              </button>

              <div className="flex items-center gap-1 text-slate-600">
                <Building2 size={13} className="text-slate-400" />
                <span>Client: <strong>{project.customer || 'No Client Assigned'}</strong></span>
              </div>

              <div className="flex items-center gap-1 text-slate-600">
                <MapPin size={13} className="text-rose-500" />
                <span>{project.location} {project.locationBlock ? `(${project.locationBlock})` : ''}</span>
              </div>
            </div>
          </div>

          {/* Simple View Switcher: Details vs All Transactions */}
          <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200 shrink-0">
            <button
              onClick={() => setViewMode('overview')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                viewMode === 'overview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Project Details & P&L
            </button>
            <button
              onClick={() => setViewMode('transactions')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                viewMode === 'transactions' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All Transactions ({project.transactions?.length || 0})
            </button>
          </div>
        </div>
      </div>

      {/* Financial P&L Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Estimated Contract Budget */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
            <span>Estimated Budget</span>
            <Wallet size={15} className="text-[#1E3A8A]" />
          </div>
          <div className="text-xl font-black text-slate-900">
            {formatINR(fin.estimatedBudget)}
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            {wo ? `Approved in WO #${wo.orderNumber}` : 'Base contract estimate'}
          </p>
        </div>

        {/* Revenue / Invoiced */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
            <span>Revenue Invoiced</span>
            <ArrowUpRight size={15} className="text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-600">
            {formatINR(fin.totalRevenue)}
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            {fin.totalRevenue > 0 ? 'Billed milestone receipts' : 'Awaiting client invoices'}
          </p>
        </div>

        {/* Total Expenses Incurred */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
            <span>Total Expenses</span>
            <ArrowDownLeft size={15} className="text-rose-600" />
          </div>
          <div className="text-xl font-black text-rose-600">
            {formatINR(fin.totalExpenses)}
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            {fin.budgetUtilization}% of budget spent
          </p>
        </div>

        {/* Net Profit / Loss (P&L) */}
        <div className={`rounded-2xl border p-5 shadow-sm ${
          fin.netProfitLoss >= 0 ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50/70 border-rose-200'
        }`}>
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider mb-1.5">
            <span className={fin.netProfitLoss >= 0 ? 'text-emerald-800' : 'text-rose-800'}>
              Net Profit / Loss (P&L)
            </span>
            {fin.netProfitLoss >= 0 ? (
              <TrendingUp size={16} className="text-emerald-600" />
            ) : (
              <TrendingDown size={16} className="text-rose-600" />
            )}
          </div>
          <div className={`text-xl font-black ${fin.netProfitLoss >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {fin.netProfitLoss >= 0 ? '+' : ''}{formatINR(fin.netProfitLoss)}
          </div>
          <p className={`text-[11px] font-bold mt-0.5 ${fin.netProfitLoss >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {fin.netProfitLoss >= 0 ? `Profitable (${fin.profitMargin}% margin)` : `Over budget (${fin.profitMargin}%)`}
          </p>
        </div>

      </div>

      {/* VIEW 1: OVERVIEW & DETAILS (Work Order Notes, Scope, People Assigned) */}
      {viewMode === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main 2-Col Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Origin Work Order Notes & Details Card */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center font-bold">
                    <FileText size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Work Order Information & Contract Terms</h3>
                    <p className="text-xs text-slate-400 font-medium">Origin work order notes, scope, and deliverable targets</p>
                  </div>
                </div>

                {wo && (
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-800 font-mono text-xs font-black rounded-lg">
                    {wo.orderNumber}
                  </span>
                )}
              </div>

              {/* Transit Route & Multi-Modal Transport */}
              {wo && (wo.loadingLocation || wo.unloadingLocation || wo.transportModes) && (
                <div className="bg-gradient-to-r from-blue-50/70 to-slate-50 p-4 rounded-2xl border border-blue-200/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-black tracking-wider text-blue-900 flex items-center gap-1.5">
                      <MapPin size={13} className="text-blue-600" />
                      Approved Transit Route & Logistics
                    </span>
                    {wo.transportModes && (
                      <div className="flex items-center gap-1 flex-wrap">
                        {wo.transportModes.split(',').map(m => m.trim()).filter(Boolean).map(mode => (
                          <span key={mode} className="inline-flex items-center gap-1 text-[10px] font-bold bg-white text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                            {mode.toLowerCase().includes('rail') ? <Train size={11} className="text-amber-600" /> :
                             mode.toLowerCase().includes('ship') ? <Ship size={11} className="text-blue-600" /> :
                             mode.toLowerCase().includes('air') ? <Plane size={11} className="text-indigo-600" /> :
                             <Truck size={11} className="text-emerald-600" />}
                            {mode}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1 text-xs">
                    <div className="flex-1 bg-white p-2.5 rounded-xl border border-blue-100">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Origin (Loading Location)</span>
                      <span className="font-bold text-slate-800">{wo.loadingLocation || 'Designated Loading Depot'}</span>
                    </div>
                    <ArrowRight size={16} className="text-blue-500 shrink-0" />
                    <div className="flex-1 bg-white p-2.5 rounded-xl border border-blue-100">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Destination (Unloading Location)</span>
                      <span className="font-bold text-slate-800">{wo.unloadingLocation || project.location || 'Project Delivery Site'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Basic Fields & Commercials */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">Client Name / ID</span>
                  <span className="font-bold text-slate-800">{wo?.clientName || project.customer || '—'}</span>
                  {wo?.clientCode && (
                    <span className="block mt-1 font-mono text-[10px] font-bold text-blue-700 bg-blue-100 w-fit px-1.5 py-0.5 rounded">
                      Code: {wo.clientCode}
                    </span>
                  )}
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">Operational Division</span>
                  <span className="font-bold text-slate-800">{wo?.divisionName || project.locationBlock || 'Operations'}</span>
                  <span className="block text-[10px] text-slate-400 mt-0.5">Supervised Division</span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">Commodity & Target Quantity</span>
                  <span className="font-bold text-slate-800">
                    {project.contractQuantity ? `${project.contractQuantity} ${project.contractQuantityUnit || ''}` : 'Continuous Scope'}
                  </span>
                  <span className="block text-[10px] text-slate-500 mt-0.5">Cargo: {project.commodity || 'Standard'}</span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">Contract Timeline</span>
                  <span className="font-bold text-slate-800">
                    {project.contractStartDate || 'TBD'} to {project.contractEndDate || 'TBD'}
                  </span>
                  <span className="block text-[10px] text-indigo-600 font-bold mt-0.5">{durationDays} Days Duration</span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">Commercial Rate & Terms</span>
                  <span className="font-bold text-slate-800">
                    {wo && Number(wo.ratePerUnit) > 0 ? `₹${Number(wo.ratePerUnit).toLocaleString()} / ${wo.rateType || 'Ton'}` : 'As per Milestones'}
                  </span>
                  <span className="block text-[10px] text-slate-500 mt-0.5">Terms: {wo?.paymentTerms || 'Net 30 Days'}</span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">Permitted Loss / Variance</span>
                  <span className={`font-bold ${wo?.isLossApplicable ? 'text-amber-700' : 'text-slate-700'}`}>
                    {wo?.isLossApplicable ? `${wo.allowedLossPercent || 0}% Allowed Tolerance` : 'Zero Tolerance (No Loss Allowed)'}
                  </span>
                  <span className="block text-[10px] text-slate-400 mt-0.5">Operational Shrinkage Policy</span>
                </div>
              </div>

              {/* Work Order Description / Scope */}
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">Scope of Work</span>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs font-medium text-slate-700 leading-relaxed">
                  {wo?.description || project.otherData || 'Operational scope includes site mobilization, transport logistics, material inspections, and milestone delivery.'}
                </div>
              </div>

              {/* Work Order Notes & Directives */}
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 flex items-center gap-1.5 mb-1.5">
                  <ShieldCheck size={13} className="text-amber-600" />
                  Work Order Directives & Safety Notes
                </span>
                <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-xs font-semibold text-amber-950 leading-relaxed">
                  {wo?.notes && wo.notes.trim() 
                    ? wo.notes 
                    : 'Mandatory PPE (helmets, safety shoes, reflective vests) must be worn at worksite. All cargo receipts and bills must be verified by the assigned Project Head.'}
                </div>
              </div>
            </div>

            {/* Recent Transactions Preview */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Recent Project Transactions</h3>
                  <p className="text-xs text-slate-400 font-medium">Latest income, vendor bills, and petty cash disbursements</p>
                </div>
                <button
                  onClick={() => setViewMode('transactions')}
                  className="text-xs font-bold text-[#1E3A8A] hover:underline"
                >
                  View All ({project.transactions?.length || 0}) →
                </button>
              </div>

              {project.transactions && project.transactions.length > 0 ? (
                <div className="space-y-2.5">
                  {project.transactions.slice(0, 4).map(tx => {
                    const isCredit = tx.entryFlow === 'credit';
                    return (
                      <div key={tx.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                            isCredit ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          }`}>
                            {isCredit ? <ArrowUpRight size={15} /> : <ArrowDownLeft size={15} />}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800">{tx.partyName || tx.type}</span>
                            <span className="text-[10px] text-slate-400 block">{tx.date} · {tx.voucherNo || tx.category}</span>
                          </div>
                        </div>
                        <div className="text-right font-black">
                          <span className={isCredit ? 'text-emerald-600' : 'text-slate-900'}>
                            {isCredit ? '+' : '-'}{formatINR(tx.amount)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-6 text-center text-slate-400 text-xs font-semibold">
                  No transactions recorded for this project yet.
                </div>
              )}
            </div>

          </div>

          {/* Right Column: People Assigned to this Project */}
          <div className="space-y-6">
            
            {/* Leadership Card */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Assigned Project Lead</span>
                <HardHat size={16} className="text-[#1E3A8A]" />
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white font-black text-lg flex items-center justify-center shrink-0">
                  {head.name ? head.name.charAt(0).toUpperCase() : 'P'}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">{head.name || 'Unassigned'}</h4>
                  <p className="text-xs font-bold text-indigo-700">{head.role || 'Project Head'}</p>
                  <p className="text-[10px] text-slate-400 font-semibold">Division: {head.division}</p>
                </div>
              </div>
            </div>

            {/* People Assigned to this Project Card */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Team Roster</h3>
                <p className="text-xs font-bold text-slate-800">Assigned People ({project.teamMembers?.length || 0})</p>
              </div>

              {project.teamMembers && project.teamMembers.length > 0 ? (
                <div className="space-y-2.5">
                  {project.teamMembers.map(member => (
                    <div key={member.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 font-bold flex items-center justify-center shrink-0 text-xs">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 block">{member.name}</span>
                          <span className="text-[10px] text-slate-400 font-semibold">{member.role}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-slate-400 text-xs font-semibold bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <Users size={22} className="mx-auto mb-1 text-slate-300" />
                  <p>No additional staff assigned.</p>
                </div>
              )}
            </div>

            {/* Worksite Physical Location Card */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Worksite Location</span>
              <div className="flex items-start gap-2 text-xs font-bold text-slate-800">
                <MapPin size={15} className="text-rose-500 shrink-0 mt-0.5" />
                <span>{project.location} {project.locationBlock ? `(${project.locationBlock})` : ''}</span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* VIEW 2: ALL TRANSACTIONS (UNIFIED LEDGER) */}
      {viewMode === 'transactions' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-black text-slate-900">All Project Financial Transactions</h3>
            <p className="text-xs text-slate-400 font-medium">Complete unified ledger of invoices, vendor bills, and petty cash</p>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1 p-1 bg-slate-50 rounded-2xl border border-slate-100 overflow-x-auto">
              {[
                { id: 'all', label: `All (${project.transactions?.length || 0})` },
                { id: 'credit', label: 'Revenue / Inflows' },
                { id: 'debit', label: 'Expenses / Outflows' },
                { id: 'vendor', label: 'Vendor Bills' },
                { id: 'petty', label: 'Petty Cash' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setTxFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                    txFilter === f.id ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-[220px]">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={txSearch}
                onChange={e => setTxSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
              />
            </div>
          </div>

          {/* Transactions Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-black uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Voucher #</th>
                    <th className="py-3 px-4">Type / Category</th>
                    <th className="py-3 px-4">Party / Payee</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Source</th>
                    <th className="py-3 px-4 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map(tx => {
                      const isCredit = tx.entryFlow === 'credit';
                      return (
                        <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-600">
                            {tx.date}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="bg-slate-100 px-2 py-0.5 rounded font-mono font-bold text-[11px] text-slate-800">
                              {tx.voucherNo || '—'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                              isCredit ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              {tx.type}
                            </span>
                            <span className="block text-[10px] text-slate-400 font-semibold mt-0.5">{tx.category}</span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-800 whitespace-nowrap">
                            {tx.partyName || '—'}
                          </td>
                          <td className="py-3.5 px-4 max-w-[280px] truncate text-slate-500" title={tx.note}>
                            {tx.note || '—'}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                              {tx.source}
                            </span>
                          </td>
                          <td className={`py-3.5 px-4 text-right font-black whitespace-nowrap text-sm ${
                            isCredit ? 'text-emerald-600' : 'text-slate-900'
                          }`}>
                            {isCredit ? '+' : '-'}{formatINR(tx.amount)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 font-semibold">
                        No transactions found for this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

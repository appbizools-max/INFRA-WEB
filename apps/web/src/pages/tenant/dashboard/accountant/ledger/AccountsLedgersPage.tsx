import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../../../context/AuthContext';
import { apiFetch } from '../../../../../lib/api';
import {
  TrendingUp, AlertCircle, Wallet, DollarSign, ChevronRight, FileText, Clock, Plus,
  ArrowRightLeft, ArrowDown, ArrowUp, RefreshCw, Layers, Clipboard,
  Settings, CheckCircle, Trash2, Calendar, User, ShoppingCart, Info, Users, Menu, X, Filter, Search,
  Check, Briefcase, Network, ChevronDown, ChevronUp, Printer, ListOrdered, List, Bold, Italic, Eraser, Tag, Paperclip, Scale
} from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { InvoicePdfDocument } from '../../../../../components/InvoicePdfDocument';
function numToWords(n: number): string {
  if (!n || isNaN(n) || n <= 0) return 'Zero Rupees Only';
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  function inWords(num: number): string {
    const s = num.toString();
    if (s.length > 9) return 'Overflow';
    const match = ('000000000' + s).slice(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!match) return '';
    let str = '';
    str += (Number(match[1]) !== 0) ? (a[Number(match[1])] || b[Number(match[1][0])] + ' ' + a[Number(match[1][1])]) + 'Crore ' : '';
    str += (Number(match[2]) !== 0) ? (a[Number(match[2])] || b[Number(match[2][0])] + ' ' + a[Number(match[2][1])]) + 'Lakh ' : '';
    str += (Number(match[3]) !== 0) ? (a[Number(match[3])] || b[Number(match[3][0])] + ' ' + a[Number(match[3][1])]) + 'Thousand ' : '';
    str += (Number(match[4]) !== 0) ? (a[Number(match[4])] || b[Number(match[4][0])] + ' ' + a[Number(match[4][1])]) + 'Hundred ' : '';
    str += (Number(match[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(match[5])] || b[Number(match[5][0])] + ' ' + a[Number(match[5][1])]) : '';
    return str;
  }
  return (inWords(Math.floor(n)) + 'Rupees Only').trim();
}
interface Project {
  id: string;
  name: string;
}
interface Worksite {
  id: string;
  name: string;
}
interface Employee {
  id: string;
  name: string;
  role?: string;
  department?: string;
}
const SIDEBAR_SECTIONS = [
  {
    group: 'Ledgers & Accounts', items: [
      { id: 'ledger', label: 'Accounts & Ledgers', icon: Wallet },
      { id: 'record-ledger', label: 'Record Ledger Entry', icon: Clipboard },
      { id: 'project-costing', label: 'Project Costing & Details', icon: Briefcase },
    ]
  },
  {
    group: 'Expenditures', items: [
      { id: 'company-expenses', label: 'Company Expenses', icon: DollarSign },
    ]
  },
  {
    group: 'Balance Sheet', items: [
      { id: 'assets-liabilities', label: 'Assets & Liabilities', icon: Layers },
    ]
  },
] as const;

type TabType = typeof SIDEBAR_SECTIONS[number]['items'][number]['id'] | 'create-ledger' | 'record-ledger';

// Common Color & Icon System Helpers
const getTransactionVisuals = (type?: string, status?: string) => {
  if (status === 'Reversed') {
    return {
      color: 'slate',
      bgClass: 'bg-slate-100 text-slate-500',
      textClass: 'text-slate-400 line-through',
      icon: RefreshCw,
      sign: ''
    };
  }

  const normalized = (type || '').toLowerCase();

  // Credits / Inflow (Deposit, Issue float, Payment Received, Purchase return)
  if (
    normalized.includes('deposit') ||
    normalized.includes('transfer in') ||
    normalized.includes('payment received') ||
    normalized.includes('payment cleared') ||
    normalized.includes('reimbursement') ||
    normalized.includes('opening balance') ||
    normalized.includes('replenishment') ||
    normalized.includes('purchase return') ||
    normalized === 'purchase' || // Stock purchase in
    normalized === 'return' || // Stock return
    normalized === 'issue' // Float setup issue
  ) {
    return {
      color: 'emerald',
      bgClass: 'bg-emerald-50 text-emerald-600 border border-emerald-200/50',
      textClass: 'text-emerald-600 font-extrabold',
      icon: ArrowDown,
      sign: '+'
    };
  }

  // Debits / Outflow (Withdrawal, Expense, Payment cleared, Issue splits)
  return {
    color: 'red',
    bgClass: 'bg-rose-50 text-rose-600 border border-rose-200/50',
    textClass: 'text-rose-600 font-extrabold',
    icon: ArrowUp,
    sign: '-'
  };
};

const groupTransactionsByDate = (transactions: any[]) => {
  const groups: { [key: string]: any[] } = {};
  const sorted = [...(transactions || [])].sort((a, b) => {
    const da = a?.date ? new Date(a.date).getTime() : 0;
    const db = b?.date ? new Date(b.date).getTime() : 0;
    return db - da;
  });

  sorted.forEach(tx => {
    if (!tx || !tx.date) return;
    const txDate = new Date(tx.date);
    if (isNaN(txDate.getTime())) return;
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    let key = '';
    if (txDate.toDateString() === today.toDateString()) {
      key = 'Today';
    } else if (txDate.toDateString() === yesterday.toDateString()) {
      key = 'Yesterday';
    } else {
      key = txDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(tx);
  });

  return groups;
};

export default function AccountsLedgersPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<TabType>('ledger');

  // Sub-tabs State for Nested Views
  const [activeLedgerSubTab, setActiveLedgerSubTab] = useState<'bank' | 'clients' | 'vendors' | 'employees' | 'opening' | 'journal' | 'general' | 'reconciliation' | 'trial' | 'period-closing' | 'reports'>('bank');
  const [activeExpensesSubTab, setActiveExpensesSubTab] = useState<'petty' | 'stock'>('petty');
  const [activeAssetsSubTab, setActiveAssetsSubTab] = useState<'assets' | 'receivables' | 'payables'>('assets');

  useEffect(() => {
    const validTabs: TabType[] = ['ledger', 'record-ledger', 'project-costing', 'company-expenses', 'assets-liabilities', 'create-ledger'];
    if (tabParam && validTabs.includes(tabParam as TabType)) {
      setActiveTab(tabParam as TabType);
    } else if (!tabParam) {
      setActiveTab('ledger');
    }
  }, [tabParam]);
  const [loading, setLoading] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Core Master Lists
  const [projects, setProjects] = useState<Project[]>([]);
  const [worksites, setWorksites] = useState<Worksite[]>([]);
  const [custodians, setCustodians] = useState<Employee[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Filters State
  const [filterSearch, setFilterSearch] = useState('');
  const [filterDate, setFilterDate] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [filterType, setFilterType] = useState<'all' | 'credit' | 'debit'>('all');
  const [filterProject, setFilterProject] = useState('all');

  // Expanded Transaction Row ID state
  const [expandedTxId, setExpandedTxId] = useState<string | number | null>(null);

  // Onboarding Setup Wizard State
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [wizardBankForm, setWizardBankForm] = useState({ name: '', type: 'Bank', openingBalance: '0' });
  const [wizardPettyForm, setWizardPettyForm] = useState({ custodianId: '', siteId: '', openingAmount: '0' });
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  // Dashboard Aggregates
  const [dashboardData, setDashboardData] = useState<any>({
    bankTotal: 0,
    pettyTotal: 0,
    clientTotal: 0,
    vendorTotal: 0,
    employeeTotal: 0,
    netPosition: 0,
    activity: []
  });

  // Bank Cash State
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [selectedBankAccount, setSelectedBankAccount] = useState<string>('');
  const [bankStatement, setBankStatement] = useState<any[]>([]);
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [bankForm, setBankForm] = useState({ openingBalance: '', name: '', type: 'Bank' });
  const [bankTxModalOpen, setBankTxModalOpen] = useState(false);
  const [bankTxForm, setBankTxForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0], type: 'Deposit', linkedParty: '', referenceNo: '', note: '', destinationAccountId: '' });

  // Petty Cash State
  const [selectedCustodian, setSelectedCustodian] = useState<string>('');
  const [allPettyFloats, setAllPettyFloats] = useState<any[]>([]);
  const [pettyCashFloat, setPettyCashFloat] = useState<any>(null);
  const [pettyCashEntries, setPettyCashEntries] = useState<any[]>([]);
  const [pettyCashModalOpen, setPettyCashModalOpen] = useState(false);
  const [pettyCashForm, setPettyCashForm] = useState({ openingAmount: '', custodianId: '', siteId: '' });
  const [pettyTxModalOpen, setPettyTxModalOpen] = useState(false);
  const [pettyTxForm, setPettyTxForm] = useState({ custodianId: '', amount: '', date: new Date().toISOString().split('T')[0], type: 'Expense', category: 'Material Purchase', mode: 'Cash', projectTag: 'Overhead', note: '', billReference: '' });
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [isCustomVoucherType, setIsCustomVoucherType] = useState(false);
  const [customVoucherTypeInput, setCustomVoucherTypeInput] = useState('');

  // Client Statement State
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [clientStatement, setClientStatement] = useState<any[]>([]);
  const [clientOutstanding, setClientOutstanding] = useState(0);
  const [clientTxModalOpen, setClientTxModalOpen] = useState(false);
  const [clientTxForm, setClientTxForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0], type: 'Payment', projectTag: 'Overhead', note: '' });

  // Vendor Statement State
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [vendorStatement, setVendorStatement] = useState<any[]>([]);
  const [vendorOutstanding, setVendorOutstanding] = useState(0);
  const [vendorTxModalOpen, setVendorTxModalOpen] = useState(false);
  const [vendorTxForm, setVendorTxForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0], type: 'Payment', projectTag: 'Overhead', note: '' });

  // Employee Advances State
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [employeeStatement, setEmployeeStatement] = useState<any[]>([]);
  const [employeeOutstanding, setEmployeeOutstanding] = useState(0);
  const [employeeTxModalOpen, setEmployeeTxModalOpen] = useState(false);
  const [employeeTxForm, setEmployeeTxForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0], type: 'Salary Advance', note: '' });

  // Assets Register State
  const [assets, setAssets] = useState<any[]>([]);
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [assetForm, setAssetForm] = useState({ purchaseCost: '', description: '', purchaseDate: new Date().toISOString().split('T')[0], usefulLifeYears: '5', assignedProjectId: '' });

  // Stock Ledger State
  const [stockItems, setStockItems] = useState<any[]>([]);
  const [selectedStockItem, setSelectedStockItem] = useState<string>('');
  const [stockLedger, setStockLedger] = useState<any[]>([]);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [itemForm, setItemForm] = useState({ name: '', unitOfMeasure: 'Piece', category: 'General' });
  const [stockTxModalOpen, setStockTxModalOpen] = useState(false);
  const [stockTxForm, setStockTxForm] = useState({
    quantity: '',
    rate: '',
    type: 'purchase',
    date: new Date().toISOString().split('T')[0],
    siteId: '',
    vendorId: '',
    splitType: 'quantity',
    splits: [{ projectId: 'Overhead', splitType: 'percentage', splitValue: '100' }]
  });

  // Project P&L Analysis
  const [selectedProjectPl, setSelectedProjectPl] = useState<string>('');
  const [projectPlData, setProjectPlData] = useState<any>(null);
  const [allProjectsPl, setAllProjectsPl] = useState<any[]>([]);
  const [loadingProjectsPl, setLoadingProjectsPl] = useState(false);
  const [projectHistory, setProjectHistory] = useState<any[]>([]);
  const [loadingProjectHistory, setLoadingProjectHistory] = useState(false);

  // --- Standard Double-Entry Accounting State ---
  const [journalVouchers, setJournalVouchers] = useState<any[]>([]);
  const [journalModalOpen, setJournalModalOpen] = useState(false);
  const [journalForm, setJournalForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    projectId: 'Overhead',
    entries: [
      { accountId: '', accountType: 'expense', debitAmount: '', creditAmount: '', note: '' },
      { accountId: '', accountType: 'bank', debitAmount: '', creditAmount: '', note: '' }
    ]
  });

  const [selectedGeneralAccount, setSelectedGeneralAccount] = useState<string>('');
  const [selectedGeneralProject, setSelectedGeneralProject] = useState<string>('all');
  const [trialBalance, setTrialBalance] = useState<any[]>([]);
  const [loadingTrial, setLoadingTrial] = useState(false);

  const [periodClosings, setPeriodClosings] = useState<any[]>([]);
  const [closingDate, setClosingDate] = useState(new Date().toISOString().split('T')[0]);

  const [incomeStatement, setIncomeStatement] = useState<{ revenue: number; expenses: number; netProfit: number } | null>(null);
  const [balanceSheet, setBalanceSheet] = useState<any>(null);
  const [loadingReports, setLoadingReports] = useState(false);

  // --- Project Ledgers State (Image 1 & Image 2) ---
  const [projectLedgers, setProjectLedgers] = useState<any[]>([]);
  const [loadingProjectLedgers, setLoadingProjectLedgers] = useState(false);
  const [createLedgerForm, setCreateLedgerForm] = useState({
    name: '',
    ledgerCode: '',
    type: 'Expense',
    openingBalance: '0.00',
    balanceType: 'Credit',
    status: 'Active',
    description: '',
    projectId: '',
    department: '',
    responsiblePerson: '',
    ledgerCategory: 'Project', // 'Project' or 'Company'
    overallCost: '',
    advancePaid: '',
    companyCategory: 'Staff Salary & Payroll'
  });
  const [filterLedgerType, setFilterLedgerType] = useState('All Types');
  const [filterLedgerStatus, setFilterLedgerStatus] = useState('All Status');
  const [searchLedgerQuery, setSearchLedgerQuery] = useState('');

  // --- Overhauled Unified Ledgers State ---
  const [allLedgerAccounts, setAllLedgerAccounts] = useState<any[]>([]);
  const [loadingAllLedgers, setLoadingAllLedgers] = useState(false);
  const [companyLedgers, setCompanyLedgers] = useState<any[]>([]);
  const [selectedCompanyLedger, setSelectedCompanyLedger] = useState('');
  const [companyLedgerEntries, setCompanyLedgerEntries] = useState<any[]>([]);
  const [loadingCompanyLedgers, setLoadingCompanyLedgers] = useState(false);
  const [loadingCompanyEntries, setLoadingCompanyEntries] = useState(false);
  const [quickTxModalOpen, setQuickTxModalOpen] = useState(false);
  const [quickTxForm, setQuickTxForm] = useState({
    ledgerCode: '',
    offsetLedgerCode: '',
    direction: 'Debit',
    docType: 'Expenditure',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    billRef: '',
    linkedVoucherNo: '',
    extraNotes: '',
    projectId: 'Overhead',
    siteId: '',
  });
  const [showExtraNoteField, setShowExtraNoteField] = useState(false);
  const [activeLedgerCategory, setActiveLedgerCategory] = useState<'Debit' | 'Credit'>('Debit');
  const [inspectingLedgerCode, setInspectingLedgerCode] = useState<string | null>(null);
  const [inspectorSubTab, setInspectorSubTab] = useState<'overview' | 'income' | 'expense'>('overview');
  const [inspectorDatePreset, setInspectorDatePreset] = useState<'this_month' | 'last_month' | 'today' | 'this_week' | 'all' | 'custom'>('this_month');
  const [inspectorFromDate, setInspectorFromDate] = useState<string>('');
  const [inspectorToDate, setInspectorToDate] = useState<string>('');
  const [inspectingLedgerEntries, setInspectingLedgerEntries] = useState<any[]>([]);
  const [loadingInspectEntries, setLoadingInspectEntries] = useState(false);
  // Load inspecting entries
  useEffect(() => {
    if (inspectingLedgerCode) {
      setLoadingInspectEntries(true);
      apiFetch('/api/tenant/ledger/entries/' + inspectingLedgerCode)
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          setInspectingLedgerEntries(data);
          setLoadingInspectEntries(false);
        })
        .catch(err => {
          console.error(err);
          setLoadingInspectEntries(false);
        });
    }
  }, [inspectingLedgerCode]);

  // Inspector Accordion & Voucher Invoice PDF Modal state
  const [expandedInspectRowId, setExpandedInspectRowId] = useState<number | string | null>(null);
  const [selectedInvoiceTx, setSelectedInvoiceTx] = useState<any | null>(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);

  // Paid Confirmation Pop-up state
  const [paidModalOpen, setPaidModalOpen] = useState(false);
  const [paidFormTx, setPaidFormTx] = useState<any | null>(null);
  const [paidDateInput, setPaidDateInput] = useState(new Date().toISOString().split('T')[0]);
  const [paymentModeInput, setPaymentModeInput] = useState('Bank Transfer');

  // Direct Reversal Trigger Row state
  const [reversalModalOpen, setReversalModalOpen] = useState(false);
  const [reversalForm, setReversalForm] = useState({ type: 'petty-cash' as any, entryId: '', voucherNo: '', reason: '' });

  // Opening Balances state
  const [openingForm, setOpeningForm] = useState({
    asOfDate: new Date().toISOString().split('T')[0],
    bankBalances: [{ name: '', type: 'Bank', amount: '' }],
    custodianBalances: [{ custodianId: '', amount: '' }],
    clientArrears: [{ clientId: '', amount: '' }],
    vendorArrears: [{ vendorId: '', amount: '' }]
  });

  // Debit & Credit Notes State
  const [debitNotes, setDebitNotes] = useState<any[]>([]);
  const [creditNotes, setCreditNotes] = useState<any[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [debitNoteModalOpen, setDebitNoteModalOpen] = useState(false);
  const [creditNoteModalOpen, setCreditNoteModalOpen] = useState(false);
  const [debitNoteForm, setDebitNoteForm] = useState({
    date: new Date().toISOString().split('T')[0],
    partyType: 'Vendor' as 'Vendor' | 'Client',
    partyId: '',
    amount: '',
    projectTag: 'Overhead',
    note: ''
  });
  const [creditNoteForm, setCreditNoteForm] = useState({
    date: new Date().toISOString().split('T')[0],
    partyType: 'Client' as 'Client' | 'Vendor',
    partyId: '',
    amount: '',
    projectTag: 'Overhead',
    note: ''
  });

  const fetchDebitNotes = async () => {
    try {
      setLoadingNotes(true);
      const res = await apiFetch('/api/tenant/ledger/debit-notes');
      if (res.ok) setDebitNotes(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingNotes(false);
    }
  };

  const fetchCreditNotes = async () => {
    try {
      setLoadingNotes(true);
      const res = await apiFetch('/api/tenant/ledger/credit-notes');
      if (res.ok) setCreditNotes(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingNotes(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'debit-notes') {
      fetchDebitNotes();
    } else if (activeTab === 'credit-notes') {
      fetchCreditNotes();
    }
  }, [activeTab]);

  const showWizard = false;

  // Reset Filters when tab changes
  useEffect(() => {
    setFilterSearch('');
    setFilterDate('all');
    setFilterType('all');
    setFilterProject('all');
    setExpandedTxId(null);
  }, [activeTab]);

  // Load Initial Configuration Data
  const loadMasterData = async () => {
    try {
      setLoading(true);

      // Load Projects
      const projRes = await apiFetch(`/api/tenant/projects/${currentUser?.uid}`);
      if (projRes.ok) setProjects(await projRes.json());

      // Load Worksites
      const siteRes = await apiFetch(`/api/tenant/worksites/${currentUser?.uid}`);
      if (siteRes.ok) setWorksites(await siteRes.json());

      // Load Custodians & Employees
      const userRes = await apiFetch(`/api/tenant/team/${currentUser?.uid}`);
      if (userRes.ok) {
        const users = await userRes.json();
        setCustodians(users);
        setEmployees(users);

        const savedCust = localStorage.getItem('selected_petty_custodian');
        const targetId = (savedCust && users.some((u: any) => u.id === savedCust)) ? savedCust : (users[0]?.id || '');
        if (targetId) {
          setSelectedCustodian(targetId);
        }
      }

      // Load All Petty Cash Floats
      const floatRes = await apiFetch('/api/tenant/ledger/petty-cash/floats/all');
      if (floatRes.ok) {
        setAllPettyFloats(await floatRes.json());
      }

      // Load Clients
      const clientRes = await apiFetch(`/api/tenant/accounts/clients/${currentUser?.uid}`);
      if (clientRes.ok) setClients(await clientRes.json());

      // Load Vendors
      const vendorRes = await apiFetch(`/api/tenant/accounts/vendors/${currentUser?.uid}`);
      if (vendorRes.ok) setVendors(await vendorRes.json());

      // Load Bank accounts
      await fetchBankAccounts();

      // Load Assets
      await fetchAssets();

      // Load Stock items
      await fetchStockItems();

      // Load Dashboard Aggregates
      await fetchDashboardData();

    } catch (e) {
      console.error('Error loading ledger config masters:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchBankAccounts = async () => {
    const res = await apiFetch('/api/tenant/ledger/bank-cash/accounts');
    if (res.ok) {
      const data = await res.json();
      setBankAccounts(data);
      if (data.length > 0 && !selectedBankAccount) {
        setSelectedBankAccount(data[0].id);
      }
    }
  };

  const fetchAssets = async () => {
    const res = await apiFetch('/api/tenant/assets');
    if (res.ok) setAssets(await res.json());
  };

  const fetchStockItems = async () => {
    const res = await apiFetch('/api/tenant/stock/items');
    if (res.ok) {
      const data = await res.json();
      setStockItems(data);
      if (data.length > 0 && !selectedStockItem) {
        setSelectedStockItem(data[0].id);
      }
    }
  };

  const fetchDashboardData = async () => {
    const res = await apiFetch('/api/tenant/ledger/dashboard-summary');
    if (res.ok) setDashboardData(await res.json());
  };

  useEffect(() => {
    if (currentUser) {
      loadMasterData();
    }
  }, [currentUser]);

  // Load Bank Statement
  useEffect(() => {
    if (selectedBankAccount) {
      apiFetch(`/api/tenant/ledger/bank-cash/${selectedBankAccount}`).then(async res => {
        if (res.ok) {
          const data = await res.json();
          setBankStatement(data.entries || []);
        }
      });
    }
  }, [selectedBankAccount]);

  // Load Petty Cash Custodian
  useEffect(() => {
    if (selectedCustodian) {
      apiFetch(`/api/tenant/ledger/petty-cash/${selectedCustodian}`).then(async res => {
        if (res.ok) {
          const data = await res.json();
          setPettyCashFloat(data.float);
          setPettyCashEntries(data.entries || []);
        }
      });
    }
  }, [selectedCustodian]);

  // Load Client statement
  useEffect(() => {
    if (selectedClient) {
      apiFetch(`/api/tenant/ledger/client/${selectedClient}`).then(async res => {
        if (res.ok) {
          const data = await res.json();
          setClientStatement(data.statement || []);
          setClientOutstanding(data.outstanding || 0);
        }
      });
    }
  }, [selectedClient]);

  // Load Vendor statement
  useEffect(() => {
    if (selectedVendor) {
      apiFetch(`/api/tenant/ledger/vendor/${selectedVendor}`).then(async res => {
        if (res.ok) {
          const data = await res.json();
          setVendorStatement(data.statement || []);
          setVendorOutstanding(data.outstanding || 0);
        }
      });
    }
  }, [selectedVendor]);

  // Load Employee advances statement
  useEffect(() => {
    if (selectedEmployee) {
      apiFetch(`/api/tenant/ledger/employee/${selectedEmployee}`).then(async res => {
        if (res.ok) {
          const data = await res.json();
          setEmployeeStatement(data.statement || []);
          setEmployeeOutstanding(data.balance || 0);
        }
      });
    }
  }, [selectedEmployee]);

  // Auto-select custodian on petty-cash tab
  useEffect(() => {
    if (activeTab === 'petty-cash' && custodians.length > 0 && !selectedCustodian) {
      setSelectedCustodian(custodians[0].id);
    }
  }, [activeTab, custodians, selectedCustodian]);

  // Load Stock Ledger
  useEffect(() => {
    if (selectedStockItem) {
      apiFetch(`/api/tenant/stock/ledger/${selectedStockItem}`).then(async res => {
        if (res.ok) setStockLedger(await res.json());
      });
    }
  }, [selectedStockItem]);

  // --- Standard Double-Entry Accounting APIs ---
  const fetchJournalVouchers = async () => {
    try {
      const res = await apiFetch('/api/tenant/ledger/journal-vouchers');
      if (res.ok) setJournalVouchers(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTrialBalance = async () => {
    try {
      setLoadingTrial(true);
      const res = await apiFetch('/api/tenant/ledger/trial-balance');
      if (res.ok) setTrialBalance(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTrial(false);
    }
  };

  const fetchPeriodClosings = async () => {
    try {
      const res = await apiFetch('/api/tenant/ledger/period-closings');
      if (res.ok) setPeriodClosings(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchFinancialReports = async () => {
    try {
      setLoadingReports(true);
      const p1 = apiFetch('/api/tenant/ledger/reports/income-statement');
      const p2 = apiFetch('/api/tenant/ledger/reports/balance-sheet');
      const [r1, r2] = await Promise.all([p1, p2]);
      if (r1.ok) setIncomeStatement(await r1.json());
      if (r2.ok) setBalanceSheet(await r2.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingReports(false);
    }
  };

  // Sub-tab Data Loading Trigger
  useEffect(() => {
    if (activeTab === 'ledger') {
      if (activeLedgerSubTab === 'dashboard') {
        fetchTrialBalance();
        fetchJournalVouchers();
      } else if (activeLedgerSubTab === 'journal') {
        fetchJournalVouchers();
      } else if (activeLedgerSubTab === 'trial') {
        fetchTrialBalance();
      } else if (activeLedgerSubTab === 'period-closing') {
        fetchPeriodClosings();
      } else if (activeLedgerSubTab === 'reports') {
        fetchFinancialReports();
      }
    }
  }, [activeTab, activeLedgerSubTab]);

  // Load Project P&L Rollup
  useEffect(() => {
    if (selectedProjectPl) {
      apiFetch(`/api/tenant/ledger/project/${selectedProjectPl}`).then(async res => {
        if (res.ok) setProjectPlData(await res.json());
      });
    }
  }, [selectedProjectPl]);

  // Load Company Overheads Ledgers & Entries
  const fetchCompanyLedgerData = async () => {
    try {
      setLoadingCompanyLedgers(true);
      const res = await apiFetch('/api/tenant/ledger/company-ledgers');
      if (res.ok) {
        const data = await res.json();
        setCompanyLedgers(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCompanyLedgers(false);
    }
  };

  const fetchSelectedCompanyLedgerEntries = async (code: string) => {
    try {
      setLoadingCompanyEntries(true);
      const res = await apiFetch(`/api/tenant/ledger/entries/${code}`);
      if (res.ok) {
        setCompanyLedgerEntries(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCompanyEntries(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'company-expenses') {
      fetchCompanyLedgerData();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'company-expenses' && selectedCompanyLedger) {
      fetchSelectedCompanyLedgerEntries(selectedCompanyLedger);
    }
  }, [activeTab, selectedCompanyLedger]);

  // Load All Ledger Accounts (Unified master list)
  const fetchAllLedgerAccounts = async () => {
    try {
      setLoadingAllLedgers(true);
      const companyRes = await apiFetch('/api/tenant/ledger/company-ledgers');
      let combined = [];
      if (companyRes.ok) {
        combined = combined.concat(await companyRes.json());
      }

      const promises = projects.map(async (p) => {
        const res = await apiFetch(`/api/tenant/ledger/project-ledgers/${p.id}`);
        if (res.ok) return await res.json();
        return [];
      });
      const projsLedgers = await Promise.all(promises);
      projsLedgers.forEach(list => {
        combined = combined.concat(list);
      });

      // Deduplicate by ledgerCode
      const unique = [];
      const seen = new Set();
      for (const item of combined) {
        if (!seen.has(item.ledgerCode)) {
          seen.add(item.ledgerCode);
          unique.push(item);
        }
      }

      setAllLedgerAccounts(unique);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAllLedgers(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'ledger') {
      fetchAllLedgerAccounts();
    }
  }, [activeTab, projects]);

  // Load Project Ledgers List (Image 2 table data)
  const fetchProjectLedgers = async (projectId: string) => {
    try {
      setLoadingProjectLedgers(true);
      const res = await apiFetch(`/api/tenant/ledger/project-ledgers/${projectId}`);
      if (res.ok) setProjectLedgers(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProjectLedgers(false);
    }
  };

  useEffect(() => {
    if (selectedProjectPl) {
      fetchProjectLedgers(selectedProjectPl);
    }
  }, [selectedProjectPl]);

  useEffect(() => {
    if (projects.length > 0) {
      setCreateLedgerForm(prev => ({
        ...prev,
        projectId: prev.projectId || projects[0].id
      }));
    }
  }, [projects]);

  // Load Project P&L summary list client-side
  useEffect(() => {
    if ((activeTab === 'project-costing' || (activeTab === 'ledger' && activeLedgerSubTab === 'dashboard')) && projects.length > 0) {
      setLoadingProjectsPl(true);
      const plPromises = projects.map(async (p) => {
        try {
          const res = await apiFetch(`/api/tenant/ledger/project/${p.id}`);
          if (res.ok) {
            const data = await res.json();
            return {
              id: p.id,
              project_id: p.id,
              name: p.name,
              totalCost: data.totalCost || 0,
              revenue: data.revenue?.invoicesRaised || 0,
              net: data.profitLoss || 0
            };
          }
        } catch (e) {
          console.error(e);
        }
        return { id: p.id, project_id: p.id, name: p.name, totalCost: 0, revenue: 0, net: 0 };
      });
      Promise.all(plPromises).then(data => {
        setAllProjectsPl(data);
        setLoadingProjectsPl(false);
      });
    }
  }, [activeTab, activeLedgerSubTab, projects]);

  // Load selected project's cost history
  const fetchProjectHistory = async (projectId: string) => {
    setLoadingProjectHistory(true);
    try {
      const res = await apiFetch(`/api/tenant/ledger/project/${projectId}/history`);
      if (res.ok) {
        setProjectHistory(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProjectHistory(false);
    }
  };

  useEffect(() => {
    if (selectedProjectPl) {
      fetchProjectHistory(selectedProjectPl);
    }
  }, [selectedProjectPl]);

  // General Post Helper using apiFetch
  const handlePost = async (endpoint: string, body: any, onSucc: () => void) => {
    try {
      const res = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(body)
      });
      if (res.ok) {
        alert('Operation recorded successfully!');
        onSucc();
        fetchDashboardData();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error || 'Failed to record entry'}`);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Reversals Execution
  const triggerReversal = () => {
    if (!reversalForm.entryId || !reversalForm.reason.trim()) {
      alert('Voucher entry and reason are required.');
      return;
    }
    const endpoint = `/api/tenant/ledger/${reversalForm.type}/entry/${reversalForm.entryId}/reverse`;
    handlePost(endpoint, { reason: reversalForm.reason }, () => {
      setReversalModalOpen(false);
      setReversalForm({ type: 'petty-cash', entryId: '', voucherNo: '', reason: '' });
      loadMasterData();
    });
  };

  // Helper to trigger reversal modal with pre-filled row ID
  const openReversalConfirmation = (type: 'petty-cash' | 'client' | 'vendor' | 'employee' | 'stock', entryId: string, voucherNo: string) => {
    setReversalForm({
      type,
      entryId,
      voucherNo,
      reason: ''
    });
    setReversalModalOpen(true);
  };

  // Stock issue allocations validation
  const validateSplits = () => {
    const qty = Number(stockTxForm.quantity || 0);
    if (qty <= 0) return 'Please specify a valid quantity first.';

    if (stockTxForm.splitType === 'percentage') {
      const totalPct = stockTxForm.splits.reduce((acc, split) => acc + Number(split.splitValue || 0), 0);
      if (totalPct !== 100) return `Splits total must equal exactly 100%. Currently: ${totalPct}%`;
    } else {
      const totalQty = stockTxForm.splits.reduce((acc, split) => acc + Number(split.splitValue || 0), 0);
      if (totalQty > qty) return `Splits total quantity (${totalQty}) cannot exceed total issued quantity (${qty})`;
    }
    return null;
  };

  // Client-Side Statement Filters Applicator
  const getFilteredStatement = (statement: any[]) => {
    return (statement || []).filter(tx => {
      // 1. Text Search
      if (filterSearch.trim()) {
        const q = filterSearch.toLowerCase();
        const voucher = (tx.voucher_no || tx.reference_no || '').toLowerCase();
        const note = (tx.note || '').toLowerCase();
        const category = (tx.category || '').toLowerCase();
        const party = (tx.linked_party || '').toLowerCase();
        if (!voucher.includes(q) && !note.includes(q) && !category.includes(q) && !party.includes(q)) {
          return false;
        }
      }
      // 2. Date presets
      if (filterDate !== 'all') {
        const txTime = new Date(tx.date).getTime();
        const now = Date.now();
        if (filterDate === 'today') {
          if (new Date(tx.date).toDateString() !== new Date().toDateString()) return false;
        } else if (filterDate === 'week') {
          if (txTime < now - 7 * 24 * 3600 * 1000) return false;
        } else if (filterDate === 'month') {
          if (txTime < now - 30 * 24 * 3600 * 1000) return false;
        }
      }
      // 3. Type credit/debit
      if (filterType !== 'all') {
        const visuals = getTransactionVisuals(tx.type || tx.transaction_type, tx.status);
        if (filterType === 'credit' && visuals.sign !== '+') return false;
        if (filterType === 'debit' && visuals.sign !== '-') return false;
      }
      // 4. Project
      if (filterProject !== 'all') {
        const tag = (tx.project_tag || tx.project_id || '').toLowerCase();
        if (tag !== filterProject.toLowerCase()) return false;
      }
      return true;
    });
  };

  // Reusable Empty State CTA Card Renderer
  const renderEmptyState = (
    title: string,
    description: string,
    buttonLabel?: string,
    onActionClick?: () => void,
    icon: React.ComponentType<any> = Info
  ) => {
    const Icon = icon;
    return (
      <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-8 text-center space-y-4 max-w-md mx-auto my-6 shadow-sm">
        <div className="p-3.5 bg-blue-50 text-blue-600 rounded-full w-fit mx-auto">
          <Icon size={20} />
        </div>
        <div className="space-y-1">
          <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider">{title}</h3>
          <p className="text-[11px] text-slate-400 font-bold leading-normal">{description}</p>
        </div>
        {buttonLabel && onActionClick && (
          <button
            onClick={onActionClick}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-colors shadow-sm inline-block"
          >
            {buttonLabel}
          </button>
        )}
      </div>
    );
  };

  // Onboarding Setup Wizard View
  const renderSetupWizard = () => {
    return (
      <div className="space-y-6 max-w-xl mx-auto py-8">

        {/* Progress header */}
        <div className="text-center space-y-2 mb-8">
          <div className="inline-block px-3 py-1 bg-blue-50 text-blue-600 font-extrabold text-[10px] uppercase tracking-wider rounded-full">
            Step {wizardStep} of 3
          </div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">
            {wizardStep === 1 && "Add your first Bank or Cash account"}
            {wizardStep === 2 && "Set up a Petty Cash float (Optional)"}
            {wizardStep === 3 && "You're all set up!"}
          </h2>
          <p className="text-xs text-slate-400 font-semibold max-w-sm mx-auto">
            {wizardStep === 1 && "Create a bank account or cash book to begin recording deposits, withdrawals, and payouts."}
            {wizardStep === 2 && "Optionally allocate a site-level petty cash float to a team custodian member."}
            {wizardStep === 3 && "Your starting cash books and initial ledger accounts have been successfully configured."}
          </p>
        </div>

        {/* Wizard Steps Content */}
        {wizardStep === 1 && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
            <div className="space-y-2">
              <span className="text-[9px] font-black uppercase text-slate-400 block">ACCOUNT NAME</span>
              <input
                type="text"
                placeholder="e.g. SBI Main / Project Cash"
                value={wizardBankForm.name}
                onChange={e => setWizardBankForm({ ...wizardBankForm, name: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold bg-white focus:outline-none focus:border-slate-800"
              />
            </div>

            <div className="space-y-2">
              <span className="text-[9px] font-black uppercase text-slate-400 block">ACCOUNT TYPE</span>
              <select
                value={wizardBankForm.type}
                onChange={e => setWizardBankForm({ ...wizardBankForm, type: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold bg-white focus:outline-none focus:border-slate-800"
              >
                <option value="Bank">Bank Account</option>
                <option value="Cash">Cash Account (Cash Book)</option>
              </select>
            </div>

            <div className="space-y-2">
              <span className="text-[9px] font-black uppercase text-slate-400 block">OPENING BALANCE</span>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-extrabold text-xs">₹</span>
                <input
                  type="number"
                  placeholder="0"
                  value={wizardBankForm.openingBalance}
                  onChange={e => setWizardBankForm({ ...wizardBankForm, openingBalance: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-black focus:outline-none focus:border-slate-800"
                />
              </div>
            </div>

            <button
              onClick={async () => {
                if (!wizardBankForm.name.trim()) {
                  alert('Please enter an account name.');
                  return;
                }
                const res = await apiFetch('/api/tenant/ledger/bank-cash/accounts', {
                  method: 'POST',
                  body: JSON.stringify(wizardBankForm)
                });
                if (res.ok) {
                  setWizardStep(2);
                } else {
                  const err = await res.json();
                  alert(`Error: ${err.error || 'Failed to create account'}`);
                }
              }}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              Setup Account &amp; Continue <ChevronRight size={14} />
            </button>
          </div>
        )}

        {wizardStep === 2 && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
            <div className="space-y-2">
              <span className="text-[9px] font-black uppercase text-slate-400 block">CHOOSE CUSTODIAN</span>
              <select
                value={wizardPettyForm.custodianId}
                onChange={e => setWizardPettyForm({ ...wizardPettyForm, custodianId: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold bg-white focus:outline-none focus:border-slate-800"
              >
                <option value="">-- Choose Team Member --</option>
                {custodians.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <span className="text-[9px] font-black uppercase text-slate-400 block">ASSIGNED WORK SITE</span>
              <select
                value={wizardPettyForm.siteId}
                onChange={e => setWizardPettyForm({ ...wizardPettyForm, siteId: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold bg-white focus:outline-none focus:border-slate-800"
              >
                <option value="">-- Choose Work Site --</option>
                {worksites.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <span className="text-[9px] font-black uppercase text-slate-400 block">FLOAT AMOUNT</span>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-extrabold text-xs">₹</span>
                <input
                  type="number"
                  placeholder="0"
                  value={wizardPettyForm.openingAmount}
                  onChange={e => setWizardPettyForm({ ...wizardPettyForm, openingAmount: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-black focus:outline-none focus:border-slate-800"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setWizardStep(3)}
                className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 text-slate-750 text-slate-700 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all"
              >
                Skip This Step
              </button>
              <button
                onClick={async () => {
                  if (!wizardPettyForm.custodianId || !wizardPettyForm.siteId || Number(wizardPettyForm.openingAmount) <= 0) {
                    alert('Please select a custodian, a site, and specify a float amount, or click Skip.');
                    return;
                  }
                  const res = await apiFetch('/api/tenant/ledger/petty-cash/float', {
                    method: 'POST',
                    body: JSON.stringify(wizardPettyForm)
                  });
                  if (res.ok) {
                    setWizardStep(3);
                  } else {
                    const err = await res.json();
                    alert(`Error: ${err.error || 'Failed to allocate float'}`);
                  }
                }}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm"
              >
                Allocate &amp; Continue
              </button>
            </div>
          </div>
        )}

        {wizardStep === 3 && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
            <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-wider">ONBOARDING DETAILS SUMMARY</h4>
            <div className="space-y-2 divide-y divide-slate-200/60">
              <div className="flex justify-between py-2 text-xs">
                <span className="font-bold text-slate-500">1. Primary Cash Book</span>
                <span className="font-black text-slate-850 text-slate-800">
                  {wizardBankForm.name} (₹{Number(wizardBankForm.openingBalance).toLocaleString('en-IN')})
                </span>
              </div>
              <div className="flex justify-between py-2 text-xs">
                <span className="font-bold text-slate-500">2. Petty Cash Float</span>
                <span className="font-black text-slate-850 text-slate-800">
                  {wizardPettyForm.custodianId
                    ? `Allocated ₹${Number(wizardPettyForm.openingAmount).toLocaleString('en-IN')}`
                    : 'Not Allocated (Skipped)'}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setOnboardingComplete(true);
                loadMasterData();
              }}
              className="w-full py-3 bg-slate-900 hover:bg-black text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
            >
              Go to Dashboard <ChevronRight size={14} />
            </button>
          </div>
        )}

      </div>
    );
  };

  // Common YONO SBI Card layout renderer
  const renderYonoAccountCard = (
    key: string | number,
    title: string,
    subtitle: string,
    balance: number,
    isSelected: boolean,
    onClick: () => void,
    balanceLabel: string = 'Available Balance',
    icon: React.ComponentType<any> = Wallet,
    isOverdrawn: boolean = false
  ) => {
    const Icon = icon;
    return (
      <div
        key={key}
        onClick={onClick}
        className={`w-full md:w-[280px] p-5 rounded-2xl border transition-all cursor-pointer shadow-sm flex flex-col justify-between h-40 select-none ${isSelected
          ? 'border-slate-900 bg-slate-900 text-white ring-2 ring-slate-900 ring-offset-2'
          : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
          }`}
      >
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isSelected ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}>
              <Icon size={16} />
            </div>
            <div>
              <h4 className="text-xs font-black tracking-tight line-clamp-1">{title}</h4>
              <p className={`text-[9px] uppercase font-bold mt-0.5 ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>{subtitle}</p>
            </div>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
        </div>

        <div>
          <p className={`text-2xl font-black tracking-tight ${isOverdrawn ? 'text-rose-500' : isSelected ? 'text-white' : 'text-slate-900'}`}>
            ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className={`text-[10px] font-bold ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>{balanceLabel}</span>
        </div>

        <div className="flex justify-between items-center border-t border-dashed pt-2 mt-2 border-slate-700/30">
          <span className="text-[9px] font-black uppercase tracking-wider">Statement feed</span>
          <ChevronRight size={10} />
        </div>
      </div>
    );
  };

  // Shared Transaction Feed Renderer
  const renderTransactionFeed = (
    statement: any[],
    type: 'petty-cash' | 'client' | 'vendor' | 'employee' | 'stock' | 'bank' | 'project'
  ) => {
    const filtered = getFilteredStatement(statement);
    const groups = groupTransactionsByDate(filtered);

    if (filtered.length === 0) {
      return (
        <div className="text-center py-16 bg-slate-50 border border-slate-200/50 rounded-2xl text-slate-400 text-xs font-bold">
          No transactions matching selected filters.
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {Object.keys(groups).map(dateKey => (
          <div key={dateKey} className="space-y-2">

            {/* Group Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm py-1.5 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 z-10">
              {dateKey}
            </div>

            {/* Group items feed */}
            <div className="space-y-1">
              {groups[dateKey].map((tx: any) => {
                const visuals = getTransactionVisuals(tx.type || tx.transaction_type, tx.status);
                const VisualIcon = visuals.icon;
                const isExpanded = expandedTxId === tx.id;

                return (
                  <div
                    key={tx.id || tx.voucher_no || Math.random().toString()}
                    className="border border-slate-100 rounded-xl hover:bg-slate-50 transition-all overflow-hidden"
                  >

                    {/* Collapsed Feed Row */}
                    <div
                      onClick={() => setExpandedTxId(isExpanded ? null : tx.id)}
                      className="p-4 flex items-center justify-between cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-full ${visuals.bgClass}`}>
                          <VisualIcon size={14} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-800">
                            {tx.category || tx.type || tx.transaction_type}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                            {tx.voucher_no || tx.reference_no || 'VOUCHER'} · {tx.project_tag || tx.project_id || 'Overhead'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className={`text-xs font-black ${visuals.textClass}`}>
                          {visuals.sign}₹{Number(tx.amount || tx.value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                        {tx.running_balance !== undefined && (
                          <p className="text-[9px] text-slate-400 font-semibold mt-0.5">
                            Bal: ₹{Number(tx.running_balance).toLocaleString('en-IN')}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Expanded Row Detail Sub-panel */}
                    {isExpanded && (
                      <div className="bg-slate-50 border-t border-slate-100 p-4 space-y-3 text-xs text-slate-600 font-medium">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-[9px] font-black uppercase text-slate-400 block">Voucher Reference</span>
                            <span className="font-extrabold text-slate-800">{tx.voucher_no || tx.reference_no || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-black uppercase text-slate-400 block">Transaction Type</span>
                            <span className="font-extrabold text-slate-800">{tx.type || tx.transaction_type}</span>
                          </div>
                        </div>

                        <div>
                          <span className="text-[9px] font-black uppercase text-slate-400 block">Note / Memorandum</span>
                          <p className="text-slate-700 italic mt-0.5">"{tx.note || 'No notes attached to this transaction.'}"</p>
                        </div>

                        {tx.status !== 'Reversed' && type !== 'bank' && type !== 'project' && (
                          <div className="flex justify-end border-t border-slate-200/60 pt-2.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openReversalConfirmation(type as any, tx.id, tx.voucher_no || tx.reference_no);
                              }}
                              className="px-3 py-1.5 bg-red-50 text-rose-600 hover:bg-rose-100 text-[10px] font-black rounded-lg transition-colors flex items-center gap-1.5"
                            >
                              <RefreshCw size={11} /> Reverse Transaction
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>

          </div>
        ))}
      </div>
    );
  };

  // Shared Filter Bar Component
  const renderFilterBar = (showProject: boolean = true) => {
    return (
      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/50 flex flex-col md:flex-row gap-3 items-center">

        {/* Search */}
        <div className="relative w-full md:flex-1">
          <Search size={14} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search memo, reference..."
            value={filterSearch}
            onChange={e => setFilterSearch(e.target.value)}
            className="w-full border border-slate-200 bg-white rounded-xl pl-9 pr-3 py-2 text-xs font-bold focus:outline-none"
          />
        </div>

        {/* Date presets */}
        <select
          value={filterDate}
          onChange={e => setFilterDate(e.target.value as any)}
          className="w-full md:w-36 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none bg-white"
        >
          <option value="all">Date: All time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>

        {/* In/Out */}
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value as any)}
          className="w-full md:w-36 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none bg-white"
        >
          <option value="all">Type: All</option>
          <option value="credit">Money In</option>
          <option value="debit">Money Out</option>
        </select>

        {/* Project Tag */}
        {showProject && (
          <select
            value={filterProject}
            onChange={e => setFilterProject(e.target.value)}
            className="w-full md:w-40 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none bg-white"
          >
            <option value="all">Project: All</option>
            <option value="Overhead">Overhead</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}

      </div>
    );
  };

  return (
    <div className="w-full min-h-[500px]">
      {loading ? (
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : showWizard ? (
        renderSetupWizard()
      ) : (
        <div className="space-y-6">


          {/* 1. LEDGER TAB */}
          {activeTab === 'ledger' && (
            inspectingLedgerCode ? (
              <div className="space-y-6">
                {/* Breadcrumbs / Back navigation */}
                <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                  <button
                    onClick={() => setInspectingLedgerCode(null)}
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    ← Back to Ledgers
                  </button>
                  <ChevronRight size={10} className="text-slate-350" />
                  <span className="text-slate-600">Ledger Profile Inspector</span>
                </div>

                {(() => {
                  const currentLedger = allLedgerAccounts.find(l => l.ledgerCode === inspectingLedgerCode);
                  if (!currentLedger) return null;

                  let ledgerTitle = 'GENERAL TRANSACTION LEDGER';
                  if (currentLedger.type === 'Payable') ledgerTitle = 'ACCOUNTS PAYABLE LEDGER';
                  else if (currentLedger.type === 'Receivable') ledgerTitle = 'ACCOUNTS RECEIVABLE LEDGER';
                  else if (currentLedger.type === 'Expense') ledgerTitle = 'EXPENSE DIRECTORY LEDGER';
                  else if (currentLedger.type === 'Bank' || currentLedger.type === 'Cash') ledgerTitle = 'BANK & CASH REGISTER';

                  return (
                    <div className="space-y-6">
                      {/* Clean slate/white inspect header matching the premium dashboard styling */}
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
                        <div>
                          <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">{currentLedger.name || ledgerTitle}</h2>
                          <p className="text-xs text-slate-400 font-semibold mt-0.5">Voucher entry registry for account code <span className="font-mono font-bold text-blue-600">{currentLedger.ledgerCode}</span></p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2.5">
                          <button
                            onClick={() => {
                              setQuickTxForm({
                                ledgerCode: currentLedger.ledgerCode,
                                direction: 'Credit',
                                docType: 'Income',
                                amount: '',
                                date: new Date().toISOString().split('T')[0],
                                description: '',
                                projectId: currentLedger.project_id || 'Overhead',
                                siteId: '',
                                offsetLedgerCode: allLedgerAccounts.find(acc => acc.ledgerCode !== currentLedger.ledgerCode)?.ledgerCode || '',
                                billRef: '',
                                linkedVoucherNo: '',
                                extraNotes: ''
                              });
                              setActiveTab('record-ledger');
                            }}
                            className="px-4 py-2 bg-emerald-600 text-white font-black text-xs uppercase tracking-wider rounded-xl hover:bg-emerald-700 shadow-sm flex items-center gap-1.5 transition-all"
                          >
                            <Plus size={12} /> + Add Income
                          </button>
                          <button
                            onClick={() => {
                              setQuickTxForm({
                                ledgerCode: currentLedger.ledgerCode,
                                direction: 'Debit',
                                docType: 'Expenditure',
                                amount: '',
                                date: new Date().toISOString().split('T')[0],
                                description: '',
                                projectId: currentLedger.project_id || 'Overhead',
                                siteId: '',
                                offsetLedgerCode: allLedgerAccounts.find(acc => acc.ledgerCode !== currentLedger.ledgerCode)?.ledgerCode || '',
                                billRef: '',
                                linkedVoucherNo: '',
                                extraNotes: ''
                              });
                              setActiveTab('record-ledger');
                            }}
                            className="px-4 py-2 bg-rose-600 text-white font-black text-xs uppercase tracking-wider rounded-xl hover:bg-rose-700 shadow-sm flex items-center gap-1.5 transition-all"
                          >
                            <Plus size={12} /> + Add Expenditure
                          </button>
                        </div>
                      </div>

                      {/* Date Filter Bar & Sub-tab segment switcher */}
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-slate-50 border border-slate-200/80 p-3 rounded-2xl">
                        {/* Sub-tabs */}
                        <div className="flex gap-2">
                          {[
                            { id: 'overview', label: 'Overview' },
                            { id: 'income', label: 'Income' },
                            { id: 'expense', label: 'Expenditure' }
                          ].map(sub => (
                            <button
                              key={sub.id}
                              onClick={() => setInspectorSubTab(sub.id as any)}
                              className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${inspectorSubTab === sub.id
                                ? 'bg-slate-900 text-white shadow-sm'
                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                }`}
                            >
                              {sub.label}
                            </button>
                          ))}
                        </div>

                        {/* Calendar & Date Preset Controls */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <Calendar size={12} className="text-slate-500" /> Filter Date:
                          </span>
                          <select
                            value={inspectorDatePreset}
                            onChange={e => setInspectorDatePreset(e.target.value as any)}
                            className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold bg-white text-slate-800 focus:outline-none focus:border-slate-800 shadow-sm"
                          >
                            <option value="this_month">This Month</option>
                            <option value="last_month">Last Month</option>
                            <option value="today">Today</option>
                            <option value="this_week">This Week</option>
                            <option value="all">All Time</option>
                            <option value="custom">Custom Range</option>
                          </select>

                          {inspectorDatePreset === 'custom' && (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="date"
                                value={inspectorFromDate}
                                onChange={e => setInspectorFromDate(e.target.value)}
                                className="border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-bold bg-white focus:outline-none"
                              />
                              <span className="text-xs text-slate-400 font-bold">to</span>
                              <input
                                type="date"
                                value={inspectorToDate}
                                onChange={e => setInspectorToDate(e.target.value)}
                                className="border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-bold bg-white focus:outline-none"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 1. OVERVIEW SUB-TAB */}
                      {inspectorSubTab === 'overview' && (
                        <div className="space-y-6">
                          {/* 5 Target Metric Cards: Ledger Code, Ledger Name, Total Income, Total Expenditure, Remaining Balance */}
                          {(() => {
                            const now = new Date();
                            const currentYear = now.getFullYear();
                            const currentMonth = now.getMonth();

                            const filteredEntries = inspectingLedgerEntries.filter((e: any) => {
                              if (!e.date) return true;
                              const entryDate = new Date(e.date);

                              if (inspectorDatePreset === 'this_month') {
                                return entryDate.getFullYear() === currentYear && entryDate.getMonth() === currentMonth;
                              }
                              if (inspectorDatePreset === 'last_month') {
                                const lmDate = new Date(currentYear, currentMonth - 1, 1);
                                return entryDate.getFullYear() === lmDate.getFullYear() && entryDate.getMonth() === lmDate.getMonth();
                              }
                              if (inspectorDatePreset === 'today') {
                                const todayStr = now.toISOString().split('T')[0];
                                return e.date.startsWith(todayStr);
                              }
                              if (inspectorDatePreset === 'this_week') {
                                const startOfWeek = new Date(now);
                                startOfWeek.setDate(now.getDate() - now.getDay());
                                startOfWeek.setHours(0, 0, 0, 0);
                                return entryDate >= startOfWeek;
                              }
                              if (inspectorDatePreset === 'custom') {
                                let valid = true;
                                if (inspectorFromDate) valid = valid && entryDate >= new Date(inspectorFromDate + 'T00:00:00');
                                if (inspectorToDate) valid = valid && entryDate <= new Date(inspectorToDate + 'T23:59:59');
                                return valid;
                              }
                              return true;
                            });

                            const opening = Number(currentLedger.opening_balance || 0);
                            const totalIncome = filteredEntries.reduce((sum, e) => sum + Number(e.credit_amount || 0), 0) + (inspectorDatePreset === 'all' ? opening : 0);
                            const totalExpenditure = filteredEntries.reduce((sum, e) => sum + Number(e.debit_amount || 0), 0);
                            const remainingBalance = totalIncome - totalExpenditure;

                            return (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                                <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Ledger Code</span>
                                  <span className="text-xs font-black text-blue-600 mt-1 block font-mono">
                                    {currentLedger.ledgerCode}
                                  </span>
                                </div>

                                <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Ledger Name</span>
                                  <span className="text-xs font-black text-slate-900 mt-1 block truncate">
                                    {currentLedger.name}
                                  </span>
                                </div>

                                <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Total Income</span>
                                  <span className="text-sm font-black text-emerald-600 mt-1 block">
                                    ₹{totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>

                                <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Total Expenditure</span>
                                  <span className="text-sm font-black text-rose-600 mt-1 block">
                                    ₹{totalExpenditure.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                              </div>
                            );
                          })()}



                          {/* Overview Postings: Project-Wise Financial Summary */}
                          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                              <div>
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Project-Wise Allocation &amp; Expenditure Breakdown</h3>
                                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Summary of total income received, expenditure spent, and remaining balance grouped by project.</p>
                              </div>
                            </div>

                            <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
                              <table className="w-full text-left border-collapse min-w-[900px]">
                                <thead>
                                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                                    <th className="p-3.5 w-12 text-center">#</th>
                                    <th className="p-3.5">Project Name</th>
                                    <th className="p-3.5">Project Scope</th>
                                    <th className="p-3.5">Worksite / Location</th>
                                    <th className="p-3.5 text-right">Total Income (₹)</th>
                                    <th className="p-3.5 text-right">Total Expenditure (₹)</th>
                                    <th className="p-3.5 text-center">Total Vouchers</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                                  {loadingInspectEntries ? (
                                    <tr>
                                      <td colSpan={7} className="p-12 text-center text-slate-400 font-semibold">
                                        Loading project breakdown...
                                      </td>
                                    </tr>
                                  ) : (() => {
                                    const now = new Date();
                                    const currentYear = now.getFullYear();
                                    const currentMonth = now.getMonth();

                                    const filtered = inspectingLedgerEntries.filter((e: any) => {
                                      if (!e.date) return true;
                                      const entryDate = new Date(e.date);
                                      if (inspectorDatePreset === 'this_month') return entryDate.getFullYear() === currentYear && entryDate.getMonth() === currentMonth;
                                      if (inspectorDatePreset === 'last_month') {
                                        const lmDate = new Date(currentYear, currentMonth - 1, 1);
                                        return entryDate.getFullYear() === lmDate.getFullYear() && entryDate.getMonth() === lmDate.getMonth();
                                      }
                                      if (inspectorDatePreset === 'today') return e.date.startsWith(now.toISOString().split('T')[0]);
                                      if (inspectorDatePreset === 'this_week') {
                                        const sow = new Date(now); sow.setDate(now.getDate() - now.getDay()); sow.setHours(0, 0, 0, 0);
                                        return entryDate >= sow;
                                      }
                                      if (inspectorDatePreset === 'custom') {
                                        let valid = true;
                                        if (inspectorFromDate) valid = valid && entryDate >= new Date(inspectorFromDate + 'T00:00:00');
                                        if (inspectorToDate) valid = valid && entryDate <= new Date(inspectorToDate + 'T23:59:59');
                                        return valid;
                                      }
                                      return true;
                                    });

                                    // Group by project + worksite combination
                                    const projectMap: { [key: string]: { id: string; name: string; siteName: string; income: number; expense: number; count: number } } = {};
                                    const opening = Number(currentLedger.opening_balance || 0);

                                    filtered.forEach((e: any) => {
                                      const pId = e.project_id || currentLedger.project_id || 'Overhead';
                                      const pObj = projects.find(p => String(p.id) === String(pId));
                                      const pName = pObj?.name || (pId === 'Overhead' ? 'General Overhead' : pId);
                                      const sName = worksites.find(s => String(s.id) === String(e.site_id))?.name || e.site_id || (pId === 'Overhead' ? 'Head Office' : 'Main Site');
                                      const groupKey = `${pId}_${sName}`;

                                      if (!projectMap[groupKey]) {
                                        projectMap[groupKey] = { id: pId, name: pName, siteName: sName, income: 0, expense: 0, count: 0 };
                                      }
                                      projectMap[groupKey].income += Number(e.credit_amount || 0);
                                      projectMap[groupKey].expense += Number(e.debit_amount || 0);
                                      projectMap[groupKey].count += 1;
                                    });

                                    // Ensure primary project is included if list is empty
                                    const mainPId = currentLedger.project_id || 'Overhead';
                                    const mainSName = mainPId === 'Overhead' ? 'Head Office' : 'Main Site';
                                    const mainGroupKey = `${mainPId}_${mainSName}`;
                                    if (Object.keys(projectMap).length === 0) {
                                      const mainPObj = projects.find(p => String(p.id) === String(mainPId));
                                      const mainPName = mainPObj?.name || (mainPId === 'Overhead' ? 'General Overhead' : mainPId);
                                      projectMap[mainGroupKey] = { id: mainPId, name: mainPName, siteName: mainSName, income: (inspectorDatePreset === 'all' ? opening : 0), expense: 0, count: 0 };
                                    } else if (inspectorDatePreset === 'all' && projectMap[mainGroupKey]) {
                                      projectMap[mainGroupKey].income += opening;
                                    }

                                    const projectList = Object.values(projectMap);

                                    if (projectList.length === 0) {
                                      return (
                                        <tr>
                                          <td colSpan={7} className="p-12 text-center text-slate-400 font-semibold">
                                            No project expenses recorded for the selected date filter.
                                          </td>
                                        </tr>
                                      );
                                    }

                                    return projectList.map((item, idx) => {
                                      return (
                                        <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                                          <td className="p-3.5 text-center font-mono text-slate-400">{idx + 1}</td>
                                          <td className="p-3.5 font-black text-slate-900">{item.name}</td>
                                          <td className="p-3.5">
                                            <span className="text-[10px] font-black uppercase bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-100">
                                              {item.id === 'Overhead' ? 'Overhead Scope' : `Project #${item.id}`}
                                            </span>
                                          </td>
                                          <td className="p-3.5 font-bold text-slate-600">
                                            {item.siteName}
                                          </td>
                                          <td className="p-3.5 text-right font-black text-emerald-600">
                                            ₹{item.income.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                          </td>
                                          <td className="p-3.5 text-right font-black text-rose-600">
                                            ₹{item.expense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                          </td>
                                          <td className="p-3.5 text-center">
                                            <span className="bg-slate-100 text-slate-700 font-extrabold px-2.5 py-1 rounded-lg text-[10px]">
                                              {item.count} {item.count === 1 ? 'Voucher' : 'Vouchers'}
                                            </span>
                                          </td>
                                        </tr>
                                      );
                                    });
                                  })()}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 2. INCOME SUB-TAB */}
                      {inspectorSubTab === 'income' && (
                        <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
                          <table className="w-full text-left border-collapse min-w-[950px]">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                                <th className="p-3.5 w-8"></th>
                                <th className="p-3.5">Date</th>
                                <th className="p-3.5">Voucher #</th>
                                <th className="p-3.5">Project</th>
                                <th className="p-3.5">Worksite / Location</th>
                                <th className="p-3.5 text-right">Total Amount (₹)</th>
                                <th className="p-3.5 text-right">Amount Paid (₹)</th>
                                <th className="p-3.5 text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-655">
                              {(() => {
                                const isLinkedNote = (e: any) => Boolean(e.description && (e.description.includes('Linked Voucher:') || e.description.includes('against Voucher')));
                                const incomeEntries = inspectingLedgerEntries.filter((e: any) => Number(e.credit_amount || 0) > 0 && !isLinkedNote(e));
                                if (loadingInspectEntries) {
                                  return (
                                    <tr>
                                      <td colSpan={8} className="p-12 text-center text-slate-400 font-semibold">
                                        Loading income entries...
                                      </td>
                                    </tr>
                                  );
                                }
                                if (incomeEntries.length === 0) {
                                  return (
                                    <tr>
                                      <td colSpan={8} className="p-12 text-center text-slate-400 font-semibold">
                                        No income entries recorded for this ledger profile.
                                      </td>
                                    </tr>
                                  );
                                }
                                return incomeEntries.map((e: any, idx: number) => {
                                  const rowId = e.id || `inc-${idx}`;
                                  const isExpanded = expandedInspectRowId === rowId;
                                  const credit = Number(e.credit_amount || 0);
                                  const debit = Number(e.debit_amount || 0);
                                  const totalAmt = credit;
                                  const amtPaid = debit;
                                  const remAmt = totalAmt - amtPaid;
                                  const projName = projects.find(p => p.id === (e.project_id || currentLedger.project_id))?.name || (e.project_id || currentLedger.project_id || 'Overhead');
                                  const siteName = worksites.find(s => String(s.id) === String(e.site_id))?.name || e.site_id || 'Head Office / Main Site';
                                  const voucherNo = e.voucher_no || `INC-${idx}`;
                                  const isPaid = e.status === 'PAID' || Boolean(e.paid_date);

                                  const linkedNotes = inspectingLedgerEntries.filter((adj: any) => adj.id !== e.id && adj.description && voucherNo && adj.description.includes(voucherNo));
                                  const totalAdjAmt = linkedNotes.reduce((sum: number, a: any) => sum + Number(a.debit_amount || a.credit_amount || 0), 0);

                                  return (
                                    <React.Fragment key={rowId}>
                                      <tr
                                        onClick={() => setExpandedInspectRowId(isExpanded ? null : rowId)}
                                        className={`cursor-pointer transition-colors ${isExpanded ? 'bg-indigo-50/60 font-extrabold' : 'hover:bg-slate-50/40'}`}
                                      >
                                        <td className="p-3.5 text-slate-400">
                                          {isExpanded ? <ChevronUp size={14} className="text-indigo-600" /> : <ChevronDown size={14} />}
                                        </td>
                                        <td className="p-3.5">{new Date(e.date || new Date()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                        <td className="p-3.5 font-black text-slate-900">
                                          {voucherNo}
                                          {linkedNotes.length > 0 && (
                                            <span className="ml-2 px-1.5 py-0.5 bg-teal-100 text-teal-800 text-[9px] font-black uppercase rounded border border-teal-200">
                                              +{linkedNotes.length} Note
                                            </span>
                                          )}
                                        </td>
                                        <td className="p-3.5 font-extrabold text-blue-900">{projName}</td>
                                        <td className="p-3.5 font-bold text-slate-700">{siteName}</td>
                                        <td className="p-3.5 text-right font-black text-slate-900">
                                          ₹{(totalAmt + totalAdjAmt).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="p-3.5 text-right font-black text-rose-600">
                                          ₹{(amtPaid + totalAdjAmt).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="p-3.5 text-center" onClick={(evt) => evt.stopPropagation()}>
                                          {isPaid ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase rounded-lg">
                                              <CheckCircle size={10} className="text-emerald-600" /> PAID
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black uppercase rounded-lg">
                                              <Clock size={10} className="text-amber-600" /> INVOICE RAISED
                                            </span>
                                          )}
                                        </td>
                                      </tr>

                                      {/* Accordion Sub-Row Drawer */}
                                      {isExpanded && (
                                        <tr className="bg-indigo-50/30 border-b border-indigo-100">
                                          <td colSpan={8} className="p-4">
                                            <div className="bg-white border border-indigo-100 rounded-xl p-4 space-y-4 shadow-sm">
                                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-2 gap-2">
                                                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                                  Income Receipt Accordion Details
                                                </span>
                                                <div className="flex items-center gap-2">
                                                  <button
                                                    onClick={() => {
                                                      setSelectedInvoiceTx({ ...e, voucherNo, projName, totalAmt, amtPaid, remAmt });
                                                      setInvoiceModalOpen(true);
                                                    }}
                                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-wider rounded-lg shadow-sm flex items-center gap-1 transition-all"
                                                  >
                                                    <FileText size={11} /> View &amp; Print Invoice PDF
                                                  </button>

                                                  {!isPaid ? (
                                                    <button
                                                      onClick={() => {
                                                        setPaidFormTx({ ...e, voucherNo, projName, totalAmt });
                                                        setPaidDateInput(new Date().toISOString().split('T')[0]);
                                                        setPaidModalOpen(true);
                                                      }}
                                                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider rounded-lg shadow-sm flex items-center gap-1 transition-all"
                                                    >
                                                      <CheckCircle size={11} /> Mark as Paid
                                                    </button>
                                                  ) : (
                                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase rounded-lg flex items-center gap-1">
                                                      <CheckCircle size={11} className="text-emerald-600" /> Paid on {e.paid_date || 'Record Date'}
                                                    </span>
                                                  )}
                                                </div>
                                              </div>

                                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-1 border-b border-slate-100 pb-3">
                                                <div>
                                                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Voucher Reference</span>
                                                  <span className="font-extrabold text-slate-900">{voucherNo}</span>
                                                </div>
                                                <div>
                                                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Project Scope</span>
                                                  <span className="font-extrabold text-blue-900">{projName}</span>
                                                </div>
                                                <div>
                                                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Worksite / Location</span>
                                                  <span className="font-bold text-slate-700">{siteName}</span>
                                                </div>
                                                <div>
                                                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Invoice Status</span>
                                                  <span className={`font-black uppercase ${isPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                    {isPaid ? `PAID (${e.paid_date || 'Recorded'})` : 'INVOICE RAISED (UNPAID)'}
                                                  </span>
                                                </div>
                                              </div>

                                              {/* Itemized Original & Credit Note Adjustment Table */}
                                              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                                                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                                                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">
                                                    Transaction &amp; Adjustment Breakdown Particulars
                                                  </span>
                                                  <span className="text-xs font-black text-slate-900">
                                                    Combined Net Total: ₹{(totalAmt + totalAdjAmt).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                  </span>
                                                </div>

                                                <table className="w-full text-left text-xs border-collapse">
                                                  <thead>
                                                    <tr className="bg-white border-b border-slate-200 text-[9px] font-black uppercase text-slate-500 tracking-wider">
                                                      <th className="p-2">Type</th>
                                                      <th className="p-2">Posting Date</th>
                                                      <th className="p-2">Voucher #</th>
                                                      <th className="p-2">Description / Particulars</th>
                                                      <th className="p-2 text-right">Amount (₹)</th>
                                                    </tr>
                                                  </thead>
                                                  <tbody className="divide-y divide-slate-200 font-bold text-slate-800 bg-white">
                                                    {/* Original Income Receipt */}
                                                    <tr>
                                                      <td className="p-2">
                                                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9px] font-black uppercase rounded">
                                                          Original Income
                                                        </span>
                                                      </td>
                                                      <td className="p-2">{new Date(e.date || new Date()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                                      <td className="p-2 font-mono font-black text-slate-900">{voucherNo}</td>
                                                      <td className="p-2 text-slate-800">{e.description || e.note || 'Original income deposit entry'}</td>
                                                      <td className="p-2 text-right font-black text-slate-900">₹{totalAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                                    </tr>

                                                    {/* Linked Credit Notes */}
                                                    {linkedNotes.map((adj: any, aIdx: number) => {
                                                      const aAmt = Number(adj.debit_amount || adj.credit_amount || 0);
                                                      return (
                                                        <tr key={adj.id || aIdx} className="bg-teal-50/60 text-teal-950">
                                                          <td className="p-2">
                                                            <span className="px-2 py-0.5 bg-teal-100 text-teal-900 border border-teal-300 text-[9px] font-black uppercase rounded">
                                                              Credit Note
                                                            </span>
                                                          </td>
                                                          <td className="p-2">{new Date(adj.date || new Date()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                                          <td className="p-2 font-mono font-black text-teal-900">{adj.voucher_no || `CN-${aIdx}`}</td>
                                                          <td className="p-2 text-teal-950 font-extrabold">{adj.description}</td>
                                                          <td className="p-2 text-right font-black text-teal-900">+₹{aAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                                        </tr>
                                                      );
                                                    })}
                                                  </tbody>
                                                </table>
                                              </div>
                                            </div>
                                          </td>
                                        </tr>
                                      )}
                                    </React.Fragment>
                                  );
                                });
                              })()}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* 3. EXPENSE SUB-TAB */}
                      {inspectorSubTab === 'expense' && (
                        <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
                          <table className="w-full text-left border-collapse min-w-[950px]">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                                <th className="p-3.5 w-8"></th>
                                <th className="p-3.5">Date</th>
                                <th className="p-3.5">Voucher #</th>
                                <th className="p-3.5">Project</th>
                                <th className="p-3.5">Worksite / Location</th>
                                <th className="p-3.5 text-right">Total Amount (₹)</th>
                                <th className="p-3.5 text-right">Expense Paid (₹)</th>
                                <th className="p-3.5 text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-655">
                              {(() => {
                                const isLinkedNote = (e: any) => Boolean(e.description && (e.description.includes('Linked Voucher:') || e.description.includes('against Voucher')));
                                const expenseEntries = inspectingLedgerEntries.filter((e: any) => Number(e.debit_amount || 0) > 0 && !isLinkedNote(e));
                                if (loadingInspectEntries) {
                                  return (
                                    <tr>
                                      <td colSpan={8} className="p-12 text-center text-slate-400 font-semibold">
                                        Loading expense entries...
                                      </td>
                                    </tr>
                                  );
                                }
                                if (expenseEntries.length === 0) {
                                  return (
                                    <tr>
                                      <td colSpan={8} className="p-12 text-center text-slate-400 font-semibold">
                                        No expense entries recorded for this ledger profile.
                                      </td>
                                    </tr>
                                  );
                                }
                                return expenseEntries.map((e: any, idx: number) => {
                                  const rowId = e.id || `exp-${idx}`;
                                  const isExpanded = expandedInspectRowId === rowId;
                                  const debit = Number(e.debit_amount || 0);
                                  const credit = Number(e.credit_amount || 0);
                                  const opening = Number(currentLedger.opening_balance || 0);
                                  const totalAmt = credit > 0 ? credit : (opening > 0 ? opening : debit);
                                  const amtPaid = debit;
                                  const remAmt = totalAmt - amtPaid;
                                  const projName = projects.find(p => p.id === (e.project_id || currentLedger.project_id))?.name || (e.project_id || currentLedger.project_id || 'Overhead');
                                  const siteName = worksites.find(s => String(s.id) === String(e.site_id))?.name || e.site_id || 'Head Office / Main Site';
                                  const voucherNo = e.voucher_no || `EXP-${idx}`;
                                  const isPaid = e.status === 'PAID' || Boolean(e.paid_date);

                                  const linkedNotes = inspectingLedgerEntries.filter((adj: any) => adj.id !== e.id && adj.description && voucherNo && adj.description.includes(voucherNo));
                                  const totalAdjAmt = linkedNotes.reduce((sum: number, a: any) => sum + Number(a.debit_amount || a.credit_amount || 0), 0);

                                  return (
                                    <React.Fragment key={rowId}>
                                      <tr
                                        onClick={() => setExpandedInspectRowId(isExpanded ? null : rowId)}
                                        className={`cursor-pointer transition-colors ${isExpanded ? 'bg-indigo-50/60 font-extrabold' : 'hover:bg-slate-50/40'}`}
                                      >
                                        <td className="p-3.5 text-slate-400">
                                          {isExpanded ? <ChevronUp size={14} className="text-indigo-600" /> : <ChevronDown size={14} />}
                                        </td>
                                        <td className="p-3.5">{new Date(e.date || new Date()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                        <td className="p-3.5 font-black text-slate-900">
                                          {voucherNo}
                                          {linkedNotes.length > 0 && (
                                            <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-black uppercase rounded border border-amber-200">
                                              +{linkedNotes.length} Note
                                            </span>
                                          )}
                                        </td>
                                        <td className="p-3.5 font-extrabold text-blue-900">{projName}</td>
                                        <td className="p-3.5 font-bold text-slate-700">{siteName}</td>
                                        <td className="p-3.5 text-right font-black text-slate-900">
                                          ₹{(totalAmt + totalAdjAmt).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="p-3.5 text-right font-black text-rose-600">
                                          ₹{(amtPaid + totalAdjAmt).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="p-3.5 text-center" onClick={(evt) => evt.stopPropagation()}>
                                          {isPaid ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase rounded-lg">
                                              <CheckCircle size={10} className="text-emerald-600" /> PAID
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black uppercase rounded-lg">
                                              <Clock size={10} className="text-amber-600" /> INVOICE RAISED
                                            </span>
                                          )}
                                        </td>
                                      </tr>

                                      {/* Accordion Sub-Row Drawer */}
                                      {isExpanded && (
                                        <tr className="bg-indigo-50/30 border-b border-indigo-100">
                                          <td colSpan={8} className="p-4">
                                            <div className="bg-white border border-indigo-100 rounded-xl p-4 space-y-4 shadow-sm">
                                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-2 gap-2">
                                                <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                                                  Expenditure Payment Accordion Details
                                                </span>
                                                <div className="flex items-center gap-2">
                                                  <button
                                                    onClick={() => {
                                                      setSelectedInvoiceTx({ ...e, voucherNo, projName, totalAmt, amtPaid, remAmt });
                                                      setInvoiceModalOpen(true);
                                                    }}
                                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-wider rounded-lg shadow-sm flex items-center gap-1 transition-all"
                                                  >
                                                    <FileText size={11} /> View &amp; Print Invoice PDF
                                                  </button>

                                                  {!isPaid ? (
                                                    <button
                                                      onClick={() => {
                                                        setPaidFormTx({ ...e, voucherNo, projName, totalAmt });
                                                        setPaidDateInput(new Date().toISOString().split('T')[0]);
                                                        setPaidModalOpen(true);
                                                      }}
                                                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider rounded-lg shadow-sm flex items-center gap-1 transition-all"
                                                    >
                                                      <CheckCircle size={11} /> Mark as Paid
                                                    </button>
                                                  ) : (
                                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase rounded-lg flex items-center gap-1">
                                                      <CheckCircle size={11} className="text-emerald-600" /> Paid on {e.paid_date || 'Record Date'}
                                                    </span>
                                                  )}
                                                </div>
                                              </div>

                                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-1 border-b border-slate-100 pb-3">
                                                <div>
                                                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Voucher Reference</span>
                                                  <span className="font-extrabold text-slate-900">{voucherNo}</span>
                                                </div>
                                                <div>
                                                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Project Scope</span>
                                                  <span className="font-extrabold text-blue-900">{projName}</span>
                                                </div>
                                                <div>
                                                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Worksite / Location</span>
                                                  <span className="font-bold text-slate-700">{siteName}</span>
                                                </div>
                                                <div>
                                                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Invoice Status</span>
                                                  <span className={`font-black uppercase ${isPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                    {isPaid ? `PAID (${e.paid_date || 'Recorded'})` : 'INVOICE RAISED (UNPAID)'}
                                                  </span>
                                                </div>
                                              </div>

                                              {/* Itemized Original & Debit Note Adjustment Table */}
                                              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                                                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                                                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">
                                                    Transaction &amp; Adjustment Breakdown Particulars
                                                  </span>
                                                  <span className="text-xs font-black text-slate-900">
                                                    Combined Net Total: ₹{(totalAmt + totalAdjAmt).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                  </span>
                                                </div>

                                                <table className="w-full text-left text-xs border-collapse">
                                                  <thead>
                                                    <tr className="bg-white border-b border-slate-200 text-[9px] font-black uppercase text-slate-500 tracking-wider">
                                                      <th className="p-2">Type</th>
                                                      <th className="p-2">Posting Date</th>
                                                      <th className="p-2">Voucher #</th>
                                                      <th className="p-2">Description / Particulars</th>
                                                      <th className="p-2 text-right">Amount (₹)</th>
                                                    </tr>
                                                  </thead>
                                                  <tbody className="divide-y divide-slate-200 font-bold text-slate-800 bg-white">
                                                    {/* Original Invoice */}
                                                    <tr>
                                                      <td className="p-2">
                                                        <span className="px-2 py-0.5 bg-rose-50 text-rose-800 border border-rose-200 text-[9px] font-black uppercase rounded">
                                                          Original Expense
                                                        </span>
                                                      </td>
                                                      <td className="p-2">{new Date(e.date || new Date()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                                      <td className="p-2 font-mono font-black text-slate-900">{voucherNo}</td>
                                                      <td className="p-2 text-slate-800">{e.description || e.note || 'Original expense payment entry'}</td>
                                                      <td className="p-2 text-right font-black text-slate-900">₹{totalAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                                    </tr>

                                                    {/* Linked Debit Notes */}
                                                    {linkedNotes.map((adj: any, aIdx: number) => {
                                                      const aAmt = Number(adj.debit_amount || adj.credit_amount || 0);
                                                      return (
                                                        <tr key={adj.id || aIdx} className="bg-amber-50/60 text-amber-950">
                                                          <td className="p-2">
                                                            <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-black uppercase rounded">
                                                              Debit Note
                                                            </span>
                                                          </td>
                                                          <td className="p-2">{new Date(adj.date || new Date()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                                          <td className="p-2 font-mono font-black text-amber-900">{adj.voucher_no || `DN-${aIdx}`}</td>
                                                          <td className="p-2 text-amber-950 font-extrabold">{adj.description}</td>
                                                          <td className="p-2 text-right font-black text-amber-900">+₹{aAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                                        </tr>
                                                      );
                                                    })}
                                                  </tbody>
                                                </table>
                                              </div>
                                            </div>
                                          </td>
                                        </tr>
                                      )}
                                    </React.Fragment>
                                  );
                                });
                              })()}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="space-y-6">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Expense Directory Ledger</h1>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">Debit &amp; Credit note register for all expense ledger accounts.</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        if (confirm('Are you sure you want to delete all mock ledger data? This will clear all ledger profiles and entries so you can start 100% fresh.')) {
                          try {
                            const res = await apiFetch('/api/tenant/ledger/purge-all', { method: 'POST' });
                            if (res.ok) {
                              alert('All mock ledger profiles deleted successfully. Starting fresh!');
                              setAllLedgerAccounts([]);
                              setCompanyLedgers([]);
                              setProjectLedgers([]);
                              loadMasterData();
                            }
                          } catch (e: any) {
                            alert('Error: ' + e.message);
                          }
                        }
                      }}
                      className="px-4 py-2.5 bg-rose-50 border border-rose-200 text-rose-600 font-black text-xs uppercase tracking-wider rounded-xl hover:bg-rose-100 shadow-sm flex items-center gap-1.5 transition-all"
                    >
                      <Trash2 size={14} /> Purge All Mock Data
                    </button>
                    <button
                      onClick={() => {
                        setCreateLedgerForm(prev => ({
                          ...prev,
                          ledgerCode: 'LDG-' + String(allLedgerAccounts.length + 1).padStart(3, '0')
                        }));
                        setActiveTab('create-ledger');
                      }}
                      className="px-5 py-2.5 bg-slate-900 text-white font-black text-xs uppercase tracking-wider rounded-xl hover:opacity-90 shadow-md flex items-center gap-1.5 transition-all"
                    >
                      <Plus size={14} /> Create Ledger Profile
                    </button>
                  </div>
                </div>

                {/* Filters Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                  <div className="flex flex-wrap items-center gap-3 flex-1">
                    <div className="relative flex-1 max-w-xs">
                      <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search accounts..."
                        value={searchLedgerQuery}
                        onChange={e => setSearchLedgerQuery(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold focus:outline-none focus:border-slate-800 bg-slate-50"
                      />
                    </div>

                    <select
                      value={filterLedgerStatus}
                      onChange={e => setFilterLedgerStatus(e.target.value)}
                      className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold bg-white focus:outline-none focus:border-slate-800"
                    >
                      <option value="All Status">Status: All</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Expense Ledger Cards */}
                {loadingAllLedgers ? (
                  <div className="py-12 text-center text-xs font-semibold text-slate-455">
                    Loading expense ledger directory...
                  </div>
                ) : (() => {
                  // Only show Expense-type ledgers
                  const expenseLedgers = allLedgerAccounts.filter(l => {
                    const matchesSearch = l.name.toLowerCase().includes(searchLedgerQuery.toLowerCase()) ||
                      l.ledgerCode.toLowerCase().includes(searchLedgerQuery.toLowerCase());
                    const matchesStatus = filterLedgerStatus === 'All Status' || l.status === filterLedgerStatus;
                    return matchesSearch && matchesStatus && (l.type === 'Expense' || l.company_category || l.companyCategory);
                  });

                  const renderCard = (l: any) => {
                    const projName = projects.find(p => p.id === l.project_id)?.name || l.project_id || 'Company';

                    return (
                      <div
                        key={l.id}
                        onClick={(e) => {
                          if ((e.target as HTMLElement).closest('button')) return;
                          setInspectingLedgerCode(l.ledgerCode);
                        }}
                        className="cursor-pointer bg-white border border-slate-200 hover:border-slate-850 hover:bg-slate-50/20 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3">
                          {/* Top row: Code & Project Tag */}
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-md">
                              {l.ledgerCode}
                            </span>
                            <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50/50 px-2 py-0.5 rounded-md border border-blue-100">
                              {projName}
                            </span>
                          </div>

                          {/* Name & Type */}
                          <div className="space-y-1">
                            <h3 className="text-xs font-black text-slate-900 leading-snug">{l.name}</h3>
                            <div className="flex items-center gap-2">
                              <span className="inline-block font-black text-[9px] px-2 py-0.5 rounded-md border uppercase bg-rose-50 text-rose-600 border-rose-100">
                                Expense
                              </span>
                              <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">
                                {l.department || 'Operations'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Balance & CTA */}
                        <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                          <div>
                            <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Current Balance</span>
                            <span className="text-sm font-black text-slate-900 block mt-0.5">
                              ₹{Number(l.currentBalance || l.current_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              setQuickTxForm({
                                ledgerCode: l.ledgerCode,
                                direction: 'Debit',
                                amount: '',
                                date: new Date().toISOString().split('T')[0],
                                description: '',
                                projectId: l.project_id || 'Overhead',
                                offsetLedgerCode: allLedgerAccounts.find(acc => acc.ledgerCode !== l.ledgerCode)?.ledgerCode || ''
                              });
                              setQuickTxModalOpen(true);
                            }}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors text-[10px] uppercase tracking-wider shadow-sm"
                          >
                            Record Entry
                          </button>
                        </div>
                      </div>
                    );
                  };

                  return (
                    <div className="space-y-4">
                      {/* Section Header */}
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                        <span className="w-1.5 h-4 bg-blue-600 rounded-full"></span>
                        <h2 className="text-xs font-black uppercase text-slate-700 tracking-wider">Ledger Profiles</h2>
                        <span className="ml-auto text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                          {expenseLedgers.length} Accounts
                        </span>
                      </div>

                      {expenseLedgers.length === 0 ? (
                        <div className="text-center py-10 text-xs text-slate-400 font-semibold bg-slate-50/50 rounded-2xl border border-slate-150 space-y-2">
                          <p>No expense ledger accounts found.</p>
                          <button
                            onClick={() => setActiveTab('create-ledger')}
                            className="text-blue-600 font-black underline text-xs"
                          >
                            + Create your first expense ledger
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                          {expenseLedgers.map(renderCard)}
                        </div>
                      )}
                    </div>
                  );
                })()}





              </div>
            ))}



          {/* ASSETS & LIABILITIES TAB (FIXED ASSETS REGISTRY, RECEIVABLES & PAYABLES) */}
          {activeTab === 'assets-liabilities' && (() => {
            // Real registered fixed assets list from state
            const activeAssetsList = assets || [];

            // Calculate straight line depreciation & book values
            let totalOriginalCost = 0;
            let totalAccumulatedDepreciation = 0;
            let totalNetBookValue = 0;

            const assetsWithDepreciation = activeAssetsList.map((ast: any) => {
              const cost = Number(ast.purchaseCost || ast.cost || 0);
              const salvage = Number(ast.salvageValue || 0);
              const lifeYears = Number(ast.usefulLifeYears || ast.useful_life_years || 10);
              const pYear = ast.purchaseDate ? new Date(ast.purchaseDate).getFullYear() : 2024;
              const currentYear = new Date().getFullYear();
              const yearsElapsed = Math.max(0, currentYear - pYear);
              
              const annualDep = lifeYears > 0 ? Math.max(0, (cost - salvage) / lifeYears) : 0;
              const accumDep = Math.min(cost - salvage, annualDep * yearsElapsed);
              const bookVal = Math.max(salvage, cost - accumDep);

              totalOriginalCost += cost;
              totalAccumulatedDepreciation += accumDep;
              totalNetBookValue += bookVal;

              return { ...ast, cost, salvage, lifeYears, annualDep, accumDep, bookVal };
            });

            // Calculate real financial totals
            const totalReceivablesPending = clients.reduce((sum, c) => sum + Number(c.outstanding || c.currentBalance || 0), 0) || Number(clientOutstanding || 0);
            const totalPayablesPending = vendors.reduce((sum, v) => sum + Number(v.outstanding || v.currentBalance || 0), 0) || Number(vendorOutstanding || 0);
            const netCompanyBalance = (totalNetBookValue + totalReceivablesPending) - totalPayablesPending;

            return (
              <div className="space-y-8">
                {/* Header Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-5 gap-4">
                  <div>
                    <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2.5">
                      <Scale size={24} className="text-indigo-600" /> Assets &amp; Liabilities Directory
                    </h1>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">Fixed capital assets registry, straight-line depreciation, accounts receivable (clients), and accounts payable (vendors)</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setAssetModalOpen(true)}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2"
                    >
                      <Plus size={15} /> + Add Asset Registry
                    </button>
                  </div>
                </div>

                {/* Sub-tab Switcher Pills */}
                <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit border border-slate-200">
                  <button
                    onClick={() => setActiveAssetsSubTab('assets')}
                    className={`px-5 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                      activeAssetsSubTab === 'assets' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Fixed Assets Register
                  </button>
                  <button
                    onClick={() => setActiveAssetsSubTab('receivables')}
                    className={`px-5 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                      activeAssetsSubTab === 'receivables' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Accounts Receivable (Clients)
                  </button>
                  <button
                    onClick={() => setActiveAssetsSubTab('payables')}
                    className={`px-5 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                      activeAssetsSubTab === 'payables' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Accounts Payable (Vendors)
                  </button>
                </div>

                {/* Top 4 KPI Metric Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                  {/* Card 1: Total Company Net Asset Balance */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Net Asset Balance</span>
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                        <Scale size={18} />
                      </div>
                    </div>
                    <div>
                      <p className={`text-2xl font-black ${netCompanyBalance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                        ₹{netCompanyBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold mt-1">Total Assets minus Total Liabilities</p>
                    </div>
                  </div>

                  {/* Card 2: Pending Income / Uncollected Receivables */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Pending Income (Receivables)</span>
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                        <TrendingUp size={18} />
                      </div>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-emerald-700">
                        ₹{totalReceivablesPending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                        ✓ Uncollected client billing outstandings
                      </p>
                    </div>
                  </div>

                  {/* Card 3: Total Spent & Payables */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Spent &amp; Payables</span>
                      <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                        <ArrowUp size={18} />
                      </div>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-rose-700">
                        ₹{totalPayablesPending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-[10px] text-rose-600 font-bold mt-1">Vendor outstandings &amp; material payables</p>
                    </div>
                  </div>

                  {/* Card 4: Capital Assets Net Book Value */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Fixed Capital Assets Valuation</span>
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                        <Briefcase size={18} />
                      </div>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-blue-950">
                        ₹{totalNetBookValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold mt-1">Accumulated straight-line book value</p>
                    </div>
                  </div>
                </div>

                {/* Sub-Tab 1: Fixed Assets Register */}
                {activeAssetsSubTab === 'assets' && (
                  <div className="space-y-6">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4 gap-3">
                        <div>
                          <h3 className="text-sm font-black text-slate-900 uppercase flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-600"></span> Fixed Assets Registry &amp; Straight-Line Depreciation
                          </h3>
                          <p className="text-xs text-slate-500 font-semibold mt-0.5">Log capital equipment purchases and verify straight-line depreciation book values</p>
                        </div>

                        <button
                          onClick={() => setAssetModalOpen(true)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                        >
                          <Plus size={14} /> + Add Asset Registry
                        </button>
                      </div>

                      {/* Assets Table or Empty State */}
                      {assetsWithDepreciation.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200 space-y-3">
                          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl mx-auto flex items-center justify-center border border-indigo-100">
                            <Briefcase size={22} />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-900 uppercase">No assets registered yet</h4>
                            <p className="text-xs text-slate-400 font-semibold mt-1">Register machinery, fleet vehicles, or office equipment to track accumulated straight-line book values.</p>
                          </div>
                          <button
                            onClick={() => setAssetModalOpen(true)}
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all inline-flex items-center gap-1.5"
                          >
                            <Plus size={15} /> + Add Asset Registry
                          </button>
                        </div>
                      ) : (
                        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-black uppercase text-slate-500 tracking-wider">
                                <th className="p-3.5">Asset Name &amp; Serial #</th>
                                <th className="p-3.5">Category</th>
                                <th className="p-3.5">Purchase Date</th>
                                <th className="p-3.5 text-right">Original Cost (₹)</th>
                                <th className="p-3.5 text-right">Accum. Dep. (₹)</th>
                                <th className="p-3.5 text-right">Net Book Value (₹)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-bold text-slate-800 bg-white">
                              {assetsWithDepreciation.map((a: any) => (
                                <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="p-3.5 font-black text-slate-900">
                                    <div>
                                      {a.name}
                                      <span className="text-[10px] text-slate-400 font-mono font-normal block">S/N: {a.serialNo || a.id}</span>
                                    </div>
                                  </td>
                                  <td className="p-3.5">
                                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[9px] font-black uppercase rounded">
                                      {a.category}
                                    </span>
                                  </td>
                                  <td className="p-3.5 text-slate-600">{a.purchaseDate}</td>
                                  <td className="p-3.5 text-right font-mono text-slate-900">₹{a.cost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                  <td className="p-3.5 text-right font-mono text-rose-600">-₹{a.accumDep.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                  <td className="p-3.5 text-right font-mono font-black text-emerald-700">₹{a.bookVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Sub-Tab 2: Accounts Receivable (Clients) */}
                {activeAssetsSubTab === 'receivables' && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-sm">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                      <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase">Accounts Receivable (Clients) Directory</h3>
                        <p className="text-xs text-slate-500 font-semibold">Track outstanding client billing, milestone receivables, and pending income</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {(clients.length > 0 ? clients : [
                        { id: 'c1', name: 'National Highways Authority (NHAI)', project: 'Tech Park Highway Overpass', outstanding: 1250000 },
                        { id: 'c2', name: 'Telangana Metro Rail Corp', project: 'Metro Line Phase-2', outstanding: 850000 },
                        { id: 'c3', name: 'Urban Infra Developers Ltd', project: 'Residential Tower Scope', outstanding: 450000 }
                      ]).map((c: any, idx: number) => (
                        <div key={c.id || idx} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-2xs">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              PENDING RECEIVABLE
                            </span>
                            <span className="text-[10px] font-mono font-bold text-slate-400">CL-00{idx + 1}</span>
                          </div>

                          <div>
                            <h4 className="text-sm font-black text-slate-900">{c.name}</h4>
                            <p className="text-[10px] text-blue-900 font-extrabold mt-0.5">Project: {c.project || 'General Scope'}</p>
                          </div>

                          <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Pending Income</span>
                            <span className="text-base font-black text-emerald-700">₹{Number(c.outstanding || 150000).toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sub-Tab 3: Accounts Payable (Vendors) */}
                {activeAssetsSubTab === 'payables' && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-sm">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                      <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase">Accounts Payable (Vendors) Directory</h3>
                        <p className="text-xs text-slate-500 font-semibold">Track outstanding vendor invoices, material supplier payables, and contractor bills</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {(vendors.length > 0 ? vendors : [
                        { id: 'v1', name: 'UltraTech Cement Ltd', category: 'Raw Materials', outstanding: 450000 },
                        { id: 'v2', name: 'Tata Steel TMT Rebar Suppliers', category: 'Structural Steel', outstanding: 680000 },
                        { id: 'v3', name: 'Deccan Earthmovers & Machinery', category: 'Equipment Hire', outstanding: 220000 }
                      ]).map((v: any, idx: number) => (
                        <div key={v.id || idx} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-2xs">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black uppercase text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                              PAYABLE DUE
                            </span>
                            <span className="text-[10px] font-mono font-bold text-slate-400">VND-00{idx + 1}</span>
                          </div>

                          <div>
                            <h4 className="text-sm font-black text-slate-900">{v.name}</h4>
                            <p className="text-[10px] text-slate-500 font-extrabold mt-0.5">Category: {v.category || 'Vendor Supplier'}</p>
                          </div>

                          <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Payable Due</span>
                            <span className="text-base font-black text-rose-700">₹{Number(v.outstanding || 85000).toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add Asset Registry Interactive Modal */}
                {assetModalOpen && (
                  <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-5 border border-slate-200 shadow-2xl animate-in fade-in zoom-in duration-200">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <h3 className="text-base font-black text-slate-900 uppercase flex items-center gap-2">
                          <Plus size={18} className="text-indigo-600" /> Register Capital Asset
                        </h3>
                        <button onClick={() => setAssetModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                          <X size={18} />
                        </button>
                      </div>

                      <div className="space-y-4 text-xs">
                        <div className="space-y-1.5">
                          <label className="font-extrabold uppercase text-slate-700 block">Asset Name / Description *</label>
                          <input
                            type="text"
                            placeholder="e.g. JCB Excavator 3DX / Tata Dumper"
                            value={assetForm.description}
                            onChange={e => setAssetForm({ ...assetForm, description: e.target.value })}
                            className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 font-bold focus:outline-none focus:border-slate-900"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="font-extrabold uppercase text-slate-700 block">Original Purchase Cost (₹) *</label>
                            <input
                              type="number"
                              placeholder="0.00"
                              value={assetForm.purchaseCost}
                              onChange={e => setAssetForm({ ...assetForm, purchaseCost: e.target.value })}
                              className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 font-bold focus:outline-none focus:border-slate-900"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="font-extrabold uppercase text-slate-700 block">Purchase Date *</label>
                            <input
                              type="date"
                              value={assetForm.purchaseDate}
                              onChange={e => setAssetForm({ ...assetForm, purchaseDate: e.target.value })}
                              className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 font-bold focus:outline-none focus:border-slate-900"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="font-extrabold uppercase text-slate-700 block">Useful Life (Years)</label>
                            <input
                              type="number"
                              placeholder="10"
                              value={assetForm.usefulLifeYears}
                              onChange={e => setAssetForm({ ...assetForm, usefulLifeYears: e.target.value })}
                              className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 font-bold focus:outline-none focus:border-slate-900"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="font-extrabold uppercase text-slate-700 block">Assign Worksite Scope</label>
                            <select
                              value={assetForm.assignedProjectId}
                              onChange={e => setAssetForm({ ...assetForm, assignedProjectId: e.target.value })}
                              className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 font-bold bg-white focus:outline-none focus:border-slate-900"
                            >
                              <option value="">-- Main Storage Yard --</option>
                              {worksites.map(w => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                        <button
                          onClick={() => setAssetModalOpen(false)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            if (!assetForm.description || !assetForm.purchaseCost) {
                              alert('Please provide Asset Description and Purchase Cost.');
                              return;
                            }
                            const newAsset = {
                              id: 'ast-' + (assets.length + 10),
                              name: assetForm.description,
                              category: 'Machinery & Equipment',
                              purchaseCost: Number(assetForm.purchaseCost),
                              purchaseDate: assetForm.purchaseDate,
                              usefulLifeYears: Number(assetForm.usefulLifeYears || 10),
                              salvageValue: 0
                            };
                            setAssets(prev => [...prev, newAsset]);
                            setAssetModalOpen(false);
                            setAssetForm({ purchaseCost: '', description: '', purchaseDate: new Date().toISOString().split('T')[0], usefulLifeYears: '5', assignedProjectId: '' });
                            alert('Capital asset registered successfully in Fixed Assets Registry!');
                          }}
                          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-1.5"
                        >
                          <CheckCircle size={15} /> Save Capital Asset
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* 5. RECORD LEDGER ENTRY PAGE TAB (INLINE - NO MODAL BORDER OVERLAY) */}
          {activeTab === 'record-ledger' && (
            <div className="space-y-8">

              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-5 gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2.5">
                    <Clipboard size={24} className="text-blue-600" /> Record Ledger Entry
                  </h1>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">Post double-entry transaction voucher entries directly to account profiles</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveTab('ledger')}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider rounded-xl transition-all"
                  >
                    ← Return to Ledgers
                  </button>
                  <button
                    onClick={async () => {
                      if (!quickTxForm.amount || !quickTxForm.ledgerCode) {
                        alert('Please fill out all required transaction details.');
                        return;
                      }

                      const docPrefix = quickTxForm.docType && quickTxForm.docType !== 'Income' && quickTxForm.docType !== 'Expenditure' ? `[${quickTxForm.docType.toUpperCase()}] ` : '';
                      const linkedText = quickTxForm.linkedVoucherNo ? `[Linked Voucher: ${quickTxForm.linkedVoucherNo}] ` : '';
                      const fullDescription = [
                        docPrefix + linkedText + (quickTxForm.description || ''),
                        quickTxForm.billRef ? `[Bill Ref: ${quickTxForm.billRef}]` : '',
                        quickTxForm.extraNotes ? `[Note: ${quickTxForm.extraNotes}]` : ''
                      ].filter(Boolean).join(' ');

                      const res = await apiFetch('/api/tenant/ledger/quick-transaction', {
                        method: 'POST',
                        body: JSON.stringify({ ...quickTxForm, description: fullDescription })
                      });
                      if (res.ok) {
                        alert('Ledger entry recorded successfully!');
                        setActiveTab('ledger');
                        setQuickTxForm(prev => ({ ...prev, amount: '', description: '', billRef: '', linkedVoucherNo: '', extraNotes: '' }));
                        fetchAllLedgerAccounts();
                        if (inspectingLedgerCode) {
                          apiFetch('/api/tenant/ledger/entries/' + inspectingLedgerCode)
                            .then(r => r.json())
                            .then(data => setInspectingLedgerEntries(data || []))
                            .catch(console.error);
                        }
                        if (selectedProjectPl) {
                          fetchProjectHistory(selectedProjectPl);
                        }
                      } else {
                        const err = await res.json();
                        alert(err.error || 'Failed to record ledger entry');
                      }
                    }}
                    className="px-7 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2"
                  >
                    <CheckCircle size={16} /> Submit Transaction Entry
                  </button>
                </div>
              </div>

              {/* Top Posting Classification Radio Bar */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Document Type Selection</span>
                  <h3 className="text-sm font-black text-slate-900 uppercase mt-0.5">
                    {quickTxForm.direction === 'Credit' ? 'Income Document Type' : 'Expenditure Document Type'}
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {quickTxForm.direction === 'Credit' ? (
                    <>
                      <label className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border cursor-pointer font-extrabold text-xs transition-all ${quickTxForm.docType !== 'Credit Note' ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-xs' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                        <input
                          type="radio"
                          name="topDocTypeRadio"
                          checked={quickTxForm.docType !== 'Credit Note'}
                          onChange={() => setQuickTxForm({ ...quickTxForm, docType: 'Income', description: '' })}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>Regular Income Deposit</span>
                      </label>

                      <label className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border cursor-pointer font-extrabold text-xs transition-all ${quickTxForm.docType === 'Credit Note' ? 'bg-teal-50 border-teal-300 text-teal-900 shadow-xs' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                        <input
                          type="radio"
                          name="topDocTypeRadio"
                          checked={quickTxForm.docType === 'Credit Note'}
                          onChange={() => setQuickTxForm({ ...quickTxForm, docType: 'Credit Note', description: quickTxForm.description || 'Credit Note / Sales Return Adjustment' })}
                          className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                        />
                        <span>Credit Note (Return / Refund)</span>
                      </label>
                    </>
                  ) : (
                    <>
                      <label className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border cursor-pointer font-extrabold text-xs transition-all ${quickTxForm.docType !== 'Debit Note' ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-xs' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                        <input
                          type="radio"
                          name="topDocTypeRadio"
                          checked={quickTxForm.docType !== 'Debit Note'}
                          onChange={() => setQuickTxForm({ ...quickTxForm, docType: 'Expenditure', description: '' })}
                          className="w-4 h-4 text-rose-600 focus:ring-rose-500"
                        />
                        <span>Regular Expenditure Payment</span>
                      </label>

                      <label className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border cursor-pointer font-extrabold text-xs transition-all ${quickTxForm.docType === 'Debit Note' ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-xs' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                        <input
                          type="radio"
                          name="topDocTypeRadio"
                          checked={quickTxForm.docType === 'Debit Note'}
                          onChange={() => setQuickTxForm({ ...quickTxForm, docType: 'Debit Note', description: quickTxForm.description || 'Debit Note / Vendor Return Adjustment' })}
                          className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                        />
                        <span>Debit Note (Purchase Return / Vendor Debit)</span>
                      </label>
                    </>
                  )}
                </div>
              </div>

              {/* Section 1: Account & Transaction Scope */}
              <div className="bg-slate-50/80 p-6 rounded-3xl border border-slate-200/90 space-y-4 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">1. Account &amp; Transaction Scope</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-extrabold uppercase text-slate-700 block">Selected Ledger Account *</label>
                    <select
                      value={quickTxForm.ledgerCode}
                      disabled={true}
                      className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold bg-slate-100/90 text-slate-700 cursor-not-allowed shadow-2xs opacity-90"
                    >
                      {allLedgerAccounts.map(acc => (
                        <option key={acc.id} value={acc.ledgerCode}>{acc.name} ({acc.ledgerCode})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-extrabold uppercase text-slate-700 block">Accounting Direction *</label>
                    <input
                      type="text"
                      disabled={true}
                      value={quickTxForm.direction === 'Credit' ? 'Credit (Money In / Income / Credit Note)' : 'Debit (Money Out / Expense / Debit Note)'}
                      className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold bg-slate-100/90 text-slate-700 cursor-not-allowed shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Financial Amount & Allocation Scope */}
              <div className="bg-slate-50/80 p-6 rounded-3xl border border-slate-200/90 space-y-5 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">2. Financial Amount &amp; Site Allocation Scope</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-extrabold uppercase text-slate-700 block">
                      Enter Amount (₹) *
                    </label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={quickTxForm.amount}
                      onChange={e => setQuickTxForm({ ...quickTxForm, amount: e.target.value })}
                      className="w-full border border-slate-300 rounded-2xl px-4 py-3 text-sm font-black bg-white focus:outline-none focus:border-slate-900 shadow-2xs text-slate-900"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-extrabold uppercase text-slate-700 block">Posting Date *</label>
                    <input
                      type="date"
                      value={quickTxForm.date}
                      onChange={e => setQuickTxForm({ ...quickTxForm, date: e.target.value })}
                      className="w-full border border-slate-300 rounded-2xl px-4 py-3 text-sm font-bold bg-white focus:outline-none focus:border-slate-900 shadow-2xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                  <div className="space-y-2">
                    <label className="text-xs font-extrabold uppercase text-slate-700 block">Link to Project Scope</label>
                    <select
                      value={quickTxForm.projectId}
                      disabled={Boolean(quickTxForm.linkedVoucherNo)}
                      onChange={e => setQuickTxForm({ ...quickTxForm, projectId: e.target.value })}
                      className={`w-full border border-slate-300 rounded-2xl px-4 py-3 text-sm font-bold bg-white focus:outline-none focus:border-slate-900 shadow-2xs ${quickTxForm.linkedVoucherNo ? 'bg-slate-100 text-slate-600 cursor-not-allowed' : ''}`}
                    >
                      <option value="Overhead">Overhead (General Scope)</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-extrabold uppercase text-slate-700 block">Assign Worksite / Location</label>
                    <select
                      value={quickTxForm.siteId}
                      disabled={Boolean(quickTxForm.linkedVoucherNo)}
                      onChange={e => setQuickTxForm({ ...quickTxForm, siteId: e.target.value })}
                      className={`w-full border border-slate-300 rounded-2xl px-4 py-3 text-sm font-bold bg-white focus:outline-none focus:border-slate-900 shadow-2xs ${quickTxForm.linkedVoucherNo ? 'bg-slate-100 text-slate-600 cursor-not-allowed' : ''}`}
                    >
                      <option value="">Head Office / Overhead Site</option>
                      {worksites.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-extrabold uppercase text-slate-700 block">
                      Link Original Invoice / Voucher # {quickTxForm.docType === 'Debit Note' || quickTxForm.docType === 'Credit Note' ? '*' : '(Optional)'}
                    </label>
                    <select
                      value={quickTxForm.linkedVoucherNo || ''}
                      onChange={e => {
                        const selectedVNo = e.target.value;
                        const matchedTx = inspectingLedgerEntries.find((e: any, idx: number) => (e.voucher_no || `QT-${idx}`) === selectedVNo);
                        if (matchedTx) {
                          setQuickTxForm(prev => ({
                            ...prev,
                            linkedVoucherNo: selectedVNo,
                            projectId: matchedTx.project_id || prev.projectId,
                            siteId: matchedTx.site_id || prev.siteId,
                            billRef: matchedTx.voucher_no || selectedVNo,
                            description: `${prev.docType || 'Adjustment'} against Voucher ${selectedVNo}`
                          }));
                        } else {
                          setQuickTxForm(prev => ({ ...prev, linkedVoucherNo: selectedVNo }));
                        }
                      }}
                      className="w-full border border-slate-300 rounded-2xl px-4 py-3 text-sm font-bold bg-white focus:outline-none focus:border-slate-900 shadow-2xs"
                    >
                      <option value="">-- Direct Entry (No Linked Voucher) --</option>
                      {inspectingLedgerEntries.map((e: any, idx: number) => {
                        const vNo = e.voucher_no || `QT-${idx}`;
                        const amt = Number(e.debit_amount || e.credit_amount || 0);
                        const isExp = Number(e.debit_amount || 0) > 0;
                        return (
                          <option key={e.id || idx} value={vNo}>
                            {vNo} - {isExp ? 'Expenditure Invoice' : 'Income Receipt'} (₹{amt.toLocaleString('en-IN')})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Narration & External Reference Details */}
              <div className="bg-slate-50/80 p-6 rounded-3xl border border-slate-200/90 space-y-5 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">3. Transaction Narration &amp; External References</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Description Column */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-extrabold uppercase text-slate-700 block">Description / Narration</label>

                      {/* Toolbar */}
                      <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-300 shadow-2xs">
                        <button
                          type="button"
                          title="Add Numbered List"
                          onClick={() => setQuickTxForm(prev => ({
                            ...prev,
                            description: prev.description ? `${prev.description}\n1. ` : '1. '
                          }))}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 transition-colors"
                        >
                          <ListOrdered size={14} />
                        </button>

                        <button
                          type="button"
                          title="Add Bullet List"
                          onClick={() => setQuickTxForm(prev => ({
                            ...prev,
                            description: prev.description ? `${prev.description}\n• ` : '• '
                          }))}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 transition-colors"
                        >
                          <List size={14} />
                        </button>

                        <button
                          type="button"
                          title="Bold Text"
                          onClick={() => setQuickTxForm(prev => ({
                            ...prev,
                            description: prev.description ? `**${prev.description}**` : '**Bold Note**'
                          }))}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 font-black text-xs"
                        >
                          <Bold size={14} />
                        </button>

                        <button
                          type="button"
                          title="Italic Text"
                          onClick={() => setQuickTxForm(prev => ({
                            ...prev,
                            description: prev.description ? `_${prev.description}_` : '_Italic Note_'
                          }))}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 transition-colors"
                        >
                          <Italic size={14} />
                        </button>

                        <button
                          type="button"
                          title="Clear Text"
                          onClick={() => setQuickTxForm(prev => ({ ...prev, description: '' }))}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-rose-500 hover:text-rose-700 transition-colors"
                        >
                          <Eraser size={14} />
                        </button>
                      </div>
                    </div>

                    <textarea
                      rows={4}
                      placeholder="e.g. Purchase of 50 bags cement for main block&#10;1. Grade 53 OPC Cement&#10;2. Supplier Invoice #INV-889"
                      value={quickTxForm.description}
                      onChange={e => setQuickTxForm({ ...quickTxForm, description: e.target.value })}
                      className="w-full border border-slate-300 rounded-2xl p-4 text-xs font-bold bg-white focus:outline-none focus:border-slate-900 resize-none font-mono shadow-2xs"
                    />
                  </div>

                  {/* Beside Fields */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-extrabold uppercase text-slate-700 block flex items-center gap-1.5">
                          <Tag size={13} className="text-blue-600" /> Bill / Supplier Invoice Ref #
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowExtraNoteField(!showExtraNoteField)}
                          className="text-xs font-black text-blue-600 hover:underline uppercase flex items-center gap-1"
                        >
                          <Plus size={12} /> {showExtraNoteField ? 'Hide Field' : '+ Add Extra Field'}
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. INV-2026-9908"
                        value={quickTxForm.billRef}
                        onChange={e => setQuickTxForm({ ...quickTxForm, billRef: e.target.value })}
                        className="w-full border border-slate-300 rounded-2xl px-4 py-3 text-xs font-bold bg-white focus:outline-none focus:border-slate-900 shadow-2xs"
                      />
                    </div>

                    {showExtraNoteField ? (
                      <div className="space-y-2">
                        <label className="text-xs font-extrabold uppercase text-slate-700 block flex items-center gap-1.5">
                          <Paperclip size={13} className="text-indigo-600" /> Sub-Note / Internal Tag
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. PO-8892 / Approved by Site Engineer"
                          value={quickTxForm.extraNotes}
                          onChange={e => setQuickTxForm({ ...quickTxForm, extraNotes: e.target.value })}
                          className="w-full border border-slate-300 rounded-2xl px-4 py-3 text-xs font-bold bg-white focus:outline-none focus:border-slate-900 shadow-2xs"
                        />
                      </div>
                    ) : (
                      <div className="p-4 bg-white border border-dashed border-slate-300 rounded-2xl text-xs text-slate-500 font-semibold flex items-center justify-between shadow-2xs">
                        <span>Need additional reference or tag field?</span>
                        <button
                          type="button"
                          onClick={() => setShowExtraNoteField(true)}
                          className="text-blue-600 font-black hover:underline uppercase text-xs"
                        >
                          + Add Field
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Page Footer */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                <button
                  onClick={() => setActiveTab('ledger')}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider rounded-xl transition-all"
                >
                  ← Cancel &amp; Return to Ledgers
                </button>
                <button
                  onClick={async () => {
                    if (!quickTxForm.amount || !quickTxForm.ledgerCode) {
                      alert('Please fill out all required transaction details.');
                      return;
                    }

                    const fullDescription = [
                      quickTxForm.description,
                      quickTxForm.billRef ? `[Bill Ref: ${quickTxForm.billRef}]` : '',
                      quickTxForm.extraNotes ? `[Note: ${quickTxForm.extraNotes}]` : ''
                    ].filter(Boolean).join(' ');

                    const res = await apiFetch('/api/tenant/ledger/quick-transaction', {
                      method: 'POST',
                      body: JSON.stringify({ ...quickTxForm, description: fullDescription })
                    });
                    if (res.ok) {
                      alert('Ledger entry recorded successfully!');
                      setActiveTab('ledger');
                      setQuickTxForm(prev => ({ ...prev, amount: '', description: '', billRef: '', extraNotes: '' }));
                      fetchAllLedgerAccounts();
                      if (inspectingLedgerCode) {
                        apiFetch('/api/tenant/ledger/entries/' + inspectingLedgerCode)
                          .then(r => r.json())
                          .then(data => setInspectingLedgerEntries(data || []))
                          .catch(console.error);
                      }
                      if (selectedProjectPl) {
                        fetchProjectHistory(selectedProjectPl);
                      }
                    } else {
                      const err = await res.json();
                      alert(err.error || 'Failed to record ledger entry');
                    }
                  }}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center gap-2"
                >
                  <CheckCircle size={16} /> Submit Transaction Entry
                </button>
              </div>

            </div>
          )}

          {/* Printable Voucher & Tax Invoice PDF Modal */}
          {invoiceModalOpen && selectedInvoiceTx && (() => {
            const activeLedger = allLedgerAccounts.find(l => l.ledgerCode === selectedInvoiceTx.ledger_code) || allLedgerAccounts.find(l => l.ledgerCode === inspectingLedgerCode);
            return (
              <div className="fixed inset-0 bg-black/60 z-60 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
                <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl p-6 space-y-6 shadow-2xl relative my-8">

                  {/* Modal Top Actions (Hidden when printing) */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4 no-print gap-3">
                    <div>
                      <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <FileText size={18} className="text-blue-600" /> Executive GST Tax Invoice / Voucher Preview
                      </span>
                      <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Perfect A4 Printable Format (Auto-Scaled Margins &amp; Government e-Invoice Standards)</p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
                      {(() => {
                        const currentVNo = selectedInvoiceTx.voucherNo || selectedInvoiceTx.voucher_no;
                        const linkedAdjustments = inspectingLedgerEntries.filter((adj: any) => {
                          return adj.id !== selectedInvoiceTx.id && adj.description && currentVNo && adj.description.includes(currentVNo);
                        });
                        const baseAmt = Number(selectedInvoiceTx.debit_amount || selectedInvoiceTx.credit_amount || 0);
                        const adjTotal = linkedAdjustments.reduce((sum: number, a: any) => sum + Number(a.debit_amount || a.credit_amount || 0), 0);
                        const grandTotal = baseAmt + adjTotal;
                        const wordAmt = numToWords(grandTotal);

                        return (
                          <PDFDownloadLink
                            document={
                              <InvoicePdfDocument
                                tx={selectedInvoiceTx}
                                ledger={activeLedger}
                                linkedAdjustments={linkedAdjustments}
                                grandTotal={grandTotal}
                                amountInWords={wordAmt}
                              />
                            }
                            fileName={`Invoice_${selectedInvoiceTx.voucherNo || selectedInvoiceTx.voucher_no || 'VOUCHER'}.pdf`}
                            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 border border-emerald-400/30"
                          >
                            {({ loading }) => (loading ? 'Generating PDF...' : '📄 Download React PDF')}
                          </PDFDownloadLink>
                        );
                      })()}
                      <button
                        onClick={() => window.print()}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 border border-blue-400/30"
                      >
                        <Printer size={15} /> 🖨️ Print / Save PDF
                      </button>
                      <button
                        onClick={() => setInvoiceModalOpen(false)}
                        className="p-1.5 hover:bg-slate-200/80 rounded-full transition-colors text-slate-500 hover:text-slate-800"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>

                  {/* Printable Document Sheet Preview */}
                  <div id="printable-voucher-invoice" className="bg-white p-8 rounded-2xl border-2 border-slate-900 space-y-5 text-slate-900 font-sans shadow-2xl relative overflow-hidden">
                    <style dangerouslySetInnerHTML={{
                      __html: `
                      @media print {
                        @page {
                          size: A4 portrait;
                          margin: 0;
                        }
                        html, body {
                          width: 100% !important;
                          height: 100% !important;
                          margin: 0 !important;
                          padding: 0 !important;
                          background: #ffffff !important;
                          color: #000000 !important;
                          -webkit-print-color-adjust: exact !important;
                          print-color-adjust: exact !important;
                        }
                        body * { visibility: hidden; }
                        #printable-voucher-invoice, #printable-voucher-invoice * { visibility: visible; }
                        #printable-voucher-invoice {
                          position: absolute !important;
                          left: 0 !important;
                          top: 0 !important;
                          width: 100% !important;
                          max-width: 100% !important;
                          margin: 0 !important;
                          padding: 12mm 15mm !important;
                          border: none !important;
                          box-shadow: none !important;
                          border-radius: 0 !important;
                          box-sizing: border-box !important;
                        }
                        .no-print { display: none !important; }
                      }
                    ` }} />

                    {/* Top Enterprise Banner */}
                    <div className="bg-slate-900 text-white px-6 py-2 rounded-t-xl flex justify-between items-center text-[10px] font-black uppercase tracking-widest no-print">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>OFFICIAL GOVERNMENT E-INVOICE &amp; FINANCIAL VOUCHER</span>
                      </div>
                      <span>SYSTEM GENERATED AUDIT DOCUMENT</span>
                    </div>

                    {/* Header: Company Logo & Tax Registration Details */}
                    <div className="flex flex-col md:flex-row justify-between items-start border-b-2 border-slate-900 pb-5 gap-6">
                      {/* Left: Company Logo & Identity */}
                      <div className="flex items-start gap-4">
                        {/* Ultra-High-Definition SVG Company Logo Badge */}
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 p-3 text-white flex flex-col items-center justify-center shadow-xl shrink-0 border-2 border-amber-400/40 relative overflow-hidden">
                          <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:8px_8px] opacity-10"></div>
                          <svg className="w-10 h-10 text-amber-400 fill-current relative z-10" viewBox="0 0 24 24">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                            <path d="M12 4.5L5 8l7 3.5L19 8l-7-3.5z" />
                          </svg>
                          <span className="text-[8px] font-black tracking-widest text-amber-300 uppercase mt-0.5 relative z-10">INFRA360</span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">INFRAOPS360 CONSTRUCTIONS PVT LTD</h1>
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[8px] font-black uppercase rounded border border-amber-300">ISO 9001:2015 CERTIFIED</span>
                          </div>
                          <p className="text-xs font-bold text-slate-600">Civil Infrastructure Engineering, Building Contractors &amp; Heavy Site Operations</p>

                          <div className="flex flex-wrap items-center gap-3 text-[10px] font-extrabold text-slate-600 pt-0.5">
                            <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">GSTIN: <span className="font-mono font-black text-slate-900">36AAACI1234F1Z9</span></span>
                            <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">PAN: <span className="font-mono font-black text-slate-900">AAACI1234F</span></span>
                            <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">CIN: <span className="font-mono font-black text-slate-800">U45200TG2020PTC123456</span></span>
                          </div>

                          <p className="text-[10px] font-medium text-slate-500">Corporate HQ: Plot #102, Tech Park Highway, Hitec City, Hyderabad, Telangana - 500081</p>
                          <p className="text-[10px] font-medium text-slate-500">Phone: +91 40 2988 7700 | Web: www.infraops360.com | Email: accounts@infraops360.com</p>
                        </div>
                      </div>

                      {/* Right: Document Badges & e-Invoice IRN Verification QR */}
                      <div className="flex items-start gap-4 shrink-0 text-right self-stretch md:self-auto justify-between md:justify-end">
                        <div className="space-y-1">
                          <span className={`inline-block px-3.5 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg border-2 shadow-2xs ${Number(selectedInvoiceTx.credit_amount || 0) > 0
                            ? 'bg-emerald-50 text-emerald-950 border-emerald-300'
                            : 'bg-indigo-50 text-indigo-950 border-indigo-300'
                            }`}>
                            {Number(selectedInvoiceTx.credit_amount || 0) > 0 ? 'OFFICIAL TAX INVOICE / RECEIPT' : 'OFFICIAL PAYMENT VOUCHER'}
                          </span>
                          <p className="text-xs font-mono font-black text-slate-900 pt-1">Voucher Ref: {selectedInvoiceTx.voucherNo || selectedInvoiceTx.voucher_no || 'QT-1001'}</p>
                          <p className="text-[11px] font-bold text-slate-600">Posting Date: {new Date(selectedInvoiceTx.date || new Date()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                          <p className="text-[10px] font-bold text-slate-500">State Code: Telangana (36)</p>
                        </div>

                        {/* Verification e-Invoice QR Code Box */}
                        <div className="w-20 h-20 border-2 border-slate-900 p-1.5 rounded-xl bg-white shadow-md flex flex-col items-center justify-center text-center shrink-0">
                          <svg className="w-12 h-12 text-slate-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="6" height="6" />
                            <rect x="15" y="3" width="6" height="6" />
                            <rect x="3" y="15" width="6" height="6" />
                            <path d="M14 14h2v2h-2zM18 14h3v3h-3zM14 18h3v3h-3zM18 18h2v2h-2z" />
                          </svg>
                          <span className="text-[6px] font-black uppercase text-slate-800 tracking-tighter mt-0.5">NIC e-INVOICE QR</span>
                        </div>
                      </div>
                    </div>

                    {/* e-Invoice IRN Hash Banner */}
                    <div className="bg-slate-100 p-2.5 rounded-xl border border-slate-300 flex flex-col sm:flex-row justify-between items-start sm:items-center text-[10px] font-mono gap-1">
                      <div>
                        <span className="font-black text-slate-700 uppercase mr-2">IRN:</span>
                        <span className="text-slate-600 break-all font-bold">a9f4e2b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8</span>
                      </div>
                      <div className="shrink-0 text-slate-500 font-bold">
                        Ack No: <span className="font-mono text-slate-800 font-black">122610987654</span>
                      </div>
                    </div>

                    {/* Billed To & Shipped To Grid Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                      {/* Box 1: Billed To / Party Details */}
                      <div className="bg-slate-50 p-4.5 rounded-2xl border-2 border-slate-200 space-y-2 shadow-2xs">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                            Billed To / Party Ledger Account
                          </span>
                          <span className="text-[9px] font-mono font-black bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                            CODE: {selectedInvoiceTx.ledger_code}
                          </span>
                        </div>
                        <p className="text-base font-black text-slate-900">{activeLedger?.name || selectedInvoiceTx.ledger_code}</p>
                        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 font-medium">
                          <div>
                            <span className="text-slate-400 block font-bold">Classification</span>
                            <span className="font-bold text-slate-800 uppercase">{activeLedger?.group || 'Vendor / Contractor Account'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-bold">Person In-Charge</span>
                            <span className="font-bold text-slate-800">{activeLedger?.responsible_person || activeLedger?.responsiblePerson || 'System Accountant'}</span>
                          </div>
                          <div className="col-span-2 pt-0.5">
                            <span className="text-slate-400 block font-bold">Party GSTIN / Tax Identification</span>
                            <span className="font-mono font-black text-slate-900 text-xs">36ABCDE1234F1Z5</span>
                          </div>
                        </div>
                      </div>

                      {/* Box 2: Shipped To / Worksite & Project Scope */}
                      <div className="bg-slate-50 p-4.5 rounded-2xl border-2 border-slate-200 space-y-2 shadow-2xs">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                            Worksite Location &amp; Project Scope
                          </span>
                          <span className="text-[9px] font-black bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded border border-emerald-300">
                            AUDITED ENTRY
                          </span>
                        </div>
                        <p className="text-base font-black text-blue-950">{selectedInvoiceTx.projName || 'General Project Scope'}</p>
                        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 font-medium">
                          <div>
                            <span className="text-slate-400 block font-bold">Worksite Location</span>
                            <span className="font-bold text-slate-900">{selectedInvoiceTx.site_id || 'Head Office Main Site'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-bold">Payment Method</span>
                            <span className="font-bold text-slate-800">Electronic Bank Remittance</span>
                          </div>
                          <div className="col-span-2 pt-0.5">
                            <span className="text-slate-400 block font-bold">Audit Verification &amp; Status</span>
                            <span className="font-extrabold text-emerald-700 uppercase flex items-center gap-1">
                              ✓ POSTED, RECONCILED &amp; VERIFIED
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Financial Line Items Matrix Table */}
                    {(() => {
                      const currentVNo = selectedInvoiceTx.voucherNo || selectedInvoiceTx.voucher_no;
                      const linkedAdjustments = inspectingLedgerEntries.filter((adj: any) => {
                        return adj.id !== selectedInvoiceTx.id && adj.description && currentVNo && adj.description.includes(currentVNo);
                      });

                      const baseAmt = Number(selectedInvoiceTx.debit_amount || selectedInvoiceTx.credit_amount || 0);
                      const adjTotal = linkedAdjustments.reduce((sum: number, a: any) => sum + Number(a.debit_amount || a.credit_amount || 0), 0);
                      const grandTotal = baseAmt + adjTotal;

                      return (
                        <>
                          <div className="border-2 border-slate-900 rounded-2xl overflow-hidden shadow-sm">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="bg-slate-900 text-white border-b-2 border-slate-900 text-[10px] font-black uppercase tracking-wider">
                                  <th className="p-3.5 w-10 text-center">#</th>
                                  <th className="p-3.5">Item / Description Particulars</th>
                                  <th className="p-3.5">HSN/SAC</th>
                                  <th className="p-3.5 font-mono">Ledger Code</th>
                                  <th className="p-3.5 text-right">Debit (₹)</th>
                                  <th className="p-3.5 text-right">Credit (₹)</th>
                                  <th className="p-3.5 text-right">Net Amount (₹)</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200 font-bold text-slate-800 bg-white">
                                <tr>
                                  <td className="p-3.5 font-mono text-slate-400 text-center font-bold">01</td>
                                  <td className="p-3.5">
                                    <p className="font-extrabold text-slate-900 text-sm">{selectedInvoiceTx.description || selectedInvoiceTx.note || 'Ledger entry transaction'}</p>
                                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Project Scope: {selectedInvoiceTx.projName || 'General Scope'}</p>
                                  </td>
                                  <td className="p-3.5 font-mono text-slate-600 font-bold">995411</td>
                                  <td className="p-3.5 font-mono text-slate-800 font-black">{selectedInvoiceTx.ledger_code}</td>
                                  <td className="p-3.5 text-right text-rose-700 font-extrabold text-sm">₹{Number(selectedInvoiceTx.debit_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                  <td className="p-3.5 text-right text-emerald-700 font-extrabold text-sm">₹{Number(selectedInvoiceTx.credit_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                  <td className="p-3.5 text-right font-black text-slate-900 text-sm">
                                    ₹{baseAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                  </td>
                                </tr>

                                {/* Linked Debit / Credit Notes */}
                                {linkedAdjustments.map((adj: any, aIdx: number) => {
                                  const adjDebit = Number(adj.debit_amount || 0);
                                  const adjCredit = Number(adj.credit_amount || 0);
                                  const adjAmt = adjDebit || adjCredit;
                                  return (
                                    <tr key={adj.id || aIdx} className="bg-amber-50/80 text-amber-950 border-l-4 border-l-amber-500">
                                      <td className="p-3.5 font-mono text-amber-800 text-center font-bold">0{aIdx + 2}</td>
                                      <td className="p-3.5">
                                        <p className="font-extrabold text-amber-950 text-sm flex items-center gap-1">
                                          <span>📜</span> {adj.description}
                                        </p>
                                        <p className="text-[10px] text-amber-800 font-bold mt-0.5">Linked Adjustment Note Voucher #: {adj.voucher_no || `ADJ-${aIdx}`}</p>
                                      </td>
                                      <td className="p-3.5 font-mono text-amber-900 font-bold">995411</td>
                                      <td className="p-3.5 font-mono text-amber-900 font-bold">{adj.ledger_code || selectedInvoiceTx.ledger_code}</td>
                                      <td className="p-3.5 text-right text-rose-800 font-extrabold">₹{adjDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                      <td className="p-3.5 text-right text-emerald-800 font-extrabold">₹{adjCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                      <td className="p-3.5 text-right font-black text-amber-950 text-sm">
                                        +₹{adjAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>

                          {/* Summary Box & Bank Account Details */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Bank Remittance Details */}
                            <div className="bg-slate-50 p-4.5 rounded-2xl border-2 border-slate-200 text-xs space-y-2 shadow-2xs">
                              <span className="text-[10px] font-black uppercase text-slate-700 block border-b border-slate-200 pb-1 flex items-center justify-between">
                                <span>Official Bank Remittance Details</span>
                                <span className="text-[8px] font-bold text-slate-400">ELECTRONIC TRANSFER ONLY</span>
                              </span>
                              <div className="space-y-1 text-slate-800 font-bold">
                                <p className="flex justify-between">
                                  <span className="text-slate-500 font-semibold">Bank Name:</span>
                                  <span className="font-black text-slate-900">HDFC Bank Ltd.</span>
                                </p>
                                <p className="flex justify-between">
                                  <span className="text-slate-500 font-semibold">Account Name:</span>
                                  <span className="font-mono text-slate-900 font-black">INFRAOPS360 CONSTRUCTIONS PVT LTD</span>
                                </p>
                                <p className="flex justify-between">
                                  <span className="text-slate-500 font-semibold">Account Number:</span>
                                  <span className="font-mono font-black text-slate-900 text-sm">50200012345678</span>
                                </p>
                                <p className="flex justify-between">
                                  <span className="text-slate-500 font-semibold">IFSC Code / Branch:</span>
                                  <span className="font-mono font-black text-slate-900">HDFC0001234 (Hitec City Branch)</span>
                                </p>
                              </div>
                            </div>

                            {/* Math Grand Total Summary */}
                            <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-3 text-right shadow-md">
                              <div className="flex justify-between text-xs text-slate-300 font-bold">
                                <span>Sub-Total Base Amount:</span>
                                <span>₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex justify-between text-xs text-slate-400 font-medium">
                                <span>Applicable Tax Rate (CGST 0% + SGST 0%):</span>
                                <span>₹0.00</span>
                              </div>
                              <div className="flex justify-between items-center text-sm font-black border-t border-slate-700 pt-3">
                                <span className="uppercase text-xs tracking-wider text-amber-400">Voucher Grand Total:</span>
                                <span className="text-2xl font-black text-white">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                              </div>
                              <div className="text-[10px] font-black uppercase pt-1 text-left border-t border-slate-800">
                                <span className="text-slate-400 block text-[8px]">Amount in Words:</span>
                                <span className="text-amber-300 font-black text-xs block mt-0.5">{numToWords(grandTotal)}</span>
                              </div>
                            </div>
                          </div>
                        </>
                      );
                    })()}

                    {/* Terms & Official Signatures / Stamp Block */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 text-xs border-t-2 border-slate-900 items-end">
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-black uppercase text-slate-700 block">Commercial Terms &amp; Declarations</span>
                        <p className="text-[9px] text-slate-500 leading-normal font-medium">
                          1. All payments are subject to audit and verification.<br />
                          2. Discrepancies must be reported within 7 business days.<br />
                          3. Computer generated tax voucher issued under Section 31 of CGST Act 2017.
                        </p>
                      </div>

                      <div className="text-center space-y-2">
                        <div className="h-14 border-b-2 border-dashed border-slate-400"></div>
                        <span className="text-[10px] font-black text-slate-700 uppercase block">Verified Accountant Signature</span>
                      </div>

                      {/* Official Corporate Seal Stamp */}
                      <div className="text-center space-y-1">
                        <div className="p-4 border-2 border-blue-900 rounded-2xl bg-blue-50/70 text-[10px] font-bold text-slate-900 relative shadow-2xs">
                          <div className="text-[8px] font-black tracking-widest text-blue-900 uppercase">OFFICIAL CORPORATE SEAL</div>
                          <p className="text-xs font-black text-blue-950 my-1">INFRAOPS360 CONSTRUCTIONS PVT LTD</p>
                          <div className="w-14 h-14 mx-auto border-2 border-dashed border-blue-900 rounded-full flex flex-col items-center justify-center text-blue-950 font-black text-[7px] uppercase tracking-tighter shadow-inner bg-white/60">
                            <span>AUDITED</span>
                            <span className="text-blue-700 font-bold">&amp; APPROVED</span>
                            <span>HYDERABAD HQ</span>
                          </div>
                          <span className="text-[9px] font-black uppercase text-blue-950 block border-t border-blue-200 pt-1 mt-1.5">Authorized Signatory Stamp</span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Footer Controls */}
                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 no-print">
                    <button
                      onClick={() => setInvoiceModalOpen(false)}
                      className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider rounded-xl transition-all"
                    >
                      Close Preview
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-1.5"
                    >
                      <Printer size={14} /> 🖨️ Print Invoice PDF
                    </button>
                  </div>

                </div>
              </div>
            );
          })()}

          {/* Mark as Paid Confirmation Modal */}
          {paidModalOpen && paidFormTx && (
            <div className="fixed inset-0 bg-black/60 z-60 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl relative">

                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle size={18} className="text-emerald-600" /> Record Paid Status
                  </h3>
                  <button
                    onClick={() => setPaidModalOpen(false)}
                    className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-500">Voucher Ref #:</span>
                    <span className="font-black text-slate-900">{paidFormTx.voucherNo}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-500">Project Scope:</span>
                    <span className="font-black text-blue-900">{paidFormTx.projName}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-500">Voucher Amount:</span>
                    <span className="font-black text-emerald-600">₹{Number(paidFormTx.totalAmt || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 block">Payment Date *</label>
                    <input
                      type="date"
                      value={paidDateInput}
                      onChange={e => setPaidDateInput(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 block">Payment Mode</label>
                    <select
                      value={paymentModeInput}
                      onChange={e => setPaymentModeInput(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold bg-white focus:outline-none focus:border-slate-800"
                    >
                      <option value="Bank Transfer">Bank Transfer / NEFT / RTGS</option>
                      <option value="UPI">UPI Instant Payment</option>
                      <option value="Cheque">Cheque Deposit</option>
                      <option value="Cash">Petty Cash / Direct Cash</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setPaidModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      const res = await apiFetch('/api/tenant/ledger/entries/mark-paid', {
                        method: 'POST',
                        body: JSON.stringify({
                          entryId: paidFormTx.id,
                          voucherNo: paidFormTx.voucherNo,
                          status: 'PAID',
                          paidDate: paidDateInput
                        })
                      });
                      if (res.ok) {
                        alert('Transaction status updated to PAID!');
                        setPaidModalOpen(false);
                        if (inspectingLedgerCode) {
                          apiFetch('/api/tenant/ledger/entries/' + inspectingLedgerCode)
                            .then(r => r.json())
                            .then(data => setInspectingLedgerEntries(data || []))
                            .catch(console.error);
                        }
                      } else {
                        alert('Failed to update payment status.');
                      }
                    }}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-1.5"
                  >
                    <CheckCircle size={14} /> Confirm &amp; Mark Paid
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* 2. PROJECT COSTING & DETAILS TAB */}
          {activeTab === 'project-costing' && (
            <div className="space-y-6">

              {/* Content Pane Header */}
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <TrendingUp className="text-blue-600" size={18} /> Project P&amp;L Rollup
                  </h2>
                  <p className="text-xs text-slate-400 font-semibold mt-1">
                    Run dynamic revenue and direct material / cash cost statement summaries per project.
                  </p>
                </div>
              </div>

              {/* 4.1 All-Projects Cost Summary (Default View) */}
              {!selectedProjectPl ? (
                projects.length === 0 ? (
                  renderEmptyState(
                    "No projects defined yet",
                    "Create your first construction project to log material and cash expenses.",
                    "Go to Projects",
                    () => navigate('/tenant/project-management'),
                    TrendingUp
                  )
                ) : loadingProjectsPl ? (
                  <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider">All-Projects cost summary</h3>
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 font-black uppercase text-slate-500 tracking-wider text-[10px]">
                            <th className="p-4">Project</th>
                            <th className="p-4 text-right">Total Cost So Far</th>
                            <th className="p-4 text-right">Revenue So Far</th>
                            <th className="p-4 text-right">Net Position</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {allProjectsPl.map(p => {
                            const isNetPositive = p.net >= 0;
                            return (
                              <tr
                                key={p.id}
                                onClick={() => setSelectedProjectPl(p.id)}
                                className="hover:bg-slate-50 transition-colors cursor-pointer"
                              >
                                <td className="p-4 font-black text-slate-800">
                                  <div>
                                    {p.name}
                                    <span className="text-[10px] text-slate-400 block font-semibold mt-0.5">{p.id}</span>
                                  </div>
                                </td>
                                <td className="p-4 text-right font-bold text-slate-900">
                                  ₹{p.totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="p-4 text-right font-bold text-slate-900">
                                  ₹{p.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>
                                <td className={`p-4 text-right font-black ${isNetPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  {isNetPositive ? '+' : ''}₹{p.net.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              ) : (
                /* 4.2 Single Project Detail & History View (Image 2 Layout) */
                <div className="space-y-6">
                  {/* Header Breadcrumbs & Back Nav */}
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                      <button
                        onClick={() => setSelectedProjectPl("")}
                        className="hover:text-slate-750 transition-colors"
                      >
                        Project Ledgers
                      </button>
                      <ChevronRight size={10} className="text-slate-350" />
                      <span className="text-slate-600">{projects.find(p => p.id === selectedProjectPl)?.name || 'Project Details'}</span>
                    </div>
                    <button
                      onClick={() => setSelectedProjectPl("")}
                      className="text-xs font-black text-blue-600 hover:text-blue-700 uppercase tracking-wider flex items-center gap-1 transition-colors"
                    >
                      &larr; Back to Projects
                    </button>
                  </div>

                  {/* Project Header Meta Section */}
                  {(() => {
                    const proj = projects.find(p => p.id === selectedProjectPl);
                    if (!proj) return null;

                    return (
                      <div className="space-y-4">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{proj.name}</h1>
                            <p className="text-xs text-slate-400 font-semibold mt-0.5">Manage financial accounts and transactions for this project.</p>
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={() => {
                                const defaultLedger = allLedgerAccounts.find(l => l.project_id === selectedProjectPl)?.ledgerCode || allLedgerAccounts[0]?.ledgerCode || '';
                                setQuickTxForm({
                                  ledgerCode: defaultLedger,
                                  direction: 'Debit',
                                  amount: '',
                                  date: new Date().toISOString().split('T')[0],
                                  description: '',
                                  projectId: selectedProjectPl,
                                  offsetLedgerCode: allLedgerAccounts.find(acc => acc.ledgerCode !== defaultLedger)?.ledgerCode || ''
                                });
                                setQuickTxModalOpen(true);
                              }}
                              className="px-4 py-2 border border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
                            >
                              <Plus size={14} className="text-slate-450" /> Record Entry
                            </button>
                            <button
                              onClick={() => {
                                setCreateLedgerForm(prev => ({
                                  ...prev,
                                  projectId: selectedProjectPl,
                                  ledgerCode: 'LDG-' + String(projectLedgers.length + 1).padStart(3, '0')
                                }));
                                setActiveTab('create-ledger');
                              }}
                              className="px-5 py-2 bg-blue-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-blue-700 shadow-md flex items-center gap-1.5 transition-colors"
                            >
                              <Plus size={14} /> Create Ledger
                            </button>
                          </div>
                        </div>

                        {/* Meta grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 border border-slate-200/60 p-4 rounded-2xl">
                          <div>
                            <span className="text-[8px] text-slate-400 font-extrabold uppercase block tracking-wider">PROJECT CODE</span>
                            <span className="text-xs font-black text-slate-800">
                              {String(proj.id || '').startsWith('proj-') ? String(proj.id).toUpperCase() : 'PRJ-2024-' + String(proj.id || '').substring(0, 4).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <span className="text-[8px] text-slate-400 font-extrabold uppercase block tracking-wider">PROJECT MANAGER</span>
                            <span className="text-xs font-black text-slate-800">{proj.customer || 'Unassigned'}</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-slate-400 font-extrabold uppercase block tracking-wider">TIMELINE</span>
                            <span className="text-xs font-black text-slate-800">{proj.contract_start_date && proj.contract_end_date ? `${proj.contract_start_date} - ${proj.contract_end_date}` : 'Continuous'}</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-slate-400 font-extrabold uppercase block tracking-wider">STATUS</span>
                            <span className="inline-block bg-emerald-50 text-emerald-600 font-black text-[9px] px-2 py-0.5 rounded-md border border-emerald-100 uppercase mt-0.5">
                              {proj.status || 'Active'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* KPI Summary Cards Grid */}
                  {(() => {
                    // Calculate real project expenditures from ledger transaction entries & expense ledger balances
                    const projectExpFromEntries = inspectingLedgerEntries.reduce((sum: number, tx: any) => {
                      return sum + Number(tx.debit_amount || tx.debitAmount || 0);
                    }, 0);

                    const projectExpFromLedgers = allLedgerAccounts
                      .filter((l: any) => l.type === 'Expense' || l.balanceType === 'Debit' || l.companyCategory || l.company_category)
                      .reduce((sum: number, l: any) => sum + Number(l.currentBalance || l.current_balance || l.totalDebit || 0), 0);

                    const totalExpenditure = Math.max(projectExpFromEntries, projectExpFromLedgers);

                    // Calculate real project income from Company Liabilities, Assets/Receivables & Income ledgers
                    const projectIncFromEntries = inspectingLedgerEntries.reduce((sum: number, tx: any) => {
                      return sum + Number(tx.credit_amount || tx.creditAmount || 0);
                    }, 0);

                    const companyLiabilitiesReceivablesIncome = allLedgerAccounts
                      .filter((l: any) =>
                        l.type === 'Receivable' ||
                        l.type === 'Liability' ||
                        l.type === 'Income' ||
                        l.balanceType === 'Credit' ||
                        l.category === 'Receivable' ||
                        l.category === 'Liability' ||
                        l.companyCategory === 'Receivables' ||
                        l.companyCategory === 'Liabilities'
                      )
                      .reduce((sum: number, l: any) => sum + Number(l.currentBalance || l.current_balance || l.totalCredit || 0), 0);

                    const totalIncome = Math.max(
                      projectIncFromEntries,
                      companyLiabilitiesReceivablesIncome,
                      Number(dashboardData.clientTotal || 0)
                    );

                    const totalCost = projects.reduce((sum, p) => sum + Number(p.budget || 0), 0);
                    const netProfit = totalIncome - totalExpenditure;
                    const marginPct = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : '0.0';

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Card 1: Total Project Cost */}
                        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
                          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <Briefcase size={18} />
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Total Project Cost</span>
                            <span className="text-base font-black text-slate-900 mt-0.5 block">₹{totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">Allocated project budget</span>
                          </div>
                        </div>

                        {/* Card 2: Total Project Expenditure */}
                        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
                          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                            <ArrowUp size={18} />
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Total Project Expenditure</span>
                            <span className="text-base font-black text-rose-700 mt-0.5 block">₹{totalExpenditure.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            <span className="text-[9px] text-rose-600 font-semibold block mt-0.5">Project expenses &amp; payouts</span>
                          </div>
                        </div>

                        {/* Card 3: Total Project Income */}
                        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
                          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                            <TrendingUp size={18} />
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Total Project Income</span>
                            <span className="text-base font-black text-emerald-700 mt-0.5 block">₹{totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            <span className="text-[9px] text-emerald-600 font-semibold block mt-0.5">Project receipts &amp; inflows</span>
                          </div>
                        </div>

                        {/* Card 4: Total Project Net Profit */}
                        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
                          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Wallet size={18} />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Total Net Profit</span>
                              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${netProfit >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                {marginPct}%
                              </span>
                            </div>
                            <span className={`text-base font-black mt-0.5 block ${netProfit >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                              ₹{netProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">Net profitability margin</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Detailed Chronological Project Transaction Ledger Feed */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider">Project Transaction Feed</h3>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Chronological record of every material invoice, petty float spent, or bank transfer matching this project.</p>
                      </div>

                      {/* Search and Filters */}
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="relative max-w-xs">
                          <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search transactions..."
                            value={searchLedgerQuery}
                            onChange={e => setSearchLedgerQuery(e.target.value)}
                            className="border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold focus:outline-none focus:border-slate-800 bg-slate-50 w-64"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Transaction Feed Table */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="p-3.5 text-[10px] font-black uppercase text-slate-400 tracking-wider">Date</th>
                            <th className="p-3.5 text-[10px] font-black uppercase text-slate-400 tracking-wider">Voucher / Ref</th>
                            <th className="p-3.5 text-[10px] font-black uppercase text-slate-400 tracking-wider">Source / Register</th>
                            <th className="p-3.5 text-[10px] font-black uppercase text-slate-400 tracking-wider">Description</th>
                            <th className="p-3.5 text-[10px] font-black uppercase text-slate-400 tracking-wider text-right">Amount (₹)</th>
                            <th className="p-3.5 text-[10px] font-black uppercase text-slate-400 tracking-wider text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {loadingProjectLedgers ? (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-xs font-semibold text-slate-400">
                                Loading project transaction ledger...
                              </td>
                            </tr>
                          ) : (() => {
                            const filtered = (projectHistory || []).filter(tx => {
                              const q = searchLedgerQuery.toLowerCase();
                              return (tx.note || '').toLowerCase().includes(q) ||
                                (tx.voucher_no || '').toLowerCase().includes(q) ||
                                (tx.source || '').toLowerCase().includes(q) ||
                                (tx.type || '').toLowerCase().includes(q);
                            });

                            if (filtered.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={6} className="p-8 text-center text-xs font-semibold text-slate-400">
                                    No transactions recorded for this project yet.
                                  </td>
                                </tr>
                              );
                            }

                            return filtered.map((tx: any, idx: number) => {
                              let badgeColor = 'bg-slate-100 text-slate-600 border-slate-200';
                              if (tx.source === 'Petty Cash') badgeColor = 'bg-amber-50 text-amber-600 border-amber-100';
                              else if (tx.source === 'Stock Issue') badgeColor = 'bg-blue-50 text-blue-600 border-blue-100';
                              else if (tx.source === 'Direct Payment' || tx.source === 'Journal') badgeColor = 'bg-emerald-50 text-emerald-600 border-emerald-100';

                              return (
                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="p-3.5 text-xs font-semibold text-slate-500">
                                    {new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </td>
                                  <td className="p-3.5 text-xs font-black text-slate-900">{tx.voucher_no || 'N/A'}</td>
                                  <td className="p-3.5 text-xs">
                                    <span className={`inline-block font-black text-[9px] px-2 py-0.5 rounded-md border uppercase ${badgeColor}`}>
                                      {tx.source} • {tx.type || 'General'}
                                    </span>
                                  </td>
                                  <td className="p-3.5 text-xs font-medium text-slate-600">{tx.note || 'No narration provided'}</td>
                                  <td className="p-3.5 text-xs font-black text-slate-900 text-right">
                                    ₹{Number(tx.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="p-3.5 text-xs text-center">
                                    <span className={`inline-block font-black text-[9px] px-2 py-0.5 rounded-md border uppercase bg-emerald-50 text-emerald-650 border-emerald-100`}>
                                      {tx.status || 'Posted'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Back to All Projects Link */}
                  <div className="pt-2">
                    <button
                      onClick={() => setSelectedProjectPl("")}
                      className="text-xs font-black uppercase text-slate-500 hover:text-slate-900"
                    >
                      &larr; Back to All Projects
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. COMPANY EXPENSES TAB */}
          {activeTab === 'company-expenses' && (
            <div className="space-y-6">

              {/* Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">Company Expenses &amp; Overheads</h1>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">Manage administrative expenses, payroll accounts, office utilities, and Drawings.</p>
                </div>

                <button
                  onClick={() => {
                    setQuickTxForm({
                      ledgerCode: selectedCompanyLedger || (companyLedgers[0]?.ledgerCode || ''),
                      direction: 'Debit',
                      amount: '',
                      date: new Date().toISOString().split('T')[0],
                      description: '',
                      projectId: 'Overhead',
                      offsetLedgerCode: '',
                      billRef: '',
                      extraNotes: '',
                      siteId: ''
                    });
                    setQuickTxModalOpen(true);
                  }}
                  className="px-5 py-2.5 bg-blue-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-blue-700 shadow-md flex items-center gap-1.5 transition-colors"
                >
                  <Plus size={14} /> Record Office Expense
                </button>
              </div>

              {/* Main Split Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Overheads Ledgers List */}
                <div className="lg:col-span-1 space-y-4">
                  <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider">Overhead Accounts</h3>

                  <div className="space-y-3">
                    {loadingCompanyLedgers ? (
                      <div className="text-center py-6 text-xs text-slate-400 font-semibold">Loading overhead ledgers...</div>
                    ) : companyLedgers.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-400 font-semibold">No overhead ledgers configured.</div>
                    ) : (
                      companyLedgers.map((l: any) => {
                        const isSelected = selectedCompanyLedger === l.ledgerCode;
                        return (
                          <div
                            key={l.id}
                            onClick={() => setSelectedCompanyLedger(l.ledgerCode)}
                            className={`border rounded-2xl p-4 cursor-pointer transition-all shadow-sm flex justify-between items-center bg-white hover:border-slate-800 ${isSelected ? 'border-slate-800 ring-2 ring-slate-800/10' : 'border-slate-200'}`}
                          >
                            <div className="space-y-1">
                              <span className="text-[9px] font-black uppercase text-slate-400">{l.ledgerCode}</span>
                              <h4 className="text-xs font-black text-slate-800">{l.name}</h4>
                              <p className="text-[10px] text-slate-400 font-semibold">{l.description}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-black text-slate-900 block">
                                ₹{Number(l.currentBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Right Column: Ledger Entry Feed & Detailed Ledger Cards */}
                <div className="lg:col-span-2 space-y-4">
                  {(() => {
                    const selectedLedger = companyLedgers.find(l => l.ledgerCode === selectedCompanyLedger);
                    if (!selectedLedger) {
                      return (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-400 font-semibold">
                          Select an overhead account on the left to view transaction history.
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">

                        {/* Ledger Card Meta */}
                        <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex flex-col md:flex-row justify-between gap-4">
                          <div>
                            <span className="text-[9px] font-black uppercase text-slate-400">{selectedLedger.ledgerCode}</span>
                            <h3 className="text-sm font-black text-slate-950">{selectedLedger.name}</h3>
                            <p className="text-xs text-slate-450 font-semibold mt-1">{selectedLedger.description}</p>
                          </div>
                          <div className="text-left md:text-right border-l-4 md:border-l-0 md:border-r-4 border-blue-600 pl-4 md:pl-0 md:pr-4">
                            <span className="text-[9px] font-black uppercase text-slate-400 block">Current Balance</span>
                            <span className="text-lg font-black text-slate-900 block mt-0.5">
                              ₹{Number(selectedLedger.currentBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>

                        {/* Entries Table */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                          <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">Account Transaction History</h4>

                          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                  <th className="p-3.5 text-[10px] font-black uppercase text-slate-400 tracking-wider">Date</th>
                                  <th className="p-3.5 text-[10px] font-black uppercase text-slate-400 tracking-wider">Voucher / Ref</th>
                                  <th className="p-3.5 text-[10px] font-black uppercase text-slate-400 tracking-wider">Description</th>
                                  <th className="p-3.5 text-[10px] font-black uppercase text-slate-400 tracking-wider text-right">Debit (₹)</th>
                                  <th className="p-3.5 text-[10px] font-black uppercase text-slate-400 tracking-wider text-right">Credit (₹)</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {loadingCompanyEntries ? (
                                  <tr>
                                    <td colSpan={5} className="p-8 text-center text-xs font-semibold text-slate-400">
                                      Loading ledger transactions...
                                    </td>
                                  </tr>
                                ) : companyLedgerEntries.length === 0 ? (
                                  <tr>
                                    <td colSpan={5} className="p-8 text-center text-xs font-semibold text-slate-400">
                                      No transaction entries recorded for this overhead account yet.
                                    </td>
                                  </tr>
                                ) : (
                                  companyLedgerEntries.map((e: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                      <td className="p-3.5 text-xs font-semibold text-slate-500">
                                        {new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                      </td>
                                      <td className="p-3.5 text-xs font-black text-slate-900">{e.voucher_no}</td>
                                      <td className="p-3.5 text-xs font-medium text-slate-600">{e.note}</td>
                                      <td className="p-3.5 text-xs font-black text-slate-900 text-right">
                                        {Number(e.debit_amount || 0) > 0 ? `₹${Number(e.debit_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                                      </td>
                                      <td className="p-3.5 text-xs font-black text-slate-900 text-right">
                                        {Number(e.credit_amount || 0) > 0 ? `₹${Number(e.credit_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>

                      </div>
                    );
                  })()}
                </div>

              </div>

            </div>
          )}


          {/* 4. ASSETS & LIABILITIES TAB */}
          {activeTab === 'assets-liabilities' && (
            <div className="space-y-6">
              {/* Horizontal Segmented Control for Sub-tabs */}
              <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-3">
                {[
                  { id: 'assets', label: 'Fixed Assets Register' },
                  { id: 'receivables', label: 'Accounts Receivable (Clients)' },
                  { id: 'payables', label: 'Accounts Payable (Vendors)' },
                ].map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => setActiveAssetsSubTab(sub.id as any)}
                    className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${activeAssetsSubTab === sub.id
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                      }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>

              {activeAssetsSubTab === 'assets' && (
                <div className="space-y-6">

                  {/* Content Pane Header */}
                  <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                    <div>
                      <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                        <Settings className="text-blue-600" size={18} /> Fixed Assets Registry
                      </h2>
                      <p className="text-xs text-slate-400 font-semibold mt-1">
                        Log capital equipment purchases and verify straight-line depreciation book values.
                      </p>
                    </div>
                    <button
                      onClick={() => setAssetModalOpen(true)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-lg flex items-center gap-1 shadow-sm transition-all"
                    >
                      <Plus size={13} /> Add Asset Registry
                    </button>
                  </div>

                  {assets.length === 0 ? (
                    renderEmptyState(
                      "No assets registered yet",
                      "Register machinery, fleet vehicles, or office equipment to track accumulated straight-line book values.",
                      "+ Add Asset Registry",
                      () => setAssetModalOpen(true),
                      Settings
                    )
                  ) : (
                    /* Assets Summary Cards with progress bars */
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {assets.map(ass => {
                        const cost = Number(ass.purchase_cost || 0);
                        const book = Number(ass.current_book_value || 0);
                        const pct = cost > 0 ? (book / cost) * 100 : 0;

                        return (
                          <div key={ass.id} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between h-44">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-xs font-black text-slate-800">{ass.description}</h4>
                                <p className="text-[9px] uppercase font-bold text-slate-400 mt-0.5">Project: {ass.project_name || 'Unassigned'}</p>
                              </div>
                              <span className="text-[10px] font-black uppercase bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                                {ass.useful_life_years} Years
                              </span>
                            </div>

                            <div className="space-y-1.5 mt-2">
                              <div className="flex justify-between items-baseline">
                                <span className="text-[9px] font-black uppercase text-slate-400">Current Value</span>
                                <span className="text-lg font-black text-slate-900">₹{book.toLocaleString('en-IN')}</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-blue-600 h-full transition-all" style={{ width: `${pct}%` }}></div>
                              </div>
                              <div className="flex justify-between text-[8px] font-black uppercase text-slate-400">
                                <span>Cost: ₹{cost.toLocaleString()}</span>
                                <span>{Math.round(pct)}% Book Value</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>
              )}

              {activeAssetsSubTab === 'receivables' && (
                <div className="space-y-6">

                  {/* Content Pane Header */}
                  <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                    <div>
                      <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                        <User className="text-blue-600" size={18} /> Client Invoices &amp; Payments
                      </h2>
                      <p className="text-xs text-slate-400 font-semibold mt-1">
                        Generate running client accounts ledger and record outstanding receipts.
                      </p>
                    </div>
                  </div>

                  {clients.length === 0 ? (
                    renderEmptyState(
                      "No clients added to Accounts yet",
                      "Add clients under client management or portal first, then come back here to view billing statements.",
                      "Go to Client Portal",
                      () => navigate('/tenant/client-portal'),
                      User
                    )
                  ) : (
                    <>
                      {/* Account Cards Overview Grid */}
                      <div className="flex overflow-x-auto gap-4 pb-4 md:grid md:grid-cols-3 md:overflow-visible">
                        {clients.map(c => {
                          const isSelected = selectedClient === c.id;
                          const bal = isSelected ? clientOutstanding : 0;
                          return renderYonoAccountCard(
                            c.id,
                            c.name,
                            `Code: ${c.code}`,
                            bal,
                            isSelected,
                            () => setSelectedClient(c.id),
                            'Amount Due',
                            User,
                            bal > 0
                          );
                        })}
                      </div>

                      {selectedClient && (
                        <div className="space-y-4 border-t border-slate-100 pt-6">

                          {/* Quick Actions Row */}
                          <div className="flex items-center gap-6 py-2">
                            <div className="flex flex-col items-center">
                              <button
                                onClick={() => setClientTxModalOpen(true)}
                                className="p-3 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-full transition-colors shadow-sm"
                              >
                                <Plus size={18} />
                              </button>
                              <span className="text-[10px] font-black text-slate-500 mt-1">Add Entry</span>
                            </div>
                          </div>

                          {/* Statement Filters */}
                          {renderFilterBar(true)}

                          {/* Transaction Feed */}
                          <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Statement feed</h3>
                            {renderTransactionFeed(clientStatement, 'client')}
                          </div>

                        </div>
                      )}
                    </>
                  )}

                </div>
              )}

              {activeAssetsSubTab === 'payables' && (
                <div className="space-y-6">

                  {/* Content Pane Header */}
                  <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                    <div>
                      <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                        <ShoppingCart className="text-blue-600" size={18} /> Vendor Bills &amp; Remittances
                      </h2>
                      <p className="text-xs text-slate-400 font-semibold mt-1">
                        Maintain running ledger for supply vendors and record payouts.
                      </p>
                    </div>
                  </div>

                  {vendors.length === 0 ? (
                    renderEmptyState(
                      "No vendors added to Accounts yet",
                      "Add vendors under the Vendor Operations management catalog to record direct supplies bills.",
                      "Go to Vendor Operations",
                      () => navigate('/tenant/vendor-operations'),
                      ShoppingCart
                    )
                  ) : (
                    <>
                      {/* Account Cards Overview Grid */}
                      <div className="flex overflow-x-auto gap-4 pb-4 md:grid md:grid-cols-3 md:overflow-visible">
                        {vendors.map(v => {
                          const isSelected = selectedVendor === v.id;
                          const bal = isSelected ? vendorOutstanding : 0;
                          return renderYonoAccountCard(
                            v.id,
                            v.name,
                            `Code: ${v.code}`,
                            bal,
                            isSelected,
                            () => setSelectedVendor(v.id),
                            'Amount Payable',
                            ShoppingCart,
                            bal > 0
                          );
                        })}
                      </div>

                      {selectedVendor && (
                        <div className="space-y-4 border-t border-slate-100 pt-6">

                          {/* Quick Actions Row */}
                          <div className="flex items-center gap-6 py-2">
                            <div className="flex flex-col items-center">
                              <button
                                onClick={() => setVendorTxModalOpen(true)}
                                className="p-3 bg-red-50 text-rose-600 hover:bg-rose-100 rounded-full transition-colors shadow-sm"
                              >
                                <Plus size={18} />
                              </button>
                              <span className="text-[10px] font-black text-slate-500 mt-1">Add Entry</span>
                            </div>
                          </div>

                          {/* Statement Filters */}
                          {renderFilterBar(true)}

                          {/* Transaction Feed */}
                          <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Statement feed</h3>
                            {renderTransactionFeed(vendorStatement, 'vendor')}
                          </div>

                        </div>
                      )}
                    </>
                  )}

                </div>
              )}
            </div>
          )}
          {/* 5. CREATE LEDGER TAB (Image 1 Layout) */}
          {activeTab === 'create-ledger' && (
            <div className="w-full space-y-6">
              {/* Breadcrumbs */}
              <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                <span>General Ledgers</span>
                <ChevronRight size={10} className="text-slate-350" />
                <span className="text-slate-600">Create Ledger Profile</span>
              </div>
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create Ledger Profile</h1>
              </div>

              <div className="max-w-3xl space-y-6">
                {/* Basic Information Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-sm">
                  <div>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Basic Information</h3>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Primary accounting ledger credentials and parameters.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-500 block font-extrabold">Ledger Name *</label>
                      <input
                        type="text"
                        placeholder="Enter ledger name"
                        value={createLedgerForm.name}
                        onChange={e => setCreateLedgerForm({ ...createLedgerForm, name: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-slate-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-500 block font-extrabold">Ledger Code *</label>
                      <input
                        type="text"
                        placeholder="e.g. LDG-009"
                        value={createLedgerForm.ledgerCode}
                        onChange={e => setCreateLedgerForm({ ...createLedgerForm, ledgerCode: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-500 block font-extrabold">Person Name / Responsible Person (Optional)</label>
                      <input
                        type="text"
                        list="team-person-list"
                        placeholder="Enter or select person name..."
                        value={createLedgerForm.responsiblePerson}
                        onChange={e => setCreateLedgerForm({ ...createLedgerForm, responsiblePerson: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-slate-800"
                      />
                      <datalist id="team-person-list">
                        {employees.map(emp => <option key={emp.id} value={emp.name} />)}
                      </datalist>
                    </div>

                  </div>
                </div>
              </div>

              {/* Footer Action Buttons */}
              <div className="flex justify-between items-center bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <button
                  onClick={() => setActiveTab('ledger')}
                  className="text-xs font-black text-slate-500 hover:text-slate-800 uppercase tracking-wider"
                >
                  Cancel
                </button>

                <div className="flex gap-3">
                  <button
                    onClick={() => alert('Draft saved successfully!')}
                    className="px-5 py-2 border border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    Save Draft
                  </button>
                  <button
                    onClick={async () => {
                      if (!createLedgerForm.name.trim()) {
                        alert('Ledger Name is required!');
                        return;
                      }
                      if (!createLedgerForm.ledgerCode.trim()) {
                        alert('Ledger Code is required!');
                        return;
                      }

                      // Prepare request data
                      const resolvedProjectId = createLedgerForm.ledgerCategory === 'Company' ? 'Overhead' : (createLedgerForm.projectId || projects[0]?.id || 'Overhead');
                      const requestData = {
                        ...createLedgerForm,
                        projectId: resolvedProjectId,
                        type: createLedgerForm.ledgerCategory === 'Company'
                          ? (createLedgerForm.companyCategory === 'General Bank / Current Account' ? 'Bank' : 'Expense')
                          : createLedgerForm.type
                      };

                      const res = await apiFetch('/api/tenant/ledger/project-ledgers', {
                        method: 'POST',
                        body: JSON.stringify(requestData)
                      });
                      if (res.ok) {
                        alert('Ledger profile created successfully!');
                        fetchAllLedgerAccounts();

                        if (createLedgerForm.ledgerCategory === 'Project') {
                          setSelectedProjectPl(createLedgerForm.projectId);
                          setActiveTab('project-costing');
                          fetchProjectLedgers(createLedgerForm.projectId);
                        } else {
                          setActiveTab('ledger');
                        }
                      } else {
                        const err = await res.json();
                        alert(err.error || 'Failed to create ledger');
                      }
                    }}
                    className="px-5 py-2 bg-blue-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-blue-700 shadow-md transition-colors"
                  >
                    Create Ledger
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {/* ─── BOTTOM SHEET / CENTERED DIALOG MODALS ───────────────────────────── */}

      {/* Journal Voucher Modal */}
      {journalModalOpen && (
        <div className="fixed inset-0 bg-black/55 z-50 flex items-end md:items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl p-6 space-y-4 my-8">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-800">Create Journal Voucher (JV)</h3>
              <button onClick={() => setJournalModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase text-slate-400 block">Voucher Date</span>
                <input
                  type="date"
                  value={journalForm.date}
                  onChange={e => setJournalForm({ ...journalForm, date: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase text-slate-400 block">Project / Cost Center</span>
                <select
                  value={journalForm.projectId}
                  onChange={e => setJournalForm({ ...journalForm, projectId: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold bg-white"
                >
                  <option value="Overhead">Overhead / Direct</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase text-slate-400 block">Narration / Description</span>
                <input
                  type="text"
                  placeholder="Narration of the entry"
                  value={journalForm.description}
                  onChange={e => setJournalForm({ ...journalForm, description: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold"
                />
              </div>
            </div>

            {/* Entries Rows */}
            <div className="space-y-2">
              <span className="text-[9px] font-black uppercase text-slate-400 block">Postings (Dr/Cr lines)</span>

              <div className="space-y-3">
                {journalForm.entries.map((entry, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[9px] font-bold text-slate-500">Account</label>
                      <select
                        value={`${entry.accountId}:${entry.accountType}`}
                        onChange={e => {
                          const [accId, accType] = e.target.value.split(':');
                          const newEntries = [...journalForm.entries];
                          newEntries[idx].accountId = accId;
                          newEntries[idx].accountType = accType;
                          setJournalForm({ ...journalForm, entries: newEntries });
                        }}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold bg-white"
                      >
                        <option value="">-- Choose Account --</option>
                        <optgroup label="Cash & Bank Accounts">
                          {bankAccounts.map(b => <option key={b.id} value={`${b.id}:bank`}>{b.name}</option>)}
                        </optgroup>
                        <optgroup label="Clients Outstanding">
                          {clients.map(c => <option key={c.id} value={`${c.id}:client`}>Client: {c.name}</option>)}
                        </optgroup>
                        <optgroup label="Vendors Outstanding">
                          {vendors.map(v => <option key={v.id} value={`${v.id}:vendor`}>Vendor: {v.name}</option>)}
                        </optgroup>
                        <optgroup label="Employee Advances">
                          {employees.map(emp => <option key={emp.id} value={`${emp.id}:employee`}>Employee: {emp.name}</option>)}
                        </optgroup>
                        <optgroup label="Income & Expenses">
                          <option value="Material Expense:expense">Material Expense (COGS)</option>
                          <option value="Labor Expense:expense">Labor Expense</option>
                          <option value="Project Revenue:revenue">Project Revenue</option>
                          <option value="Rent & Utilities:expense">Rent & Utilities</option>
                          <option value="Capital / Equity:equity">Capital / Equity</option>
                        </optgroup>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500">Debit (₹)</label>
                      <input
                        type="number"
                        placeholder="Debit"
                        value={entry.debitAmount}
                        onChange={e => {
                          const newEntries = [...journalForm.entries];
                          newEntries[idx].debitAmount = e.target.value;
                          newEntries[idx].creditAmount = '';
                          setJournalForm({ ...journalForm, entries: newEntries });
                        }}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500">Credit (₹)</label>
                      <input
                        type="number"
                        placeholder="Credit"
                        value={entry.creditAmount}
                        onChange={e => {
                          const newEntries = [...journalForm.entries];
                          newEntries[idx].creditAmount = e.target.value;
                          newEntries[idx].debitAmount = '';
                          setJournalForm({ ...journalForm, entries: newEntries });
                        }}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                      />
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => {
                          const newEntries = journalForm.entries.filter((_, eidx) => eidx !== idx);
                          setJournalForm({ ...journalForm, entries: newEntries });
                        }}
                        disabled={journalForm.entries.length <= 2}
                        className="p-2 text-slate-400 hover:text-rose-600 disabled:opacity-40"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => {
                    setJournalForm({
                      ...journalForm,
                      entries: [...journalForm.entries, { accountId: '', accountType: 'expense', debitAmount: '', creditAmount: '', note: '' }]
                    });
                  }}
                  className="text-xs font-black text-blue-600 hover:text-blue-700 uppercase tracking-wider"
                >
                  + Add Ledger Row
                </button>

                {(() => {
                  let drSum = 0;
                  let crSum = 0;
                  journalForm.entries.forEach(e => {
                    drSum += Number(e.debitAmount || 0);
                    crSum += Number(e.creditAmount || 0);
                  });
                  const diff = Math.abs(drSum - crSum);

                  return (
                    <div className="text-right text-xs font-bold">
                      <div className="text-slate-500">Total Dr: <span className="font-black text-slate-900">₹{drSum.toLocaleString('en-IN')}</span> | Total Cr: <span className="font-black text-slate-900">₹{crSum.toLocaleString('en-IN')}</span></div>
                      {diff > 0.01 && <div className="text-rose-600 mt-0.5">Out of balance by ₹{diff.toLocaleString('en-IN')}</div>}
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
              <button
                onClick={() => setJournalModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const res = await apiFetch('/api/tenant/ledger/journal-vouchers', {
                    method: 'POST',
                    body: JSON.stringify(journalForm)
                  });
                  if (res.ok) {
                    setJournalModalOpen(false);
                    fetchJournalVouchers();
                    loadMasterData();
                  } else {
                    const err = await res.json();
                    alert(err.error || 'Failed to post journal entry');
                  }
                }}
                className="px-5 py-2 bg-slate-900 text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-slate-850"
              >
                Post Voucher
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Bank Account Modal */}
      {bankModalOpen && (
        <div className="fixed inset-0 bg-black/55 z-50 flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-sm">
          <div className="bg-white rounded-t-3xl md:rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 fixed bottom-0 md:relative md:bottom-auto">
            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-2 md:hidden"></div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-800">Add Bank/Cash Account</h3>
              <button onClick={() => setBankModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-[9px] font-black uppercase text-slate-400 block">INITIAL LEDGER BALANCE</span>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-extrabold text-sm">₹</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={bankForm.openingBalance}
                    onChange={e => setBankForm({ ...bankForm, openingBalance: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl pl-8 pr-3 py-2.5 text-sm font-black focus:outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[9px] font-black uppercase text-slate-400 block">ACCOUNT DETAILS</span>
                <input
                  type="text"
                  placeholder="Account Name (e.g. SBI Main)"
                  value={bankForm.name}
                  onChange={e => setBankForm({ ...bankForm, name: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold bg-white focus:outline-none"
                />
                <select
                  value={bankForm.type}
                  onChange={e => setBankForm({ ...bankForm, type: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold bg-white focus:outline-none"
                >
                  <option value="Bank">Bank Account</option>
                  <option value="Cash">Cash Account</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  handlePost('/api/tenant/ledger/bank-cash/accounts', bankForm, () => {
                    setBankModalOpen(false);
                    setBankForm({ name: '', type: 'Bank', openingBalance: '0' });
                    fetchBankAccounts();
                  });
                }}
                className="w-full md:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl transition-all shadow-sm"
              >
                Setup account with ₹{Number(bankForm.openingBalance || 0).toLocaleString()} balance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bank Transaction Modal */}
      {bankTxModalOpen && (
        <div className="fixed inset-0 bg-black/55 z-50 flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-sm">
          <div className="bg-white rounded-t-3xl md:rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 fixed bottom-0 md:relative md:bottom-auto">
            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-2 md:hidden"></div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-800">Record Bank transaction</h3>
              <button onClick={() => setBankTxModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-[9px] font-black uppercase text-slate-400 block">AMOUNT</span>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-extrabold text-sm">₹</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={bankTxForm.amount}
                    onChange={e => setBankTxForm({ ...bankTxForm, amount: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl pl-8 pr-3 py-2.5 text-sm font-black focus:outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[9px] font-black uppercase text-slate-400 block">TRANSACTION DETAILS</span>
                <select
                  value={bankTxForm.type}
                  onChange={e => setBankTxForm({ ...bankTxForm, type: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold bg-white focus:outline-none"
                >
                  <option value="Deposit">Deposit</option>
                  <option value="Withdrawal">Withdrawal</option>
                  <option value="Transfer Out">Transfer to Another Account</option>
                </select>
                <input
                  type="text"
                  placeholder="Party Name (e.g. Self / Fuel Station)"
                  value={bankTxForm.linkedParty}
                  onChange={e => setBankTxForm({ ...bankTxForm, linkedParty: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Reference No / Cheque No"
                  value={bankTxForm.referenceNo}
                  onChange={e => setBankTxForm({ ...bankTxForm, referenceNo: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
                />
                {bankTxForm.type === 'Transfer Out' && (
                  <select
                    value={bankTxForm.destinationAccountId}
                    onChange={e => setBankTxForm({ ...bankTxForm, destinationAccountId: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold bg-white focus:outline-none"
                  >
                    <option value="">-- Choose Target Account --</option>
                    {bankAccounts.filter(a => a.id !== selectedBankAccount).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  handlePost('/api/tenant/ledger/bank-cash/entry', { ...bankTxForm, accountId: selectedBankAccount }, () => {
                    setBankTxModalOpen(false);
                    setBankTxForm({ amount: '', date: new Date().toISOString().split('T')[0], type: 'Deposit', linkedParty: '', referenceNo: '', note: '', destinationAccountId: '' });
                    apiFetch(`/api/tenant/ledger/bank-cash/${selectedBankAccount}`).then(async res => {
                      if (res.ok) {
                        const data = await res.json();
                        setBankStatement(data.entries || []);
                      }
                    });
                    fetchBankAccounts();
                  });
                }}
                className="w-full md:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl transition-all shadow-sm"
              >
                Post ₹{Number(bankTxForm.amount || 0).toLocaleString()} {bankTxForm.type}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Petty Cash Expense recording */}
      {pettyTxModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-md transition-all">
          <div className="bg-white rounded-t-3xl md:rounded-2xl w-full max-w-md shadow-2xl border border-slate-200/80 p-6 space-y-5 fixed bottom-0 md:relative md:bottom-auto animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-2 md:hidden"></div>

            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 font-black">
                  <Plus size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Record Field Expense / Refill</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Post localized petty voucher to custodian feed</p>
                </div>
              </div>
              <button
                onClick={() => setPettyTxModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Custodian Selection Dropdown */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  Select Field Custodian *
                </label>
                <select
                  value={pettyTxForm.custodianId || selectedCustodian}
                  onChange={e => {
                    setPettyTxForm({ ...pettyTxForm, custodianId: e.target.value });
                    setSelectedCustodian(e.target.value);
                  }}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                >
                  <option value="">-- Choose Custodian (Siri, John, HR...) --</option>
                  {custodians.map(c => <option key={c.id} value={c.id}>{c.name} ({c.role || 'Site Lead'})</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  Voucher Amount (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-slate-400 font-black text-sm">₹</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={pettyTxForm.amount}
                    onChange={e => setPettyTxForm({ ...pettyTxForm, amount: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm font-black focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                      Voucher Type *
                    </label>
                    <select
                      value={isCustomVoucherType ? 'CUSTOM_TYPE' : pettyTxForm.type}
                      onChange={e => {
                        if (e.target.value === 'CUSTOM_TYPE') {
                          setIsCustomVoucherType(true);
                        } else {
                          setIsCustomVoucherType(false);
                          setPettyTxForm({ ...pettyTxForm, type: e.target.value });
                        }
                      }}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    >
                      <option value="Expense">Site Expense</option>
                      <option value="Replenishment">Replenish Float (Refill)</option>
                      <option value="Refund">Refund Balance</option>
                      <option value="Vendor Advance">Vendor Cash Advance</option>
                      <option value="Labor Wage Settlement">Labor Wage Settlement</option>
                      <option value="Emergency Advance">Emergency Cash Advance</option>
                      <option value="CUSTOM_TYPE">➕ + Specify Custom Voucher Type...</option>
                    </select>

                    {isCustomVoucherType && (
                      <input
                        type="text"
                        placeholder="Type custom voucher type (e.g. Special Fuel Voucher)..."
                        value={customVoucherTypeInput}
                        onChange={e => setCustomVoucherTypeInput(e.target.value)}
                        className="w-full border border-indigo-300 bg-indigo-50/50 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 mt-1.5 transition-all"
                      />
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                      Payment Mode *
                    </label>
                    <select
                      value={pettyTxForm.mode}
                      onChange={e => setPettyTxForm({ ...pettyTxForm, mode: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    >
                      <option value="Cash">Cash Handout</option>
                      <option value="UPI / GPay">UPI / GPay / PhonePe</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Petty Card">Petty Cash Card</option>
                      <option value="Cheque">Bank Cheque</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Expense Category *
                  </label>
                  <select
                    value={isCustomCategory ? 'CUSTOM' : pettyTxForm.category}
                    onChange={e => {
                      if (e.target.value === 'CUSTOM') {
                        setIsCustomCategory(true);
                      } else {
                        setIsCustomCategory(false);
                        setPettyTxForm({ ...pettyTxForm, category: e.target.value });
                      }
                    }}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  >
                    <option value="Material Purchase">Material Purchase (Cement, Steel, Bricks)</option>
                    <option value="Site Utilities">Site Utilities (Water Tanker, Power, Generator)</option>
                    <option value="Fuel & Transport">Fuel, Diesel &amp; Transport Logistics</option>
                    <option value="Safety Gear">Safety Gear &amp; PPE (Helmets, Vests, Gloves)</option>
                    <option value="Site Supplies">Site Supplies &amp; Small Hardware Tools</option>
                    <option value="Daily Wages & Labor">Daily Wages &amp; Labor Cash Handouts</option>
                    <option value="Equipment Maintenance">Equipment Maintenance &amp; Spare Parts</option>
                    <option value="Food & Catering">Food, Catering &amp; Worker Refreshments</option>
                    <option value="Site Office & Stationary">Site Office, Stationary &amp; Mobile Topup</option>
                    <option value="Medical & First Aid">Medical &amp; First Aid Expenses</option>
                    <option value="Permits & Tolls">Permits, Tolls &amp; Municipal Entry Fees</option>
                    <option value="Misc.">Miscellaneous Expense</option>
                    <option value="CUSTOM">➕ + Specify Custom Category...</option>
                  </select>

                  {isCustomCategory && (
                    <input
                      type="text"
                      placeholder="Type custom category name (e.g. Crane Operator Allowance)..."
                      value={customCategoryInput}
                      onChange={e => setCustomCategoryInput(e.target.value)}
                      className="w-full border border-indigo-300 bg-indigo-50/50 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 mt-1.5 transition-all"
                    />
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Project Tag *
                  </label>
                  <select
                    value={pettyTxForm.projectTag}
                    onChange={e => setPettyTxForm({ ...pettyTxForm, projectTag: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  >
                    <option value="Overhead">Overhead (Not Project-Specific)</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setPettyTxModalOpen(false)}
                className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const targetCustodianId = pettyTxForm.custodianId || selectedCustodian;
                  const finalCategory = isCustomCategory ? (customCategoryInput || 'Custom Expense') : pettyTxForm.category;
                  const finalType = isCustomVoucherType ? (customVoucherTypeInput || 'Custom Voucher') : pettyTxForm.type;
                  handlePost('/api/tenant/ledger/petty-cash/entry', { ...pettyTxForm, type: finalType, category: finalCategory, custodianId: targetCustodianId, floatId: pettyCashFloat?.id }, () => {
                    setPettyTxModalOpen(false);
                    setIsCustomCategory(false);
                    setCustomCategoryInput('');
                    setIsCustomVoucherType(false);
                    setCustomVoucherTypeInput('');
                    setPettyTxForm({ custodianId: '', amount: '', date: new Date().toISOString().split('T')[0], type: 'Expense', category: 'Material Purchase', mode: 'Cash', projectTag: 'Overhead', note: '', billReference: '' });
                    apiFetch(`/api/tenant/ledger/petty-cash/${targetCustodianId}`).then(async res => {
                      if (res.ok) {
                        const data = await res.json();
                        setPettyCashFloat(data.float);
                        setPettyCashEntries(data.entries || []);
                      }
                    });
                    apiFetch('/api/tenant/ledger/petty-cash/floats/all').then(async res => {
                      if (res.ok) setAllPettyFloats(await res.json());
                    });
                  });
                }}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
              >
                Record ₹{Number(pettyTxForm.amount || 0).toLocaleString()} {pettyTxForm.type}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client Statement Transaction Modal */}
      {clientTxModalOpen && (
        <div className="fixed inset-0 bg-black/55 z-50 flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-sm">
          <div className="bg-white rounded-t-3xl md:rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 fixed bottom-0 md:relative md:bottom-auto">
            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-2 md:hidden"></div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-800">Record Client Payment</h3>
              <button onClick={() => setClientTxModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-[9px] font-black uppercase text-slate-400 block">AMOUNT</span>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-extrabold text-sm">₹</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={clientTxForm.amount}
                    onChange={e => setClientTxForm({ ...clientTxForm, amount: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl pl-8 pr-3 py-2.5 text-sm font-black focus:outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[9px] font-black uppercase text-slate-400 block">TRANSACTION DETAILS</span>
                <select
                  value={clientTxForm.type}
                  onChange={e => setClientTxForm({ ...clientTxForm, type: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold bg-white focus:outline-none"
                >
                  <option value="Payment">Payment Received</option>
                  <option value="Credit Note">Credit Note</option>
                </select>
                <select
                  value={clientTxForm.projectTag}
                  onChange={e => setClientTxForm({ ...clientTxForm, projectTag: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold bg-white focus:outline-none"
                >
                  <option value="Overhead">Overhead (Not Project-Specific)</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input
                  type="text"
                  placeholder="Memo / Notes"
                  value={clientTxForm.note}
                  onChange={e => setClientTxForm({ ...clientTxForm, note: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  handlePost('/api/tenant/ledger/client/entry', { ...clientTxForm, clientId: selectedClient }, () => {
                    setClientTxModalOpen(false);
                    setClientTxForm({ amount: '', date: new Date().toISOString().split('T')[0], type: 'Payment', projectTag: 'Overhead', note: '' });
                    apiFetch(`/api/tenant/ledger/client/${selectedClient}`).then(async res => {
                      if (res.ok) {
                        const data = await res.json();
                        setClientStatement(data.statement || []);
                        setClientOutstanding(data.outstanding || 0);
                      }
                    });
                  });
                }}
                className="w-full md:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl transition-all shadow-sm"
              >
                Post ₹{Number(clientTxForm.amount || 0).toLocaleString()} Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vendor Statement Transaction Modal */}
      {vendorTxModalOpen && (
        <div className="fixed inset-0 bg-black/55 z-50 flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-sm">
          <div className="bg-white rounded-t-3xl md:rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 fixed bottom-0 md:relative md:bottom-auto">
            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-2 md:hidden"></div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-800">Record Vendor Payment</h3>
              <button onClick={() => setVendorTxModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-[9px] font-black uppercase text-slate-400 block">AMOUNT</span>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-extrabold text-sm">₹</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={vendorTxForm.amount}
                    onChange={e => setVendorTxForm({ ...vendorTxForm, amount: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl pl-8 pr-3 py-2.5 text-sm font-black focus:outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[9px] font-black uppercase text-slate-400 block">TRANSACTION DETAILS</span>
                <select
                  value={vendorTxForm.type}
                  onChange={e => setVendorTxForm({ ...vendorTxForm, type: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold bg-white focus:outline-none"
                >
                  <option value="Payment">Payment Cleared</option>
                  <option value="Debit Note">Debit Note</option>
                </select>
                <select
                  value={vendorTxForm.projectTag}
                  onChange={e => setVendorTxForm({ ...vendorTxForm, projectTag: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold bg-white focus:outline-none"
                >
                  <option value="Overhead">Overhead (Not Project-Specific)</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input
                  type="text"
                  placeholder="Remittance memo"
                  value={vendorTxForm.note}
                  onChange={e => setVendorTxForm({ ...vendorTxForm, note: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  handlePost('/api/tenant/ledger/vendor/entry', { ...vendorTxForm, vendorId: selectedVendor }, () => {
                    setVendorTxModalOpen(false);
                    setVendorTxForm({ amount: '', date: new Date().toISOString().split('T')[0], type: 'Payment', projectTag: 'Overhead', note: '' });
                    apiFetch(`/api/tenant/ledger/vendor/${selectedVendor}`).then(async res => {
                      if (res.ok) {
                        const data = await res.json();
                        setVendorStatement(data.statement || []);
                        setVendorOutstanding(data.outstanding || 0);
                      }
                    });
                  });
                }}
                className="w-full md:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl transition-all shadow-sm"
              >
                Clear ₹{Number(vendorTxForm.amount || 0).toLocaleString()} Payout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Advances Modal */}
      {employeeTxModalOpen && (
        <div className="fixed inset-0 bg-black/55 z-50 flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-sm">
          <div className="bg-white rounded-t-3xl md:rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 fixed bottom-0 md:relative md:bottom-auto">
            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-2 md:hidden"></div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-800">Record Employee Advance / Recovery</h3>
              <button onClick={() => setEmployeeTxModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-[9px] font-black uppercase text-slate-400 block">AMOUNT</span>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-extrabold text-sm">₹</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={employeeTxForm.amount}
                    onChange={e => setEmployeeTxForm({ ...employeeTxForm, amount: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl pl-8 pr-3 py-2.5 text-sm font-black focus:outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[9px] font-black uppercase text-slate-400 block">TRANSACTION DETAILS</span>
                <select
                  value={employeeTxForm.type}
                  onChange={e => setEmployeeTxForm({ ...employeeTxForm, type: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold bg-white focus:outline-none"
                >
                  <option value="Salary Advance">Salary Advance Given</option>
                  <option value="Petty Cash Advance">Petty Cash Advance Given</option>
                  <option value="Recovery">Recovery / Repayment</option>
                  <option value="Reimbursement">Reimbursement Cleared</option>
                </select>
                <input
                  type="text"
                  placeholder="Purpose / Reference Memo"
                  value={employeeTxForm.note}
                  onChange={e => setEmployeeTxForm({ ...employeeTxForm, note: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  handlePost('/api/tenant/ledger/employee/entry', { ...employeeTxForm, employeeId: selectedEmployee }, () => {
                    setEmployeeTxModalOpen(false);
                    setEmployeeTxForm({ amount: '', date: new Date().toISOString().split('T')[0], type: 'Salary Advance', note: '' });
                    apiFetch(`/api/tenant/ledger/employee/${selectedEmployee}`).then(async res => {
                      if (res.ok) {
                        const data = await res.json();
                        setEmployeeStatement(data.statement || []);
                        setEmployeeOutstanding(data.balance || 0);
                      }
                    });
                  });
                }}
                className="w-full md:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl transition-all shadow-sm"
              >
                Clear ₹{Number(employeeTxForm.amount || 0).toLocaleString()} {employeeTxForm.type}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Asset Registry Modal */}
      {assetModalOpen && (
        <div className="fixed inset-0 bg-black/55 z-50 flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-sm">
          <div className="bg-white rounded-t-3xl md:rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 fixed bottom-0 md:relative md:bottom-auto">
            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-2 md:hidden"></div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-800">Add Asset Registry</h3>
              <button onClick={() => setAssetModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-[9px] font-black uppercase text-slate-400 block">PURCHASE COST</span>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-extrabold text-sm">₹</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={assetForm.purchaseCost}
                    onChange={e => setAssetForm({ ...assetForm, purchaseCost: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl pl-8 pr-3 py-2.5 text-sm font-black focus:outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[9px] font-black uppercase text-slate-400 block">ASSET DETAILS</span>
                <input
                  type="text"
                  placeholder="Asset Description (e.g. Excavator)"
                  value={assetForm.description}
                  onChange={e => setAssetForm({ ...assetForm, description: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
                />
                <input
                  type="date"
                  value={assetForm.purchaseDate}
                  onChange={e => setAssetForm({ ...assetForm, purchaseDate: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <span className="text-[9px] font-black uppercase text-slate-400 block">DEPRECIATION &amp; ASSIGNMENT</span>
                <input
                  type="number"
                  placeholder="Useful Life (Years)"
                  value={assetForm.usefulLifeYears}
                  onChange={e => setAssetForm({ ...assetForm, usefulLifeYears: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
                />
                <select
                  value={assetForm.assignedProjectId}
                  onChange={e => setAssetForm({ ...assetForm, assignedProjectId: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold bg-white focus:outline-none"
                >
                  <option value="">-- Optional: Assign Project --</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  handlePost('/api/tenant/assets', assetForm, () => {
                    setAssetModalOpen(false);
                    setAssetForm({ purchaseCost: '', description: '', purchaseDate: new Date().toISOString().split('T')[0], usefulLifeYears: '5', assignedProjectId: '' });
                    fetchAssets();
                  });
                }}
                className="w-full md:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl transition-all shadow-sm"
              >
                Save ₹{Number(assetForm.purchaseCost || 0).toLocaleString()} Asset Registry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Transaction (Purchase/Issue splits) Modal */}
      {stockTxModalOpen && (
        <div className="fixed inset-0 bg-black/55 z-55 flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-t-3xl md:rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4 fixed bottom-0 md:relative md:bottom-auto my-8">
            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-2 md:hidden"></div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-800">Record Stock In / Out</h3>
              <button onClick={() => setStockTxModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            <div className="space-y-4">

              {/* QUANTITY & COST */}
              <div className="space-y-2">
                <span className="text-[9px] font-black uppercase text-slate-400 block">QUANTITY &amp; COST</span>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    placeholder="Enter Quantity"
                    value={stockTxForm.quantity}
                    onChange={e => setStockTxForm({ ...stockTxForm, quantity: e.target.value })}
                    className="border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Rate per unit (₹)"
                    value={stockTxForm.rate}
                    onChange={e => setStockTxForm({ ...stockTxForm, rate: e.target.value })}
                    className="border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none"
                  />
                </div>
              </div>

              {/* TRANSACTION DETAILS */}
              <div className="space-y-2">
                <span className="text-[9px] font-black uppercase text-slate-400 block">TRANSACTION DETAILS</span>
                <select
                  value={stockTxForm.type}
                  onChange={e => setStockTxForm({ ...stockTxForm, type: e.target.value, splits: e.target.value === 'issue' ? [{ projectId: 'Overhead', splitType: 'percentage', splitValue: '100' }] : [] })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold bg-white focus:outline-none"
                >
                  <option value="purchase">Purchase Stock In (Linked to Vendor)</option>
                  <option value="issue">Issue Stock Out (Project split)</option>
                  <option value="wastage">Wastage / Damage write-off</option>
                </select>
                <select
                  value={stockTxForm.siteId}
                  onChange={e => setStockTxForm({ ...stockTxForm, siteId: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold bg-white focus:outline-none"
                >
                  <option value="">-- Choose Store Warehouse --</option>
                  {worksites.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>

              {/* Purchase vendor link */}
              {stockTxForm.type === 'purchase' && (
                <div className="space-y-2">
                  <span className="text-[9px] font-black uppercase text-slate-400 block">VENDOR ARREARS LINK</span>
                  <select
                    value={stockTxForm.vendorId}
                    onChange={e => setStockTxForm({ ...stockTxForm, vendorId: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold bg-white focus:outline-none"
                  >
                    <option value="">-- Optional: Link to Vendor Account --</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
              )}

              {/* Multiple Project Issue splits */}
              {stockTxForm.type === 'issue' && (
                <div className="space-y-3 border-t border-slate-100 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black uppercase text-slate-400">PROJECT ALLOCATION SPLITS</span>
                    <div className="flex items-center gap-4">
                      <label className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                        <input
                          type="radio"
                          checked={stockTxForm.splitType === 'percentage'}
                          onChange={() => setStockTxForm({ ...stockTxForm, splitType: 'percentage' })}
                        />
                        % Percent
                      </label>
                      <label className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                        <input
                          type="radio"
                          checked={stockTxForm.splitType === 'quantity'}
                          onChange={() => setStockTxForm({ ...stockTxForm, splitType: 'quantity' })}
                        />
                        Qty Quantity
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {stockTxForm.splits.map((split, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <select
                          value={split.projectId}
                          onChange={e => {
                            const newSplits = [...stockTxForm.splits];
                            newSplits[idx].projectId = e.target.value;
                            setStockTxForm({ ...stockTxForm, splits: newSplits });
                          }}
                          className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold bg-white"
                        >
                          <option value="Overhead">Overhead / Headquarters</option>
                          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <input
                          type="number"
                          placeholder={stockTxForm.splitType === 'percentage' ? '%' : 'Qty'}
                          value={split.splitValue}
                          onChange={e => {
                            const newSplits = [...stockTxForm.splits];
                            newSplits[idx].splitValue = e.target.value;
                            setStockTxForm({ ...stockTxForm, splits: newSplits });
                          }}
                          className="w-24 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                        />
                        {stockTxForm.splits.length > 1 && (
                          <button
                            onClick={() => {
                              const newSplits = stockTxForm.splits.filter((_, sidx) => sidx !== idx);
                              setStockTxForm({ ...stockTxForm, splits: newSplits });
                            }}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-slate-100 rounded-lg"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      setStockTxForm({
                        ...stockTxForm,
                        splits: [...stockTxForm.splits, { projectId: 'Overhead', splitType: stockTxForm.splitType as any, splitValue: '0' }]
                      });
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-750 text-[10px] font-black rounded-lg flex items-center gap-1 transition-colors"
                  >
                    + Add project split
                  </button>
                </div>
              )}

            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  const errorMsg = validateSplits();
                  if (errorMsg) {
                    alert(errorMsg);
                    return;
                  }

                  const endpoint = `/api/tenant/stock/${stockTxForm.type}`;
                  const body = {
                    itemId: selectedStockItem,
                    siteId: stockTxForm.siteId,
                    date: stockTxForm.date,
                    totalQuantity: stockTxForm.quantity,
                    quantity: stockTxForm.quantity,
                    rate: stockTxForm.rate,
                    vendorId: stockTxForm.vendorId || null,
                    splits: stockTxForm.type === 'issue' ? stockTxForm.splits.map(s => ({
                      projectId: s.projectId,
                      splitType: stockTxForm.splitType,
                      splitValue: s.splitValue
                    })) : []
                  };

                  handlePost(endpoint, body, () => {
                    setStockTxModalOpen(false);
                    setStockTxForm({ quantity: '', rate: '', type: 'purchase', date: new Date().toISOString().split('T')[0], siteId: '', vendorId: '', splitType: 'quantity', splits: [{ projectId: 'Overhead', splitType: 'percentage', splitValue: '100' }] });
                    apiFetch(`/api/tenant/stock/ledger/${selectedStockItem}`).then(async res => {
                      if (res.ok) setStockLedger(await res.json());
                    });
                  });
                }}
                className="w-full md:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl transition-all shadow-sm"
              >
                Record ₹{Number(stockTxForm.quantity || 0) * Number(stockTxForm.rate || 0)} Transaction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Debit Note Modal Dialog */}
      {debitNoteModalOpen && (
        <div className="fixed inset-0 bg-black/55 z-55 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-6 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <ArrowUp size={16} className="text-rose-500" /> Create Debit Note
              </h3>
              <button
                onClick={() => setDebitNoteModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500 block font-extrabold">Party Type *</label>
                <select
                  value={debitNoteForm.partyType}
                  onChange={e => {
                    const type = e.target.value as 'Vendor' | 'Client';
                    setDebitNoteForm({
                      ...debitNoteForm,
                      partyType: type,
                      partyId: type === 'Vendor' ? (vendors[0]?.id || '') : (clients[0]?.id || '')
                    });
                  }}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold bg-white focus:outline-none"
                >
                  <option value="Vendor">Vendor</option>
                  <option value="Client">Client</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500 block font-extrabold">Select Party *</label>
                <select
                  value={debitNoteForm.partyId}
                  onChange={e => setDebitNoteForm({ ...debitNoteForm, partyId: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold bg-white focus:outline-none"
                >
                  <option value="">-- Choose Party --</option>
                  {debitNoteForm.partyType === 'Vendor' ? (
                    vendors.map(v => <option key={v.id} value={v.id}>{v.name} ({v.code})</option>)
                  ) : (
                    clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)
                  )}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500 block font-extrabold">Amount (₹) *</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={debitNoteForm.amount}
                  onChange={e => setDebitNoteForm({ ...debitNoteForm, amount: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500 block font-extrabold">Date *</label>
                <input
                  type="date"
                  value={debitNoteForm.date}
                  onChange={e => setDebitNoteForm({ ...debitNoteForm, date: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500 block font-extrabold">Link to Project</label>
                <select
                  value={debitNoteForm.projectTag}
                  onChange={e => setDebitNoteForm({ ...debitNoteForm, projectTag: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold bg-white focus:outline-none"
                >
                  <option value="Overhead">Overhead (General)</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500 block font-extrabold">Note / Narration *</label>
                <input
                  type="text"
                  placeholder="Reason for Debit Note"
                  value={debitNoteForm.note}
                  onChange={e => setDebitNoteForm({ ...debitNoteForm, note: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => setDebitNoteModalOpen(false)}
                className="text-xs font-black text-slate-500 hover:text-slate-800 uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!debitNoteForm.amount || !debitNoteForm.partyId || !debitNoteForm.note) {
                    alert('Please fill out all required details.');
                    return;
                  }
                  const endpoint = debitNoteForm.partyType === 'Vendor'
                    ? '/api/tenant/ledger/vendor/entry'
                    : '/api/tenant/ledger/client/entry';

                  const payload = debitNoteForm.partyType === 'Vendor'
                    ? { vendorId: debitNoteForm.partyId, amount: debitNoteForm.amount, date: debitNoteForm.date, type: 'Debit Note', projectTag: debitNoteForm.projectTag, note: debitNoteForm.note }
                    : { clientId: debitNoteForm.partyId, amount: debitNoteForm.amount, date: debitNoteForm.date, type: 'Debit Note', projectTag: debitNoteForm.projectTag, note: debitNoteForm.note };

                  const res = await apiFetch(endpoint, {
                    method: 'POST',
                    body: JSON.stringify(payload)
                  });
                  if (res.ok) {
                    alert('Debit Note recorded successfully!');
                    setDebitNoteModalOpen(false);
                    fetchDebitNotes();
                  } else {
                    const err = await res.json();
                    alert(err.error || 'Failed to record Debit Note');
                  }
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-colors"
              >
                Submit Debit Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credit Note Modal Dialog */}
      {creditNoteModalOpen && (
        <div className="fixed inset-0 bg-black/55 z-55 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-6 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <ArrowDown size={16} className="text-emerald-500" /> Create Credit Note
              </h3>
              <button
                onClick={() => setCreditNoteModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500 block font-extrabold">Party Type *</label>
                <select
                  value={creditNoteForm.partyType}
                  onChange={e => {
                    const type = e.target.value as 'Client' | 'Vendor';
                    setCreditNoteForm({
                      ...creditNoteForm,
                      partyType: type,
                      partyId: type === 'Client' ? (clients[0]?.id || '') : (vendors[0]?.id || '')
                    });
                  }}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold bg-white focus:outline-none"
                >
                  <option value="Client">Client</option>
                  <option value="Vendor">Vendor</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500 block font-extrabold">Select Party *</label>
                <select
                  value={creditNoteForm.partyId}
                  onChange={e => setCreditNoteForm({ ...creditNoteForm, partyId: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold bg-white focus:outline-none"
                >
                  <option value="">-- Choose Party --</option>
                  {creditNoteForm.partyType === 'Client' ? (
                    clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)
                  ) : (
                    vendors.map(v => <option key={v.id} value={v.id}>{v.name} ({v.code})</option>)
                  )}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500 block font-extrabold">Amount (₹) *</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={creditNoteForm.amount}
                  onChange={e => setCreditNoteForm({ ...creditNoteForm, amount: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500 block font-extrabold">Date *</label>
                <input
                  type="date"
                  value={creditNoteForm.date}
                  onChange={e => setCreditNoteForm({ ...creditNoteForm, date: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500 block font-extrabold">Link to Project</label>
                <select
                  value={creditNoteForm.projectTag}
                  onChange={e => setCreditNoteForm({ ...creditNoteForm, projectTag: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold bg-white focus:outline-none"
                >
                  <option value="Overhead">Overhead (General)</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500 block font-extrabold">Note / Narration *</label>
                <input
                  type="text"
                  placeholder="Reason for Credit Note"
                  value={creditNoteForm.note}
                  onChange={e => setCreditNoteForm({ ...creditNoteForm, note: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => setCreditNoteModalOpen(false)}
                className="text-xs font-black text-slate-500 hover:text-slate-800 uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!creditNoteForm.amount || !creditNoteForm.partyId || !creditNoteForm.note) {
                    alert('Please fill out all required details.');
                    return;
                  }
                  const endpoint = creditNoteForm.partyType === 'Client'
                    ? '/api/tenant/ledger/client/entry'
                    : '/api/tenant/ledger/vendor/entry';

                  const payload = creditNoteForm.partyType === 'Client'
                    ? { clientId: creditNoteForm.partyId, amount: creditNoteForm.amount, date: creditNoteForm.date, type: 'Credit Note', projectTag: creditNoteForm.projectTag, note: creditNoteForm.note }
                    : { vendorId: creditNoteForm.partyId, amount: creditNoteForm.amount, date: creditNoteForm.date, type: 'Credit Note', projectTag: creditNoteForm.projectTag, note: creditNoteForm.note };

                  const res = await apiFetch(endpoint, {
                    method: 'POST',
                    body: JSON.stringify(payload)
                  });
                  if (res.ok) {
                    alert('Credit Note recorded successfully!');
                    setCreditNoteModalOpen(false);
                    fetchCreditNotes();
                  } else {
                    const err = await res.json();
                    alert(err.error || 'Failed to record Credit Note');
                  }
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-colors"
              >
                Submit Credit Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Row-level direct reversal confirmation modal */}
      {reversalModalOpen && (
        <div className="fixed inset-0 bg-black/55 z-55 flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-sm">
          <div className="bg-white rounded-t-3xl md:rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 fixed bottom-0 md:relative md:bottom-auto">
            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-2 md:hidden"></div>

            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-black text-red-600 flex items-center gap-2">
                  <RefreshCw size={18} /> Reverse Ledger Entry
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-1">
                  You are about to append an equal-and-opposite reversal voucher for <strong>{reversalForm.voucherNo}</strong>.
                </p>
              </div>
              <button
                onClick={() => setReversalModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">REVERSAL REASON *</span>
                <input
                  type="text"
                  placeholder="Enter reason for reversal (e.g. Data entry error)"
                  value={reversalForm.reason}
                  onChange={e => setReversalForm({ ...reversalForm, reason: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setReversalModalOpen(false)}
                className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={triggerReversal}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-colors shadow-sm"
              >
                Confirm Reversal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Item Modal */}
      {itemModalOpen && (
        <div className="fixed inset-0 bg-black/55 z-50 flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-sm">
          <div className="bg-white rounded-t-3xl md:rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 fixed bottom-0 md:relative md:bottom-auto">
            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-2 md:hidden"></div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-800">Add Stock Item Master</h3>
              <button onClick={() => setItemModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-[9px] font-black uppercase text-slate-400 block">ITEM DESCRIPTION</span>
                <input
                  type="text"
                  placeholder="Item Name (e.g. Cement)"
                  value={itemForm.name}
                  onChange={e => setItemForm({ ...itemForm, name: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none"
                />
                <select
                  value={itemForm.unitOfMeasure}
                  onChange={e => setItemForm({ ...itemForm, unitOfMeasure: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold bg-white focus:outline-none"
                >
                  <option value="Piece">Piece</option>
                  <option value="Bag">Bag</option>
                  <option value="Liter">Liter</option>
                  <option value="Kg">Kg</option>
                  <option value="Meter">Meter</option>
                </select>
                <input
                  type="text"
                  placeholder="Category (e.g. General)"
                  value={itemForm.category}
                  onChange={e => setItemForm({ ...itemForm, category: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  handlePost('/api/tenant/stock/items', itemForm, () => {
                    setItemModalOpen(false);
                    setItemForm({ name: '', unitOfMeasure: 'Piece', category: 'General' });
                    fetchStockItems();
                  });
                }}
                className="w-full md:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl transition-all shadow-sm"
              >
                Create Item
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

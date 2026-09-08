import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../../../context/AuthContext';
import { apiFetch } from '../../../../../lib/api';
import {
  TrendingUp, AlertCircle, Wallet, DollarSign, ChevronRight, FileText, Clock, Plus, FolderPlus, Folder,
  ArrowRightLeft, ArrowDown, ArrowUp, RefreshCw, Layers, Clipboard, CreditCard, ArrowLeft,
  Settings, CheckCircle, Trash2, Calendar, User, ShoppingCart, Info, Users, Menu, X, Filter, Search,
  Check, Briefcase, Network, ChevronDown, ChevronUp, Printer, ListOrdered, List, Bold, Italic, Eraser, Tag, Paperclip, Scale, Landmark, Coins
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
      { id: 'assets-liabilities', label: 'Assets & Liabilities', icon: Landmark },
      { id: 'record-ledger', label: 'Record Ledger Entry', icon: Clipboard },
      { id: 'project-costing', label: 'Project Costing & Details', icon: Briefcase },
      { id: 'create-ledger', label: 'Create Ledger', icon: Plus },
    ]
  },
  {
    group: 'Expenditures', items: [
      { id: 'company-expenses', label: 'Company Expenses', icon: DollarSign },
    ]
  },
] as const;

type TabType = typeof SIDEBAR_SECTIONS[number]['items'][number]['id'] | 'assets-liabilities' | 'create-ledger' | 'create-group' | 'record-ledger';

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
    const validTabs: TabType[] = ['ledger', 'assets-liabilities', 'record-ledger', 'project-costing', 'company-expenses', 'create-ledger'];
    if (tabParam === 'create-group') {
      setActiveTab('create-ledger');
      setCreateSection('group');
    } else if (tabParam && validTabs.includes(tabParam as TabType)) {
      setActiveTab(tabParam as TabType);
      if (tabParam === 'create-ledger') setCreateSection('ledger');
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
    companyCategory: '',
    groupName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    branchName: '',
    custodianName: '',
    gstin: '',
    address: '',
    contactInfo: '',
    paymentTerms: ''
  });

  // --- Sub-section toggle inside Create Ledger ---
  const [createSection, setCreateSection] = useState<'ledger' | 'group'>('ledger');
  const [successModal, setSuccessModal] = useState<{ open: boolean; title: string; message: string } | null>(null);

  // --- Create Group State ---
  const [createGroupForm, setCreateGroupForm] = useState({
    groupName: '',
    groupCode: '',
    description: ''
  });
  const [ledgerGroups, setLedgerGroups] = useState<any[]>([]);
  const [filterLedgerType, setFilterLedgerType] = useState('All Types');
  const [filterLedgerStatus, setFilterLedgerStatus] = useState('All Status');
  const [filterLedgerGroup, setFilterLedgerGroup] = useState('All Groups');
  const [selectedExpenseGroup, setSelectedExpenseGroup] = useState<string | null>(null);
  const [recordTxSelectedGroup, setRecordTxSelectedGroup] = useState<string>('');
  const [searchGroupQuery, setSearchGroupQuery] = useState('');
  const [searchLedgerQuery, setSearchLedgerQuery] = useState('');
  const [showEmptyGroups, setShowEmptyGroups] = useState(false);
  // --- Overhauled Unified Ledgers State ---
  const [allLedgerAccounts, setAllLedgerAccounts] = useState<any[]>([]);
  const [loadingAllLedgers, setLoadingAllLedgers] = useState(false);
  const [companyLedgers, setCompanyLedgers] = useState<any[]>([]);
  const [selectedCompanyLedger, setSelectedCompanyLedger] = useState('');
  const [companyLedgerEntries, setCompanyLedgerEntries] = useState<any[]>([]);
  const [loadingCompanyLedgers, setLoadingCompanyLedgers] = useState(false);
  const [loadingCompanyEntries, setLoadingCompanyEntries] = useState(false);
  const [showWalletBreakdownModal, setShowWalletBreakdownModal] = useState(false);
  const [viewWalletBreakdownView, setViewWalletBreakdownView] = useState(false);
  const [expandedWalletCardId, setExpandedWalletCardId] = useState<string | null>(null);
  const [cardEntriesMap, setCardEntriesMap] = useState<Record<string, any[]>>({});
  const [loadingCardEntries, setLoadingCardEntries] = useState<Record<string, boolean>>({});

  const toggleWalletCardAccordion = async (cardId: string, ledgerCode?: string) => {
    if (expandedWalletCardId === cardId) {
      setExpandedWalletCardId(null);
      return;
    }
    setExpandedWalletCardId(cardId);
    if (!cardEntriesMap[cardId]) {
      setLoadingCardEntries(prev => ({ ...prev, [cardId]: true }));
      try {
        if (ledgerCode) {
          const res = await apiFetch(`/api/tenant/ledger/entries/${encodeURIComponent(ledgerCode)}`);
          const entries = Array.isArray(res) ? res : (res?.entries || res?.data || []);
          setCardEntriesMap(prev => ({ ...prev, [cardId]: entries }));
        } else {
          setCardEntriesMap(prev => ({ ...prev, [cardId]: [] }));
        }
      } catch (err) {
        console.error('Failed to fetch entries for wallet card:', err);
        setCardEntriesMap(prev => ({ ...prev, [cardId]: [] }));
      } finally {
        setLoadingCardEntries(prev => ({ ...prev, [cardId]: false }));
      }
    }
  };

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
  const [paidOffsetLedgerCodeInput, setPaidOffsetLedgerCodeInput] = useState('');

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
      let combined: any[] = [];

      // 1. Company Overhead Ledgers
      const companyRes = await apiFetch('/api/tenant/ledger/company-ledgers');
      if (companyRes.ok) {
        const comp = await companyRes.json();
        combined = combined.concat(comp);
      }

      // 2. Project Ledgers
      if (projects && projects.length > 0) {
        const promises = projects.map(async (p) => {
          const res = await apiFetch(`/api/tenant/ledger/project-ledgers/${p.id}`);
          if (res.ok) return await res.json();
          return [];
        });
        const projsLedgers = await Promise.all(promises);
        projsLedgers.forEach(list => {
          combined = combined.concat(list);
        });
      }

      // 3. Bank Accounts
      const bankRes = await apiFetch('/api/tenant/ledger/bank-cash/accounts');
      if (bankRes.ok) {
        const banks = await bankRes.json();
        banks.forEach((b: any) => {
          combined.push({
            id: b.id || b.ledgerCode,
            ledgerCode: b.ledgerCode || `BNK-${b.id}`,
            name: b.name || b.bankName || 'Bank Account',
            type: 'Bank',
            groupName: 'Bank Accounts',
            currentBalance: Number(b.currentBalance || b.openingBalance || 0),
            status: 'Active',
            department: b.branchName || 'Treasury'
          });
        });
      }

      // 4. Petty Cash Floats
      const floatRes = await apiFetch('/api/tenant/ledger/petty-cash/floats/all');
      if (floatRes.ok) {
        const floats = await floatRes.json();
        floats.forEach((p: any) => {
          combined.push({
            id: p.id || p.ledgerCode,
            ledgerCode: p.ledgerCode || `CSH-${p.id}`,
            name: p.name || p.custodianName || 'Petty Cash Float',
            type: 'Cash',
            groupName: 'Cash Floats',
            currentBalance: Number(p.currentBalance || p.current_balance || p.openingAmount || p.balance || 0),
            status: 'Active',
            department: p.siteName || 'Site Cash'
          });
        });
      }

      // 5. Clients / Receivables
      if (currentUser?.uid) {
        const clientRes = await apiFetch(`/api/tenant/accounts/clients/${currentUser.uid}`);
        if (clientRes.ok) {
          const cls = await clientRes.json();
          cls.forEach((c: any) => {
            combined.push({
              id: c.id || c.ledgerCode,
              ledgerCode: c.ledgerCode || `REC-${c.id}`,
              name: c.name || c.clientName || 'Client Account',
              type: 'Receivable',
              groupName: 'Accounts Receivable',
              currentBalance: Number(c.outstanding || c.outstandingBalance || c.outstandingAmount || c.outstanding_amount || c.balance || c.currentBalance || c.current_balance || c.openingBalance || 0),
              status: 'Active',
              department: 'Sales & AR'
            });
          });
        }

        // 6. Vendors / Payables
        const vendorRes = await apiFetch(`/api/tenant/accounts/vendors/${currentUser.uid}`);
        if (vendorRes.ok) {
          const vds = await vendorRes.json();
          vds.forEach((v: any) => {
            combined.push({
              id: v.id || v.ledgerCode,
              ledgerCode: v.ledgerCode || `PAY-${v.id}`,
              name: v.name || v.vendorName || 'Vendor Account',
              type: 'Payable',
              groupName: 'Accounts Payable',
              currentBalance: Number(v.outstanding || v.outstandingBalance || v.outstandingAmount || v.outstanding_amount || v.balance || v.currentBalance || v.current_balance || v.openingBalance || 0),
              status: 'Active',
              department: 'Procurement & AP'
            });
          });
        }
      }

      // 7. Assets
      const assetRes = await apiFetch('/api/tenant/assets');
      if (assetRes.ok) {
        const asts = await assetRes.json();
        asts.forEach((a: any) => {
          combined.push({
            id: a.id || a.ledgerCode,
            ledgerCode: a.ledgerCode || `AST-${a.id}`,
            name: a.description || a.name || 'Fixed Asset',
            type: 'Asset',
            groupName: 'Fixed Assets',
            currentBalance: Number(a.purchaseCost || a.purchase_cost || a.currentValue || a.balance || 0),
            status: 'Active',
            department: 'Capital Assets'
          });
        });
      }

      // Deduplicate by ledgerCode or id
      const unique: any[] = [];
      const seen = new Set();
      for (const item of combined) {
        const key = item.ledgerCode || item.id;
        if (key && !seen.has(key)) {
          seen.add(key);
          unique.push(item);
        }
      }

      setAllLedgerAccounts(unique);
    } catch (e) {
      console.error('Error fetching all ledger accounts:', e);
    } finally {
      setLoadingAllLedgers(false);
    }
  };

  const fetchLedgerGroups = async () => {
    try {
      const res = await apiFetch('/api/tenant/ledger/groups');
      if (res.ok) {
        const data = await res.json();
        setLedgerGroups(data);
      }
    } catch (err) {
      console.error('Failed to fetch ledger groups:', err);
    }
  };

  useEffect(() => {
    fetchAllLedgerAccounts();
    fetchLedgerGroups();
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
                        <div className="flex items-center gap-3.5">
                          <button
                            onClick={() => setInspectingLedgerCode(null)}
                            className="px-3 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 rounded-xl transition-all flex items-center gap-1.5 font-black text-xs uppercase tracking-wider border border-slate-200 shadow-2xs"
                            title="Back to Ledgers"
                          >
                            <ArrowLeft size={16} className="text-slate-600" />
                            <span>Back to Ledgers</span>
                          </button>
                          <div className="h-7 w-px bg-slate-200 hidden sm:block" />
                          <div>
                            <div className="flex items-center gap-2">
                              <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">{currentLedger.name || ledgerTitle}</h2>
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-800">
                                {currentLedger.type || 'Expense'} Ledger
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-semibold mt-1">
                              <span>Code: <span className="font-mono font-bold text-blue-600">{currentLedger.ledgerCode}</span></span>
                              {currentLedger.bankName && <span>Bank: <strong className="text-slate-800">{currentLedger.bankName}</strong></span>}
                              {currentLedger.accountNumber && <span>A/C #: <span className="font-mono font-bold text-slate-800">{currentLedger.accountNumber}</span></span>}
                              {currentLedger.ifscCode && <span>IFSC: <span className="font-mono font-bold text-slate-800">{currentLedger.ifscCode}</span></span>}
                              {currentLedger.custodianName && <span>Custodian: <strong className="text-slate-800">{currentLedger.custodianName}</strong></span>}
                              {currentLedger.gstin && <span>GSTIN: <span className="font-mono font-bold text-slate-800">{currentLedger.gstin}</span></span>}
                              {currentLedger.paymentTerms && <span>Terms: <strong className="text-slate-800">{currentLedger.paymentTerms}</strong></span>}
                            </div>
                          </div>
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
                            <Plus size={12} /> + Add Credit
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
                            <Plus size={12} /> + Add Debit
                          </button>
                        </div>
                      </div>

                      {/* Date Filter Bar & Sub-tab segment switcher */}
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-slate-50 border border-slate-200/80 p-3 rounded-2xl">
                        {/* Sub-tabs */}
                        <div className="flex gap-2">
                          {[
                            { id: 'overview', label: 'Overview' },
                            { id: 'income', label: 'Credit Entries' },
                            { id: 'expense', label: 'Debit Entries' }
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
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Total Credit</span>
                                  <span className="text-sm font-black text-emerald-600 mt-1 block">
                                    ₹{totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>

                                <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Total Debit</span>
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
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Project-Wise Allocation Breakdown</h3>
                                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Summary of total credit received, debit spent, and remaining balance grouped by project.</p>
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
                                    <th className="p-3.5 text-right">Total Credit (₹)</th>
                                    <th className="p-3.5 text-right">Total Debit (₹)</th>
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
            ) : !selectedExpenseGroup ? (
              /* LEVEL 1: LEDGER GROUPS DIRECTORY */
              <div className="space-y-6">
                {/* Directory Header Bar */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">LEDGER GROUPS DIRECTORY</h1>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700">
                        Primary Accounting Groups
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-semibold mt-1">
                      Browse all primary and secondary accounting categories. Click any group card to inspect its underlying ledger accounts.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative max-w-xs w-full">
                      <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search ledger groups..."
                        value={searchGroupQuery}
                        onChange={e => setSearchGroupQuery(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold focus:outline-none focus:border-slate-800 bg-slate-50"
                      />
                    </div>
                    <button
                      onClick={() => setShowEmptyGroups(!showEmptyGroups)}
                      className={`px-3 py-2 text-xs font-bold rounded-xl transition-all border ${
                        showEmptyGroups
                          ? 'bg-slate-200 text-slate-800 border-slate-300'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {showEmptyGroups ? 'Hide Empty Groups' : 'Show All Categories'}
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('create-ledger');
                        setCreateSection('group');
                      }}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
                    >
                      <Plus size={14} /> + New Group
                    </button>
                  </div>
                </div>

                {/* Grid of Groups */}
                {(() => {
                  const matchLedgerGroup = (l: any, targetGroup: string): boolean => {
                    const grp = l.groupName || l.group_name || l.companyCategory || l.company_category;
                    if (grp && String(grp).trim()) {
                      return String(grp).trim().toLowerCase() === targetGroup.trim().toLowerCase();
                    }
                    const type = String(l.type || l.ledger_type || '').toLowerCase();
                    const tgt = targetGroup.trim().toLowerCase();
                    if (tgt.includes('bank') && (type.includes('bank') || type.includes('wallet'))) return true;
                    if (tgt.includes('cash') && (type.includes('cash') || type.includes('petty'))) return true;
                    if (tgt.includes('receivable') && (type.includes('receivable') || type.includes('client'))) return true;
                    if (tgt.includes('payable') && (type.includes('payable') || type.includes('vendor'))) return true;
                    if (tgt.includes('fixed asset') && (type.includes('asset') || type.includes('fixed'))) return true;
                    if (tgt.includes('direct expense') && type.includes('direct')) return true;
                    if ((tgt.includes('sales') || tgt.includes('income')) && (type.includes('sales') || type.includes('income') || type.includes('revenue'))) return true;
                    if (tgt.includes('liability') && type.includes('liability')) return true;
                    if (tgt.includes('capital') && (type.includes('capital') || type.includes('reserve'))) return true;
                    if (tgt.includes('indirect expense') || tgt.includes('overhead')) return (type.includes('expense') || type.includes('overhead') || !type);
                    return false;
                  };

                  const stdGroups = [
                    'Indirect Expenses / Overheads',
                    'Direct Expenses',
                    'Bank Accounts',
                    'Cash Floats',
                    'Accounts Receivable',
                    'Accounts Payable',
                    'Fixed Assets',
                    'Current Assets',
                    'Current Liabilities',
                    'Capital & Reserves',
                    'Sales & Income'
                  ];

                  const customGroupNames = (ledgerGroups || []).map((g: any) => g.name || g.groupName).filter(Boolean);
                  const combinedGroupNames = Array.from(new Set([...stdGroups, ...customGroupNames]));

                  const filteredGroups = combinedGroupNames.filter(gName => {
                    const matchesSearch = gName.toLowerCase().includes(searchGroupQuery.toLowerCase());
                    if (!matchesSearch) return false;
                    const groupLedgers = allLedgerAccounts.filter(l => matchLedgerGroup(l, gName));
                    const isCustom = (ledgerGroups || []).some((cg: any) => (cg.name || cg.groupName || '').toLowerCase() === gName.toLowerCase());
                    if (!showEmptyGroups) {
                      return groupLedgers.length > 0 || isCustom;
                    }
                    return true;
                  });

                  if (filteredGroups.length === 0) {
                    return (
                      <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl p-8 space-y-4 shadow-2xs">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                          <Folder size={24} />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">No Active Ledger Groups</h3>
                          <p className="text-xs text-slate-500 font-semibold max-w-sm mx-auto">
                            Groups with 0 ledger profiles are hidden by default. Click below to view all accounting categories or create a new ledger.
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                          <button
                            onClick={() => setShowEmptyGroups(true)}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs uppercase tracking-wider rounded-xl transition-all"
                          >
                            Show All 11 Accounting Categories
                          </button>
                          <button
                            onClick={() => {
                              setActiveTab('create-ledger');
                              setCreateSection('ledger');
                            }}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-sm transition-all"
                          >
                            + Create First Ledger
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredGroups.map(gName => {
                        const customGrpObj = (ledgerGroups || []).find((cg: any) => (cg.name || cg.groupName || '').toLowerCase() === gName.toLowerCase());
                        const groupLedgers = allLedgerAccounts.filter(l => matchLedgerGroup(l, gName));

                        const totalGrpBalance = groupLedgers.reduce(
                          (sum, acc) => sum + Number(acc.currentBalance || acc.current_balance || acc.outstanding || acc.outstandingBalance || acc.outstandingAmount || acc.balance || acc.openingBalance || acc.opening_balance || acc.purchaseCost || 0),
                          0
                        );

                        return (
                          <div
                            key={gName}
                            onClick={() => setSelectedExpenseGroup(gName)}
                            className="group cursor-pointer bg-white border border-slate-200/80 hover:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4"
                          >
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                  <Folder size={20} />
                                </div>
                                <span className="text-xs font-black font-mono text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                                  ₹{totalGrpBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                              </div>

                              <div className="space-y-1">
                                <h3 className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                                  {gName}
                                </h3>
                                <p className="text-[11px] text-slate-400 font-semibold line-clamp-2 leading-relaxed">
                                  {customGrpObj?.description || `Accounting category group for organizing ${gName.toLowerCase()} ledgers and vouchers.`}
                                </p>
                              </div>
                            </div>

                            <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-500">
                                {groupLedgers.length} {groupLedgers.length === 1 ? 'Ledger profile' : 'Ledger profiles'}
                              </span>

                              <div className="flex items-center gap-1 text-xs font-black text-blue-600 group-hover:translate-x-1 transition-transform">
                                <span>View Ledgers</span>
                                <ChevronRight size={14} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            ) : (
              /* LEVEL 2: LEDGERS INSIDE SELECTED GROUP */
              <div className="space-y-6">
                {/* Clean Top Navigation & Header */}
                <div className="space-y-3">
                  <div>
                    <button
                      onClick={() => setSelectedExpenseGroup(null)}
                      className="px-3.5 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 rounded-xl transition-all inline-flex items-center gap-1.5 font-black text-xs uppercase tracking-wider border border-slate-200 shadow-2xs"
                    >
                      <ArrowLeft size={16} className="text-slate-600" />
                      <span>Back to Group Directory</span>
                    </button>
                  </div>

                  <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    {/* Left: Group Title */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="p-3 bg-blue-600 text-white rounded-xl shadow-sm">
                        <Folder size={22} />
                      </div>
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">SELECTED GROUP</span>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">{selectedExpenseGroup}</h1>
                      </div>
                    </div>

                    {/* Center: Search Bar */}
                    <div className="relative flex-1 max-w-sm w-full md:w-auto">
                      <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type="text"
                        placeholder={`Search ledgers in ${selectedExpenseGroup}...`}
                        value={searchLedgerQuery}
                        onChange={e => setSearchLedgerQuery(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold focus:outline-none focus:border-slate-800 bg-slate-50"
                      />
                    </div>

                    {/* Right: Add Ledger Button */}
                    <div className="shrink-0">
                      <button
                        onClick={() => {
                          setCreateLedgerForm(prev => ({
                            ...prev,
                            groupName: selectedExpenseGroup,
                            companyCategory: selectedExpenseGroup,
                            ledgerCode: 'LDG-' + String(allLedgerAccounts.length + 1).padStart(3, '0')
                          }));
                          setActiveTab('create-ledger');
                          setCreateSection('ledger');
                        }}
                        className="px-4 py-2.5 bg-blue-600 text-white font-black text-xs uppercase tracking-wider rounded-xl hover:bg-blue-700 shadow-md flex items-center gap-1.5 transition-all"
                      >
                        <Plus size={14} /> Add Ledger in {selectedExpenseGroup}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Ledgers inside selected group */}
                {(() => {
                  const matchLedgerGroup = (l: any, targetGroup: string): boolean => {
                    const grp = l.groupName || l.group_name || l.companyCategory || l.company_category;
                    if (grp && String(grp).trim()) {
                      return String(grp).trim().toLowerCase() === targetGroup.trim().toLowerCase();
                    }
                    const type = String(l.type || l.ledger_type || '').toLowerCase();
                    const tgt = targetGroup.trim().toLowerCase();
                    if (tgt.includes('bank') && (type.includes('bank') || type.includes('wallet'))) return true;
                    if (tgt.includes('cash') && (type.includes('cash') || type.includes('petty'))) return true;
                    if (tgt.includes('receivable') && (type.includes('receivable') || type.includes('client'))) return true;
                    if (tgt.includes('payable') && (type.includes('payable') || type.includes('vendor'))) return true;
                    if (tgt.includes('fixed asset') && (type.includes('asset') || type.includes('fixed'))) return true;
                    if (tgt.includes('direct expense') && type.includes('direct')) return true;
                    if ((tgt.includes('sales') || tgt.includes('income')) && (type.includes('sales') || type.includes('income') || type.includes('revenue'))) return true;
                    if (tgt.includes('liability') && type.includes('liability')) return true;
                    if (tgt.includes('capital') && (type.includes('capital') || type.includes('reserve'))) return true;
                    if (tgt.includes('indirect expense') || tgt.includes('overhead')) return (type.includes('expense') || type.includes('overhead') || !type);
                    return false;
                  };

                  const groupLedgers = allLedgerAccounts.filter(l => {
                    const matchesGroup = matchLedgerGroup(l, selectedExpenseGroup || '');
                    const matchesSearch = (l.name || '').toLowerCase().includes(searchLedgerQuery.toLowerCase()) ||
                      (l.ledgerCode || '').toLowerCase().includes(searchLedgerQuery.toLowerCase());
                    return matchesGroup && matchesSearch;
                  });

                  const renderCard = (l: any) => {
                    const projName = projects.find(p => p.id === l.project_id)?.name || l.project_id || 'Company';

                    return (
                      <div
                        key={l.id || l.ledgerCode}
                        onClick={(e) => {
                          if ((e.target as HTMLElement).closest('button')) return;
                          setInspectingLedgerCode(l.ledgerCode);
                        }}
                        className="cursor-pointer bg-white border border-slate-200/80 hover:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3">
                          {/* Top row: Code & Project Tag */}
                          <div className="flex justify-between items-center flex-wrap gap-1">
                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider bg-slate-100/80 border border-slate-200/80 px-2.5 py-0.5 rounded-lg font-mono">
                              {l.ledgerCode}
                            </span>
                            <span className="text-[9px] font-black text-blue-600 uppercase tracking-wider bg-blue-50/80 px-2.5 py-0.5 rounded-lg border border-blue-100">
                              {projName}
                            </span>
                          </div>

                          {/* Name & Subtitle */}
                          <div className="space-y-1">
                            <h3 className="text-xs font-black text-slate-900 leading-snug">
                              {l.name}
                            </h3>
                            <div className="flex items-center gap-2 flex-wrap pt-0.5">
                              <span className="inline-block font-black text-[9px] px-2 py-0.5 rounded-md border uppercase bg-slate-100 text-slate-600 border-slate-200">
                                {l.department || 'Operations'}
                              </span>
                              <span className={`inline-block font-black text-[9px] px-2 py-0.5 rounded-md border uppercase ${l.status === 'Inactive' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}>
                                {l.status || 'Active'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Ledger Balance Row */}
                        <div className="border-t border-slate-100 pt-2.5 flex items-center justify-between">
                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Current Balance</span>
                          <span className="text-xs font-black font-mono text-slate-900">
                            ₹{Number(l.currentBalance || l.current_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    );
                  };

                  return (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <h2 className="text-xs font-black uppercase text-slate-700 tracking-wider">
                          Ledgers in {selectedExpenseGroup}
                        </h2>
                        <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                          {groupLedgers.length} Accounts
                        </span>
                      </div>

                      {groupLedgers.length === 0 ? (
                        <div className="text-center py-12 text-xs text-slate-400 font-semibold bg-slate-50/50 rounded-2xl border border-slate-200/80 space-y-2">
                          <p>No ledger profiles created under "{selectedExpenseGroup}" yet.</p>
                          <button
                            onClick={() => {
                              setCreateLedgerForm(prev => ({
                                ...prev,
                                groupName: selectedExpenseGroup,
                                companyCategory: selectedExpenseGroup,
                                ledgerCode: 'LDG-' + String(allLedgerAccounts.length + 1).padStart(3, '0')
                              }));
                              setActiveTab('create-ledger');
                              setCreateSection('ledger');
                            }}
                            className="text-blue-600 font-black underline text-xs hover:text-blue-800"
                          >
                            + Create first ledger in {selectedExpenseGroup}
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {groupLedgers.map(l => renderCard(l))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )
          )}

          {/* 2. ASSETS & LIABILITIES TAB (BANK & CASH ACCOUNTS DIRECTORY) */}
          {activeTab === 'assets-liabilities' && (
            <div className="space-y-6">
              {(() => {
                const createdBankAccounts = allLedgerAccounts.filter(
                  l => (l.type === 'Bank' || l.type === 'bank') && !bankAccounts.some(b => (b.ledgerCode && b.ledgerCode === l.ledgerCode) || b.id === l.id)
                ).map(l => ({
                  id: l.id || l.ledgerCode,
                  name: l.name,
                  accountNo: l.accountNumber || l.account_number || l.ledgerCode || 'N/A',
                  bankName: l.bankName || l.bank_name || l.name,
                  ifscCode: l.ifscCode || l.ifsc_code || 'N/A',
                  branch: l.branchName || l.branch_name || 'Main Branch',
                  type: 'Bank Ledger Account',
                  currentBalance: Number(l.currentBalance || l.current_balance || l.openingBalance || 0),
                  ledgerCode: l.ledgerCode
                }));

                const displayBankAccounts = [...bankAccounts, ...createdBankAccounts];

                const createdPettyFloats = allLedgerAccounts.filter(
                  l => (l.type === 'Cash' || l.type === 'cash') && !allPettyFloats.some(p => (p.ledgerCode && p.ledgerCode === l.ledgerCode) || p.id === l.id)
                ).map(l => ({
                  id: l.id || l.ledgerCode,
                  name: l.name,
                  custodianName: l.custodianName || l.custodian_name || l.responsiblePerson || l.name,
                  siteName: l.description || 'General Cash Box',
                  type: 'Cash Ledger Account',
                  currentBalance: Number(l.currentBalance || l.current_balance || l.openingBalance || 0),
                  ledgerCode: l.ledgerCode
                }));

                const displayPettyFloats = [...allPettyFloats, ...createdPettyFloats];

                const totalWalletBalance = displayBankAccounts.reduce((sum, b) => sum + Number(b.currentBalance || b.current_balance || b.openingBalance || 0), 0) +
                  displayPettyFloats.reduce((sum, p) => sum + Number(p.currentBalance || p.current_balance || p.openingAmount || 0), 0);

                return (
                  <div className="space-y-6">
                    {/* Header Bar */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4 gap-3">
                      <div className="space-y-1">
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                          <Landmark size={24} className="text-blue-600" /> Bank &amp; Cash Accounts
                        </h1>
                        <p className="text-xs text-slate-500 font-semibold">View all your bank accounts, cash boxes, and current balances in one place.</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setBankModalOpen(true)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-1.5"
                        >
                          <Plus size={14} /> + Add Bank Account
                        </button>
                      </div>
                    </div>

                      {/* Total Summary Banner */}
                      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block">TOTAL AVAILABLE BALANCE</span>
                          <p className="text-3xl font-black text-white mt-1">
                            ₹{totalWalletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-slate-300 font-medium mt-1">
                            Total money across {displayBankAccounts.length} Bank Account{displayBankAccounts.length !== 1 ? 's' : ''} and {displayPettyFloats.length} Cash Box{displayPettyFloats.length !== 1 ? 'es' : ''}.
                          </p>
                        </div>
                      </div>

                      {/* Grid 1: Bank Accounts */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-200/80 pb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                              <Landmark size={18} />
                            </div>
                            <div>
                              <h2 className="text-sm font-black uppercase text-slate-900 tracking-wider">
                                Bank Accounts
                              </h2>
                              <span className="text-[10px] text-slate-400 font-semibold block">Connected bank wallets &amp; settlement accounts</span>
                            </div>
                          </div>
                          <span className="text-xs font-black text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                            {displayBankAccounts.length} Account{displayBankAccounts.length !== 1 ? 's' : ''}
                          </span>
                        </div>

                        {displayBankAccounts.length === 0 ? (
                          <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-xs font-semibold text-slate-400 space-y-2">
                            <p>No bank accounts added yet.</p>
                            <button onClick={() => setBankModalOpen(true)} className="text-blue-600 font-black underline hover:text-blue-800">+ Add your first bank account</button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {displayBankAccounts.map((b: any) => {
                              const cardId = `bank-${b.id || b.ledgerCode || b.accountNo || b.name}`;
                              const bal = Number(b.currentBalance || b.current_balance || b.openingBalance || 0);
                              const accNo = b.accountNo || b.account_no || b.accountNumber || b.account_number || '501004889201';
                              const bankName = b.bankName || b.bank_name || (b.name.includes('HDFC') ? 'HDFC Bank Ltd.' : b.name.includes('ICICI') ? 'ICICI Bank Ltd.' : b.name.includes('SBI') ? 'State Bank of India' : 'Scheduled Bank');
                              const ifsc = b.ifscCode || b.ifsc_code || b.ifsc || 'HDFC0001429';
                              const branch = b.branch || b.branchName || b.branch_name || 'Main Branch';
                              const accType = b.type || 'Bank Account';
                              const isExpanded = expandedWalletCardId === cardId;
                              const entries = (cardEntriesMap[cardId] || []).slice(0, 5);
                              const isLoadingEntries = loadingCardEntries[cardId];

                              return (
                                <div
                                  key={cardId}
                                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-slate-300 transition-all space-y-3"
                                >
                                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div className="flex items-center gap-3.5 min-w-0">
                                      <div className="p-3 bg-blue-50 text-blue-700 rounded-xl border border-blue-100 shrink-0">
                                        <Landmark size={22} />
                                      </div>
                                      <div className="space-y-0.5 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <h3 className="text-sm font-black text-slate-900 truncate">{b.name}</h3>
                                          <span className="text-[9px] font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 shrink-0">
                                            {bankName}
                                          </span>
                                          <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
                                            {accType}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                                          <span>Acc: <strong className="font-mono text-slate-800">{accNo}</strong></span>
                                          <span>IFSC: <strong className="font-mono text-slate-800">{ifsc}</strong></span>
                                          <span className="hidden sm:inline">Branch: {branch}</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-between md:justify-end gap-5 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                                      <div className="text-left md:text-right">
                                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">AVAILABLE BALANCE</span>
                                        <span className="text-lg font-black text-slate-900 block tracking-tight">
                                          ₹{bal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() => {
                                            if (b.ledgerCode) {
                                              setInspectingLedgerCode(b.ledgerCode);
                                              setActiveTab('ledger');
                                            } else {
                                              setSelectedBankAccount(b.id);
                                              setActiveTab('bank-register');
                                            }
                                          }}
                                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-wider rounded-xl shadow-xs transition-all flex items-center gap-1 shrink-0"
                                        >
                                          Statement <ChevronRight size={12} />
                                        </button>

                                        <button
                                          onClick={() => toggleWalletCardAccordion(cardId, b.ledgerCode)}
                                          className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl border transition-all flex items-center gap-1 shrink-0 ${isExpanded
                                              ? 'bg-blue-50 text-blue-700 border-blue-300'
                                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                                            }`}
                                        >
                                          Last 5 Txns {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                        </button>
                                      </div>
                                    </div>
                                  </div>

                                  {isExpanded && (
                                    <div className="border-t border-slate-100 pt-3 mt-1 space-y-2 bg-slate-50/70 rounded-xl p-3">
                                      <div className="flex justify-between items-center px-1">
                                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                                          Recent 5 Transactions for {b.name}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-semibold">Real-time settlement history</span>
                                      </div>

                                      {isLoadingEntries ? (
                                        <div className="py-4 text-center text-xs font-semibold text-slate-400 animate-pulse">
                                          Loading transactions...
                                        </div>
                                      ) : entries.length === 0 ? (
                                        <div className="py-4 text-center text-xs font-medium text-slate-400 bg-white rounded-lg border border-slate-200/80">
                                          No recorded transactions found for this account.
                                        </div>
                                      ) : (
                                        <div className="overflow-x-auto">
                                          <table className="w-full text-left border-collapse bg-white rounded-lg border border-slate-200/80 overflow-hidden text-xs">
                                            <thead>
                                              <tr className="bg-slate-100/80 text-[10px] font-black uppercase text-slate-500 border-b border-slate-200">
                                                <th className="py-2 px-3">Date</th>
                                                <th className="py-2 px-3">Voucher #</th>
                                                <th className="py-2 px-3">Description</th>
                                                <th className="py-2 px-3 text-right">Amount</th>
                                                <th className="py-2 px-3 text-center">Status</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                              {entries.map((tx: any, idx: number) => {
                                                const isDebit = Number(tx.debit_amount || 0) > 0;
                                                const isCredit = Number(tx.credit_amount || 0) > 0;
                                                const amount = isDebit ? Number(tx.debit_amount) : Number(tx.credit_amount);
                                                const txDate = tx.date ? new Date(tx.date).toLocaleDateString('en-IN') : 'N/A';
                                                const voucher = tx.voucher_no || tx.voucherNo || `TX-${tx.id || idx}`;
                                                const desc = tx.description || tx.narration || 'Ledger Entry';

                                                let statusLabel = 'PAID';
                                                let statusBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';

                                                if (tx.status === 'PENDING' || tx.status === 'INVOICE_RAISED') {
                                                  statusLabel = 'PENDING';
                                                  statusBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
                                                } else if (isDebit) {
                                                  statusLabel = 'RECEIVED';
                                                  statusBadgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
                                                } else if (isCredit) {
                                                  statusLabel = 'DEBITED';
                                                  statusBadgeClass = 'bg-purple-50 text-purple-700 border-purple-200';
                                                }

                                                return (
                                                  <tr key={tx.id || idx} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="py-2 px-3 font-mono text-[11px] text-slate-600">{txDate}</td>
                                                    <td className="py-2 px-3 font-mono font-bold text-slate-800 text-[11px]">{voucher}</td>
                                                    <td className="py-2 px-3 text-slate-700 font-medium truncate max-w-[200px]">{desc}</td>
                                                    <td className={`py-2 px-3 text-right font-black font-mono ${isDebit ? 'text-emerald-700' : 'text-slate-800'}`}>
                                                      {isDebit ? `+₹${amount.toLocaleString('en-IN')}` : `-₹${amount.toLocaleString('en-IN')}`}
                                                    </td>
                                                    <td className="py-2 px-3 text-center">
                                                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${statusBadgeClass}`}>
                                                        {statusLabel}
                                                      </span>
                                                    </td>
                                                  </tr>
                                                );
                                              })}
                                            </tbody>
                                          </table>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Grid 2: Cash Boxes & Floats */}
                      <div className="space-y-4 pt-4">
                        <div className="flex justify-between items-center border-b border-slate-200/80 pb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                              <Coins size={18} />
                            </div>
                            <div>
                              <h2 className="text-sm font-black uppercase text-slate-900 tracking-wider">
                                Cash Boxes &amp; Floats
                              </h2>
                              <span className="text-[10px] text-slate-400 font-semibold block">Petty cash floats &amp; site cash boxes</span>
                            </div>
                          </div>
                          <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                            {displayPettyFloats.length} Box{displayPettyFloats.length !== 1 ? 'es' : ''}
                          </span>
                        </div>

                        {displayPettyFloats.length === 0 ? (
                          <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-xs font-semibold text-slate-400">
                            No cash boxes added yet.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {displayPettyFloats.map((p: any) => {
                              const cardId = `petty-${p.id || p.ledgerCode || p.custodianName}`;
                              const bal = Number(p.currentBalance || p.current_balance || p.openingAmount || 0);
                              const custodian = p.custodianName || p.custodian_name || p.name || 'Cash Custodian';
                              const site = p.siteName || p.site_id ? `Site: ${p.siteName || p.site_id}` : 'General Cash Box';
                              const isExpanded = expandedWalletCardId === cardId;
                              const entries = (cardEntriesMap[cardId] || []).slice(0, 5);
                              const isLoadingEntries = loadingCardEntries[cardId];

                              return (
                                <div
                                  key={cardId}
                                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-slate-300 transition-all space-y-3"
                                >
                                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div className="flex items-center gap-3.5 min-w-0">
                                      <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 shrink-0">
                                        <Coins size={22} />
                                      </div>
                                      <div className="space-y-0.5 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <h3 className="text-sm font-black text-slate-900 truncate">{custodian}</h3>
                                          <span className="text-[9px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
                                            CASH FLOAT
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                                          <span>Scope: <strong className="font-semibold text-slate-800">{site}</strong></span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-between md:justify-end gap-5 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                                      <div className="text-left md:text-right">
                                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">CASH IN HAND</span>
                                        <span className="text-lg font-black text-emerald-700 block tracking-tight">
                                          ₹{bal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() => {
                                            if (p.ledgerCode) {
                                              setInspectingLedgerCode(p.ledgerCode);
                                              setActiveTab('ledger');
                                            } else {
                                              setSelectedCustodian(p.custodianId || p.id);
                                              setActiveTab('petty-cash');
                                            }
                                          }}
                                          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-black uppercase tracking-wider rounded-xl shadow-xs transition-all flex items-center gap-1 shrink-0"
                                        >
                                          Cash Log <ChevronRight size={12} />
                                        </button>

                                        <button
                                          onClick={() => toggleWalletCardAccordion(cardId, p.ledgerCode)}
                                          className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl border transition-all flex items-center gap-1 shrink-0 ${isExpanded
                                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                                            }`}
                                        >
                                          Last 5 Txns {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                        </button>
                                      </div>
                                    </div>
                                  </div>

                                  {isExpanded && (
                                    <div className="border-t border-slate-100 pt-3 mt-1 space-y-2 bg-slate-50/70 rounded-xl p-3">
                                      <div className="flex justify-between items-center px-1">
                                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                                          Recent 5 Cash Log Transactions for {custodian}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-semibold">Float movement history</span>
                                      </div>

                                      {isLoadingEntries ? (
                                        <div className="py-4 text-center text-xs font-semibold text-slate-400 animate-pulse">
                                          Loading transactions...
                                        </div>
                                      ) : entries.length === 0 ? (
                                        <div className="py-4 text-center text-xs font-medium text-slate-400 bg-white rounded-lg border border-slate-200/80">
                                          No recorded transactions found for this cash box.
                                        </div>
                                      ) : (
                                        <div className="overflow-x-auto">
                                          <table className="w-full text-left border-collapse bg-white rounded-lg border border-slate-200/80 overflow-hidden text-xs">
                                            <thead>
                                              <tr className="bg-slate-100/80 text-[10px] font-black uppercase text-slate-500 border-b border-slate-200">
                                                <th className="py-2 px-3">Date</th>
                                                <th className="py-2 px-3">Voucher #</th>
                                                <th className="py-2 px-3">Description</th>
                                                <th className="py-2 px-3 text-right">Amount</th>
                                                <th className="py-2 px-3 text-center">Status</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                              {entries.map((tx: any, idx: number) => {
                                                const isDebit = Number(tx.debit_amount || 0) > 0;
                                                const isCredit = Number(tx.credit_amount || 0) > 0;
                                                const amount = isDebit ? Number(tx.debit_amount) : Number(tx.credit_amount);
                                                const txDate = tx.date ? new Date(tx.date).toLocaleDateString('en-IN') : 'N/A';
                                                const voucher = tx.voucher_no || tx.voucherNo || `CSH-${tx.id || idx}`;
                                                const desc = tx.description || tx.narration || 'Cash Entry';

                                                let statusLabel = 'PAID';
                                                let statusBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';

                                                if (tx.status === 'PENDING' || tx.status === 'INVOICE_RAISED') {
                                                  statusLabel = 'PENDING';
                                                  statusBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
                                                } else if (isDebit) {
                                                  statusLabel = 'RECEIVED';
                                                  statusBadgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
                                                } else if (isCredit) {
                                                  statusLabel = 'DEBITED';
                                                  statusBadgeClass = 'bg-purple-50 text-purple-700 border-purple-200';
                                                }

                                                return (
                                                  <tr key={tx.id || idx} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="py-2 px-3 font-mono text-[11px] text-slate-600">{txDate}</td>
                                                    <td className="py-2 px-3 font-mono font-bold text-slate-800 text-[11px]">{voucher}</td>
                                                    <td className="py-2 px-3 text-slate-700 font-medium truncate max-w-[200px]">{desc}</td>
                                                    <td className={`py-2 px-3 text-right font-black font-mono ${isDebit ? 'text-emerald-700' : 'text-slate-800'}`}>
                                                      {isDebit ? `+₹${amount.toLocaleString('en-IN')}` : `-₹${amount.toLocaleString('en-IN')}`}
                                                    </td>
                                                    <td className="py-2 px-3 text-center">
                                                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${statusBadgeClass}`}>
                                                        {statusLabel}
                                                      </span>
                                                    </td>
                                                  </tr>
                                                );
                                              })}
                                            </tbody>
                                          </table>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          {/* 4. COMPANY EXPENSES & OVERHEADS TAB */}
          {activeTab === 'company-expenses' && (
            <div className="space-y-6">
              {/* Header Bar */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Company Expenses & Overheads</h1>
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md bg-purple-50 border border-purple-200 text-purple-700">
                      Administrative & Payroll
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-semibold mt-1">
                    Manage office salaries, PF & ESI statutory accounts, building rent, utilities, and administrative overheads.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => {
                      setQuickTxForm({
                        ledgerCode: companyLedgers[0]?.ledgerCode || '',
                        direction: 'Debit',
                        docType: 'Expenditure',
                        amount: '',
                        date: new Date().toISOString().split('T')[0],
                        description: 'Office Salary / Overhead Expense Payment',
                        projectId: 'Overhead',
                        siteId: '',
                        offsetLedgerCode: bankAccounts[0]?.ledgerCode || '',
                        billRef: '',
                        linkedVoucherNo: '',
                        extraNotes: ''
                      });
                      setActiveTab('record-ledger');
                    }}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
                  >
                    <Plus size={14} /> + Record Office Expense
                  </button>

                  <button
                    onClick={() => {
                      setCreateLedgerForm(prev => ({
                        ...prev,
                        ledgerCategory: 'Company',
                        groupName: 'Indirect Expenses / Overheads',
                        companyCategory: 'Indirect Expenses / Overheads',
                        ledgerCode: 'LDG-' + String(allLedgerAccounts.length + 1).padStart(3, '0')
                      }));
                      setActiveTab('create-ledger');
                      setCreateSection('ledger');
                    }}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
                  >
                    <Plus size={14} /> + Add Overhead Account
                  </button>
                </div>
              </div>

              {/* Overhead Expense Summary Metrics */}
              {(() => {
                const totalOverheadSpend = companyLedgerEntries.reduce((sum, e) => sum + Number(e.debit_amount || 0), 0);
                const salaryLedger = companyLedgers.find(l => (l.name || '').toLowerCase().includes('salary') || (l.name || '').toLowerCase().includes('payroll'));
                const pfLedger = companyLedgers.find(l => (l.name || '').toLowerCase().includes('pf') || (l.name || '').toLowerCase().includes('provident') || (l.name || '').toLowerCase().includes('esi'));

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-1">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Overhead Spend</span>
                      <div className="text-xl font-black text-slate-900 font-mono">
                        ₹{totalOverheadSpend.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 block">Recorded company expenses</span>
                    </div>

                    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-1">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Office Salaries & Payroll</span>
                      <div className="text-xl font-black text-blue-700 font-mono">
                        ₹{Number(salaryLedger?.currentBalance || salaryLedger?.current_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <span className="text-[10px] font-bold text-blue-600 block">Staff salaries & allowances</span>
                    </div>

                    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-1">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">PF & ESI Deductions</span>
                      <div className="text-xl font-black text-purple-700 font-mono">
                        ₹{Number(pfLedger?.currentBalance || pfLedger?.current_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <span className="text-[10px] font-bold text-purple-600 block">Statutory employer benefits</span>
                    </div>

                    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-1">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Overhead Accounts</span>
                      <div className="text-xl font-black text-emerald-700 font-mono">
                        {companyLedgers.length} Profiles
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 block">Active administrative ledgers</span>
                    </div>
                  </div>
                );
              })()}

              {/* Overhead Expense Accounts & Categories */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <h2 className="text-xs font-black uppercase text-slate-700 tracking-wider">
                    Company Overhead Accounts & Categories
                  </h2>
                  <div className="relative max-w-xs w-full">
                    <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search company overhead accounts..."
                      value={searchLedgerQuery}
                      onChange={e => setSearchLedgerQuery(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-bold bg-white focus:outline-none focus:border-slate-800"
                    />
                  </div>
                </div>

                {(() => {
                  const filteredCompanyLedgers = companyLedgers.filter(l =>
                    (l.name || '').toLowerCase().includes(searchLedgerQuery.toLowerCase()) ||
                    (l.ledgerCode || '').toLowerCase().includes(searchLedgerQuery.toLowerCase())
                  );

                  if (filteredCompanyLedgers.length === 0) {
                    return (
                      <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
                        <p className="text-xs text-slate-500 font-semibold">No company overhead accounts created yet.</p>
                        <button
                          onClick={() => {
                            setCreateLedgerForm(prev => ({
                              ...prev,
                              ledgerCategory: 'Company',
                              groupName: 'Indirect Expenses / Overheads',
                              companyCategory: 'Indirect Expenses / Overheads',
                              ledgerCode: 'LDG-' + String(allLedgerAccounts.length + 1).padStart(3, '0')
                            }));
                            setActiveTab('create-ledger');
                            setCreateSection('ledger');
                          }}
                          className="px-4 py-2 bg-blue-600 text-white font-black text-xs uppercase tracking-wider rounded-xl hover:bg-blue-700 shadow-sm transition-all"
                        >
                          + Create Office Salaries / Overhead Ledger
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredCompanyLedgers.map((l: any) => {
                        const bal = Number(l.currentBalance || l.current_balance || 0);
                        const isInspecting = selectedCompanyLedger === l.ledgerCode;

                        return (
                          <div
                            key={l.id || l.ledgerCode}
                            onClick={() => {
                              setSelectedCompanyLedger(l.ledgerCode);
                            }}
                            className={`cursor-pointer bg-white border rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all space-y-4 ${
                              isInspecting ? 'border-blue-600 ring-2 ring-blue-500/10' : 'border-slate-200/80 hover:border-slate-400'
                            }`}
                          >
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider bg-slate-100 px-2.5 py-0.5 rounded-lg font-mono">
                                  {l.ledgerCode}
                                </span>
                                <span className="text-[9px] font-black uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                                  {l.department || 'Administrative'}
                                </span>
                              </div>

                              <div>
                                <h3 className="text-sm font-black text-slate-900 leading-snug">{l.name}</h3>
                                <p className="text-[11px] text-slate-400 font-semibold line-clamp-1 mt-0.5">
                                  {l.description || 'Company overhead expense account'}
                                </p>
                              </div>
                            </div>

                            <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                              <div>
                                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">CURRENT BALANCE</span>
                                <span className="text-xs font-black font-mono text-slate-900">
                                  ₹{bal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                              </div>

                              <button
                                onClick={(evt) => {
                                  evt.stopPropagation();
                                  setInspectingLedgerCode(l.ledgerCode);
                                  setActiveTab('ledger');
                                }}
                                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all"
                              >
                                View Log
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Selected Overhead Ledger Detailed Transactions Log */}
              {selectedCompanyLedger && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs mt-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-3 gap-2">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-blue-600 block">TRANSACTION REGISTER</span>
                      <h3 className="text-sm font-black text-slate-900">
                        {companyLedgers.find(l => l.ledgerCode === selectedCompanyLedger)?.name || selectedCompanyLedger} Ledger Entries
                      </h3>
                    </div>
                    <button
                      onClick={() => setSelectedCompanyLedger('')}
                      className="text-xs font-bold text-slate-400 hover:text-slate-700"
                    >
                      Clear Selection
                    </button>
                  </div>

                  {loadingCompanyEntries ? (
                    <div className="py-8 text-center text-xs font-semibold text-slate-400">Loading ledger entries...</div>
                  ) : companyLedgerEntries.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 font-semibold bg-slate-50 rounded-xl">
                      No voucher entries posted for this overhead account yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                            <th className="p-3">Posting Date</th>
                            <th className="p-3">Voucher #</th>
                            <th className="p-3">Particulars / Description</th>
                            <th className="p-3 text-right">Debit (₹)</th>
                            <th className="p-3 text-right">Credit (₹)</th>
                            <th className="p-3 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-bold text-slate-800">
                          {companyLedgerEntries.map((e: any, idx: number) => (
                            <tr key={e.id || idx} className="hover:bg-slate-50/60">
                              <td className="p-3">{new Date(e.date || new Date()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                              <td className="p-3 font-mono font-black text-slate-900">{e.voucher_no || `VOU-${idx}`}</td>
                              <td className="p-3 text-slate-700 font-medium">{e.description || e.narration || 'Overhead expense'}</td>
                              <td className="p-3 text-right font-black text-rose-600">
                                {Number(e.debit_amount || 0) > 0 ? `₹${Number(e.debit_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                              </td>
                              <td className="p-3 text-right font-black text-emerald-600">
                                {Number(e.credit_amount || 0) > 0 ? `₹${Number(e.credit_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                              </td>
                              <td className="p-3 text-center">
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-black uppercase rounded-md">
                                  POSTED
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

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
              {(() => {
                // Collect unique groups
                const allGroupsSet = new Set<string>();
                ledgerGroups.forEach(g => { if (g.name) allGroupsSet.add(g.name); });
                ['Direct Expenses', 'Indirect Expenses', 'Overhead & Administrative', 'Bank Accounts', 'Sundry Debtors (Clients)', 'Sundry Creditors (Vendors)'].forEach(g => allGroupsSet.add(g));
                allLedgerAccounts.forEach(l => {
                  const grp = l.groupName || l.group_name || l.companyCategory || l.company_category;
                  if (grp) allGroupsSet.add(grp);
                });

                const groupList = Array.from(allGroupsSet);

                // Find group of currently selected ledger
                const selectedLedgerObj = allLedgerAccounts.find(l => l.ledgerCode === quickTxForm.ledgerCode);
                const activeGroup = recordTxSelectedGroup || (selectedLedgerObj ? (selectedLedgerObj.groupName || selectedLedgerObj.group_name || selectedLedgerObj.companyCategory || selectedLedgerObj.company_category || groupList[0]) : groupList[0]);

                // Ledgers inside activeGroup
                const groupLedgers = allLedgerAccounts.filter(l => {
                  const grp = l.groupName || l.group_name || l.companyCategory || l.company_category || 'General Expenses';
                  return grp === activeGroup;
                });

                return (
                  <div className="bg-slate-50/80 p-6 rounded-3xl border border-slate-200/90 space-y-4 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">1. Account &amp; Transaction Scope</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {/* Field 1: Primary Group Selection */}
                      <div className="space-y-2">
                        <label className="text-xs font-extrabold uppercase text-slate-700 block">
                          Select Accounting Group *
                        </label>
                        <select
                          value={activeGroup}
                          onChange={e => {
                            const newGroup = e.target.value;
                            setRecordTxSelectedGroup(newGroup);
                            const matchingLedgers = allLedgerAccounts.filter(l => {
                              const grp = l.groupName || l.group_name || l.companyCategory || l.company_category || 'General Expenses';
                              return grp === newGroup;
                            });
                            if (matchingLedgers.length > 0) {
                              setQuickTxForm(prev => ({ ...prev, ledgerCode: matchingLedgers[0].ledgerCode }));
                            } else {
                              setQuickTxForm(prev => ({ ...prev, ledgerCode: '' }));
                            }
                          }}
                          className="w-full border border-slate-300 rounded-2xl px-4 py-3 text-xs font-bold bg-white focus:outline-none focus:border-slate-900 shadow-2xs"
                        >
                          {groupList.map(gName => {
                            const count = allLedgerAccounts.filter(l => {
                              const grp = l.groupName || l.group_name || l.companyCategory || l.company_category || 'General Expenses';
                              return grp === gName;
                            }).length;
                            return (
                              <option key={gName} value={gName}>
                                {gName} ({count} {count === 1 ? 'ledger' : 'ledgers'})
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      {/* Field 2: Ledger Account Selection inside selected group */}
                      <div className="space-y-2">
                        <label className="text-xs font-extrabold uppercase text-slate-700 block">
                          Select Ledger Profile ({groupLedgers.length} in group) *
                        </label>
                        <select
                          value={quickTxForm.ledgerCode}
                          onChange={e => setQuickTxForm({ ...quickTxForm, ledgerCode: e.target.value })}
                          className="w-full border border-slate-300 rounded-2xl px-4 py-3 text-xs font-bold bg-white focus:outline-none focus:border-slate-900 shadow-2xs"
                        >
                          {groupLedgers.length === 0 ? (
                            <option value="">No ledgers in this group yet</option>
                          ) : (
                            groupLedgers.map(acc => (
                              <option key={acc.id} value={acc.ledgerCode}>
                                {acc.name} ({acc.ledgerCode})
                              </option>
                            ))
                          )}
                        </select>
                      </div>

                      {/* Field 3: Accounting Direction */}
                      <div className="space-y-2">
                        <label className="text-xs font-extrabold uppercase text-slate-700 block">
                          Accounting Direction *
                        </label>
                        <input
                          type="text"
                          disabled={true}
                          value={quickTxForm.direction === 'Credit' ? 'Credit (Money In / Income)' : 'Debit (Money Out / Expense)'}
                          className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold bg-slate-100/90 text-slate-700 cursor-not-allowed shadow-2xs"
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Section 2: Financial Amount & Allocation Scope */}
              <div className="bg-slate-50/80 p-6 rounded-3xl border border-slate-200/90 space-y-5 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">2. Financial Amount &amp; Site Allocation Scope</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    <label className="text-xs font-extrabold uppercase text-slate-700 block">
                      Settlement Bank / Cash Account (Wallet) *
                    </label>
                    <select
                      value={quickTxForm.offsetLedgerCode}
                      onChange={e => setQuickTxForm({ ...quickTxForm, offsetLedgerCode: e.target.value })}
                      className="w-full border border-slate-300 rounded-2xl px-4 py-3 text-xs font-bold bg-white focus:outline-none focus:border-slate-900 shadow-2xs"
                    >
                      <option value="">-- Choose Settlement Bank / Cash Account --</option>
                      {allLedgerAccounts.filter(l => (l.type === 'Bank' || l.type === 'Cash') && l.ledgerCode !== quickTxForm.ledgerCode).length > 0 && (
                        <optgroup label="Created Bank & Cash Ledgers">
                          {allLedgerAccounts.filter(l => (l.type === 'Bank' || l.type === 'Cash') && l.ledgerCode !== quickTxForm.ledgerCode).map(b => (
                            <option key={b.id || b.ledgerCode} value={b.ledgerCode}>
                              {b.name} ({b.type} - {b.ledgerCode}) | Bal: ₹{Number(b.currentBalance || b.current_balance || b.openingBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {bankAccounts.length > 0 && (
                        <optgroup label="System Bank Accounts">
                          {bankAccounts.map(b => (
                            <option key={b.id} value={b.ledgerCode || b.id}>
                              {b.name} (Bal: ₹{Number(b.currentBalance || b.current_balance || b.openingBalance || 0).toLocaleString('en-IN')})
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {allPettyFloats.length > 0 && (
                        <optgroup label="Cash Floats & Boxes">
                          {allPettyFloats.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.custodianName || p.name || 'Petty Cash'} (Bal: ₹{Number(p.currentBalance || p.current_balance || p.openingAmount || 0).toLocaleString('en-IN')})
                            </option>
                          ))}
                        </optgroup>
                      )}
                      <optgroup label="Other General Ledger Accounts">
                        {allLedgerAccounts.filter(l => l.type !== 'Bank' && l.type !== 'Cash' && l.ledgerCode !== quickTxForm.ledgerCode).map(acc => (
                          <option key={acc.id} value={acc.ledgerCode}>
                            {acc.name} ({acc.ledgerCode})
                          </option>
                        ))}
                      </optgroup>
                    </select>
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

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 block">Settlement Bank / Cash Account (Wallet)</label>
                    <select
                      value={paidOffsetLedgerCodeInput}
                      onChange={e => setPaidOffsetLedgerCodeInput(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold bg-white focus:outline-none focus:border-slate-800"
                    >
                      <option value="">-- Choose Settlement Account (Optional) --</option>
                      {allLedgerAccounts.filter(l => (l.type === 'Bank' || l.type === 'Cash') && l.ledgerCode !== paidFormTx?.ledger_code).map(b => (
                        <option key={b.id || b.ledgerCode} value={b.ledgerCode}>
                          {b.name} ({b.type} - {b.ledgerCode}) | Bal: ₹{Number(b.currentBalance || b.current_balance || b.openingBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </option>
                      ))}
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
                          paidDate: paidDateInput,
                          offsetLedgerCode: paidOffsetLedgerCodeInput
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

                        {/* Card 2: Total Project Debit */}
                        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
                          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                            <ArrowUp size={18} />
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Total Project Debit</span>
                            <span className="text-base font-black text-rose-700 mt-0.5 block">₹{totalExpenditure.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            <span className="text-[9px] text-rose-600 font-semibold block mt-0.5">Project debits &amp; payouts</span>
                          </div>
                        </div>

                        {/* Card 3: Total Project Credit */}
                        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
                          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                            <TrendingUp size={18} />
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Total Project Credit</span>
                            <span className="text-base font-black text-emerald-700 mt-0.5 block">₹{totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            <span className="text-[9px] text-emerald-600 font-semibold block mt-0.5">Project credits &amp; inflows</span>
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
                <span className="text-slate-600">
                  {createSection === 'ledger' ? 'Create Ledger Profile' : 'Create Group'}
                </span>
              </div>
              {/* Sub-navigation Tabs: Create Ledger vs Create Group */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                <button
                  type="button"
                  onClick={() => setCreateSection('ledger')}
                  className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 ${createSection === 'ledger'
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  <Plus size={14} /> Section 1: Create Ledger
                </button>
                <button
                  type="button"
                  onClick={() => setCreateSection('group')}
                  className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 ${createSection === 'group'
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  <FolderPlus size={14} /> Section 2: Create Group
                </button>
              </div>
              {/* SECTION 1: CREATE LEDGER */}
              {createSection === 'ledger' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create Ledger Profile</h1>
                  </div>
                  <div className="max-w-3xl space-y-6">
                    {/* Basic Information Card */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-sm">
                      <div>
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Basic Information</h3>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Primary accounting ledger credentials, classification group, and parameters.</p>
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
                          <label className="text-[10px] font-black uppercase text-slate-500 block font-extrabold">Primary Group / Group Name *</label>
                          <select
                            value={createLedgerForm.groupName}
                            onChange={e => setCreateLedgerForm({ ...createLedgerForm, groupName: e.target.value })}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-slate-800 bg-white"
                          >
                            <option value="">-- Select Primary Group --</option>
                            <optgroup label="Standard Accounting Groups">
                              <option value="Indirect Expenses / Overheads">Indirect Expenses / Overheads</option>
                              <option value="Direct Expenses">Direct Expenses</option>
                              <option value="Bank Accounts">Bank Accounts</option>
                              <option value="Cash Floats">Cash Floats</option>
                              <option value="Accounts Receivable">Accounts Receivable</option>
                              <option value="Accounts Payable">Accounts Payable</option>
                              <option value="Fixed Assets">Fixed Assets</option>
                              <option value="Current Assets">Current Assets</option>
                              <option value="Current Liabilities">Current Liabilities</option>
                              <option value="Capital &amp; Drawings">Capital &amp; Drawings</option>
                              <option value="Sales / Revenue">Sales / Revenue</option>
                              <option value="Other Income">Other Income</option>
                            </optgroup>
                            {ledgerGroups.length > 0 && (
                              <optgroup label="Custom Created Groups">
                                {ledgerGroups.map((g, idx) => {
                                  const gName = g?.name || g?.groupName || g?.group_name;
                                  if (!gName) return null;
                                  return (
                                    <option key={g.id || idx} value={gName}>
                                      {gName}
                                    </option>
                                  );
                                })}
                              </optgroup>
                            )}
                          </select>
                          <span className="text-[9px] text-slate-400 font-semibold block">Primary group classification for ledger statements.</span>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-500 block font-extrabold">Ledger Type *</label>
                          <select
                            value={createLedgerForm.type || 'Expense'}
                            onChange={e => setCreateLedgerForm({ ...createLedgerForm, type: e.target.value })}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-slate-800 bg-white"
                          >
                            <option value="Expense">General Ledger (Expense / Overhead)</option>
                            <option value="Bank">Bank Ledger (Bank Account)</option>
                            <option value="Cash">Cash Ledger (Petty Cash Float)</option>
                            <option value="Receivable">Accounts Receivable (Client Account)</option>
                            <option value="Payable">Accounts Payable (Vendor Account)</option>
                          </select>
                          <span className="text-[9px] text-slate-400 font-semibold block">Nature of ledger (General, Bank, or Cash).</span>
                        </div>
                      </div>

                      {/* Dynamic Schema Fields based on Ledger Type */}
                      {createLedgerForm.type === 'Bank' && (
                        <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-3">
                          <span className="text-[10px] font-black uppercase tracking-wider text-blue-800 block">Bank Account Specification</span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase text-slate-500 block">Bank Name *</label>
                              <input
                                type="text"
                                placeholder="e.g. State Bank of India, HDFC Bank"
                                value={createLedgerForm.bankName}
                                onChange={e => setCreateLedgerForm({ ...createLedgerForm, bankName: e.target.value })}
                                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-slate-800 bg-white"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase text-slate-500 block">Account Number *</label>
                              <input
                                type="text"
                                placeholder="e.g. 5010023456789"
                                value={createLedgerForm.accountNumber}
                                onChange={e => setCreateLedgerForm({ ...createLedgerForm, accountNumber: e.target.value })}
                                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-slate-800 bg-white font-mono"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase text-slate-500 block">IFSC / SWIFT Code *</label>
                              <input
                                type="text"
                                placeholder="e.g. SBIN0001234"
                                value={createLedgerForm.ifscCode}
                                onChange={e => setCreateLedgerForm({ ...createLedgerForm, ifscCode: e.target.value })}
                                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-slate-800 bg-white uppercase font-mono"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase text-slate-500 block">Branch Name</label>
                              <input
                                type="text"
                                placeholder="e.g. Main Branch, Commercial Hub"
                                value={createLedgerForm.branchName}
                                onChange={e => setCreateLedgerForm({ ...createLedgerForm, branchName: e.target.value })}
                                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-slate-800 bg-white"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {createLedgerForm.type === 'Cash' && (
                        <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl space-y-3">
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">Cash Float Specification</span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase text-slate-500 block">Custodian Person / Manager *</label>
                              <input
                                type="text"
                                list="team-person-list"
                                placeholder="Enter cash custodian name..."
                                value={createLedgerForm.custodianName || createLedgerForm.responsiblePerson}
                                onChange={e => setCreateLedgerForm({ ...createLedgerForm, custodianName: e.target.value, responsiblePerson: e.target.value })}
                                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-slate-800 bg-white"
                              />
                              <datalist id="team-person-list">
                                {employees.map(emp => <option key={emp.id} value={emp.name} />)}
                              </datalist>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase text-slate-500 block">Cash Box Location / Notes</label>
                              <input
                                type="text"
                                placeholder="e.g. Main Office Safe Box 2"
                                value={createLedgerForm.description}
                                onChange={e => setCreateLedgerForm({ ...createLedgerForm, description: e.target.value })}
                                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-slate-800 bg-white"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {createLedgerForm.type === 'Receivable' && (
                        <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-2xl space-y-3">
                          <span className="text-[10px] font-black uppercase tracking-wider text-purple-800 block">Client Profile Details</span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase text-slate-500 block">GSTIN / Tax Registration ID</label>
                              <input
                                type="text"
                                placeholder="e.g. 27AAAAA0000A1Z5"
                                value={createLedgerForm.gstin}
                                onChange={e => setCreateLedgerForm({ ...createLedgerForm, gstin: e.target.value })}
                                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-slate-800 bg-white font-mono uppercase"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase text-slate-500 block">Primary Contact Phone / Email</label>
                              <input
                                type="text"
                                placeholder="e.g. +91 9876543210 / accounts@client.com"
                                value={createLedgerForm.contactInfo}
                                onChange={e => setCreateLedgerForm({ ...createLedgerForm, contactInfo: e.target.value })}
                                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-slate-800 bg-white"
                              />
                            </div>
                            <div className="md:col-span-2 space-y-1">
                              <label className="text-[10px] font-black uppercase text-slate-500 block">Billing Address</label>
                              <input
                                type="text"
                                placeholder="Registered business billing address..."
                                value={createLedgerForm.address}
                                onChange={e => setCreateLedgerForm({ ...createLedgerForm, address: e.target.value })}
                                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-slate-800 bg-white"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {createLedgerForm.type === 'Payable' && (
                        <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl space-y-3">
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block">Vendor Profile & Payment Terms</span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase text-slate-500 block">GSTIN / Tax ID</label>
                              <input
                                type="text"
                                placeholder="e.g. 29ABCDE1234F1Z9"
                                value={createLedgerForm.gstin}
                                onChange={e => setCreateLedgerForm({ ...createLedgerForm, gstin: e.target.value })}
                                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-slate-800 bg-white font-mono uppercase"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase text-slate-500 block">Payment Terms</label>
                              <select
                                value={createLedgerForm.paymentTerms || 'Net 30'}
                                onChange={e => setCreateLedgerForm({ ...createLedgerForm, paymentTerms: e.target.value })}
                                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-slate-800 bg-white"
                              >
                                <option value="Immediate">Immediate / Advance</option>
                                <option value="Net 15">Net 15 Days</option>
                                <option value="Net 30">Net 30 Days</option>
                                <option value="Net 60">Net 60 Days</option>
                              </select>
                            </div>
                            <div className="md:col-span-2 space-y-1">
                              <label className="text-[10px] font-black uppercase text-slate-500 block">Vendor Payout Bank Details</label>
                              <input
                                type="text"
                                placeholder="e.g. HDFC Account # 5010098765432 / IFSC HDFC0000123"
                                value={createLedgerForm.accountNumber}
                                onChange={e => setCreateLedgerForm({ ...createLedgerForm, accountNumber: e.target.value })}
                                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-slate-800 bg-white font-mono"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {createLedgerForm.type === 'Expense' && (
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
                      )}
                    </div>
                  </div>

                  {/* Footer Action Buttons */}
                  <div className="flex justify-between items-center bg-white border border-slate-200 rounded-xl p-4 shadow-sm max-w-3xl">
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

                          const firstAvailableGroup = ledgerGroups[0]?.name || ledgerGroups[0]?.groupName || ledgerGroups[0]?.group_name || 'General Expenses';
                          const assignedGroup = createLedgerForm.groupName || firstAvailableGroup;
                          const resolvedProjectId = createLedgerForm.ledgerCategory === 'Company' ? 'Overhead' : (createLedgerForm.projectId || projects[0]?.id || 'Overhead');

                          const requestData = {
                            ...createLedgerForm,
                            groupName: assignedGroup,
                            group_name: assignedGroup,
                            companyCategory: assignedGroup,
                            company_category: assignedGroup,
                            projectId: resolvedProjectId,
                            type: createLedgerForm.type || 'Expense'
                          };

                          const fallbackLedger = {
                            id: String(Date.now()),
                            name: createLedgerForm.name.trim(),
                            ledgerCode: createLedgerForm.ledgerCode.trim(),
                            groupName: assignedGroup,
                            group_name: assignedGroup,
                            companyCategory: assignedGroup,
                            company_category: assignedGroup,
                            type: createLedgerForm.type || 'Expense',
                            status: createLedgerForm.status || 'Active',
                            currentBalance: Number(createLedgerForm.openingBalance || 0),
                            current_balance: Number(createLedgerForm.openingBalance || 0),
                            department: createLedgerForm.department || 'Operations',
                            project_id: resolvedProjectId
                          };

                          try {
                            const res = await apiFetch('/api/tenant/ledger/project-ledgers', {
                              method: 'POST',
                              body: JSON.stringify(requestData)
                            });
                            if (res.ok) {
                              const saved = await res.json();
                              const formattedSaved = {
                                ...saved,
                                groupName: saved.groupName || saved.group_name || assignedGroup,
                                group_name: saved.group_name || saved.groupName || assignedGroup,
                                companyCategory: saved.companyCategory || saved.company_category || assignedGroup,
                                company_category: saved.company_category || saved.companyCategory || assignedGroup
                              };
                              setAllLedgerAccounts(prev => [formattedSaved, ...prev]);
                            } else {
                              setAllLedgerAccounts(prev => [fallbackLedger, ...prev]);
                            }
                          } catch (err) {
                            setAllLedgerAccounts(prev => [fallbackLedger, ...prev]);
                          }

                          setSelectedExpenseGroup(assignedGroup);
                          setActiveTab('ledger');
                          setSuccessModal({
                            open: true,
                            title: 'Ledger Created Successfully! 🎉',
                            message: `Ledger profile "${createLedgerForm.name}" has been created under group "${assignedGroup}".`
                          });

                          setCreateLedgerForm({
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
                            ledgerCategory: 'Project',
                            overallCost: '',
                            advancePaid: '',
                            companyCategory: '',
                            groupName: '',
                            bankName: '',
                            accountNumber: '',
                            ifscCode: '',
                            branchName: '',
                            custodianName: '',
                            gstin: '',
                            address: '',
                            contactInfo: '',
                            paymentTerms: ''
                          });
                        }}
                        className="px-5 py-2 bg-blue-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-blue-700 shadow-md transition-colors"
                      >
                        Create Ledger
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 2: CREATE GROUP */}
              {createSection === 'group' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create Group</h1>
                      <p className="text-xs text-slate-400 font-semibold mt-0.5">Define accounting classification groups for organizing ledgers, balance sheets, and P&L statements.</p>
                    </div>
                  </div>

                  <div className="max-w-3xl space-y-6">
                    {/* Create Group Form Card */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-sm">
                      <div>
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                          <FolderPlus size={16} className="text-blue-600" /> New Ledger Group Setup
                        </h3>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Set up parent/child ledger category hierarchy.</p>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-500 block font-extrabold">Group Name *</label>
                          <input
                            type="text"
                            placeholder="Enter group name (e.g. Site Equipment Expenses)"
                            value={createGroupForm.groupName}
                            onChange={e => setCreateGroupForm({ ...createGroupForm, groupName: e.target.value })}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-slate-800"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-500 block font-extrabold">Group Code</label>
                          <input
                            type="text"
                            placeholder="e.g. GRP-009"
                            value={createGroupForm.groupCode || `GRP-00${ledgerGroups.length + 1}`}
                            onChange={e => setCreateGroupForm({ ...createGroupForm, groupCode: e.target.value })}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-slate-800 font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-500 block font-extrabold">Description / Purpose</label>
                          <textarea
                            rows={2}
                            placeholder="Optional details regarding accounting treatment for this group..."
                            value={createGroupForm.description}
                            onChange={e => setCreateGroupForm({ ...createGroupForm, description: e.target.value })}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-slate-800"
                          />
                        </div>

                        <div className="pt-2 flex gap-3">
                          <button
                            onClick={async () => {
                              if (!createGroupForm.groupName.trim()) {
                                alert('Group Name is required!');
                                return;
                              }
                              const grpName = createGroupForm.groupName.trim();
                              const fallbackGrp = {
                                id: String(Date.now()),
                                name: grpName,
                                groupName: grpName,
                                groupCode: createGroupForm.groupCode.trim() || `GRP-00${ledgerGroups.length + 1}`,
                                description: createGroupForm.description
                              };
                              try {
                                const res = await apiFetch('/api/tenant/ledger/groups', {
                                  method: 'POST',
                                  body: JSON.stringify(createGroupForm)
                                });
                                if (res.ok) {
                                  const saved = await res.json();
                                  const formattedSaved = {
                                    ...saved,
                                    name: saved.name || saved.groupName || saved.group_name || grpName,
                                    groupName: saved.name || saved.groupName || saved.group_name || grpName
                                  };
                                  setLedgerGroups(prev => [formattedSaved, ...prev]);
                                } else {
                                  setLedgerGroups(prev => [fallbackGrp, ...prev]);
                                }
                              } catch (err) {
                                setLedgerGroups(prev => [fallbackGrp, ...prev]);
                              }

                              setCreateGroupForm({
                                groupName: '',
                                groupCode: '',
                                description: ''
                              });
                              setSelectedExpenseGroup(null);
                              setActiveTab('ledger');
                              setSuccessModal({
                                open: true,
                                title: 'Ledger Group Created! 🎉',
                                message: `Accounting group "${grpName}" has been created successfully and added to your Ledger Groups directory.`
                              });
                            }}
                            className="w-full py-2.5 bg-blue-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-blue-700 shadow-md transition-colors flex items-center justify-center gap-1.5"
                          >
                            <FolderPlus size={14} /> Create Group
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {/* ─── BOTTOM SHEET / CENTERED DIALOG MODALS ───────────────────────────── */}

      {/* Wallet Breakdown Modal (Bank Accounts & Cash Balance Breakdown) */}
      {showWalletBreakdownModal && (() => {
        const totalWalletBal = bankAccounts.reduce((sum, b) => sum + Number(b.currentBalance || b.current_balance || b.openingBalance || 0), 0) +
          allPettyFloats.reduce((sum, p) => sum + Number(p.currentBalance || p.current_balance || p.openingAmount || 0), 0);

        return (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl p-6 space-y-6 my-8 border border-slate-200">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                    Wallet &amp; Liquidity Breakdown
                  </span>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1.5 flex items-center gap-2">
                    <Wallet size={20} className="text-emerald-600" /> Total Money in Wallet
                  </h2>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">Segregated list of bank accounts and petty cash floats.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[9px] font-extrabold uppercase text-slate-400 block">Total Liquidity</span>
                    <span className="text-lg font-black text-emerald-700">₹{totalWalletBal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <button onClick={() => setShowWalletBreakdownModal(false)} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1">
                {/* 1. BANK ACCOUNTS SEGREGATION */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Landmark size={14} className="text-blue-600" /> Bank Accounts ({bankAccounts.length})
                    </h3>
                    <button
                      onClick={() => {
                        setShowWalletBreakdownModal(false);
                        setBankModalOpen(true);
                      }}
                      className="text-xs font-black text-blue-600 hover:underline uppercase flex items-center gap-1"
                    >
                      <Plus size={12} /> + Add Bank Account
                    </button>
                  </div>

                  {bankAccounts.length === 0 ? (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-400 font-semibold text-center">
                      No bank accounts configured yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {bankAccounts.map((b: any) => {
                        const bal = Number(b.currentBalance || b.current_balance || b.openingBalance || 0);
                        return (
                          <div key={b.id} className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm flex items-center justify-between hover:border-slate-800 transition-all">
                            <div className="flex items-center gap-3">
                              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                <Landmark size={18} />
                              </div>
                              <div>
                                <h4 className="text-xs font-black text-slate-900 leading-snug">{b.name}</h4>
                                <p className="text-[10px] text-slate-400 font-mono font-bold mt-0.5">
                                  {b.accountNo || b.account_no ? `A/c: ${b.accountNo || b.account_no}` : (b.type || 'Bank Account')}
                                </p>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="text-[9px] font-bold text-slate-400 uppercase block">Available Balance</span>
                              <span className="text-sm font-black text-slate-900">
                                ₹{bal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. PETTY CASH & CASH FLOATS SEGREGATION */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Coins size={14} className="text-emerald-600" /> Cash Floats &amp; Petty Cash Boxes ({allPettyFloats.length})
                  </h3>

                  {allPettyFloats.length === 0 ? (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-400 font-semibold text-center">
                      No petty cash floats setup yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {allPettyFloats.map((p: any) => {
                        const bal = Number(p.currentBalance || p.current_balance || p.openingAmount || 0);
                        return (
                          <div key={p.id} className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm flex items-center justify-between hover:border-slate-800 transition-all">
                            <div className="flex items-center gap-3">
                              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                                <Coins size={18} />
                              </div>
                              <div>
                                <h4 className="text-xs font-black text-slate-900 leading-snug">{p.custodianName || p.name || 'Petty Cash Box'}</h4>
                                <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                                  {p.siteName || p.site_id ? `Site: ${p.siteName || p.site_id}` : 'General Cash Float'}
                                </p>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="text-[9px] font-bold text-slate-400 uppercase block">Cash in Hand</span>
                              <span className="text-sm font-black text-emerald-700">
                                ₹{bal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
                <button
                  onClick={() => setShowWalletBreakdownModal(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider rounded-xl transition-all"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowWalletBreakdownModal(false);
                    setActiveTab('record-ledger');
                  }}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <Plus size={14} /> Record Entry into Wallet
                </button>
              </div>
            </div>
          </div>
        );
      })()}

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

      {/* SUCCESS NOTIFICATION MODAL POPUP */}
      {successModal?.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">{successModal.title}</h3>
              <p className="text-xs font-semibold text-slate-500 leading-relaxed">{successModal.message}</p>
            </div>
            <button
              onClick={() => setSuccessModal(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer"
            >
              Done &amp; Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

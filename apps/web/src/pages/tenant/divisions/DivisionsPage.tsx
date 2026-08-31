import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Plus, Search, MapPin, X, Trash2, Edit, AlertCircle, Network, Map, Sparkles, Building2, CheckCircle2, ChevronRight, MoreVertical, SlidersHorizontal, LayoutGrid, List, Users, Briefcase, Mail, Phone } from 'lucide-react';

interface Division {
  id: string;
  name: string;
  state: string;
  city: string;
  pincodes: string;
  description: string;
  status: 'Active' | 'Inactive';
  created_at: string;
  member_count?: number;
}

export default function DivisionsPage() {
  const { currentUser } = useAuth();
  
  // Profile & Access Check States
  const [profile, setProfile] = useState<any>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  // Divisions Data States
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Newest');
  const [stateFilter, setStateFilter] = useState('All');
  const [cityFilter, setCityFilter] = useState('All');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editDivision, setEditDivision] = useState<Division | null>(null);
  const [name, setName] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [pincodes, setPincodes] = useState('');
  const [description, setDescription] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [detectionSuccess, setDetectionSuccess] = useState(false);

  // Detail Modal State
  const [selectedDivision, setSelectedDivision] = useState<Division | null>(null);
  const [divisionTeam, setDivisionTeam] = useState<any[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);

  const handleOpenDetails = (div: Division) => {
    setSelectedDivision(div);
    setLoadingTeam(true);
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const host = baseUrl.startsWith('http://localhost:3001') ? 'http://localhost:5000' : baseUrl;
    fetch(`${host}/api/tenant/divisions/${div.id}/team`)
      .then(res => res.json())
      .then(data => {
        setDivisionTeam(data);
        setLoadingTeam(false);
      })
      .catch(err => {
        console.error('Error fetching division team:', err);
        setLoadingTeam(false);
      });
  };

  // Deletion Confirm State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Pincode Lookup Handler
  const handlePincodeChange = (val: string) => {
    setPincodes(val);
    setDetectionSuccess(false);
    
    const match = val.match(/\b\d{6}\b/);
    if (match) {
      const pin = match[0];
      setDetectingLocation(true);
      fetch(`https://api.postalpincode.in/pincode/${pin}`)
        .then(res => res.json())
        .then(data => {
          setDetectingLocation(false);
          if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice[0]) {
            const po = data[0].PostOffice[0];
            if (po.State) setState(po.State);
            if (po.District) setCity(po.District);
            setDetectionSuccess(true);
          }
        })
        .catch(err => {
          console.error('Failed to auto-detect location from pincode:', err);
          setDetectingLocation(false);
        });
    }
  };

  // 1. Fetch Profile and Check Access
  useEffect(() => {
    if (currentUser) {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const host = baseUrl.startsWith('http://localhost:3001') ? 'http://localhost:5000' : baseUrl;
      const mobile = currentUser.phoneNumber || '';
      const email = currentUser.email || '';

      fetch(`${host}/api/tenant/profile/${currentUser.uid}?mobile=${encodeURIComponent(mobile)}&email=${encodeURIComponent(email)}`)
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Profile fetch failed');
        })
        .then(data => {
          setProfile(data);
          const isHR = 
            data.userType === 'team_member' && (
              String(data.department).toUpperCase().includes('HR') || 
              String(data.department).toUpperCase().includes('HUMAN RES') || 
              String(data.designation).toUpperCase().includes('HR') || 
              String(data.designation).toUpperCase().includes('HUMAN RES')
            );
          const isAdmin = data.userType === 'admin';
          if (isAdmin || isHR) {
            setHasAccess(true);
          } else {
            setHasAccess(false);
          }
          setCheckingAccess(false);
        })
        .catch(err => {
          console.error(err);
          setCheckingAccess(false);
          setHasAccess(false);
        });
    }
  }, [currentUser]);

  // 2. Fetch Divisions if authorized
  const fetchDivisions = () => {
    if (currentUser && hasAccess) {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const host = baseUrl.startsWith('http://localhost:3001') ? 'http://localhost:5000' : baseUrl;

      fetch(`${host}/api/tenant/divisions/${currentUser.uid}`)
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Failed to fetch divisions');
        })
        .then(data => {
          setDivisions(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  };

  useEffect(() => {
    if (!checkingAccess && hasAccess) {
      fetchDivisions();
    }
  }, [checkingAccess, hasAccess, currentUser]);

  // 3. Open Add / Edit Modal
  const openModal = (div: Division | null = null) => {
    setModalError(null);
    setDetectionSuccess(false);
    if (div) {
      setEditDivision(div);
      setName(div.name);
      setState(div.state);
      setCity(div.city);
      setPincodes(div.pincodes);
      setDescription(div.description);
    } else {
      setEditDivision(null);
      setName('');
      setState('');
      setCity('');
      setPincodes('');
      setDescription('');
    }
    setIsModalOpen(true);
  };

  // 4. Save (Insert / Update) Division
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!name.trim() || !state.trim() || !city.trim()) {
      setModalError('Division Name, State, and City are required fields.');
      return;
    }

    if (!currentUser) return;

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const host = baseUrl.startsWith('http://localhost:3001') ? 'http://localhost:5000' : baseUrl;

    const body = {
      userUid: currentUser.uid,
      name: name.trim(),
      state: state.trim(),
      city: city.trim(),
      pincodes: pincodes.trim(),
      description: description.trim(),
      status: 'Active'
    };

    const url = editDivision 
      ? `${host}/api/tenant/divisions/${editDivision.id}` 
      : `${host}/api/tenant/divisions`;
    const method = editDivision ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
      .then(res => {
        if (res.ok) return res.json();
        return res.json().then(errData => {
          throw new Error(errData.error || 'Failed to save division');
        });
      })
      .then(() => {
        fetchDivisions();
        setIsModalOpen(false);
      })
      .catch(err => {
        setModalError(err.message || 'Error occurred while saving.');
      });
  };

  // 5. Delete Division
  const handleDelete = (id: string) => {
    if (!currentUser) return;

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const host = baseUrl.startsWith('http://localhost:3001') ? 'http://localhost:5000' : baseUrl;

    fetch(`${host}/api/tenant/divisions/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userUid: currentUser.uid })
    })
      .then(res => {
        if (res.ok) return res.json();
        return res.json().then(errData => {
          throw new Error(errData.error || 'Failed to delete division');
        });
      })
      .then(() => {
        setDivisions(divisions.filter(d => d.id !== id));
        setDeleteConfirmId(null);
        if (selectedDivision?.id === id) {
          setSelectedDivision(null);
        }
      })
      .catch(err => {
        alert(err.message || 'Error deleting division');
      });
  };

  if (checkingAccess) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 bg-white border border-slate-200 rounded-2xl shadow-xl max-w-2xl mx-auto text-center my-10 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-60 h-60 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="w-20 h-20 rounded-3xl bg-red-50 border border-red-150 flex items-center justify-center text-red-500 mb-8 shadow-inner">
          <AlertCircle size={40} />
        </div>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-3">Access Denied</h2>
        <p className="text-slate-500 text-sm max-w-md mb-8 leading-relaxed font-medium">
          You do not have sufficient permissions to access the Divisions screen. Only Tenant Administrators and HR Executives can manage operational zones.
        </p>
        <button 
          onClick={() => window.history.back()}
          className="px-6 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Filter & Search & Sort logic
  const filteredDivisions = divisions.filter(div => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      div.name.toLowerCase().includes(query) ||
      div.state.toLowerCase().includes(query) ||
      div.city.toLowerCase().includes(query) ||
      div.pincodes.toLowerCase().includes(query);
    const matchesState = stateFilter === 'All' || div.state === stateFilter;
    const matchesCity = cityFilter === 'All' || div.city === cityFilter;
    return matchesSearch && matchesState && matchesCity;
  });

  // Unique Lists for Dropdown options
  const uniqueStatesList = Array.from(new Set(divisions.map(d => d.state.trim()))).filter(Boolean);
  const uniqueCitiesList = Array.from(new Set(divisions.map(d => d.city.trim()))).filter(Boolean);

  const sortedDivisions = [...filteredDivisions].sort((a, b) => {
    if (sortBy === 'Newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortBy === 'Oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (sortBy === 'Name A-Z') return a.name.localeCompare(b.name);
    if (sortBy === 'Name Z-A') return b.name.localeCompare(a.name);
    return 0;
  });

  const totalDivisions = divisions.length;
  const uniqueCities = new Set(divisions.map(d => d.city.trim().toLowerCase())).size;
  const uniqueStates = new Set(divisions.map(d => d.state.trim().toLowerCase())).size;

  return (
    <div className="space-y-6 relative min-h-screen pb-12 bg-[#F8FAFC]/40 p-1 md:p-4">

      {/* Header (Clean inline layout) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 pt-2 gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Divisions Directory</h1>
          <p className="text-slate-400 text-xs font-semibold">
            Geographic operations boundaries based on states, cities, and pincodes.
          </p>
        </div>
        
        <button
          onClick={() => openModal()}
          className="bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2 active:scale-95"
        >
          <span className="text-sm font-semibold">+</span> Create Division
        </button>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Divisions */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex items-center justify-between hover:shadow-md transition-all duration-300">
          <div className="flex items-center space-x-5">
            <div className="w-14 h-14 bg-[#EFF6FF] text-[#2563EB] rounded-2xl flex items-center justify-center shrink-0">
              <Network size={24} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Total Divisions</span>
              <span className="text-3xl font-bold text-slate-900 block mt-1 tracking-tight">{totalDivisions}</span>
              <span className="text-xs text-slate-400 font-semibold mt-1 block">All divisions created</span>
            </div>
          </div>
          <button className="text-slate-400 p-1 hover:bg-slate-55 rounded-lg">
            <MoreVertical size={16} />
          </button>
        </div>

        {/* Cities Covered */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex items-center justify-between hover:shadow-md transition-all duration-300">
          <div className="flex items-center space-x-5">
            <div className="w-14 h-14 bg-[#ECFDF5] text-[#059669] rounded-2xl flex items-center justify-center shrink-0">
              <MapPin size={24} fill="#ECFDF5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Cities Covered</span>
              <span className="text-3xl font-bold text-slate-900 block mt-1 tracking-tight">{uniqueCities}</span>
              <span className="text-xs text-slate-400 font-semibold mt-1 block">Unique cities covered</span>
            </div>
          </div>
          <button className="text-slate-400 p-1 hover:bg-slate-55 rounded-lg">
            <MoreVertical size={16} />
          </button>
        </div>

        {/* States Represented */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex items-center justify-between hover:shadow-md transition-all duration-300">
          <div className="flex items-center space-x-5">
            <div className="w-14 h-14 bg-[#FFF7ED] text-[#EA580C] rounded-2xl flex items-center justify-center shrink-0">
              <MapPin size={24} fill="#FFF7ED" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">States Represented</span>
              <span className="text-3xl font-bold text-slate-900 block mt-1 tracking-tight">{uniqueStates}</span>
              <span className="text-xs text-slate-400 font-semibold mt-1 block">States represented</span>
            </div>
          </div>
          <button className="text-slate-400 p-1 hover:bg-slate-55 rounded-lg">
            <MoreVertical size={16} />
          </button>
        </div>
      </div>

      {/* Search & Filters Bar Container */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2563EB] transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search by division name, state, city, pincode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-10 py-3 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-100 focus:border-slate-200 focus:ring-1 focus:ring-slate-300/50 rounded-2xl text-sm font-semibold text-slate-700 placeholder-slate-400 focus:outline-none transition-all duration-200"
            />
            {searchQuery ? (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-450 hover:text-slate-700 p-1 hover:bg-slate-200/50 rounded-lg"
              >
                <X size={14} />
              </button>
            ) : null}
          </div>
          
          <button 
            onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            className={`flex items-center gap-2 px-5 py-3 border rounded-2xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 ${
              showFiltersPanel || stateFilter !== 'All' || cityFilter !== 'All'
                ? 'border-blue-100 bg-blue-50 text-[#2563EB] shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal size={14} />
            Filters
          </button>
        </div>

        {/* Collapsible Filter Dropdowns */}
        {showFiltersPanel && (
          <div className="bg-slate-50/50 border border-slate-200/60 rounded-2xl p-4 space-y-4 animate-in slide-in-from-top duration-250">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* State Select */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block pl-0.5">Filter by State</label>
                <select
                  value={stateFilter}
                  onChange={(e) => {
                    setStateFilter(e.target.value);
                    setCityFilter('All');
                  }}
                  className="w-full px-3.5 py-2.5 border border-slate-200 bg-white rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                >
                  <option value="All">All States</option>
                  {uniqueStatesList.map((st, i) => (
                    <option key={i} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              {/* City Select */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block pl-0.5">Filter by City</label>
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 bg-white rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                >
                  <option value="All">All Cities</option>
                  {uniqueCitiesList
                    .filter(c => stateFilter === 'All' || divisions.some(d => d.city.trim() === c && d.state.trim() === stateFilter))
                    .map((ct, i) => (
                      <option key={i} value={ct}>{ct}</option>
                    ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Active Filter Tags */}
        {(searchQuery || stateFilter !== 'All' || cityFilter !== 'All') && (
          <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-slate-100">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-1.5">Active Filters:</span>
            {searchQuery && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-100 text-[#2563EB] text-xs font-bold rounded-full">
                "{searchQuery}"
                <button onClick={() => setSearchQuery('')} className="hover:text-blue-800 p-0.5"><X size={12} /></button>
              </span>
            )}
            {stateFilter !== 'All' && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                State: {stateFilter}
                <button onClick={() => setStateFilter('All')} className="hover:text-emerald-900 p-0.5"><X size={12} /></button>
              </span>
            )}
            {cityFilter !== 'All' && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-orange-50 border border-orange-100 text-orange-700 text-xs font-bold rounded-full">
                City: {cityFilter}
                <button onClick={() => setCityFilter('All')} className="hover:text-orange-950 p-0.5"><X size={12} /></button>
              </span>
            )}
            <button 
              onClick={() => {
                setSearchQuery('');
                setStateFilter('All');
                setCityFilter('All');
              }}
              className="text-[10px] font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest pl-2"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* All Divisions Section Header */}
      <div className="flex items-center justify-between pt-4">
        <div className="flex items-center">
          <h2 className="text-lg font-black text-slate-900">All Divisions</h2>
          <span className="ml-2.5 px-2.5 py-0.5 bg-slate-100 text-slate-600 text-xs font-black rounded-full">
            {filteredDivisions.length}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Sort Menu */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-2 rounded-xl">
            <span className="text-xs text-slate-400 font-semibold">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs font-black text-slate-800 focus:outline-none bg-transparent cursor-pointer"
            >
              <option value="Newest">Newest</option>
              <option value="Oldest">Oldest</option>
              <option value="Name A-Z">Name A-Z</option>
              <option value="Name Z-A">Name Z-A</option>
            </select>
          </div>

          {/* Layout Toggle Mock */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden">
            <button className="p-2 bg-blue-50 text-[#2563EB] border-r border-slate-200">
              <LayoutGrid size={15} />
            </button>
            <button className="p-2 text-slate-450 hover:bg-slate-50">
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Listing Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white border border-slate-200 rounded-2xl">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 border-3 border-blue-500/20 rounded-full"></div>
            <div className="absolute inset-0 border-3 border-[#2563EB] border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      ) : sortedDivisions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedDivisions.map(div => (
            <div 
              key={div.id} 
              onClick={() => handleOpenDetails(div)}
              className="bg-white border border-slate-200 rounded-3xl p-5 flex flex-col justify-between hover:shadow-md transition-shadow relative cursor-pointer group"
            >
              <div>
                <div className="flex items-start gap-4">
                  {/* Building Logo in soft blue squircle */}
                  <div className="w-16 h-16 bg-[#EFF6FF] rounded-2xl flex items-center justify-center text-[#2563EB] shrink-0 border border-blue-100/50">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 21H21" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M5 21V5C5 4.44772 5.44772 4 6 4H18C18.5523 4 19 4.44772 19 5V21" stroke="#2563EB" strokeWidth="1.5" />
                      <path d="M9 8H11V10H9V8ZM9 12H11V14H9V12ZM9 16H11V18H9V16ZM13 8H15V10H13V8ZM13 12H15V14H13V12ZM13 16H15V18H13V16Z" fill="#2563EB" opacity="0.4" />
                    </svg>
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <h3 className="text-base font-black text-slate-800 truncate leading-snug group-hover:text-[#2563EB] transition-colors">{div.name}</h3>
                    <div className="flex items-center text-xs font-semibold text-slate-500 gap-1">
                      <MapPin size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{div.city}, {div.state}</span>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      {div.pincodes ? (
                        <div className="px-3 py-1 bg-[#EFF6FF] text-[#2563EB] text-xs font-black rounded-lg w-fit">
                          {div.pincodes.split(',')[0].trim()}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-semibold italic block">No pincodes</span>
                      )}

                      <div className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-200/50 rounded-lg text-slate-600 text-xs font-semibold">
                        <Users size={12} className="text-slate-400" />
                        <span>{div.member_count || 0} Staff</span>
                      </div>
                    </div>
                  </div>
                </div>

                {div.description && (
                  <p className="text-xs text-slate-450 font-medium line-clamp-2 mt-4 leading-relaxed pl-1">
                    {div.description}
                  </p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold">
                  Added on {new Date(div.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
                
                {/* Actions row */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); openModal(div); }}
                    className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition-all"
                    title="Edit Division"
                  >
                    <Edit size={14} />
                  </button>
                  
                  {deleteConfirmId === div.id ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(div.id); }}
                      className="bg-red-600 hover:bg-red-750 text-white text-[10px] font-black px-2.5 py-2 rounded-xl uppercase tracking-wide transition-colors"
                    >
                      Confirm
                    </button>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(div.id); }}
                      className="p-2 border border-slate-200 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-550 transition-all"
                      title="Delete Division"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl py-20 text-center flex flex-col items-center justify-center p-6 shadow-sm">
          <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-450 mb-4">
            <Network size={28} />
          </div>
          <h3 className="text-lg font-black text-slate-800 mb-1">No divisions matching</h3>
          <p className="text-slate-450 text-xs max-w-xs font-semibold leading-relaxed">
            Create or refine geographic query fields to show operational areas.
          </p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all">
          <div 
            className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editDivision ? 'Modify Division Settings' : 'Create New Division'}
                </h3>
                <p className="text-xs text-slate-400 font-semibold mt-1">
                  Configure operational bounds for workforce allocation.
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-400 hover:text-slate-700 transition-colors p-2 hover:bg-slate-200/50 rounded-xl"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
              
              {modalError && (
                <div className="p-4 bg-red-50 border border-red-150 rounded-2xl flex items-start gap-3 text-red-650 text-xs font-bold shadow-sm">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                  Division Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Telangana Division, Mumbai South"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 focus:border-[#2563EB] rounded-xl text-sm font-semibold placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15 transition-all"
                  required
                />
              </div>

              {/* Pincodes (Position 2) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                    Pincode(s) <span className="text-[9px] text-slate-400 lowercase italic">(comma-separated)</span>
                  </label>
                  
                  {detectingLocation && (
                    <span className="text-[10px] text-[#2563EB] font-black animate-pulse flex items-center gap-1.5 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-ping" />
                      Auto-detecting...
                    </span>
                  )}
                  {detectionSuccess && (
                    <span className="text-[10px] text-emerald-600 font-black flex items-center gap-1 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                      <CheckCircle2 size={11} /> Location Auto-filled!
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="e.g. 500001, 500002"
                  value={pincodes}
                  onChange={(e) => handlePincodeChange(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 focus:border-[#2563EB] rounded-xl text-sm font-semibold placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15 transition-all bg-slate-50/50 hover:bg-slate-50 focus:bg-white"
                />
              </div>

              {/* State & City (Auto-populated but editable) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                    State <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Telangana"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 focus:border-[#2563EB] rounded-xl text-sm font-semibold placeholder-slate-455 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15 transition-all"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                    City / District <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Hyderabad"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 focus:border-[#2563EB] rounded-xl text-sm font-semibold placeholder-slate-455 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                  Description / Remarks
                </label>
                <textarea
                  placeholder="Additional division operational details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-slate-200 focus:border-[#2563EB] rounded-xl text-sm font-semibold placeholder-slate-455 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15 transition-all resize-none"
                />
              </div>

              {/* Actions Footer */}
              <div className="pt-5 border-t border-slate-100 flex items-center justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all uppercase tracking-wide"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-black px-6 py-2.5 rounded-xl transition-all shadow-md uppercase tracking-wider active:scale-95"
                >
                  Save Division
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
      {/* Division Details View Modal */}
      {selectedDivision && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-800">{selectedDivision.name}</h3>
                <div className="flex items-center text-xs font-semibold text-slate-500 gap-1.5 mt-1">
                  <MapPin size={14} className="text-[#2563EB]" />
                  <span>{selectedDivision.city}, {selectedDivision.state}</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedDivision(null)} 
                className="text-slate-400 hover:text-slate-700 transition-colors p-2 hover:bg-slate-200/50 rounded-xl"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Info Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Pincodes Covered</span>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedDivision.pincodes ? (
                      selectedDivision.pincodes.split(',').map((p, i) => (
                        <span key={i} className="px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-lg text-xs font-bold text-[#2563EB]">
                          {p.trim()}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 font-semibold italic">No pincodes configured</span>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Operational Status</span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold rounded-lg mt-2">
                    <CheckCircle2 size={12} /> Active Zone
                  </span>
                </div>
              </div>

              {selectedDivision.description && (
                <div className="space-y-1.5 pl-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Description / Remarks</span>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    {selectedDivision.description}
                  </p>
                </div>
              )}

              {/* Workforce Members List */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider pl-1">
                  Assigned Workforce ({loadingTeam ? '...' : divisionTeam.length})
                </h4>

                {loadingTeam ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="w-6 h-6 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : divisionTeam.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {divisionTeam.map((member) => {
                      const nameParts = member.name.trim().split(' ');
                      const initials = nameParts.map((p: string) => p[0]).join('').toUpperCase().substring(0, 2);
                      return (
                        <div key={member.id} className="p-4 border border-slate-200 rounded-2xl flex flex-col justify-between bg-white shadow-sm hover:border-blue-200 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 text-xs font-black shadow-inner shrink-0">
                              {initials || 'U'}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h5 className="text-sm font-black text-slate-800 truncate leading-snug">{member.name}</h5>
                              <p className="text-xs text-slate-450 font-semibold truncate mt-0.5">{member.role}</p>
                            </div>
                          </div>

                          <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                              <Briefcase size={12} className="text-slate-400 shrink-0" />
                              <span className="truncate">{member.department}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                              <Mail size={12} className="text-slate-400 shrink-0" />
                              <a href={`mailto:${member.email}`} className="hover:text-blue-600 truncate">{member.email}</a>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                              <Phone size={12} className="text-slate-400 shrink-0" />
                              <a href={`tel:${member.mobile}`} className="hover:text-blue-600 truncate">{member.mobile}</a>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-slate-50/50 border border-slate-200/50 rounded-2xl">
                    <Users className="mx-auto text-slate-350 mb-2" size={24} />
                    <span className="text-xs font-bold text-slate-450 block">No staff assigned</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">Link employees to this division inside the Team Directory.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button 
                onClick={() => setSelectedDivision(null)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-all uppercase tracking-wider"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

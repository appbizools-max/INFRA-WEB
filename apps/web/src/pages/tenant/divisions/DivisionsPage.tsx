import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { apiFetch } from '../../../lib/api';
import {
  Network, Plus, Search, Edit3, Users, CheckCircle2,
  AlertCircle, X, MapPin, Building2, Sparkles,
  RefreshCw, Briefcase, Mail, Phone, Table, Check,
  ChevronRight, Compass, Shield
} from 'lucide-react';
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

interface TeamMember {
  id: string | number;
  name: string;
  role: string;
  department: string;
  email: string;
  mobile: string;
  status?: string;
}

export default function DivisionsPage() {
  const { currentUser } = useAuth();

  // Access Control States
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  // Divisions Data States
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Add / Edit Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editDivision, setEditDivision] = useState<Division | null>(null);
  const [name, setName] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [pincodes, setPincodes] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [detectionSuccess, setDetectionSuccess] = useState(false);

  // Detail / Assigned Workforce Modal State
  const [selectedDivision, setSelectedDivision] = useState<Division | null>(null);
  const [divisionTeam, setDivisionTeam] = useState<TeamMember[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);

  // 1. Profile and Access Check
  useEffect(() => {
    if (!currentUser) return;
    const mobile = currentUser.phoneNumber || '';
    const email = currentUser.email || '';

    apiFetch(`/api/tenant/profile/${currentUser.uid}?mobile=${encodeURIComponent(mobile)}&email=${encodeURIComponent(email)}`)
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Profile fetch failed');
      })
      .then(data => {
        const isHR =
          data.userType === 'team_member' && (
            String(data.department || '').toUpperCase().includes('HR') ||
            String(data.department || '').toUpperCase().includes('HUMAN RES') ||
            String(data.designation || '').toUpperCase().includes('HR') ||
            String(data.designation || '').toUpperCase().includes('HUMAN RES')
          );
        const isAdmin = data.userType === 'admin';
        setHasAccess(isAdmin || isHR);
      })
      .catch(err => {
        console.error('Access verification error:', err);
        setHasAccess(false);
      })
      .finally(() => setCheckingAccess(false));
  }, [currentUser]);

  // 2. Fetch Divisions
  const fetchDivisions = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const res = await apiFetch(`/api/tenant/divisions/${currentUser.uid}`);
      if (res.ok) {
        const data = await res.json();
        setDivisions(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch divisions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!checkingAccess && hasAccess) {
      fetchDivisions();
    }
  }, [checkingAccess, hasAccess, currentUser]);

  // 3. Open Team Members Detail Modal
  const handleOpenDetails = (div: Division) => {
    setSelectedDivision(div);
    setLoadingTeam(true);
    apiFetch(`/api/tenant/divisions/${div.id}/team`)
      .then(res => res.json())
      .then(data => {
        setDivisionTeam(Array.isArray(data) ? data : []);
      })
      .catch(err => console.error('Error loading division team:', err))
      .finally(() => setLoadingTeam(false));
  };

  // 4. Pincode Auto-detect Handler
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
          if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice[0]) {
            const po = data[0].PostOffice[0];
            if (po.State && !state) setState(po.State);
            if (po.District && !city) setCity(po.District);
            setDetectionSuccess(true);
          }
        })
        .catch(err => console.warn('Pincode lookup error:', err))
        .finally(() => setDetectingLocation(false));
    }
  };

  // 5. Open Add / Edit Modal
  const openModal = (div: Division | null = null, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setModalError(null);
    setDetectionSuccess(false);
    if (div) {
      setEditDivision(div);
      setName(div.name);
      setState(div.state);
      setCity(div.city);
      setPincodes(div.pincodes || '');
      setDescription(div.description || '');
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

  // 6. Save Division
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!name.trim() || !state.trim() || !city.trim()) {
      setModalError('Division Name, State, and City are required fields.');
      return;
    }

    try {
      setSaving(true);
      setModalError(null);

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
        ? `/api/tenant/divisions/${editDivision.id}`
        : `/api/tenant/divisions`;
      const method = editDivision ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save division');
      }

      setIsModalOpen(false);
      fetchDivisions();
    } catch (err: any) {
      setModalError(err.message || 'An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  // Filter & Search
  const filteredDivisions = divisions.filter(div => {
    const q = searchQuery.toLowerCase();
    return (
      div.name.toLowerCase().includes(q) ||
      div.state.toLowerCase().includes(q) ||
      div.city.toLowerCase().includes(q) ||
      (div.pincodes && div.pincodes.toLowerCase().includes(q)) ||
      (div.description && div.description.toLowerCase().includes(q))
    );
  });

  const uniqueStatesCount = new Set(divisions.map(d => d.state.trim().toLowerCase())).size;
  const uniqueCitiesCount = new Set(divisions.map(d => d.city.trim().toLowerCase())).size;
  const totalMembersCount = divisions.reduce((acc, curr) => acc + (curr.member_count || 0), 0);

  if (checkingAccess) {
    return (
      <div className="py-24 text-center space-y-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
        <RefreshCw size={24} className="animate-spin text-emerald-600 mx-auto" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Verifying permissions...</p>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-md mx-auto my-12 space-y-3 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle size={24} />
        </div>
        <h2 className="text-base font-black text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Only Tenant Administrators and HR Executives have permissions to manage regional divisions.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* ── Executive Dark Banner (Matching Roles & Departments) ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0B132B] p-4 md:p-5 text-white shadow-md border border-slate-800">
        <div className="absolute -top-16 -right-16 w-60 h-60 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-60 h-60 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1">
              <Sparkles size={13} />
              <span>Geographic Hierarchy & Regional Zones</span>
            </div>
            <h1 className="text-lg md:text-xl font-black tracking-tight text-white flex items-center gap-2">
              Corporate Divisions & Territories
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
              Standardized operational zones categorized by state, city, and pin codes for localized workforce and site allocations.
            </p>
          </div>

          <div className="flex items-center shrink-0">
            <button
              onClick={() => openModal()}
              className="inline-flex items-center space-x-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg text-xs shadow-md transition-all hover:scale-102"
            >
              <Plus size={14} />
              <span>New Division</span>
            </button>
          </div>
        </div>

        {/* Compact KPI Strip */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-3.5 border-t border-slate-800/80">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Operational Zones</p>
            <p className="text-lg font-black text-white">{divisions.length}</p>
            <p className="text-[10px] text-emerald-400 font-medium">Active territories</p>
          </div>

          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">States Covered</p>
            <p className="text-lg font-black text-cyan-400">{uniqueStatesCount}</p>
            <p className="text-[10px] text-slate-400 font-medium">Federal jurisdictions</p>
          </div>

          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Cities & Districts</p>
            <p className="text-lg font-black text-amber-400">{uniqueCitiesCount}</p>
            <p className="text-[10px] text-slate-400 font-medium">Municipal hubs</p>
          </div>

          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Field Personnel</p>
            <p className="text-lg font-black text-emerald-400">{totalMembersCount}</p>
            <p className="text-[10px] text-slate-400 font-medium">Assigned staff</p>
          </div>
        </div>
      </div>

      {/* ── Filter & Search Bar ── */}
      <div className="bg-white p-2.5 md:p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Search division, state, city, pincode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F172A] font-medium"
          />
        </div>

        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="text-[11px] font-bold text-slate-500 hover:text-slate-800 ml-2"
          >
            Clear Search
          </button>
        )}
      </div>

      {/* ── MAIN CONTENT (CLEAN FULL-WIDTH CORPORATE TABLE) ── */}
      {loading ? (
        <div className="py-20 text-center space-y-3 bg-white rounded-xl border border-slate-200">
          <RefreshCw size={24} className="animate-spin text-emerald-600 mx-auto" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading regional divisions...</p>
        </div>
      ) : filteredDivisions.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-2">
          <Network size={36} className="text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No divisions match your search</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search query, or click below to configure a new operational territory.
          </p>
          <button
            onClick={() => openModal()}
            className="mt-2 inline-flex items-center space-x-1.5 bg-[#0F172A] hover:bg-slate-800 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs"
          >
            <Plus size={13} />
            <span>Create New Division</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-extrabold text-[10px] border-b border-slate-200">
                <th className="py-3 px-4">Division / Territory</th>
                <th className="py-3 px-3">State & Region</th>
                <th className="py-3 px-3">City / District</th>
                <th className="py-3 px-3">Postal Codes</th>
                <th className="py-3 px-3 text-center">Assigned Staff</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredDivisions.map((div) => {
                const pinList = (div.pincodes || '').split(',').map(p => p.trim()).filter(Boolean);

                return (
                  <tr key={div.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Division Name & Description */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
                          <Network size={16} />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 text-xs">{div.name}</span>
                          <p className="text-[10px] text-slate-400 line-clamp-1 max-w-xs mt-0.5">
                            {div.description || 'Geographic operational boundary zone.'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* State */}
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800 text-xs flex items-center gap-1">
                        <MapPin size={12} className="text-slate-400 shrink-0" />
                        <span>{div.state}</span>
                      </span>
                    </td>

                    {/* City */}
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-700 text-xs">
                        {div.city}
                      </span>
                    </td>

                    {/* Pincodes */}
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap items-center gap-1 max-w-xs">
                        {pinList.length > 0 ? (
                          pinList.slice(0, 3).map((pin, i) => (
                            <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                              {pin}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">No pincodes</span>
                        )}
                        {pinList.length > 3 && (
                          <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1 py-0.2 rounded border border-slate-200">
                            +{pinList.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Staff Count */}
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleOpenDetails(div)}
                        className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-blue-700 bg-slate-50 hover:bg-blue-50 px-2 py-0.5 rounded-md border border-slate-200 hover:border-blue-200 transition-colors"
                        title="View Assigned Workforce"
                      >
                        <Users size={11} className="text-blue-600" />
                        <span>{div.member_count || 0}</span>
                      </button>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${div.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${div.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {div.status}
                      </span>
                    </td>

                    {/* Actions (No Delete option) */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenDetails(div)}
                          className="px-2 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md flex items-center gap-1 border border-slate-200 transition-colors"
                        >
                          <Users size={11} />
                          <span>Team</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => openModal(div, e)}
                          className="px-2 py-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md border border-slate-200 flex items-center gap-1 transition-colors"
                          title="Edit Division"
                        >
                          <Edit3 size={12} />
                          <span>Edit</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Add / Edit Division Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-[#0F172A] text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Network size={18} className="text-emerald-400" />
                <h3 className="font-bold text-sm text-white">
                  {editDivision ? 'Edit Division Settings' : 'New Operational Division'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-4 space-y-3">
              {modalError && (
                <div className="bg-rose-50 text-rose-700 text-xs p-2 rounded-lg border border-rose-200 flex items-center gap-1.5">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                  Division Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Telangana Central, Mumbai Metropolitan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F172A] font-semibold"
                />
              </div>

              {/* Pincodes with Auto-Detect */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase">
                    Postal Codes (Pincodes)
                  </label>
                  {detectingLocation && (
                    <span className="text-[10px] text-blue-600 font-bold animate-pulse flex items-center gap-1">
                      <RefreshCw size={10} className="animate-spin" /> Detecting state & city...
                    </span>
                  )}
                  {detectionSuccess && (
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 size={11} /> Auto-filled!
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="e.g. 500001, 500002"
                  value={pincodes}
                  onChange={(e) => handlePincodeChange(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F172A] font-mono font-medium"
                />
              </div>

              {/* State & City */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Telangana"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F172A] font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                    City / District *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hyderabad"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F172A] font-semibold"
                  />
                </div>
              </div>

              {/* Note / Description */}
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                  Note :
                </label>
                <textarea
                  rows={2}
                  placeholder="Add operational notes or remarks..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F172A] resize-none"
                />
              </div>

              {/* Footer Actions */}
              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 text-xs font-bold bg-[#0F172A] hover:bg-slate-800 text-white rounded-lg shadow-sm flex items-center gap-1"
                >
                  {saving ? (
                    <RefreshCw size={13} className="animate-spin text-emerald-400" />
                  ) : (
                    <Check size={13} className="text-emerald-400" />
                  )}
                  <span>{editDivision ? 'Update Division' : 'Create Division'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Assigned Workforce Detail Modal ── */}
      {selectedDivision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="bg-[#0F172A] text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <Network size={18} className="text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm text-white">{selectedDivision.name}</h3>
                  <p className="text-[10px] text-slate-300 flex items-center gap-1">
                    <MapPin size={10} className="text-emerald-400" />
                    <span>{selectedDivision.city}, {selectedDivision.state}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDivision(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-4">
              {/* Top Summary Bar */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Territory Pincodes</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedDivision.pincodes ? (
                      selectedDivision.pincodes.split(',').map((p, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-white text-slate-700 border border-slate-200">
                          {p.trim()}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">No pincodes listed</span>
                    )}
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Jurisdiction Status</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 mt-1">
                    <CheckCircle2 size={12} className="text-emerald-500" />
                    <span>Active Operational Territory</span>
                  </span>
                </div>
              </div>

              {/* Workforce List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Users size={13} className="text-blue-600" />
                    <span>Assigned Workforce ({loadingTeam ? '...' : divisionTeam.length})</span>
                  </span>
                </div>

                {loadingTeam ? (
                  <div className="py-8 text-center space-y-2">
                    <RefreshCw size={18} className="animate-spin text-emerald-600 mx-auto" />
                    <p className="text-xs text-slate-400 font-medium">Loading personnel...</p>
                  </div>
                ) : divisionTeam.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-0.5">
                    {divisionTeam.map((m) => {
                      const initials = (m.name || 'U').split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
                      return (
                        <div key={m.id} className="p-2.5 bg-slate-50/80 border border-slate-200 rounded-xl flex items-start space-x-2.5">
                          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-800 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                            {initials}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-slate-900 truncate">{m.name}</h4>
                            <p className="text-[10px] text-emerald-700 font-semibold truncate">{m.role || 'Staff'}</p>
                            <p className="text-[10px] text-slate-400 truncate">{m.department}</p>
                            {m.mobile && (
                              <p className="text-[9px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                                <Phone size={9} className="text-slate-400" />
                                <span>{m.mobile}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <Users className="mx-auto text-slate-300 mb-1" size={22} />
                    <span className="text-xs font-bold text-slate-600 block">No workforce assigned</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Assign employees to this division inside the Team Directory.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedDivision(null)}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
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

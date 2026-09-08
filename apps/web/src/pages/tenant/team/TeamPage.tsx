import React, { useState, useEffect, useRef } from 'react';
import { Users, Search, Plus, Mail, Phone, X, Briefcase, Award, Clock, Trash2, AlertCircle, MapPin, Shield, Heart, Home, Camera, FileText, DollarSign, CheckCircle, Upload, User, CreditCard, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
interface TeamMember {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  mobile: string;
  status: 'Active' | 'Away' | 'On Duty' | 'Offline';
  initials: string;
  member_id: string;
  division_id?: string;
  division_name?: string;
  alternate_mobile?: string;
  aadhar_number?: string;
  residing_address?: string;
  permanent_address?: string;
  emergency_contact_name?: string;
  emergency_contact_mobile?: string;
  blood_group?: string;
  aadhar_copy?: string | boolean;
  profile_photo?: string;
  salary?: number;
  mobile_verified?: boolean;
  bank_name?: string;
  bank_account_number?: string;
  ifsc_code?: string;
  account_holder_name?: string;
  sub_role?: string;
  employee_type?: string;
  joining_date?: string;
}

const DEPARTMENTS = ['All', 'Operations', 'Logistics', 'Site Ops', 'Human Resources', 'Accountant'];

export default function TeamPage() {
  const { currentUser } = useAuth();

  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [divisions, setDivisions] = useState<any[]>([]);
  const [selectedDivisionFilter, setSelectedDivisionFilter] = useState('All');

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [isEditingDivision, setIsEditingDivision] = useState(false);
  const [editDivisionId, setEditDivisionId] = useState('');

  const handleUpdateDivision = (memberId: string, divId: string) => {
    if (!selectedMember) return;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const host = baseUrl.startsWith('http://localhost:3001') ? 'http://localhost:5000' : baseUrl;

    fetch(`${host}/api/tenant/team/${memberId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: selectedMember.name,
        role: selectedMember.role,
        department: selectedMember.department,
        email: selectedMember.email,
        mobile: selectedMember.mobile,
        divisionId: divId || null,
      }),
    })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Failed to update division');
      })
      .then(updatedMember => {
        const divObj = divisions.find(d => d.id === updatedMember.division_id);
        const formatted = {
          ...selectedMember,
          division_id: updatedMember.division_id,
          division_name: divObj ? divObj.name : undefined
        };
        setSelectedMember(formatted);
        setTeam(team.map(m => m.id === memberId ? formatted : m));
        setIsEditingDivision(false);
      })
      .catch(err => {
        alert(err.message || 'Error updating member division');
      });
  };
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // New Member Form State
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newDept, setNewDept] = useState('Operations');
  const [newEmail, setNewEmail] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [newDivisionId, setNewDivisionId] = useState('');
  const [newAlternateMobile, setNewAlternateMobile] = useState('');
  const [newAadharNumber, setNewAadharNumber] = useState('');
  const [newResidingAddress, setNewResidingAddress] = useState('');
  const [newPermanentAddress, setNewPermanentAddress] = useState('');
  const [sameAsResiding, setSameAsResiding] = useState(false);
  const [newEmergencyName, setNewEmergencyName] = useState('');
  const [newEmergencyMobile, setNewEmergencyMobile] = useState('');
  const [newBloodGroup, setNewBloodGroup] = useState('');
  const [newProfilePhoto, setNewProfilePhoto] = useState('');
  const [newAadharCopy, setNewAadharCopy] = useState('');
  const [newSalary, setNewSalary] = useState('');
  const [newBankName, setNewBankName] = useState('');
  const [newBankAccountNumber, setNewBankAccountNumber] = useState('');
  const [newIfscCode, setNewIfscCode] = useState('');
  const [newAccountHolderName, setNewAccountHolderName] = useState('');
  const [newSubRole, setNewSubRole] = useState('');
  const [newEmployeeType, setNewEmployeeType] = useState('Permanent');
  const [newJoiningDate, setNewJoiningDate] = useState('');
  // OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [mobileVerified, setMobileVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const apiHost = (() => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return baseUrl.startsWith('http://localhost:3001') ? 'http://localhost:5000' : baseUrl;
  })();

  const handleSendOtp = () => {
    if (!newMobile.trim()) return;
    setOtpLoading(true);
    fetch(`${apiHost}/api/auth/send-mobile-otp`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: newMobile.trim() }),
    }).then(r => r.json()).then(() => {
      setOtpSent(true); setOtpLoading(false);
    }).catch(() => setOtpLoading(false));
  };

  const handleVerifyOtp = () => {
    setOtpLoading(true);
    fetch(`${apiHost}/api/auth/verify-mobile-otp`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: newMobile.trim(), otp: otpValue }),
    }).then(r => r.json()).then(data => {
      if (data.verified) setMobileVerified(true);
      else alert('Invalid OTP');
      setOtpLoading(false);
    }).catch(() => { alert('Verification failed'); setOtpLoading(false); });
  };

  const handleFileToBase64 = (file: File, setter: (v: string) => void) => {
    if (file.size > 2 * 1024 * 1024) { alert('File must be under 2MB'); return; }
    const reader = new FileReader();
    reader.onload = () => setter(reader.result as string);
    reader.readAsDataURL(file);
  };

  const fetchTeamMembers = () => {
    if (currentUser) {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const host = baseUrl.startsWith('http://localhost:3001') ? 'http://localhost:5000' : baseUrl;

      fetch(`${host}/api/tenant/team/${currentUser.uid}`)
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Failed to fetch team members');
        })
        .then(data => {
          // Format with initials
          const formattedData = data.map((member: any) => {
            const nameParts = member.name.trim().split(' ');
            const initials = nameParts.map((p: string) => p[0]).join('').toUpperCase().substring(0, 2);
            return {
              ...member,
              initials: initials || 'U',
            };
          });
          setTeam(formattedData);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  };

  const fetchDivisions = () => {
    if (currentUser) {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const host = baseUrl.startsWith('http://localhost:3001') ? 'http://localhost:5000' : baseUrl;

      fetch(`${host}/api/tenant/divisions/${currentUser.uid}`)
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Failed to fetch divisions');
        })
        .then(data => {
          setDivisions(data);
        })
        .catch(err => {
          console.error(err);
        });
    }
  };

  useEffect(() => {
    fetchTeamMembers();
    fetchDivisions();
  }, [currentUser]);

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newRole.trim() || !newEmail.trim() || !newMobile.trim()) {
      alert('Please fill in all required fields.');
      return;
    }
    const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!mobileVerified && !isLocalDev) {
      alert('Please verify the mobile number with OTP before submitting.');
      return;
    }
    if (!currentUser) return;

    fetch(`${apiHost}/api/tenant/team`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adminUid: currentUser.uid,
        name: newName.trim(),
        role: newRole.trim(),
        department: newDept,
        email: newEmail.trim(),
        mobile: newMobile.trim(),
        divisionId: newDivisionId || null,
        alternateMobile: newAlternateMobile.trim() || null,
        aadharNumber: newAadharNumber.trim() || null,
        residingAddress: newResidingAddress.trim() || null,
        permanentAddress: sameAsResiding ? newResidingAddress.trim() : newPermanentAddress.trim() || null,
        emergencyContactName: newEmergencyName.trim() || null,
        emergencyContactMobile: newEmergencyMobile.trim() || null,
        bloodGroup: newBloodGroup || null,
        profilePhoto: newProfilePhoto || null,
        aadharCopy: newAadharCopy || null,
        salary: newSalary ? parseFloat(newSalary) : null,
        mobileVerified: true,
        bankName: newBankName.trim() || null,
        bankAccountNumber: newBankAccountNumber.trim() || null,
        ifscCode: newIfscCode.trim() || null,
        accountHolderName: newAccountHolderName.trim() || null,
        subRole: newSubRole.trim() || null,
        employeeType: newEmployeeType,
        joiningDate: newJoiningDate || null,
      }),
    })
      .then(res => {
        if (res.ok) return res.json();
        return res.json().then(errData => { throw new Error(errData.error || 'Failed to add member'); });
      })
      .then(savedMember => {
        const nameParts = savedMember.name.trim().split(' ');
        const initials = nameParts.map((p: string) => p[0]).join('').toUpperCase().substring(0, 2);
        const divObj = divisions.find(d => d.id === savedMember.division_id);
        const formattedMember = { ...savedMember, initials: initials || 'U', division_name: divObj ? divObj.name : undefined };
        setTeam([formattedMember, ...team]);
        // Reset all form fields
        setNewName(''); setNewRole(''); setNewDept('Operations'); setNewEmail(''); setNewMobile('');
        setNewDivisionId(''); setNewAlternateMobile(''); setNewAadharNumber('');
        setNewResidingAddress(''); setNewPermanentAddress(''); setSameAsResiding(false);
        setNewEmergencyName(''); setNewEmergencyMobile(''); setNewBloodGroup('');
        setNewProfilePhoto(''); setNewAadharCopy(''); setNewSalary('');
        setNewBankName(''); setNewBankAccountNumber(''); setNewIfscCode(''); setNewAccountHolderName('');
        setNewSubRole('');
        setNewEmployeeType('Permanent');
        setNewJoiningDate('');
        setOtpSent(false); setOtpValue(''); setMobileVerified(false);
        setModalOpen(false);
      })
      .catch(err => alert(err.message || 'Connection error adding team member'));
  };

  const triggerDeleteConfirm = (member: TeamMember) => {
    setSelectedMember(member);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteMember = () => {
    if (!selectedMember) return;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const host = baseUrl.startsWith('http://localhost:3001') ? 'http://localhost:5000' : baseUrl;

    fetch(`${host}/api/tenant/team/${selectedMember.id}`, {
      method: 'DELETE'
    })
      .then(res => {
        if (res.ok) {
          setTeam(team.filter(m => m.id !== selectedMember.id));
          setDeleteConfirmOpen(false);
          setDetailsOpen(false);
        } else {
          alert('Failed to delete team member');
        }
      })
      .catch(err => {
        console.error(err);
        alert('Connection error deleting member');
      });
  };

  // Filter Team Members
  const filteredTeam = team.filter(member => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.department.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = selectedDept === 'All' || member.department === selectedDept;
    const matchesDivision = selectedDivisionFilter === 'All' || member.division_id === selectedDivisionFilter;

    return matchesSearch && matchesDept && matchesDivision;
  });

  // Calculate Metrics
  const activeCount = team.filter(m => m.status === 'Active' || m.status === 'On Duty').length;
  const uniqueDepts = new Set(team.map(m => m.department)).size;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[#001538] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!modalOpen ? (
        <>
          {/* Top Banner with Clean Light Header */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 text-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-black tracking-tight text-slate-800">Team Directory</h2>
              <p className="text-slate-500 text-sm">Manage and collaborate with your organization's members.</p>
            </div>
          </div>

          {/* Control Panel: Search & Add Member */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search & Division Dropdown */}
            <div className="flex flex-col sm:flex-row gap-3 w-full md:max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by name, role, department..."
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#001538] focus:border-[#001538] transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Division Filter select */}
              <select
                value={selectedDivisionFilter}
                onChange={(e) => setSelectedDivisionFilter(e.target.value)}
                className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#001538] focus:border-[#001538]"
              >
                <option value="All">All Divisions</option>
                {divisions.map((div) => (
                  <option key={div.id} value={div.id}>{div.name}</option>
                ))}
              </select>
            </div>

            {/* Add Team Member Button */}
            <button
              onClick={() => setModalOpen(true)}
              className="w-full md:w-auto px-5 py-2.5 bg-[#001538] hover:bg-[#001538]/90 text-white text-sm font-black rounded-xl transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 group"
            >
              <Plus size={18} className="group-hover:rotate-90 transition-transform duration-200" />
              Add Member
            </button>
          </div>

          {/* Filters (Department Chips) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {DEPARTMENTS.map(dept => {
              const isActive = selectedDept === dept;
              return (
                <button
                  key={dept}
                  onClick={() => setSelectedDept(dept)}
                  className={`px-4 py-2 text-xs font-semibold rounded-full border transition-all shrink-0 whitespace-nowrap ${isActive
                      ? 'bg-[#001538] text-white border-[#001538] shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                >
                  {dept}
                </button>
              );
            })}
          </div>

          {/* Directory Grid */}
          {filteredTeam.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTeam.map(member => (
                <div
                  key={member.id}
                  onClick={() => {
                    setSelectedMember(member);
                    setDetailsOpen(true);
                  }}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer hover:border-blue-200 hover:-translate-y-0.5 duration-200"
                >
                  <div className="flex items-center space-x-4">
                    {/* Avatar (Cohesive Slate Background matching Mobile) */}
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-base font-black shadow-inner shrink-0 bg-[#2D3748] text-white">
                      {member.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-base font-black text-slate-800 leading-tight group-hover:text-[#001538] transition-colors truncate">
                        {member.name}
                      </h4>
                      <p className="text-xs font-semibold text-slate-400 mt-1">ID: {member.member_id || 'Generating...'}</p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">{member.role}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between mt-4 pt-3 border-t border-slate-100 gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-500">
                        {member.department}
                      </span>
                      {member.division_name && (
                        <span className="px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-lg text-[10px] font-bold text-[#2563EB]">
                          {member.division_name}
                        </span>
                      )}
                    </div>
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md uppercase tracking-wider ${member.status === 'Active' ? 'bg-emerald-50 text-emerald-600' :
                        member.status === 'On Duty' ? 'bg-teal-50 text-teal-600' :
                          member.status === 'Away' ? 'bg-amber-50 text-amber-600' :
                            'bg-slate-50 text-slate-600'
                      }`}>
                      {member.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <Users className="mx-auto text-slate-300 mb-4" size={48} />
              <h3 className="text-base font-black text-slate-700">No team members found</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">Try adjusting your filters or search keywords, or add a new team member.</p>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* Header Card with Back Button */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 text-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-800">Add Team Member</h2>
              <p className="text-slate-500 text-sm">Register a new employee profile in your organization.</p>
            </div>
            <button
              onClick={() => setModalOpen(false)}
              className="px-3.5 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 rounded-xl transition-all flex items-center gap-1.5 font-black text-xs uppercase tracking-wider border border-slate-200 shadow-2xs"
            >
              <ArrowLeft size={16} className="text-slate-600" />
              <span>Back to Directory</span>
            </button>
          </div>

          {/* Form Content - Inline Screen Panel */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <form onSubmit={handleAddMember} className="space-y-5">
              {/* ─── SECTION: Personal Info ─── */}
              <div className="space-y-1 pb-1"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Personal Information</p></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="text" required placeholder="e.g. Alex Smith" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#001538] transition-all" value={newName} onChange={(e) => setNewName(e.target.value)} />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Email Address *</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="email" required placeholder="alex@company.com" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#001538] transition-all" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                  </div>
                </div>

                {/* Mobile */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Mobile Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="tel" required placeholder="e.g. 9876543210" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#001538] transition-all" value={newMobile} onChange={(e) => setNewMobile(e.target.value)} />
                  </div>
                </div>

                {/* Alternate Mobile */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Alternate Mobile</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="tel" placeholder="e.g. 9988776655" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#001538] transition-all" value={newAlternateMobile} onChange={(e) => setNewAlternateMobile(e.target.value)} />
                  </div>
                </div>

                {/* Aadhar Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Aadhar Number</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="text" placeholder="12-digit UID" maxLength={12} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#001538] transition-all" value={newAadharNumber} onChange={(e) => setNewAadharNumber(e.target.value.replace(/\D/g, ''))} />
                  </div>
                </div>

                {/* Aadhar Copy Upload */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Aadhar Card Copy (URL)</label>
                  <div className="relative">
                    <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="text" placeholder="https://example.com/aadhar.pdf" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#001538] transition-all" value={newAadharCopy} onChange={(e) => setNewAadharCopy(e.target.value)} />
                  </div>
                </div>

                {/* Residing Address */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Residing Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                    <textarea rows={2} placeholder="Current Address" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#001538] transition-all" value={newResidingAddress} onChange={(e) => setNewResidingAddress(e.target.value)} />
                  </div>
                </div>

                {/* Permanent Address */}
                <div className="space-y-1.5 md:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Permanent Address</label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-500 font-bold cursor-pointer">
                      <input type="checkbox" className="rounded text-[#001538] focus:ring-[#001538]" checked={sameAsResiding} onChange={(e) => {
                        setSameAsResiding(e.target.checked);
                        if (e.target.checked) setNewPermanentAddress(newResidingAddress);
                      }} />
                      Same as Residing
                    </label>
                  </div>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                    <textarea rows={2} disabled={sameAsResiding} placeholder="Permanent Address" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#001538] transition-all disabled:opacity-60" value={sameAsResiding ? newResidingAddress : newPermanentAddress} onChange={(e) => setNewPermanentAddress(e.target.value)} />
                  </div>
                </div>

                {/* Emergency Contact Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Emergency Contact Person</label>
                  <div className="relative">
                    <Heart className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="text" placeholder="Contact Name" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#001538] transition-all" value={newEmergencyName} onChange={(e) => setNewEmergencyName(e.target.value)} />
                  </div>
                </div>

                {/* Emergency Contact Mobile */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Emergency Contact Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="tel" placeholder="e.g. 9876543210" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#001538] transition-all" value={newEmergencyMobile} onChange={(e) => setNewEmergencyMobile(e.target.value)} />
                  </div>
                </div>

                {/* Blood Group */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Blood Group</label>
                  <select value={newBloodGroup} onChange={(e) => setNewBloodGroup(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#001538]">
                    <option value="">Select Blood Group</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* ─── SECTION: Employment Details ─── */}
              <div className="space-y-1 pb-1"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Employment Details</p></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Role */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Role / Designation *</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="text" required placeholder="e.g. Operations Head" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#001538] transition-all" value={newRole} onChange={(e) => setNewRole(e.target.value)} />
                  </div>
                </div>
                {/* Salary */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Monthly Salary (₹)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="number" placeholder="e.g. 25000" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#001538] transition-all" value={newSalary} onChange={(e) => setNewSalary(e.target.value)} />
                  </div>
                </div>
                {/* Employee Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Employee Type *</label>
                  <select
                    value={newEmployeeType}
                    onChange={(e) => setNewEmployeeType(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#001538]"
                  >
                    <option value="Permanent">Permanent</option>
                    <option value="Contract">Contract</option>
                    <option value="Temporary">Temporary</option>
                    <option value="Daily Wager">Daily Wager</option>
                    <option value="Apprentice">Apprentice</option>
                  </select>
                </div>
              </div>
              {/* Department Chips */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Department *</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {['Operations', 'Logistics', 'Site Ops', 'Human Resources', 'Accountant'].map(dept => (
                    <button type="button" key={dept} onClick={() => setNewDept(dept)} className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all ${newDept === dept ? 'bg-[#001538]/10 text-[#001538] border-[#001538]' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'}`}>{dept}</button>
                  ))}
                </div>
              </div>
              {/* Division Select & Joining Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Division Assignment</label>
                  <select value={newDivisionId} onChange={(e) => setNewDivisionId(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#001538]">
                    <option value="">No Division (Unassigned)</option>
                    {divisions.map((div) => (<option key={div.id} value={div.id}>{div.name}</option>))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Joining Date *</label>
                  <input
                    type="date"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#001538]"
                    value={newJoiningDate}
                    onChange={(e) => setNewJoiningDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Operational Sub-Role (Conditional) */}
              {(newDept === 'Operations' || newDept === 'Site Ops') && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Operational Sub-Role *</label>
                  <select
                    value={newSubRole}
                    onChange={(e) => setNewSubRole(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#001538]"
                  >
                    <option value="">Select Sub-Role</option>
                    <option value="Operational Manager">Operational Manager</option>
                    <option value="Site Incharge">Site Incharge</option>
                    <option value="Site Supervisor">Site Supervisor</option>
                    <option value="Driver">Driver</option>
                    <option value="Helper">Helper</option>
                    <option value="Crane Operator">Crane Operator</option>
                    <option value="Dozer Operator">Dozer Operator</option>
                  </select>
                </div>
              )}

              <hr className="border-slate-100" />

              {/* ─── SECTION: Bank Details ─── */}
              <div className="space-y-1 pb-1"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bank Details</p></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Account Holder Name</label>
                  <input type="text" placeholder="Holder Name" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#001538] transition-all" value={newAccountHolderName} onChange={(e) => setNewAccountHolderName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Bank Name</label>
                  <input type="text" placeholder="Bank Name" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#001538] transition-all" value={newBankName} onChange={(e) => setNewBankName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Account Number</label>
                  <input type="text" placeholder="Account Number" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#001538] transition-all" value={newBankAccountNumber} onChange={(e) => setNewBankAccountNumber(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">IFSC Code</label>
                  <input type="text" placeholder="IFSC Code" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#001538] transition-all" value={newIfscCode} onChange={(e) => setNewIfscCode(e.target.value)} />
                </div>
              </div>

              {/* Modal Footer / Submit */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4.5 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-600 transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-[#001538] hover:bg-[#001538]/90 text-white text-sm font-black rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2">Add Member</button>
              </div>

            </form>
          </div>
        </div>
      )}
      {/* Employee Details Modal */}
      {detailsOpen && selectedMember && (
        <div className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-800">Employee Details</h3>
              <button
                onClick={() => setDetailsOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
              {/* Profile Card */}
              <div className="flex flex-col items-center text-center pb-4 border-b border-slate-100">
                <div className="w-20 h-20 rounded-full bg-[#001538] text-white flex items-center justify-center text-2xl font-black shrink-0 border-4 border-blue-100 mb-3">
                  {selectedMember.initials}
                </div>
                <h4 className="text-xl font-black text-slate-800 leading-tight">{selectedMember.name}</h4>
                <p className="text-sm font-semibold text-slate-400 mt-1">ID: {selectedMember.member_id || 'N/A'}</p>
                <p className="text-sm text-slate-500 font-medium mt-0.5">{selectedMember.role}</p>
              </div>

              {/* Details List */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 space-y-4">
                <div className="flex items-center space-x-3.5 text-slate-700">
                  <Briefcase size={16} className="text-slate-400 shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Department</span>
                    <span className="text-sm font-semibold text-slate-800">{selectedMember.department}</span>
                  </div>
                </div>

                {selectedMember.sub_role && (
                  <div className="flex items-center space-x-3.5 text-slate-700">
                    <Briefcase size={16} className="text-slate-400 shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sub-Role</span>
                      <span className="text-sm font-semibold text-slate-800">{selectedMember.sub_role}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3.5 text-slate-700">
                  <Briefcase size={16} className="text-slate-400 shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Employee Type</span>
                    <span className="text-sm font-semibold text-slate-800">{selectedMember.employee_type || 'Permanent'}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3.5 text-slate-700">
                  <Clock size={16} className="text-slate-400 shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Joining Date</span>
                    <span className="text-sm font-semibold text-slate-800">{selectedMember.joining_date || 'N/A'}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3.5 text-slate-700">
                  <MapPin size={16} className="text-slate-400 shrink-0" />
                  <div className="flex-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Division Assignment</span>
                    <div className="flex items-center justify-between mt-0.5">
                      {isEditingDivision ? (
                        <select
                          value={editDivisionId}
                          onChange={(e) => handleUpdateDivision(selectedMember.id, e.target.value)}
                          className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-800 focus:outline-none focus:border-[#001538]"
                        >
                          <option value="">No Division (Unassigned)</option>
                          {divisions.map((div) => (
                            <option key={div.id} value={div.id}>{div.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`text-sm font-semibold ${selectedMember.division_name ? 'text-[#2563EB]' : 'text-slate-400 italic'}`}>
                          {selectedMember.division_name || 'Unassigned'}
                        </span>
                      )}
                      <button
                        onClick={() => {
                          setEditDivisionId(selectedMember.division_id || '');
                          setIsEditingDivision(!isEditingDivision);
                        }}
                        className="text-[10px] text-[#001538] hover:underline font-black ml-2 uppercase tracking-wider"
                      >
                        {isEditingDivision ? 'Cancel' : 'Change'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3.5 text-slate-700">
                  <Mail size={16} className="text-slate-400 shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</span>
                    <span className="text-sm font-semibold text-slate-800">{selectedMember.email}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3.5 text-slate-700">
                  <Phone size={16} className="text-slate-400 shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mobile Number</span>
                    <span className="text-sm font-semibold text-slate-800">{selectedMember.mobile}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3.5 text-slate-700">
                  <Clock size={16} className="text-slate-400 shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status</span>
                    <span className="text-sm font-semibold text-slate-800">{selectedMember.status || 'Active'}</span>
                  </div>
                </div>

                {/* Bank Details View */}
                {selectedMember.bank_name || selectedMember.bank_account_number || selectedMember.ifsc_code || selectedMember.account_holder_name ? (
                  <div className="flex items-start space-x-3.5 text-slate-700">
                    <FileText size={16} className="text-slate-400 shrink-0 mt-1" />
                    <div className="flex-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Bank Details</span>
                      <div className="bg-white rounded-xl p-3 border border-slate-200 mt-1 text-xs space-y-1.5 shadow-sm">
                        {selectedMember.account_holder_name && <p><span className="text-slate-400 font-semibold block">Holder Name</span> <span className="font-bold text-slate-800">{selectedMember.account_holder_name}</span></p>}
                        {selectedMember.bank_name && <p><span className="text-slate-400 font-semibold block">Bank Name</span> <span className="font-bold text-slate-800">{selectedMember.bank_name}</span></p>}
                        {selectedMember.bank_account_number && <p><span className="text-slate-400 font-semibold block">Account Number</span> <span className="font-bold text-slate-800">{selectedMember.bank_account_number}</span></p>}
                        {selectedMember.ifsc_code && <p><span className="text-slate-400 font-semibold block">IFSC Code</span> <span className="font-bold text-[#2563EB]">{selectedMember.ifsc_code}</span></p>}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => triggerDeleteConfirm(selectedMember)}
                  className="flex-1 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={16} />
                  Remove from Team
                </button>
                <button
                  type="button"
                  onClick={() => setDetailsOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirmOpen && selectedMember && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 p-6 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <AlertCircle size={32} className="text-red-500" />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-2">Remove Team Member</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Are you sure you want to remove <strong className="text-slate-800 font-bold">{selectedMember.name}</strong> from the team? This action is permanent and cannot be undone.
            </p>

            <div className="flex items-center gap-3 w-full">
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
                className="flex-1 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteMember}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-sm transition-all shadow-md"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

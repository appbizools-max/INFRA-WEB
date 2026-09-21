import React, { useState, useEffect, useRef } from 'react';
import { Users, Search, Plus, Mail, Phone, X, Briefcase, Award, Clock, Trash2, AlertCircle, MapPin, Shield, Heart, Home, Camera, FileText, CheckCircle, Upload, User, CreditCard, ArrowLeft, ChevronDown, Check, Eye } from 'lucide-react';
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
  division_ids?: string[];
  divisions_list?: { id: string; name: string }[];
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

function DivisionMultiSelectDropdown({
  divisions,
  selectedIds,
  onChange,
  placeholder = "Select Divisions..."
}: {
  divisions: any[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterText, setFilterText] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const filteredDivisions = divisions.filter(d =>
    d.name.toLowerCase().includes(filterText.toLowerCase()) ||
    (d.city && d.city.toLowerCase().includes(filterText.toLowerCase())) ||
    (d.state && d.state.toLowerCase().includes(filterText.toLowerCase()))
  );

  const toggleDivision = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(item => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const selectAll = () => {
    onChange(divisions.map(d => d.id));
  };

  const clearAll = () => {
    onChange([]);
  };

  const isAllSelected = divisions.length > 0 && selectedIds.length === divisions.length;
  const selectedDivisions = divisions.filter(d => selectedIds.includes(d.id));

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Dropdown Trigger */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full min-h-[42px] px-3.5 py-2 bg-slate-50 hover:bg-white border border-slate-200 hover:border-slate-300 rounded-xl flex items-center justify-between cursor-pointer transition-all shadow-2xs"
      >
        <div className="flex flex-wrap items-center gap-1.5 flex-1 pr-2">
          {selectedDivisions.length === 0 ? (
            <span className="text-sm text-slate-400 font-medium">{placeholder}</span>
          ) : isAllSelected ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 text-[#2563EB] text-xs font-bold rounded-lg shadow-2xs">
              <Check size={12} className="stroke-[3]" />
              <span>All Divisions ({divisions.length})</span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  clearAll();
                }}
                className="hover:text-red-500 rounded-full p-0.5 cursor-pointer ml-1"
                title="Clear all divisions"
              >
                <X size={12} />
              </span>
            </span>
          ) : (
            selectedDivisions.map(div => (
              <span
                key={div.id}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 border border-blue-200 text-[#2563EB] text-xs font-bold rounded-lg shadow-2xs"
              >
                <span className="truncate max-w-[150px]">{div.name}</span>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDivision(div.id);
                  }}
                  className="hover:text-red-500 rounded-full p-0.5 cursor-pointer"
                >
                  <X size={12} />
                </span>
              </span>
            ))
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
          {isAllSelected ? (
            <span className="text-[10px] font-black px-2 py-0.5 bg-[#2563EB] text-white rounded-md tracking-wider shadow-2xs">
              ALL ({divisions.length})
            </span>
          ) : selectedIds.length > 0 ? (
            <span className="text-[11px] font-black px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded-md">
              {selectedIds.length}
            </span>
          ) : null}
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-slate-700' : ''}`}
          />
        </div>
      </div>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Header & Quick Actions */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input
                type="text"
                placeholder="Search divisions..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-full pl-7 pr-2 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#001538]"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold shrink-0">
              <button
                type="button"
                onClick={selectAll}
                className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="px-2 py-1 text-slate-500 hover:bg-slate-200 rounded-md transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Division Options List */}
          <div className="max-h-56 overflow-y-auto p-1 divide-y divide-slate-100">
            {/* Explicit 'All Divisions' Option */}
            {divisions.length > 0 && (!filterText || 'all divisions'.includes(filterText.toLowerCase()) || 'all'.includes(filterText.toLowerCase())) && (
              <div
                onClick={() => {
                  if (isAllSelected) {
                    clearAll();
                  } else {
                    selectAll();
                  }
                }}
                className={`flex items-center justify-between px-3 py-2.5 text-xs rounded-lg cursor-pointer transition-colors ${
                  isAllSelected ? 'bg-blue-50/90 text-[#2563EB]' : 'hover:bg-slate-50 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      isAllSelected ? 'bg-[#2563EB] border-[#2563EB] text-white' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isAllSelected && <Check size={12} className="stroke-[3]" />}
                  </div>
                  <div>
                    <span className="font-black block leading-tight text-slate-900">
                      All Divisions
                    </span>
                    <span className="text-[10px] text-slate-400 block leading-tight">
                      Assign to all {divisions.length} corporate divisions
                    </span>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                  isAllSelected ? 'bg-[#2563EB] text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {isAllSelected ? 'All Selected' : `Select All (${divisions.length})`}
                </span>
              </div>
            )}

            {filteredDivisions.length === 0 && divisions.length > 0 ? (
              <div className="py-4 text-center text-xs text-slate-400 font-medium">
                No matching divisions found
              </div>
            ) : filteredDivisions.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400 font-medium">
                No divisions created yet
              </div>
            ) : (
              filteredDivisions.map(div => {
                const isSelected = selectedIds.includes(div.id);
                return (
                  <div
                    key={div.id}
                    onClick={() => toggleDivision(div.id)}
                    className={`flex items-center justify-between px-3 py-2 text-xs rounded-lg cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50/80 text-[#2563EB]' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? 'bg-[#2563EB] border-[#2563EB] text-white' : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check size={12} className="stroke-[3]" />}
                      </div>
                      <div className="truncate">
                        <span className="font-bold block leading-tight text-slate-800">{div.name}</span>
                        {(div.city || div.state) && (
                          <span className="text-[10px] text-slate-400 block leading-tight truncate">
                            {[div.city, div.state].filter(Boolean).join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <span className="text-[10px] font-bold text-[#2563EB] shrink-0 uppercase tracking-wider">
                        Selected
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Bar */}
          <div className="p-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium text-[11px]">
              {isAllSelected ? (
                <strong className="text-blue-600 font-bold">All {divisions.length} divisions selected</strong>
              ) : (
                `${selectedIds.length} of ${divisions.length} selected`
              )}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 bg-[#001538] hover:bg-[#001538]/90 text-white rounded-lg text-xs font-bold transition-all shadow-2xs"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TeamPage() {
  const { currentUser } = useAuth();

  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [divisions, setDivisions] = useState<any[]>([]);
  const [selectedDivisionFilter, setSelectedDivisionFilter] = useState('All');

  // Live Departments & Roles for Interconnection
  const [departments, setDepartments] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [isEditingDivision, setIsEditingDivision] = useState(false);
  const [editDivisionIds, setEditDivisionIds] = useState<string[]>([]);

  const openMemberDetails = (member: TeamMember) => {
    setSelectedMember(member);
    const cur = (member.division_ids && member.division_ids.length > 0)
      ? member.division_ids
      : (member.division_id ? [member.division_id] : []);
    setEditDivisionIds(cur);
    setIsEditingDivision(false);
    setDetailsOpen(true);
  };

  const handleUpdateDivisions = (memberId: string, divIds: string[]) => {
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
        divisionIds: divIds,
      }),
    })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Failed to update divisions');
      })
      .then(updatedMember => {
        const assignedDivs = divisions.filter(d => (updatedMember.division_ids || divIds).includes(d.id));
        const formatted: TeamMember = {
          ...selectedMember,
          division_id: updatedMember.division_id,
          division_ids: updatedMember.division_ids || divIds,
          divisions_list: assignedDivs.map(d => ({ id: d.id, name: d.name })),
          division_name: assignedDivs[0]?.name || undefined
        };
        setSelectedMember(formatted);
        setTeam(team.map(m => m.id === memberId ? formatted : m));
        setIsEditingDivision(false);
      })
      .catch(err => {
        alert(err.message || 'Error updating member divisions');
      });
  };
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // New Member Form State
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newDept, setNewDept] = useState('Operational Staff');
  const [newEmail, setNewEmail] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [newDivisionIds, setNewDivisionIds] = useState<string[]>([]);
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
  const [aadharFileName, setAadharFileName] = useState('');
  const aadharFileInputRef = useRef<HTMLInputElement>(null);
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

  const handleAadharFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAadharFileName(file.name);
    handleFileToBase64(file, setNewAadharCopy);
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
            const divIds = Array.isArray(member.division_ids)
              ? member.division_ids
              : (member.division_id ? [member.division_id] : []);
            return {
              ...member,
              initials: initials || 'U',
              division_ids: divIds,
              divisions_list: member.divisions_list || [],
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

  const fetchDepartmentsAndRoles = async () => {
    if (!currentUser) return;
    try {
      const [deptRes, rolesRes] = await Promise.all([
        fetch(`${apiHost}/api/tenant/departments/${currentUser.uid}`),
        fetch(`${apiHost}/api/tenant/roles/${currentUser.uid}`)
      ]);
      let deptList: any[] = [];
      let roleList: any[] = [];
      if (deptRes.ok) {
        const d = await deptRes.json();
        deptList = Array.isArray(d) ? d : (d.departments || []);
        setDepartments(deptList);
      }
      if (rolesRes.ok) {
        const r = await rolesRes.json();
        roleList = Array.isArray(r) ? r : (r.roles || []);
        setRoles(roleList);
      }

      // Interconnect initial department and role selection
      const initialDept = deptList.length > 0 ? deptList[0].name : 'Operational Staff';
      setNewDept(prev => (!prev || prev === 'Operations' ? initialDept : prev));

      const activeDept = (!newDept || newDept === 'Operations') ? initialDept : newDept;
      const deptLower = activeDept.trim().toLowerCase();
      if (deptLower === 'accounts') {
        setNewRole(prev => (!prev ? 'Accountant' : prev));
      } else if (deptLower === 'hr' || deptLower === 'human resources') {
        setNewRole(prev => (!prev ? 'HR' : prev));
      } else {
        const dRoles = roleList.filter(role => (role.department || '').trim().toLowerCase() === deptLower);
        if (dRoles.length > 0) {
          setNewRole(prev => (!prev ? dRoles[0].name : prev));
        }
      }
    } catch (err) {
      console.error('Error loading departments or roles in TeamPage:', err);
    }
  };

  useEffect(() => {
    fetchTeamMembers();
    fetchDivisions();
    fetchDepartmentsAndRoles();
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
        divisionIds: newDivisionIds,
        divisionId: newDivisionIds[0] || null,
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
        const assignedDivIds = savedMember.division_ids || newDivisionIds;
        const assignedDivs = divisions.filter(d => assignedDivIds.includes(d.id));
        const formattedMember: TeamMember = {
          ...savedMember,
          initials: initials || 'U',
          division_ids: assignedDivIds,
          divisions_list: assignedDivs.map(d => ({ id: d.id, name: d.name })),
          division_name: assignedDivs[0]?.name || undefined
        };
        setTeam([formattedMember, ...team]);
        // Refresh departments and roles in case a custom one was added
        fetchDepartmentsAndRoles();
        // Reset all form fields
        setNewName(''); 
        setNewEmail(''); 
        setNewMobile('');
        const resetDept = departments[0]?.name || 'Operational Staff';
        setNewDept(resetDept);
        const resetLower = resetDept.trim().toLowerCase();
        if (resetLower === 'accounts') {
          setNewRole('Accountant');
        } else if (resetLower === 'hr' || resetLower === 'human resources') {
          setNewRole('HR');
        } else {
          const dRoles = roles.filter(r => (r.department || '').trim().toLowerCase() === resetLower);
          setNewRole(dRoles.length > 0 ? dRoles[0].name : '');
        }
        setNewDivisionIds([]); setNewAlternateMobile(''); setNewAadharNumber('');
        setNewResidingAddress(''); setNewPermanentAddress(''); setSameAsResiding(false);
        setNewEmergencyName(''); setNewEmergencyMobile(''); setNewBloodGroup('');
        setNewProfilePhoto(''); setNewAadharCopy(''); setAadharFileName(''); setNewSalary('');
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
    const matchesDivision =
      selectedDivisionFilter === 'All' ||
      member.division_id === selectedDivisionFilter ||
      (Array.isArray(member.division_ids) && member.division_ids.includes(selectedDivisionFilter));

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
              className="w-full md:w-auto px-5 py-2.5 bg-[#001538] hover:bg-[#001538]/90 text-white text-sm font-black rounded-xl transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 group whitespace-nowrap"
            >
              <Plus size={18} className="group-hover:rotate-90 transition-transform duration-200" />
              Add Member
            </button>
          </div>

          {/* Filters (Dynamic Department Chips) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {Array.from(new Set([
              'All',
              ...departments.map(d => d.name),
              ...team.map(m => m.department).filter(Boolean)
            ])).map(dept => {
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

          {/* Directory Table */}
          {filteredTeam.length > 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                        <th className="py-3.5 px-4 text-center w-12">S.No</th>
                        <th className="py-3.5 px-4 min-w-[220px]">Member</th>
                        <th className="py-3.5 px-4">Member ID</th>
                        <th className="py-3.5 px-4">Role / Designation</th>
                        <th className="py-3.5 px-4">Department</th>
                        <th className="py-3.5 px-4 min-w-[180px]">Division Assignment</th>
                        <th className="py-3.5 px-4 text-center w-28">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                      {filteredTeam.map((member, idx) => {
                        const memberDivs = (member.divisions_list && member.divisions_list.length > 0)
                          ? member.divisions_list
                          : (member.division_ids && member.division_ids.length > 0)
                            ? divisions.filter(d => member.division_ids!.includes(d.id))
                            : member.division_name
                              ? [{ id: member.division_id || '', name: member.division_name }]
                              : [];
                        const isAllDivs = divisions.length > 1 && memberDivs.length >= divisions.length;

                        return (
                          <tr
                            key={member.id}
                            onClick={() => openMemberDetails(member)}
                            className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                          >
                            <td className="py-3 px-4 text-center text-slate-400 font-bold">{idx + 1}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-3">
                                {member.profile_photo ? (
                                  <img
                                    src={member.profile_photo}
                                    alt={member.name}
                                    className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0 shadow-2xs"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black shadow-inner shrink-0 bg-[#2D3748] text-white">
                                    {member.initials}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <span className="font-bold text-slate-900 group-hover:text-[#001538] transition-colors block text-sm leading-tight truncate">
                                    {member.name}
                                  </span>
                                  <span className="text-[11px] text-slate-400 font-medium truncate block mt-0.5">
                                    {member.email || member.mobile || 'No contact specified'}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md border border-slate-200/80">
                                {member.member_id || 'Generating...'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-bold text-slate-800 text-xs block">
                                {member.role || 'Unassigned'}
                              </span>
                              {member.employee_type && (
                                <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                                  {member.employee_type}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-700 font-bold text-[11px] rounded-lg border border-slate-200/60">
                                {member.department}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {isAllDivs ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#2563EB] text-white rounded-lg text-[10px] font-black tracking-wide shadow-2xs">
                                  <Check size={11} className="stroke-[3]" />
                                  All Divisions ({divisions.length})
                                </span>
                              ) : memberDivs.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {memberDivs.map(div => (
                                    <span
                                      key={div.id || div.name}
                                      className="px-2 py-0.5 bg-blue-50 border border-blue-100 rounded-md text-[10px] font-bold text-[#2563EB]"
                                    >
                                      {div.name}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400 italic font-medium">Unassigned</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center whitespace-nowrap">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openMemberDetails(member);
                                }}
                                className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-[#001538] hover:bg-slate-100 rounded-lg transition-colors inline-flex items-center gap-1 border border-slate-200/80 group-hover:border-slate-300"
                              >
                                <Eye size={13} />
                                <span>View</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
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

                {/* Aadhar Copy Media Upload */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      Aadhar Card Copy
                    </label>
                    {newAadharCopy && (
                      <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle size={12} /> Media Attached
                      </span>
                    )}
                  </div>

                  <input
                    ref={aadharFileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={handleAadharFileChange}
                  />

                  {!newAadharCopy ? (
                    <button
                      type="button"
                      onClick={() => aadharFileInputRef.current?.click()}
                      className="w-full py-2 px-3.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 hover:border-[#001538] rounded-xl flex items-center justify-between text-left transition-all group cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <Upload size={15} />
                        </div>
                        <div className="truncate">
                          <span className="text-xs font-bold text-slate-700 block truncate">Upload Aadhar Media</span>
                          <span className="text-[10px] text-slate-400 block truncate">PDF, JPG, PNG (Max 2MB)</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 text-[11px] font-bold rounded-lg shrink-0 group-hover:bg-[#001538] group-hover:text-white group-hover:border-[#001538] transition-all">
                        Browse
                      </span>
                    </button>
                  ) : (
                    <div className="w-full py-2 px-3 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between gap-2 shadow-2xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <FileText size={16} />
                        </div>
                        <div className="truncate">
                          <span className="text-xs font-bold text-slate-800 block truncate">
                            {aadharFileName || 'Aadhar Document Attached'}
                          </span>
                          <span className="text-[10px] text-emerald-600 font-semibold block">Ready to submit</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => aadharFileInputRef.current?.click()}
                          className="px-2 py-1 text-[11px] font-bold text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setNewAadharCopy('');
                            setAadharFileName('');
                            if (aadharFileInputRef.current) aadharFileInputRef.current.value = '';
                          }}
                          className="p-1 text-slate-400 hover:text-red-500 rounded-md transition-colors"
                          title="Remove file"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  )}
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

              {/* ─── SECTION: Employment Details (Interconnected Department & Role) ─── */}
              <div className="space-y-1 pb-1"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Employment Details</p></div>
              
              {/* 1. Department Selection (First) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Department *
                </label>

                <div className="flex flex-wrap gap-2 pt-0.5">
                  {(departments.length > 0 ? departments.map(d => d.name) : ['Operational Staff', 'FMS', 'Accounts', 'HR']).map(dept => {
                      const isSelected = newDept === dept;
                      return (
                        <button
                          type="button"
                          key={dept}
                          onClick={() => {
                            setNewDept(dept);
                            const deptLower = dept.trim().toLowerCase();
                            if (deptLower === 'accounts') {
                              setNewRole('Accountant');
                            } else if (deptLower === 'hr' || deptLower === 'human resources') {
                              setNewRole('HR');
                            } else {
                              // Auto-select first role of this department if available
                              const dRoles = roles.filter(r => (r.department || '').trim().toLowerCase() === deptLower);
                              if (dRoles.length > 0) {
                                setNewRole(dRoles[0].name);
                              } else {
                                setNewRole('');
                              }
                            }
                          }}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                            isSelected 
                              ? 'bg-[#001538] text-white border-[#001538] shadow-xs' 
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {dept}
                        </button>
                      );
                    })}
                  </div>
              </div>

              {/* 2. Role / Designation (Interconnected to Department) */}
              {/* 2. Role / Designation & Employee Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Role / Designation *
                    </label>
                    {(() => {
                      const deptLower = (newDept || '').trim().toLowerCase();
                      let dRoles = roles.filter(r => (r.department || '').trim().toLowerCase() === deptLower);
                      if (deptLower === 'accounts' && !dRoles.some(r => r.name.toLowerCase() === 'accountant')) {
                        dRoles = [{ id: 'acc-role', name: 'Accountant', access_level: 'Financial', department: 'Accounts' }, ...dRoles];
                      }
                      if ((deptLower === 'hr' || deptLower === 'human resources') && !dRoles.some(r => r.name.toLowerCase() === 'hr')) {
                        dRoles = [{ id: 'hr-role', name: 'HR', access_level: 'HR', department: 'HR' }, ...dRoles];
                      }
                      return dRoles.length > 0 ? (
                        <span className="text-[10px] text-emerald-600 font-bold">
                          {dRoles.length} Available Roles
                        </span>
                      ) : null;
                    })()}
                  </div>

                  {(() => {
                    const deptLower = (newDept || '').trim().toLowerCase();
                    let dRoles = roles.filter(r => (r.department || '').trim().toLowerCase() === deptLower);
                    if (deptLower === 'accounts' && !dRoles.some(r => r.name.toLowerCase() === 'accountant')) {
                      dRoles = [{ id: 'acc-role', name: 'Accountant', access_level: 'Financial', department: 'Accounts' }, ...dRoles];
                    }
                    if ((deptLower === 'hr' || deptLower === 'human resources') && !dRoles.some(r => r.name.toLowerCase() === 'hr')) {
                      dRoles = [{ id: 'hr-role', name: 'HR', access_level: 'HR', department: 'HR' }, ...dRoles];
                    }
                    
                    if (dRoles.length > 0) {
                      return (
                        <select
                          value={newRole}
                          onChange={(e) => setNewRole(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#001538]"
                        >
                          <option value="" disabled>-- Select Role in {newDept} --</option>
                          {dRoles.map(r => (
                            <option key={r.id || r.name} value={r.name}>
                              {r.name} ({r.access_level || 'Operational'})
                            </option>
                          ))}
                        </select>
                      );
                    } else {
                      return (
                        <div className="relative">
                          <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input
                            type="text"
                            required
                            placeholder={`e.g. ${newDept} Officer`}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#001538] transition-all"
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                          />
                        </div>
                      );
                    }
                  })()}
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

              {/* Division Assignment (Drop and Select) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Division Assignment
                </label>
                <DivisionMultiSelectDropdown
                  divisions={divisions}
                  selectedIds={newDivisionIds}
                  onChange={setNewDivisionIds}
                  placeholder="Drop down to select divisions..."
                />
              </div>

              {/* Joining Date */}
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

              {/* Monthly Salary */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Monthly Salary (₹)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="e.g. 25000"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#001538] transition-all"
                  value={newSalary}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setNewSalary(val);
                  }}
                />
              </div>



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

                <div className="flex items-start space-x-3.5 text-slate-700">
                  <MapPin size={16} className="text-slate-400 shrink-0 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Division Assignment ({(() => {
                          const list = (selectedMember.divisions_list && selectedMember.divisions_list.length > 0)
                            ? selectedMember.divisions_list
                            : (selectedMember.division_ids && selectedMember.division_ids.length > 0)
                              ? divisions.filter(d => selectedMember.division_ids!.includes(d.id))
                              : selectedMember.division_name
                                ? [{ id: selectedMember.division_id || '', name: selectedMember.division_name }]
                                : [];
                          return list.length;
                        })()})
                      </span>
                      <button
                        onClick={() => {
                          if (!isEditingDivision) {
                            const cur = (selectedMember.division_ids && selectedMember.division_ids.length > 0)
                              ? selectedMember.division_ids
                              : (selectedMember.division_id ? [selectedMember.division_id] : []);
                            setEditDivisionIds(cur);
                          }
                          setIsEditingDivision(!isEditingDivision);
                        }}
                        className="text-[10px] text-[#001538] hover:underline font-black uppercase tracking-wider"
                      >
                        {isEditingDivision ? 'Cancel' : 'Change'}
                      </button>
                    </div>

                    {isEditingDivision ? (
                      <div className="mt-2 space-y-2 p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
                        <DivisionMultiSelectDropdown
                          divisions={divisions}
                          selectedIds={editDivisionIds}
                          onChange={setEditDivisionIds}
                          placeholder="Drop down to select divisions..."
                        />
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setIsEditingDivision(false)}
                            className="px-2.5 py-1 text-xs font-semibold text-slate-500 hover:text-slate-700"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateDivisions(selectedMember.id, editDivisionIds)}
                            className="px-3 py-1 bg-[#001538] hover:bg-[#001538]/90 text-white text-xs font-bold rounded-lg shadow-xs"
                          >
                            Save Divisions
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {(() => {
                          const list = (selectedMember.divisions_list && selectedMember.divisions_list.length > 0)
                            ? selectedMember.divisions_list
                            : (selectedMember.division_ids && selectedMember.division_ids.length > 0)
                              ? divisions.filter(d => selectedMember.division_ids!.includes(d.id))
                              : selectedMember.division_name
                                ? [{ id: selectedMember.division_id || '', name: selectedMember.division_name }]
                                : [];

                          if (list.length === 0) {
                            return <span className="text-xs text-slate-400 italic font-semibold">No Division (Unassigned)</span>;
                          }

                          if (divisions.length > 1 && list.length >= divisions.length) {
                            return (
                              <span className="px-3 py-1 bg-[#2563EB] text-white rounded-lg text-xs font-black tracking-wide shadow-2xs flex items-center gap-1.5">
                                <Check size={13} className="stroke-[3]" />
                                All Divisions ({divisions.length})
                              </span>
                            );
                          }

                          return list.map(div => (
                            <span
                              key={div.id || div.name}
                              className="px-2.5 py-0.5 bg-blue-50 border border-blue-100 rounded-lg text-xs font-bold text-[#2563EB]"
                            >
                              {div.name}
                            </span>
                          ));
                        })()}
                      </div>
                    )}
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

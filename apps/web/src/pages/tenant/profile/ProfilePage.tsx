import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { User, Mail, Phone, Briefcase, Building2, Globe, Users, FileText, MapPin, AlertCircle, Loader2, Edit3, Check, X } from 'lucide-react';

const INDUSTRIES = [
  'Logistics',
  'Mining',
  'Port Operations',
  'Rail Logistics',
  'EPC / Infrastructure',
  'Construction',
  'Manufacturing',
];

interface ProfileData {
  adminName: string;
  designation: string;
  mobile: string;
  email: string;
  companyName: string;
  industryType: string;
  country: string;
  state: string;
  pincode: string;
  city: string;
  companyWebsite?: string;
  companySize?: string;
  gstNumber?: string;
  panNumber?: string;
  msmeNumber?: string;
  memberId?: string;
  userType?: string;
  department?: string;
  alternateMobile?: string;
  aadharNumber?: string;
  residingAddress?: string;
  permanentAddress?: string;
  emergencyContactName?: string;
  emergencyContactMobile?: string;
  bloodGroup?: string;
  profilePhoto?: string;
  salary?: number | string;
  bankName?: string;
  bankAccountNumber?: string;
  ifscCode?: string;
  accountHolderName?: string;
  subRole?: string;
  employeeType?: string;
  joiningDate?: string;
}
export default function ProfilePage() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [editForm, setEditForm] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const fetchProfile = () => {
    if (currentUser) {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const host = baseUrl.startsWith('http://localhost:3001') ? 'http://localhost:5000' : baseUrl;
      const mobile = currentUser.phoneNumber || '';
      const email = currentUser.email || '';
      fetch(`${host}/api/tenant/profile/${currentUser.uid}?mobile=${encodeURIComponent(mobile)}&email=${encodeURIComponent(email)}`)
        .then((res) => {
          if (!res.ok) {
            if (res.status === 404) {
              setProfile(null);
            } else {
              throw new Error('Failed to load profile data');
            }
          } else {
            return res.json();
          }
        })
        .then((data) => {
          if (data) {
            setProfile(data);
            setEditForm(data);
          }
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [currentUser]);

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    if (editForm) {
      setEditForm({ ...editForm, [field]: value });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !editForm) return;

    setSaving(true);
    setError(null);
    setMessage(null);

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const host = baseUrl.startsWith('http://localhost:3001') ? 'http://localhost:5000' : baseUrl;

    try {
      const res = await fetch(`${host}/api/tenant/profile/${currentUser.uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setProfile(editForm);
      setIsEditing(false);
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#1E3A8A] animate-spin" />
        <span className="mt-2 text-sm text-slate-500 font-medium">Loading profile details...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-blue-50/50 border border-blue-200 rounded-2xl flex flex-col items-center text-center">
        <Building2 className="w-16 h-16 text-[#1E3A8A] mb-4" />
        <h3 className="text-xl font-black text-[#1E3A8A] mb-2">Registration Incomplete</h3>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          It looks like you haven't completed your company registration yet. Please complete the registration wizard to view your full organization profile.
        </p>
        <a
          href="/tenant/registration"
          className="px-6 py-3 bg-[#1E3A8A] text-white font-bold rounded-xl text-sm hover:bg-[#152a63] transition-colors"
        >
          Complete Registration
        </a>
      </div>
    );
  }

  const initials = profile.adminName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2 shrink-0" />
          {error}
        </div>
      )}
      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 flex items-center">
          <Check className="w-5 h-5 mr-2 shrink-0" />
          {message}
        </div>
      )}

      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row items-center justify-between shadow-sm space-y-4 sm:space-y-0">
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <div className="w-20 h-20 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center text-2xl font-black shrink-0 border-4 border-blue-100">
            {initials}
          </div>
          <div className="text-center sm:text-left min-w-0">
            <h2 className="text-2xl font-black text-slate-900 leading-tight mb-1">{profile.adminName}</h2>
            <p className="text-sm text-slate-500 font-semibold mb-2">{profile.designation}</p>
            <span className="inline-block px-3 py-1 bg-blue-50 text-[#1E3A8A] font-bold text-xs rounded-full border border-blue-100">
              {profile.companyName}
            </span>
          </div>
        </div>

        {!isEditing && profile.userType !== 'team_member' && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors"
          >
            <Edit3 size={16} className="mr-2" />
            Edit Profile
          </button>
        )}
      </div>

      {profile.userType === 'team_member' ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Personal Details */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center">
                <User size={18} className="text-[#1E3A8A] mr-2" />
                Personal Details
              </h3>
              <div className="space-y-4">
                <ProfileFieldReadOnly icon={User} label="Member ID" value={profile.memberId || 'N/A'} />
                <ProfileFieldReadOnly icon={User} label="Full Name" value={profile.adminName} />
                <ProfileFieldReadOnly icon={Briefcase} label="Designation / Role" value={profile.designation} />
                <ProfileFieldReadOnly icon={Users} label="Department" value={profile.department || 'Operations'} />
                <ProfileFieldReadOnly icon={Mail} label="Email Address" value={profile.email} />
                <ProfileFieldReadOnly icon={Phone} label="Mobile Number" value={profile.mobile} />
                <ProfileFieldReadOnly icon={Phone} label="Alternate Mobile" value={profile.alternateMobile || 'Not Provided'} />
                <ProfileFieldReadOnly icon={User} label="Blood Group" value={profile.bloodGroup || 'Not Provided'} />
                <ProfileFieldReadOnly icon={FileText} label="Aadhar Card Number" value={profile.aadharNumber || 'Not Provided'} />
              </div>
            </div>

            {/* Address & Emergency Info */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center">
                <MapPin size={18} className="text-[#1E3A8A] mr-2" />
                Addresses & Emergency Info
              </h3>
              <div className="space-y-4">
                <ProfileFieldReadOnly icon={MapPin} label="Residing Address" value={profile.residingAddress || 'Not Provided'} />
                <ProfileFieldReadOnly icon={MapPin} label="Permanent Address" value={profile.permanentAddress || 'Not Provided'} />
                <ProfileFieldReadOnly icon={User} label="Emergency Contact Person" value={profile.emergencyContactName || 'Not Provided'} />
                <ProfileFieldReadOnly icon={Phone} label="Emergency Contact Number" value={profile.emergencyContactMobile || 'Not Provided'} />
              </div>
            </div>

          </div>

          {/* Employment & Bank Details */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center">
              <FileText size={18} className="text-[#1E3A8A] mr-2" />
              Employment & Bank Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <ProfileFieldReadOnly icon={Briefcase} label="Employee Type" value={profile.employeeType || 'Permanent'} />
              <ProfileFieldReadOnly icon={FileText} label="Joining Date" value={profile.joiningDate ? new Date(profile.joiningDate).toLocaleDateString('en-IN') : 'Not Provided'} />
              <ProfileFieldReadOnly icon={FileText} label="Monthly Salary" value={profile.salary ? `₹${Number(profile.salary).toLocaleString('en-IN')}` : 'Not Provided'} />
              <ProfileFieldReadOnly icon={Building2} label="Bank Name" value={profile.bankName || 'Not Provided'} />
              <ProfileFieldReadOnly icon={FileText} label="Bank Account Number" value={profile.bankAccountNumber || 'Not Provided'} />
              <ProfileFieldReadOnly icon={FileText} label="IFSC Code" value={profile.ifscCode || 'Not Provided'} />
              <ProfileFieldReadOnly icon={User} label="Account Holder Name" value={profile.accountHolderName || 'Not Provided'} />
            </div>
          </div>

          {/* Company details */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center">
              <Building2 size={18} className="text-[#1E3A8A] mr-2" />
              Company Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <ProfileFieldReadOnly icon={Building2} label="Company Name" value={profile.companyName} />
              <ProfileFieldReadOnly icon={Globe} label="Industry" value={profile.industryType} />
              <ProfileFieldReadOnly icon={MapPin} label="City & State" value={`${profile.city}, ${profile.state}`} />
              <ProfileFieldReadOnly icon={Globe} label="Country & Pincode" value={`${profile.country} - ${profile.pincode}`} />
            </div>
          </div>

        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Admin Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center">
              <User size={18} className="text-[#1E3A8A] mr-2" />
              Administrator Details
            </h3>

            <div className="space-y-4">
              <ProfileField
                icon={User} label="Admin ID" field="memberId"
                value={profile.memberId || 'Loading...'} editValue={profile.memberId}
                isEditing={false} onChange={() => {}}
              />
              <ProfileField
                icon={User} label="Full Name" field="adminName"
                value={profile.adminName} editValue={editForm?.adminName}
                isEditing={isEditing} onChange={handleInputChange} required
              />
              <ProfileField
                icon={Briefcase} label="Designation" field="designation"
                value={profile.designation} editValue={editForm?.designation}
                isEditing={isEditing} onChange={handleInputChange} required
              />
              <ProfileField
                icon={Mail} label="Email Address" field="email"
                value={profile.email} editValue={editForm?.email}
                isEditing={isEditing} onChange={handleInputChange} type="email" required
              />
              <ProfileField
                icon={Phone} label="Mobile Number" field="mobile"
                value={profile.mobile} editValue={editForm?.mobile}
                isEditing={isEditing} onChange={handleInputChange} required
              />
            </div>
          </div>

          {/* Company Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center">
              <Building2 size={18} className="text-[#1E3A8A] mr-2" />
              Company Details
            </h3>

            <div className="space-y-4">
              <ProfileField
                icon={Building2} label="Company Name" field="companyName"
                value={profile.companyName} editValue={editForm?.companyName}
                isEditing={isEditing} onChange={handleInputChange} required
              />
              {isEditing ? (
                <div className="flex items-start space-x-3 w-full">
                  <Globe size={16} className="text-slate-400 mt-2.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Industry Type</div>
                    <select
                      value={INDUSTRIES.includes(editForm?.industryType || '') ? editForm?.industryType : (editForm?.industryType ? 'Other' : '')}
                      onChange={(e) => handleInputChange('industryType', e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1E3A8A] font-semibold text-sm text-slate-800"
                    >
                      <option value="">Select Industry</option>
                      {INDUSTRIES.map(ind => (
                        <option key={ind} value={ind}>{ind}</option>
                      ))}
                      <option value="Other">Other</option>
                    </select>

                    {editForm?.industryType !== undefined && !INDUSTRIES.includes(editForm.industryType) && (
                      <input
                        type="text"
                        required
                        value={editForm.industryType === 'Other' ? '' : editForm.industryType}
                        onChange={(e) => handleInputChange('industryType', e.target.value)}
                        placeholder="Please specify your industry"
                        className="w-full mt-2 px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1E3A8A] font-semibold text-sm text-slate-800"
                      />
                    )}
                  </div>
                </div>
              ) : (
                <ProfileField
                  icon={Globe} label="Industry Type" field="industryType"
                  value={profile.industryType} editValue={editForm?.industryType}
                  isEditing={isEditing} onChange={handleInputChange} required
                />
              )}
              <ProfileField
                icon={Globe} label="Website" field="companyWebsite"
                value={profile.companyWebsite || 'Not Provided'} editValue={editForm?.companyWebsite}
                isEditing={isEditing} onChange={handleInputChange}
              />
              <ProfileField
                icon={Users} label="Company Size" field="companySize"
                value={profile.companySize || 'Not Provided'} editValue={editForm?.companySize}
                isEditing={isEditing} onChange={handleInputChange}
              />
              <ProfileField
                icon={FileText} label="GST Number" field="gstNumber"
                value={profile.gstNumber || 'Not Provided'} editValue={editForm?.gstNumber}
                isEditing={isEditing} onChange={handleInputChange}
              />
              <ProfileField
                icon={FileText} label="PAN Number" field="panNumber"
                value={profile.panNumber || 'Not Provided'} editValue={editForm?.panNumber}
                isEditing={isEditing} onChange={handleInputChange}
              />
              <ProfileField
                icon={FileText} label="MSME Registration No" field="msmeNumber"
                value={profile.msmeNumber || 'Not Provided'} editValue={editForm?.msmeNumber}
                isEditing={isEditing} onChange={handleInputChange}
              />
            </div>
          </div>

        </div>

        {/* Location Details Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center">
            <MapPin size={18} className="text-[#1E3A8A] mr-2" />
            Location details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <ProfileField
              icon={MapPin} label="City" field="city"
              value={profile.city} editValue={editForm?.city}
              isEditing={isEditing} onChange={handleInputChange} required
            />
            <ProfileField
              icon={MapPin} label="State" field="state"
              value={profile.state} editValue={editForm?.state}
              isEditing={isEditing} onChange={handleInputChange} required
            />
            <ProfileField
              icon={MapPin} label="Country" field="country"
              value={profile.country} editValue={editForm?.country}
              isEditing={isEditing} onChange={handleInputChange} required
            />
            <ProfileField
              icon={MapPin} label="Pincode" field="pincode"
              value={profile.pincode} editValue={editForm?.pincode}
              isEditing={isEditing} onChange={handleInputChange} required
            />
          </div>
        </div>

        {/* Form Actions */}
        {isEditing && (
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setEditForm(profile);
              }}
              disabled={saving}
              className="flex items-center px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors disabled:opacity-50"
            >
              <X size={16} className="mr-2" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center px-6 py-2.5 bg-[#1E3A8A] hover:bg-[#152a63] text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check size={16} className="mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        )}
      </form>
      )}
    </div>
  );
}

interface ProfileFieldProps {
  icon: any;
  label: string;
  field: keyof ProfileData;
  value: string;
  editValue?: string;
  isEditing: boolean;
  onChange: (field: keyof ProfileData, value: string) => void;
  type?: string;
  required?: boolean;
}

function ProfileField({ icon: Icon, label, field, value, editValue, isEditing, onChange, type = 'text', required = false }: ProfileFieldProps) {
  return (
    <div className="flex items-start space-x-3 w-full">
      <Icon size={16} className="text-slate-400 mt-2.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</div>
        {isEditing ? (
          <input
            type={type}
            required={required}
            value={editValue || ''}
            onChange={(e) => onChange(field, e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1E3A8A] font-semibold text-sm text-slate-800"
          />
        ) : (
          <div className="text-sm font-semibold text-slate-800 break-words mt-0.5">{value}</div>
        )}
      </div>
    </div>
  );
}

function ProfileFieldReadOnly({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="flex items-start space-x-3 w-full">
      <Icon size={16} className="text-slate-400 mt-2.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</div>
        <div className="text-sm font-semibold text-slate-800 break-words mt-0.5">{value}</div>
      </div>
    </div>
  );
}

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Globe, Users, MapPin, FileText, CreditCard, User, Paperclip, ChevronRight, ShieldCheck, ArrowRight } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  location: string;
  locationBlock?: string;
  status: string;
}

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
  companySize?: string;
  companyWebsite?: string;
  gstNumber?: string;
  userType?: string;
  memberId?: string;
}

interface AdminDashboardProps {
  profile: ProfileData;
  pinnedProjects: Project[];
  isFullyRegistered: boolean;
}

export default function AdminDashboard({ profile, pinnedProjects, isFullyRegistered }: AdminDashboardProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Welcome & Main Info */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 mb-1">Welcome back, {profile.adminName}!</h2>
            <p className="text-sm text-slate-500 font-semibold">Managing operations for {profile.companyName}.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
            <DashboardItem icon={Building2} label="Company Name" value={profile.companyName} />
            <DashboardItem icon={Globe} label="Industry Type" value={profile.industryType} />
            <DashboardItem icon={Users} label="Company Size" value={profile.companySize || 'Not Provided'} />
            <DashboardItem icon={Globe} label="Website" value={profile.companyWebsite || 'Not Provided'} isLink />
          </div>
        </div>

        {/* Quick Details Column */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Location</span>
            <div className="flex items-start space-x-3">
              <MapPin size={20} className="text-[#1E3A8A] mt-0.5 shrink-0" />
              <div>
                <h4 className="text-base font-black text-slate-800">{profile.city}, {profile.state}</h4>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">{profile.country} - {profile.pincode}</p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-start space-x-3">
            <FileText size={20} className="text-[#1E3A8A] mt-0.5 shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">GST Number</span>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">{profile.gstNumber || 'Not Provided'}</p>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-start space-x-3">
            <CreditCard size={20} className="text-[#1E3A8A] mt-0.5 shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Plan</span>
              <p className="text-sm font-black text-[#1E3A8A] mt-0.5">14-Day Free Trial</p>
            </div>
          </div>
        </div>
      </div>

      {/* ADMIN OVERVIEW */}
      <div className="bg-[#F8FAFF] rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-base font-black text-[#1E3A8A] mb-4 flex items-center">
          <User size={18} className="mr-2" />
          Primary Administrator Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Name</span>
            <p className="text-sm font-bold text-slate-800 mt-1">{profile.adminName}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Designation</span>
            <p className="text-sm font-bold text-slate-800 mt-1">{profile.designation}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Contact Email</span>
            <p className="text-sm font-bold text-slate-800 mt-1">{profile.email}</p>
          </div>
        </div>
      </div>

      {/* PINNED PROJECTS SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-black text-slate-900 flex items-center">
            <Paperclip size={18} className="mr-2 text-[#D97706]" />
            Pinned Projects
          </h3>
          <button onClick={() => navigate('/tenant/projects')} className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center">
            View All Projects
            <ChevronRight size={14} className="ml-0.5" />
          </button>
        </div>
        
        {pinnedProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pinnedProjects.map(project => (
              <div 
                key={project.id} 
                className="bg-slate-50 rounded-xl p-4 border border-slate-100 hover:border-blue-100 transition-colors cursor-pointer" 
                onClick={() => navigate('/tenant/projects')}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-black tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded-md">{project.id}</span>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                    project.status === 'Active' ? 'bg-emerald-50 text-emerald-600' :
                    project.status === 'Completed' ? 'bg-blue-50 text-blue-600' :
                    project.status === 'Planning' ? 'bg-amber-50 text-amber-600' :
                    'bg-red-50 text-red-600'
                  }`}>
                    {project.status}
                  </span>
                </div>
                <h4 className="text-sm font-black text-slate-800 truncate mb-1">{project.name}</h4>
                <p className="text-xs text-slate-500 font-semibold truncate flex items-center">
                  <MapPin size={12} className="mr-1" />
                  {project.location} {project.locationBlock ? `(${project.locationBlock})` : ''}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 rounded-xl border border-dashed border-slate-200 p-8 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 mb-3">
              <Paperclip size={20} className="text-slate-400" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 mb-1">No projects pinned to dashboard</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              Keep your most important or active projects here for quick access. Go to the Projects tab and click the 3-dots menu to pin one!
            </p>
            <button 
              onClick={() => navigate('/tenant/projects')}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors"
            >
              Go to Projects
            </button>
          </div>
        )}
      </div>

      {/* TRIAL BANNER */}
      {isFullyRegistered && (
        <div className="bg-gradient-to-r from-[#001538] to-[#000A1C] rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between mt-4">
          <div className="flex items-center mb-4 sm:mb-0">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mr-4 shrink-0">
              <ShieldCheck size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white mb-0.5">14-Day Free Trial</h3>
              <p className="text-sm text-slate-300">7 Days Remaining</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:items-end w-full sm:w-auto">
            <button className="bg-white text-[#001538] font-black text-sm px-5 py-2.5 rounded-xl hover:bg-slate-100 transition-colors flex items-center justify-center group w-full sm:w-auto">
              Upgrade Plan
              <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardItem({ icon: Icon, label, value, isLink }: any) {
  return (
    <div className="flex items-start space-x-3">
      <Icon size={18} className="text-slate-400 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{label}</span>
        {isLink && value !== 'Not Provided' ? (
          <a href={value.startsWith('http') ? value : `https://${value}`} target="_blank" rel="noreferrer" className="text-sm font-semibold text-blue-600 hover:underline block truncate mt-0.5">
            {value}
          </a>
        ) : (
          <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">{value}</p>
        )}
      </div>
    </div>
  );
}

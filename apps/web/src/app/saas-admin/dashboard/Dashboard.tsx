import React from 'react';
export default function SuperAdminDashboard() {
  const stats = [
    { 
      name: "Total Tenants", 
      value: "142", 
      trend: "+12%", 
      up: true, 
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    },
    { 
      name: "Active Users", 
      value: "3,284", 
      trend: "+8%", 
      up: true, 
      color: "text-blue-600",
      bg: "bg-blue-50",
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    },
    { 
      name: "Monthly Revenue", 
      value: "42.5", 
      trend: "+15%", 
      up: true, 
      color: "text-green-600",
      bg: "bg-green-50",
      prefix: "₹", 
      suffix: "k",
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    },
    { 
      name: "Support Tickets", 
      value: "18", 
      trend: "-2%", 
      up: false, 
      color: "text-rose-600",
      bg: "bg-rose-50",
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
    },
  ];

  return (
    <div className="min-h-screen bg-white relative pb-12 overflow-x-hidden">
      
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 pt-8">
        
        {/* Breadcrumb / Top Bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-[13px] font-medium">
            <span className="text-gray-400">Home / </span>
            <span className="text-green-600">Dashboard</span>
          </div>
          <div className="relative">
            <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
              <span className="text-[8px] text-white font-bold">1</span>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">System Dashboard</h1>
            <p className="text-[15px] text-slate-500 mt-1">Real-time overview of your operations and tenant health.</p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <div className="flex items-center space-x-2 bg-green-50 px-4 py-2 rounded-lg border border-green-100">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs font-bold text-green-700 uppercase tracking-wide">Systems Operational</span>
            </div>
            <button className="flex items-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export Data
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {stats.map((stat) => (
            <div key={stat.name} className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-slate-100 relative group overflow-hidden">
              
              {/* Subtle hover accent line at the bottom */}
              <div className={`absolute bottom-0 left-0 w-full h-1 opacity-0 group-hover:opacity-100 transition-opacity ${stat.bg.replace('50', '500')}`}></div>

              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <svg className={`w-6 h-6 ${stat.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {stat.icon}
                  </svg>
                </div>
                <div className={`flex items-center px-2 py-1 rounded-md text-xs font-bold ${stat.up ? 'bg-green-50 text-green-700' : 'bg-rose-50 text-rose-700'}`}>
                  {stat.up ? '↑' : '↓'} {stat.trend}
                </div>
              </div>
              
              <div>
                <h3 className="text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-1">{stat.name}</h3>
                <div className="flex items-baseline">
                  {stat.prefix && <span className="text-2xl font-bold text-slate-400 mr-1">{stat.prefix}</span>}
                  <span className="text-4xl font-extrabold text-slate-900 tracking-tight">{stat.value}</span>
                  {stat.suffix && <span className="text-xl font-bold text-slate-500 ml-1">{stat.suffix}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Chart Area */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Revenue Analytics</h2>
                <p className="text-[13px] text-slate-500 mt-1">Tenant subscription vs usage revenue over time.</p>
              </div>
              <select className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2 outline-none font-medium">
                <option>Last 30 Days</option>
                <option>This Quarter</option>
                <option>This Year</option>
              </select>
            </div>
            
            {/* Mock Chart UI */}
            <div className="h-[300px] w-full relative flex items-end justify-between px-2 pb-6 pt-10 border-b border-slate-100">
              {/* Horizontal Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-full border-t border-slate-100 border-dashed"></div>
                ))}
              </div>
              
              {/* Bars */}
              {[40, 65, 45, 80, 55, 90, 75, 100].map((height, i) => (
                <div key={i} className="w-[8%] flex flex-col justify-end items-center h-full relative z-10 group">
                  <div className="w-full rounded-t-sm bg-indigo-100 flex flex-col justify-end overflow-hidden" style={{ height: `${height}%` }}>
                    <div className="w-full bg-[#10b981] rounded-t-sm transition-all duration-300 group-hover:bg-[#059669]" style={{ height: `${height * 0.6}%` }}></div>
                  </div>
                  <span className="absolute -bottom-6 text-[10px] font-semibold text-slate-400">W{i + 1}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center mt-8 space-x-6">
              <div className="flex items-center text-[12px] font-semibold text-slate-600">
                <span className="w-3 h-3 rounded-full bg-indigo-100 mr-2"></span> Subscription Fees
              </div>
              <div className="flex items-center text-[12px] font-semibold text-slate-600">
                <span className="w-3 h-3 rounded-full bg-[#10b981] mr-2"></span> Usage Billing
              </div>
            </div>
          </div>
          
          {/* Quick Links & Activity */}
          <div className="space-y-6">
            <div className="bg-[#0f211c] rounded-2xl shadow-xl border border-transparent p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#10b981] rounded-full mix-blend-overlay filter blur-[60px] opacity-20 pointer-events-none"></div>
              
              <h2 className="text-lg font-bold text-white mb-6 relative z-10">Quick Actions</h2>
              <div className="space-y-3 relative z-10">
                
                <button className="w-full flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors group">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-lg bg-[#10b981]/20 flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-[#34d399]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <span className="text-[13px] font-semibold text-white">Onboard New Tenant</span>
                  </div>
                </button>

                <button className="w-full flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors group">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <span className="text-[13px] font-semibold text-white">Review Reports</span>
                  </div>
                </button>

              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-6">Recent Activity</h2>
              <div className="space-y-5">
                {[
                  { text: "Tenant A upgraded to Professional", time: "10 mins ago", color: "bg-green-50 text-green-600" },
                  { text: "New Vendor FMS registration", time: "2 hours ago", color: "bg-blue-50 text-blue-600" },
                  { text: "System backup completed", time: "5 hours ago", color: "bg-indigo-50 text-indigo-600" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start">
                    <div className={`w-8 h-8 rounded-full ${item.color} flex items-center justify-center shrink-0 mr-3`}>
                      <span className="text-[10px] font-bold">●</span>
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-slate-700">{item.text}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

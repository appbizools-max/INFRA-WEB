import React, { useState, useEffect } from 'react';
import { Settings, Eye, EyeOff, CheckSquare, Square, Plus, Trash2, Save, Layers, AlertCircle, RefreshCw, Edit2 } from 'lucide-react';

interface ConfigField {
  id?: number;
  formType: 'registration' | 'project' | 'worksite';
  fieldKey: string;
  fieldLabel: string;
  fieldType: 'text' | 'dropdown';
  isDefault: boolean;
  isHidden: boolean;
  isRequired: boolean;
  dropdownOptions: string | null;
}

export default function ConfigPage() {
  const [activeTab, setActiveTab] = useState<'registration' | 'project' | 'worksite'>('project');
  const [fields, setFields] = useState<ConfigField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Custom Field Form
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState<'text' | 'dropdown'>('text');
  const [newRequired, setNewRequired] = useState(false);
  const [newOptions, setNewOptions] = useState('');

  // Rename Modal State
  const [renameFieldTarget, setRenameFieldTarget] = useState<{ key: string, label: string } | null>(null);
  const [renameInputValue, setRenameInputValue] = useState('');

  const fetchConfig = async (formType: typeof activeTab) => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const host = baseUrl.startsWith('http://localhost:3001') ? 'http://localhost:5000' : baseUrl;
      const res = await fetch(`${host}/api/admin/form-config/${formType}`);
      if (res.ok) {
        const data = await res.json();
        setFields(data);
      } else {
        throw new Error('Failed to load fields configuration.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error loading configurations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig(activeTab);
  }, [activeTab]);

  const handleToggleHide = (fieldKey: string) => {
    setFields(prev => prev.map(f => {
      if (f.fieldKey === fieldKey) {
        return { ...f, isHidden: !f.isHidden };
      }
      return f;
    }));
  };

  const handleToggleRequired = (fieldKey: string) => {
    setFields(prev => prev.map(f => {
      if (f.fieldKey === fieldKey) {
        return { ...f, isRequired: !f.isRequired };
      }
      return f;
    }));
  };

  const handleAddCustomField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;

    // Generate unique key based on label
    const key = 'custom_' + newLabel.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');

    // Check duplicates
    if (fields.some(f => f.fieldKey === key)) {
      alert('A field with this name already exists!');
      return;
    }

    const newField: ConfigField = {
      formType: activeTab,
      fieldKey: key,
      fieldLabel: newLabel.trim(),
      fieldType: newType,
      isDefault: false,
      isHidden: false,
      isRequired: newRequired,
      dropdownOptions: newType === 'dropdown' ? newOptions.trim() : null
    };

    setFields(prev => [...prev, newField]);
    setNewLabel('');
    setNewType('text');
    setNewRequired(false);
    setNewOptions('');
    setSuccessMsg(`Field added to list. Remember to click "Save Configuration" to apply!`);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const handleDeleteCustomField = (fieldKey: string) => {
    setFields(prev => prev.filter(f => f.fieldKey !== fieldKey));
  };

  const handleRenameField = (fieldKey: string, currentLabel: string) => {
    setRenameFieldTarget({ key: fieldKey, label: currentLabel });
    setRenameInputValue(currentLabel);
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const host = baseUrl.startsWith('http://localhost:3001') ? 'http://localhost:5000' : baseUrl;
      const res = await fetch(`${host}/api/admin/form-config/${activeTab}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
      });
      if (res.ok) {
        setSuccessMsg('Configurations saved successfully!');
        fetchConfig(activeTab);
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save configuration');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error saving configurations');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold font-sans text-slate-900 flex items-center space-x-2">
          <Settings size={28} className="text-[#46B351]" />
          <span>SaaS Admin Forms Configurator</span>
        </h2>
        <p className="text-slate-500 mt-1 font-sans">
          Control form settings dynamically. Add custom columns, hide default fields, or change field requirements.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('project')}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-all ${activeTab === 'project'
              ? 'border-[#46B351] text-[#46B351]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
        >
          Project Form Config
        </button>
        <button
          onClick={() => setActiveTab('worksite')}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-all ${activeTab === 'worksite'
              ? 'border-[#46B351] text-[#46B351]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
        >
          Work Site Form Config
        </button>
        <button
          onClick={() => setActiveTab('registration')}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-all ${activeTab === 'registration'
              ? 'border-[#46B351] text-[#46B351]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
        >
          Onboarding Registration Form
        </button>
      </div>

      {errorMsg && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 flex items-center space-x-2 text-sm font-semibold">
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-200 flex items-center space-x-2 text-sm font-semibold">
          <CheckSquare size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm flex flex-col items-center justify-center space-y-3">
          <RefreshCw size={24} className="text-[#46B351] animate-spin" />
          <span className="text-slate-400 font-bold uppercase tracking-wider text-xs">Loading form settings...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Section: Add Custom Field Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="flex-1 space-y-4">
                <h3 className="text-lg font-black text-slate-900 flex items-center space-x-2">
                  <Plus size={20} className="text-[#46B351]" />
                  <span>Add Custom Field</span>
                </h3>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider leading-snug">
                  Configure a new dynamic entry column for the {activeTab === 'project' ? 'Project' : activeTab === 'worksite' ? 'Work Site' : 'Registration'} Form.
                </p>
                <form onSubmit={handleAddCustomField} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start pt-2">
                  <div className="md:col-span-1">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1.5">Field Label *</label>
                    <input
                      type="text"
                      required
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      placeholder="e.g. Safety Level"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-[#46B351] text-sm font-semibold"
                    />
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1.5">Field Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setNewType('text')}
                        className={`py-2 px-2 rounded-xl border text-[10px] font-black transition-all ${newType === 'text'
                            ? 'bg-emerald-50 border-[#46B351] text-[#46B351]'
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                          }`}
                      >
                        TEXT
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewType('dropdown')}
                        className={`py-2 px-2 rounded-xl border text-[10px] font-black transition-all ${newType === 'dropdown'
                            ? 'bg-emerald-50 border-[#46B351] text-[#46B351]'
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                          }`}
                      >
                        DROPDOWN
                      </button>
                    </div>
                  </div>

                  <div className="md:col-span-1 flex flex-col justify-center h-full pt-6">
                    <button
                      type="button"
                      onClick={() => setNewRequired(!newRequired)}
                      className="flex items-center space-x-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                    >
                      {newRequired ? <CheckSquare size={16} className="text-[#46B351]" /> : <Square size={16} />}
                      <span>Mandatory</span>
                    </button>
                  </div>

                  <div className="md:col-span-1 flex justify-end pt-5">
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-all active:scale-95 flex items-center justify-center space-x-2 shadow-sm"
                    >
                      <Plus size={16} />
                      <span>Add Field</span>
                    </button>
                  </div>

                  {newType === 'dropdown' && (
                    <div className="md:col-span-4 mt-2">
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1.5">Dropdown Options * (Comma separated)</label>
                      <input
                        type="text"
                        required
                        value={newOptions}
                        onChange={(e) => setNewOptions(e.target.value)}
                        placeholder="e.g. Low, Medium, High"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-[#46B351] text-sm font-semibold"
                      />
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>

          {/* Full Width Table for Form Fields */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">Current Form Fields</h3>
              <button
                onClick={handleSaveConfig}
                disabled={saving}
                className="flex items-center space-x-2 px-6 py-2.5 bg-[#46B351] hover:bg-[#399a43] text-white font-bold rounded-xl text-sm transition-all shadow-sm hover:shadow-md active:scale-95 disabled:opacity-50"
              >
                {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4 w-12 text-center">S.No</th>
                    <th className="py-3 px-4">Field Name</th>
                    <th className="py-3 px-4">Field Key</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Options</th>
                    <th className="py-3 px-4 text-center">Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {fields.map((field, idx) => (
                    <tr key={field.fieldKey} className={`hover:bg-slate-50/50 transition-colors ${field.isHidden ? 'opacity-60 bg-white' : 'bg-white'}`}>
                      <td className="py-3 px-4 text-center text-slate-400 font-bold">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900">{field.fieldLabel}</span>
                          <button
                            onClick={() => handleRenameField(field.fieldKey, field.fieldLabel)}
                            className="text-slate-400 hover:text-blue-500 transition-colors p-1 rounded hover:bg-slate-100"
                            title="Rename Field"
                          >
                            <Edit2 size={12} />
                          </button>
                          {field.isDefault ? (
                            <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-black uppercase border border-slate-200">System</span>
                          ) : (
                            <span className="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-black uppercase border border-indigo-200">Custom</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[10px]">
                        {field.fieldKey}
                      </td>
                      <td className="py-3 px-4 uppercase text-[10px] tracking-wider text-slate-500 font-bold">
                        {field.fieldType}
                      </td>
                      <td className="py-3 px-4">
                        {field.fieldType === 'dropdown' && field.dropdownOptions ? (
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-1 rounded-md border border-slate-200">{field.dropdownOptions}</span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center space-x-3">
                          <button
                            onClick={() => handleToggleHide(field.fieldKey)}
                            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${field.isHidden
                                ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                                : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                              }`}
                            title={field.isHidden ? 'Hidden' : 'Visible'}
                          >
                            {field.isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                            <span>{field.isHidden ? 'Hidden' : 'Visible'}</span>
                          </button>

                          <button
                            onClick={() => handleToggleRequired(field.fieldKey)}
                            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${field.isRequired
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-50 text-slate-500 border-slate-200'
                              }`}
                          >
                            {field.isRequired ? <CheckSquare size={14} className="text-amber-600" /> : <Square size={14} />}
                            <span>{field.isRequired ? 'Mandatory' : 'Optional'}</span>
                          </button>

                          {!field.isDefault ? (
                            <button
                              onClick={() => handleDeleteCustomField(field.fieldKey)}
                              className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors ml-2"
                              title="Delete Custom Field"
                            >
                              <Trash2 size={16} />
                            </button>
                          ) : (
                            <div className="w-8 ml-2"></div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Custom Rename Modal */}
      {renameFieldTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl border border-slate-200 shadow-2xl overflow-hidden p-6 animate-fadeIn">
            <h3 className="text-lg font-black text-slate-900 mb-2">Rename Field</h3>
            <p className="text-xs font-semibold text-slate-500 mb-4">Enter a new name for this form field.</p>
            <input
              type="text"
              value={renameInputValue}
              onChange={(e) => setRenameInputValue(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#46B351] text-sm font-semibold mb-6"
              autoFocus
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setRenameFieldTarget(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const newLabel = renameInputValue.trim();
                  if (newLabel && newLabel !== renameFieldTarget.label) {
                    setFields(prev => prev.map(f => {
                      if (f.fieldKey === renameFieldTarget.key) {
                        return { ...f, fieldLabel: newLabel };
                      }
                      return f;
                    }));
                    setSuccessMsg(`Field renamed. Remember to click "Save Configuration" to apply!`);
                    setTimeout(() => setSuccessMsg(''), 5000);
                  }
                  setRenameFieldTarget(null);
                }}
                className="px-5 py-2 bg-[#46B351] hover:bg-[#399a43] text-white font-bold rounded-xl text-sm transition-colors shadow-sm"
              >
                Save Name
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

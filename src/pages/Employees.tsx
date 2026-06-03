import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import api from '../services/api.js';
import { User } from '../types.js';
import { 
  Users, 
  Trash2, 
  UserPlus, 
  Plus, 
  Slash, 
  Search, 
  Filter, 
  AlertTriangle, 
  ArrowRight, 
  CheckCircle,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  Building
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Employees: React.FC = () => {
  const { user } = useAuth();
  
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, deptFilter, statusFilter]);

  // Register New Worker modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'Admin' | 'Manager' | 'Employee'>('Employee');
  const [newDept, setNewDept] = useState('Engineering');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/users');
      if (response.data?.success) {
        setEmployees(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to retreive employee rosters');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleRegisterEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail || !newPassword || !newRole || !newDept) {
      setRegError('Please fill in all registration fields');
      return;
    }

    setRegLoading(true);
    setRegError(null);
    setRegSuccess(null);

    try {
      const response = await api.post('/auth/register', {
        name: newName,
        email: newEmail,
        password: newPassword,
        role: newRole,
        department: newDept,
      });

      if (response.data?.success) {
        setRegSuccess('Co-worker account registered and seeded successfully!');
        setNewName('');
        setNewEmail('');
        setNewPassword('');
        setNewRole('Employee');
        setNewDept('Engineering');
        fetchEmployees();
        // Keep modal open briefly to show success or auto-close
        setTimeout(() => {
          setModalOpen(false);
          setRegSuccess(null);
        }, 1500);
      }
    } catch (err: any) {
      setRegError(err.response?.data?.message || 'Failed to complete registration');
    } finally {
      setRegLoading(false);
    }
  };

  const handleToggleState = async (id: string, currentStatus: boolean) => {
    setActionError(null);
    try {
      const response = await api.put(`/users/${id}`, { isActive: !currentStatus });
      if (response.data?.success) {
        fetchEmployees();
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'State modification denied');
    }
  };

  const handleDeleteEmployee = async (id: string, name: string) => {
    setActionError(null);
    const doubleConfirm = window.confirm(`CRITICAL WARNING: Are you absolutely certain you wish to delete the employee "${name}"?\nThis deletes their profile, leaf balances, leave applications, and attendance histories permanently.`);
    if (!doubleConfirm) return;

    try {
      const response = await api.delete(`/users/${id}`);
      if (response.data?.success) {
        fetchEmployees();
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Access Denied during delete operation');
    }
  };

  // Run searches locally
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch = 
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      emp.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDept = deptFilter === '' || emp.department === deptFilter;
    
    const matchesStatus = 
      statusFilter === '' || 
      (statusFilter === 'active' && emp.isActive) || 
      (statusFilter === 'inactive' && !emp.isActive);

    return matchesSearch && matchesDept && matchesStatus;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-[#F3E9D2] text-[#8B713A] border-[#A3AD9A]/20';
      case 'Manager':
        return 'bg-[#E2E8D5] text-olive border-[#A3AD9A]/30';
      default:
        return 'bg-[#FAF9F6] text-[#5A5A40] border-[#A3AD9A]/15';
    }
  };

  return (
    <div id="employees_page" className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-light font-serif text-ink italic tracking-tight">Staffing Directory</h1>
          <p className="text-xs text-sage uppercase tracking-widest mt-1.5 font-sans">Audit profile records, enroll fresh employees, and set access hierarchies.</p>
        </div>
        
        {user?.role === 'Admin' && (
          <button
            id="btn_open_register_modal"
            onClick={() => setModalOpen(true)}
            className="px-5 py-2.5 bg-olive hover:opacity-95 active:scale-95 text-white font-semibold text-xs rounded-full flex items-center space-x-1.5 shadow transition-all border-none cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            <span>Enroll Employee</span>
          </button>
        )}
      </div>

      {actionError && (
        <div className="p-3 bg-rose-55 border border-rose-150 rounded-2xl text-rose-750 text-xs flex items-start space-x-2 leading-relaxed">
          <AlertTriangle className="h-4 w-4 mt-0.5 text-rose-500 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Renders error bar if fetching fails */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-start space-x-2">
          <AlertTriangle className="h-5 w-5 mt-0.5 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Advanced Filter Box */}
      <div className="bg-white border border-slate-100 rounded-[32px] p-4 flex flex-col md:flex-row gap-4 items-center justify-between text-xs shadow-[0_4px_24px_rgba(0,0,0,0.015)]">
        <div className="relative w-full md:w-80 shrink-0">
          <span className="absolute left-3.5 top-2.5 text-sage">
            <Search className="h-4 w-4" />
          </span>
          <input
            id="search_employee_input"
            type="text"
            placeholder="Search by name or email address..."
            className="w-full pl-10 pr-4 py-2 bg-[#FAF9F6] border border-[#A3AD9A]/30 rounded-2xl text-ink outline-none focus:border-olive select-text transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-3 w-full justify-end">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Building className="h-4 w-4 text-sage shrink-0" />
            <select
              className="px-4 py-2 bg-[#FAF9F6] border border-[#A3AD9A]/30 rounded-2xl text-ink outline-none focus:border-olive text-xs font-semibold select-text transition-all"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              <option value="">All Departments</option>
              <option value="Executive Services">Executive Services</option>
              <option value="Engineering">Engineering</option>
              <option value="Product Management">Product Management</option>
              <option value="Marketing">Marketing</option>
              <option value="Human Resources">Human Resources</option>
              <option value="Sales">Sales</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Filter className="h-4 w-4 text-sage shrink-0" />
            <select
              className="px-4 py-2 bg-[#FAF9F6] border border-[#A3AD9A]/30 rounded-2xl text-ink outline-none focus:border-olive text-xs font-semibold select-text transition-all"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="active">Active Staff</option>
              <option value="inactive">Inactive Staff</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main employees list table */}
      <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.015)]">
        {loading ? (
          <div className="text-center py-10 font-mono text-xs text-sage">
            Scanning company staffing grids...
          </div>
        ) : filteredEmployees.length > 0 ? (
          (() => {
            const itemsPerPage = 10;
            const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
            const truncatedCurrentPage = Math.min(currentPage, totalPages || 1);
            const paginatedEmployees = filteredEmployees.slice(
              (truncatedCurrentPage - 1) * itemsPerPage,
              truncatedCurrentPage * itemsPerPage
            );

            return (
              <>
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left border-collapse select-text">
                    <thead>
                      <tr className="bg-[#FAF9F6] border-b border-[#F5F5F0] text-sage font-semibold uppercase tracking-wider text-[10px]">
                        <th className="py-3.5 px-4 font-mono">Employee Details</th>
                        <th className="py-3.5 px-4 font-mono">Role</th>
                        <th className="py-3.5 px-4 font-mono">Department</th>
                        <th className="py-3.5 px-4 font-mono">Enrollment Date</th>
                        <th className="py-3.5 px-4 font-mono">Active</th>
                        {user?.role === 'Admin' && <th className="py-3.5 px-4 font-mono text-right">Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cream text-ink/85">
                      {paginatedEmployees.map((emp) => (
                        <tr key={emp.id} className="hover:bg-cream/10 transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-3">
                              {emp.profilePicture ? (
                                <img 
                                  referrerPolicy="no-referrer"
                                  src={emp.profilePicture} 
                                  alt={emp.name} 
                                  className="h-10 w-10 rounded-full object-cover border border-[#A3AD9A]/30"
                                />
                              ) : (
                                <div className="h-10 w-10 bg-[#FAF9F6] border border-[#A3AD9A]/30 rounded-full flex items-center justify-center font-bold text-sage">
                                  {emp.name.charAt(0)}
                                </div>
                              )}
                              <div>
                                <p className="font-serif text-base font-semibold text-ink leading-none">{emp.name}</p>
                                <p className="text-[10px] text-sage font-mono mt-1 select-all">{emp.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-bold uppercase ${getRoleBadge(emp.role)}`}>
                              {emp.role}
                            </span>
                          </td>
                          <td className="py-4 px-4 font-semibold text-ink/80">
                            {emp.department}
                          </td>
                          <td className="py-4 px-4 font-mono text-sage font-medium">
                            {emp.joinDate}
                          </td>
                          <td className="py-4 px-4">
                            {user?.role === 'Admin' ? (
                              <button
                                id={`btn_toggle_active_${emp.id}`}
                                onClick={() => handleToggleState(emp.id, emp.isActive)}
                                className="focus:outline-none focus:ring-1 focus:ring-olive/30 rounded cursor-pointer transition-colors"
                              >
                                {emp.isActive ? (
                                  <ToggleRight className="h-6 w-6 text-olive" />
                                ) : (
                                  <ToggleLeft className="h-6 w-6 text-sage/70" />
                                )}
                              </button>
                            ) : (
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] leading-none uppercase font-extrabold ${
                                emp.isActive ? 'bg-[#E2E8D5] text-olive border border-[#A3AD9A]/30' : 'bg-cream text-sage/70'
                              }`}>
                                {emp.isActive ? 'Active' : 'Inactive'}
                              </span>
                            )}
                          </td>
                          {user?.role === 'Admin' && (
                            <td className="py-4 px-4 text-right">
                              <button
                                id={`btn_delete_employee_${emp.id}`}
                                onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                                disabled={user.id === emp.id}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg shrink-0 disabled:opacity-40 disabled:hover:bg-rose-50 transition-colors cursor-pointer border-none"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#F5F5F0] select-none text-xs">
                    <button
                      id="btn_employees_prev"
                      disabled={truncatedCurrentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1.5 rounded-xl border border-[#A3AD9A]/20 text-xs text-ink/75 hover:text-olive hover:bg-cream/50 disabled:opacity-30 disabled:hover:text-ink/75 disabled:hover:bg-transparent transition-all cursor-pointer font-medium"
                    >
                      Previous
                    </button>
                    <span className="text-[10px] font-mono text-sage uppercase tracking-wider font-semibold">
                      Page {truncatedCurrentPage} of {totalPages}
                    </span>
                    <button
                      id="btn_employees_next"
                      disabled={truncatedCurrentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="px-3 py-1.5 rounded-xl border border-[#A3AD9A]/20 text-xs text-ink/75 hover:text-olive hover:bg-cream/50 disabled:opacity-30 disabled:hover:text-ink/75 disabled:hover:bg-transparent transition-all cursor-pointer font-medium"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            );
          })()
        ) : (
          <div className="p-8 text-center text-sage font-mono text-xs">
            No employees match your search query filters
          </div>
        )}
      </div>

      {/* Enroll New employee drawer Modal dialog */}
      <AnimatePresence>
        {modalOpen && (
          <div id="register_modal_backdrop" className="fixed inset-0 bg-[#3C3C2D]/35 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              id="register_modal"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-md w-full bg-white rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden"
            >
              <div className="p-6 bg-olive text-white flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="h-5 w-5 text-[#E2E8D5]" />
                  <h3 className="font-serif text-lg leading-none">Enroll New Staff Profile</h3>
                </div>
                <button
                  id="btn_close_register_modal"
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white/85 hover:text-white cursor-pointer text-xs font-semibold"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-4">
                {regError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-start space-x-1.5 leading-normal animate-shake">
                    <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>{regError}</span>
                  </div>
                )}

                {regSuccess && (
                  <div className="p-3 bg-[#E2E8D5] border border-[#A3AD9A]/30 rounded-2xl text-olive text-xs flex items-start space-x-1.5 leading-normal">
                    <CheckCircle className="h-4 w-4 text-olive shrink-0 mt-0.5" />
                    <span>{regSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleRegisterEmployee} className="space-y-4 text-xs font-medium text-ink">
                  <div>
                    <label className="block text-sage font-bold mb-1.5 uppercase tracking-wider text-[10px]">Staff Full Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-[#FAF9F6] border border-[#A3AD9A]/30 rounded-2xl outline-none focus:border-olive text-ink font-sans select-text transition-all"
                      placeholder="John Doe"
                      required
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sage font-bold mb-1.5 uppercase tracking-wider text-[10px]">Staff Email Address</label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 bg-[#FAF9F6] border border-[#A3AD9A]/30 rounded-2xl outline-none focus:border-olive text-ink font-mono select-text transition-all"
                      placeholder="johndoe@ems.com"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sage font-bold mb-1.5 uppercase tracking-wider text-[10px]">Initial Password</label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 bg-[#FAF9F6] border border-[#A3AD9A]/30 rounded-2xl outline-none focus:border-olive text-ink font-mono select-text transition-all"
                      placeholder="••••••••"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sage font-bold mb-1.5 uppercase tracking-wider text-[10px]">Department</label>
                      <select
                        className="w-full px-3 py-2 bg-[#FAF9F6] border border-[#A3AD9A]/30 rounded-2xl outline-none focus:border-olive text-ink font-semibold select-text transition-all"
                        value={newDept}
                        onChange={(e) => setNewDept(e.target.value)}
                      >
                        <option value="Executive Services">Executive Services</option>
                        <option value="Engineering">Engineering</option>
                        <option value="Product Management">Product Management</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Human Resources">Human Resources</option>
                        <option value="Sales">Sales</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sage font-bold mb-1.5 uppercase tracking-wider text-[10px]">System Role</label>
                      <select
                        className="w-full px-3 py-2 bg-[#FAF9F6] border border-[#A3AD9A]/30 rounded-2xl outline-none focus:border-olive text-ink font-semibold select-text transition-all"
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value as any)}
                      >
                        <option value="Employee">Employee Account</option>
                        <option value="Manager">Manager Account</option>
                        <option value="Admin">Admin Account</option>
                      </select>
                    </div>
                  </div>

                  <button
                    id="btn_submit_employee_registration"
                    type="submit"
                    disabled={regLoading}
                    className="w-full py-3 bg-olive hover:opacity-95 text-white font-semibold rounded-full flex items-center justify-center space-x-1 shadow cursor-pointer transition-all border-none"
                  >
                    <span>{regLoading ? 'Registering account...' : 'Complete Registration'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

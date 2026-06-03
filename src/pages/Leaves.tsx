import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import api from '../services/api.js';
import { Leave, LeaveBalance } from '../types.js';
import { 
  FileSpreadsheet, 
  Send, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  Award,
  BookOpen,
  HelpCircle,
  AlertCircle,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Leaves: React.FC = () => {
  const { user } = useAuth();

  // Personal leaves states
  const [personalLeaves, setPersonalLeaves] = useState<Leave[]>([]);
  const [personalBalance, setPersonalBalance] = useState<LeaveBalance | null>(null);
  const [personalLoading, setPersonalLoading] = useState(true);

  // Administrative leave pipeline
  const [globalLeaves, setGlobalLeaves] = useState<any[]>([]);
  const [globalLoading, setGlobalLoading] = useState(false);

  // Form states
  const [leaveType, setLeaveType] = useState<'annual' | 'sick' | 'casual'>('annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Status updating states
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [backlogError, setBacklogError] = useState<string | null>(null);

  // Pagination states
  const [personalPage, setPersonalPage] = useState(1);
  const [globalPage, setGlobalPage] = useState(1);

  const fetchPersonalLeaves = async () => {
    if (!user) return;
    setPersonalLoading(true);
    try {
      const response = await api.get('/leave/my');
      if (response.data?.success) {
        setPersonalLeaves(response.data.data.leaves);
        setPersonalBalance(response.data.data.balance);
      }
    } catch (err) {
      console.error('Failed to load my leave logs', err);
    } finally {
      setPersonalLoading(false);
    }
  };

  const fetchGlobalLeaves = async () => {
    if (user?.role !== 'Admin' && user?.role !== 'Manager') return;
    setGlobalLoading(true);
    try {
      const response = await api.get('/leave/all');
      if (response.data?.success) {
        setGlobalLeaves(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load global leave pipeline', err);
    } finally {
      setGlobalLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonalLeaves();
    if (user?.role === 'Admin' || user?.role === 'Manager') {
      fetchGlobalLeaves();
    }
  }, [user]);

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) {
      setFormError('Please complete all application details');
      return;
    }

    if (startDate > endDate) {
      setFormError('The start date cannot exceed the end date');
      return;
    }

    setFormLoading(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const response = await api.post('/leave/apply', {
        leaveType,
        startDate,
        endDate,
        reason,
      });

      if (response.data?.success) {
        setFormSuccess('Leave application registered successfully!');
        setStartDate('');
        setEndDate('');
        setReason('');
        // Refresh listings
        fetchPersonalLeaves();
        if (user?.role === 'Admin' || user?.role === 'Manager') {
          fetchGlobalLeaves();
        }
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to submit leave file');
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: 'approved' | 'rejected') => {
    setUpdatingId(id);
    setBacklogError(null);
    try {
      const response = await api.put(`/leave/${id}/status`, { status: newStatus });
      if (response.data?.success) {
        // Redraw lists
        fetchPersonalLeaves();
        fetchGlobalLeaves();
      }
    } catch (err: any) {
      setBacklogError(err.response?.data?.message || 'Operation failed during supervisor processing');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-[#E2E8D5] text-olive border-[#A3AD9A]/40';
      case 'rejected':
        return 'bg-rose-55 text-rose-750 border-rose-150';
      default:
        return 'bg-[#F3E9D2] text-[#8B713A] border-[#A3AD9A]/25';
    }
  };

  const getDaysCount = (startStr: string, endStr: string): number => {
    try {
      const start = new Date(startStr);
      const end = new Date(endStr);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    } catch {
      return 1;
    }
  };

  return (
    <div id="leaves_page" className="space-y-6 font-sans">
      <div>
        <h1 className="text-4xl font-light font-serif text-ink italic tracking-tight">Leave Escrow & Management</h1>
        <p className="text-xs text-sage uppercase tracking-widest mt-1.5 font-sans">Review allocations, log leave applications, and process backlogs.</p>
      </div>

      {/* Renders remaining balances if loaded */}
      {personalBalance && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-100 p-6 rounded-[32px] flex items-center space-x-4 shadow-[0_4px_24px_rgba(0,0,0,0.015)]">
            <div className="h-12 w-12 bg-[#E2E8D5] rounded-full flex items-center justify-center text-olive shrink-0">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] text-sage block font-bold uppercase tracking-wider">Annual Leaves</span>
              <span className="text-3xl font-light font-serif text-ink tracking-tight">
                {personalBalance.annual} <span className="text-xs font-normal text-sage font-sans">Days Left</span>
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-100 p-6 rounded-[32px] flex items-center space-x-4 shadow-[0_4px_24px_rgba(0,0,0,0.015)]">
            <div className="h-12 w-12 bg-[#FAF9F6] border border-[#A3AD9A]/30 rounded-full flex items-center justify-center text-olive shrink-0">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] text-sage block font-bold uppercase tracking-wider">Sick Leaves</span>
              <span className="text-3xl font-light font-serif text-ink tracking-tight">
                {personalBalance.sick} <span className="text-xs font-normal text-sage font-sans">Days Left</span>
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-100 p-6 rounded-[32px] flex items-center space-x-4 shadow-[0_4px_24px_rgba(0,0,0,0.015)]">
            <div className="h-12 w-12 bg-[#F3E9D2] rounded-full flex items-center justify-center text-[#8B713A] shrink-0">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] text-sage block font-bold uppercase tracking-wider">Casual Leaves</span>
              <span className="text-3xl font-light font-serif text-ink tracking-tight">
                {personalBalance.casual} <span className="text-xs font-normal text-sage font-sans">Days Left</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Section split: Left Form submission | Right Listing history */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: application scheduler form */}
        <div className="bg-white border border-slate-100 rounded-[32px] p-6 h-fit shadow-[0_4px_24px_rgba(0,0,0,0.015)]">
          <div className="flex items-center space-x-2 border-b border-cream pb-3 mb-4">
            <Send className="h-4 w-4 text-olive" />
            <h3 className="font-serif text-lg font-semibold text-ink">Apply For Absence</h3>
          </div>

          {formError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-[11px] flex items-start space-x-1.5 leading-normal">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="mb-4 p-3 bg-[#E2E8D5]/80 border border-[#A3AD9A]/30 rounded-2xl text-olive text-[11px] flex items-start space-x-1.5 leading-normal">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-olive" />
              <span>{formSuccess}</span>
            </div>
          )}

          <form onSubmit={handleApplyLeave} className="space-y-4 text-xs">
            <div>
              <label className="block text-sage font-bold mb-1.5 uppercase tracking-wider text-[10px]">Leave Category</label>
              <select
                className="w-full px-3 py-2 bg-[#FAF9F6] border border-[#A3AD9A]/30 rounded-2xl text-ink outline-none focus:border-olive select-text transition-all font-medium"
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value as any)}
              >
                <option value="annual">Annual Allotment</option>
                <option value="sick">Sickness Escrow</option>
                <option value="casual">Casual / Personal Days</option>
              </select>
            </div>

            <div>
              <label className="block text-sage font-bold mb-1.5 uppercase tracking-wider text-[10px]">Start Date</label>
              <input
                type="date"
                required
                className="w-full px-3 py-2 bg-[#FAF9F6] border border-[#A3AD9A]/30 rounded-2xl text-ink outline-none focus:border-olive select-text transition-all"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sage font-bold mb-1.5 uppercase tracking-wider text-[10px]">End Date</label>
              <input
                type="date"
                required
                className="w-full px-3 py-2 bg-[#FAF9F6] border border-[#A3AD9A]/30 rounded-2xl text-ink outline-none focus:border-olive select-text transition-all"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sage font-bold mb-1.5 uppercase tracking-wider text-[10px]">Reason for Absence</label>
              <textarea
                required
                rows={3}
                placeholder="Briefly state why you require leave..."
                className="w-full px-3 py-2 bg-[#FAF9F6] border border-[#A3AD9A]/30 rounded-2xl text-ink outline-none focus:border-olive select-text transition-all leading-normal"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <button
              id="btn_submit_leave_application"
              type="submit"
              disabled={formLoading}
              className="w-full py-3 bg-olive hover:opacity-95 active:scale-95 text-white font-semibold rounded-full flex items-center justify-center space-x-1.5 shadow-md cursor-pointer transition-all border-none"
            >
              <Plus className="h-4 w-4" />
              <span>{formLoading ? 'Filing Application...' : 'File Application'}</span>
            </button>
          </form>
        </div>

        {/* Right col: lists of leaves */}
        <div className="lg:col-span-2 space-y-6">
          {/* Supervisor Application backlog pipeline (Admins/Managers only) */}
          {(user?.role === 'Admin' || user?.role === 'Manager') && (
            <div id="leave_approvals_card" className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.015)]">
              <div className="mb-4 flex items-center justify-between border-b border-cream pb-3">
                <div>
                  <h3 className="font-serif text-xl font-semibold text-ink">Workforce Leave Backlog</h3>
                  <p className="text-[10px] text-sage mt-0.5">Review and authorize pending leave requests across all staff.</p>
                </div>
                <UserCheck className="h-5 w-5 text-olive shrink-0" />
              </div>

              {backlogError && (
                <div className="mb-4 p-3 bg-rose-55 border border-rose-150 rounded-2xl text-rose-750 text-[11px] flex items-start space-x-1.5 leading-normal">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
                  <span>{backlogError}</span>
                </div>
              )}

              {globalLoading ? (
                <div className="text-center py-10 font-mono text-xs text-sage">
                   Checking active leave registries...
                </div>
              ) : globalLeaves.length > 0 ? (
                (() => {
                  const itemsPerPage = 4;
                  const totalPages = Math.ceil(globalLeaves.length / itemsPerPage);
                  const currentPage = Math.min(globalPage, totalPages || 1);
                  const paginatedLeaves = globalLeaves.slice(
                    (currentPage - 1) * itemsPerPage,
                    currentPage * itemsPerPage
                  );

                  return (
                    <>
                      <div className="space-y-4 text-xs max-h-[450px] overflow-auto pr-1">
                        {paginatedLeaves.map((lv) => {
                          const duration = getDaysCount(lv.startDate, lv.endDate);
                          const isPending = lv.status === 'pending';

                          return (
                            <div key={lv.id} className="p-5 bg-[#FAF9F6] border border-[#F5F5F0] hover:border-[#A3AD9A]/30 rounded-[24px] relative overflow-hidden flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-all">
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-serif text-base font-semibold text-ink leading-tight">{lv.employeeName}</span>
                                  <span className="text-[9px] bg-[#E2E8D5] text-olive font-mono px-2 py-0.5 rounded-full uppercase font-bold">{lv.department}</span>
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-ink/70 text-[11px] font-sans">
                                  <span className="font-semibold capitalize text-olive bg-[#E2E8D5]/60 px-2 py-0.5 rounded-full border border-[#A3AD9A]/20 text-[10px]">{lv.leaveType}</span>
                                  <span className="font-mono">{lv.startDate} to {lv.endDate} <span className="text-[10px] text-sage">({duration} day{duration > 1 ? 's' : ''})</span></span>
                                </div>
                                <p className="text-ink/80 italic leading-normal mt-2 font-sans select-text">"{lv.reason}"</p>
                              </div>

                              <div className="shrink-0 flex sm:flex-col items-end gap-2 text-right">
                                {isPending ? (
                                  <div className="flex gap-2 w-full sm:w-auto">
                                    <button
                                      id={`btn_reject_leave_${lv.id}`}
                                      disabled={updatingId === lv.id}
                                      onClick={() => handleStatusUpdate(lv.id, 'rejected')}
                                      className="px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-[10px] font-bold rounded-full uppercase flex items-center space-x-1 cursor-pointer transition-colors"
                                    >
                                      <XCircle className="h-3.5 w-3.5" />
                                      <span>Reject</span>
                                    </button>
                                    <button
                                      id={`btn_approve_leave_${lv.id}`}
                                      disabled={updatingId === lv.id}
                                      onClick={() => handleStatusUpdate(lv.id, 'approved')}
                                      className="px-4 py-2 bg-olive hover:opacity-90 active:scale-95 text-white text-[10px] font-bold rounded-full uppercase flex items-center space-x-1 cursor-pointer transition-all shadow"
                                    >
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                      <span>Approve</span>
                                    </button>
                                  </div>
                                ) : (
                                  <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-bold uppercase ${getStatusColor(lv.status)}`}>
                                    {lv.status}
                                  </span>
                                )}
                                {!isPending && (
                                  <span className="text-[9px] text-sage mt-1 block">Reviewed by: {lv.approvedBy || 'System'}</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#F5F5F0] select-none">
                          <button
                            id="btn_global_leaves_prev"
                            disabled={currentPage === 1}
                            onClick={() => setGlobalPage((p) => Math.max(1, p - 1))}
                            className="px-3 py-1.5 rounded-xl border border-[#A3AD9A]/20 text-xs text-ink/75 hover:text-olive hover:bg-cream/50 disabled:opacity-30 disabled:hover:text-ink/75 disabled:hover:bg-transparent transition-all cursor-pointer font-medium"
                          >
                            Previous
                          </button>
                          <span className="text-[10px] font-mono text-sage uppercase tracking-wider">
                            Page {currentPage} of {totalPages}
                          </span>
                          <button
                            id="btn_global_leaves_next"
                            disabled={currentPage === totalPages}
                            onClick={() => setGlobalPage((p) => Math.min(totalPages, p + 1))}
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
                  Zero leaves backlog. Clear roster.
                </div>
              )}
            </div>
          )}

          {/* Personal leave submissions history */}
          <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.015)]">
            <div className="mb-4">
              <h3 className="font-serif text-xl font-semibold text-ink">Your Leave Submission History</h3>
              <p className="text-[10px] text-sage">Review, statuses, and history of your leave logs.</p>
            </div>

            {personalLoading ? (
               <div className="text-center py-10 font-mono text-xs text-sage border-0">
                 Fulfilling leave ledger logs...
               </div>
            ) : personalLeaves.length > 0 ? (
               (() => {
                 const itemsPerPage = 4;
                 const totalPages = Math.ceil(personalLeaves.length / itemsPerPage);
                 const currentPage = Math.min(personalPage, totalPages || 1);
                 const paginatedPersonal = personalLeaves.slice(
                   (currentPage - 1) * itemsPerPage,
                   currentPage * itemsPerPage
                 );

                 return (
                   <>
                     <div className="space-y-4 text-xs max-h-[450px] overflow-auto pr-1">
                       {paginatedPersonal.map((lv) => {
                         const duration = getDaysCount(lv.startDate, lv.endDate);
                         return (
                           <div key={lv.id} className="p-5 border border-slate-100 hover:border-[#A3AD9A]/20 rounded-[24px] flex items-center justify-between gap-4 transition-colors">
                             <div className="space-y-1">
                               <div className="flex items-center space-x-2">
                                 <span className="font-serif text-base font-semibold text-ink capitalize">{lv.leaveType} Leave</span>
                                 <span className="text-[9px] font-mono text-sage">({duration} Day{duration > 1 ? 's' : ''})</span>
                               </div>
                               <p className="text-[10px] text-sage font-mono">Duration: {lv.startDate} to {lv.endDate}</p>
                               <p className="text-ink/80 italic leading-relaxed font-sans select-text">"{lv.reason}"</p>
                             </div>

                             <div className="text-right shrink-0">
                               <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-bold uppercase block w-fit ml-auto ${getStatusColor(lv.status)}`}>
                                 {lv.status}
                               </span>
                               {lv.status !== 'pending' && (
                                 <span className="text-[9px] text-sage mt-1 block font-sans">Reviewed by: {lv.approvedBy || 'System'}</span>
                               )}
                             </div>
                           </div>
                         );
                       })}
                     </div>

                     {totalPages > 1 && (
                       <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#F5F5F0] select-none">
                         <button
                           id="btn_personal_leaves_prev"
                           disabled={currentPage === 1}
                           onClick={() => setPersonalPage((p) => Math.max(1, p - 1))}
                           className="px-3 py-1.5 rounded-xl border border-[#A3AD9A]/20 text-xs text-ink/75 hover:text-olive hover:bg-cream/50 disabled:opacity-30 disabled:hover:text-ink/75 disabled:hover:bg-transparent transition-all cursor-pointer font-medium"
                         >
                           Previous
                         </button>
                         <span className="text-[10px] font-mono text-sage uppercase tracking-wider">
                           Page {currentPage} of {totalPages}
                         </span>
                         <button
                           id="btn_personal_leaves_next"
                           disabled={currentPage === totalPages}
                           onClick={() => setPersonalPage((p) => Math.min(totalPages, p + 1))}
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
              <div className="p-8 text-center text-sage font-mono text-xs border-0">
                You have not filed any leave applications yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

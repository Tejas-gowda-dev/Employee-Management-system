import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import api from '../services/api.js';
import { Attendance as AttendanceType } from '../types.js';
import { 
  Calendar, 
  Clock, 
  Clock3, 
  MapPin, 
  User, 
  Sliders, 
  Download, 
  CheckCircle, 
  XCircle,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';
import { motion } from 'motion/react';

export const Attendance: React.FC = () => {
  const { user } = useAuth();
  
  // Real-time local clock
  const [time, setTime] = useState(new Date());

  // Personal state
  const [personalLogs, setPersonalLogs] = useState<AttendanceType[]>([]);
  const [personalLoading, setPersonalLoading] = useState(true);

  // Admin/Manager state
  const [globalLogs, setGlobalLogs] = useState<any[]>([]);
  const [globalLoading, setGlobalLoading] = useState(false);

  // Common filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [department, setDepartment] = useState('');

  // Pagination states
  const [personalPage, setPersonalPage] = useState(1);
  const [globalPage, setGlobalPage] = useState(1);

  useEffect(() => {
    setPersonalPage(1);
    setGlobalPage(1);
  }, [startDate, endDate, department]);

  // Clock state today
  const [todayRecord, setTodayRecord] = useState<AttendanceType | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // Tick the clock every second
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchPersonalLogs = async () => {
    if (!user) return;
    setPersonalLoading(true);
    try {
      const qParams = new URLSearchParams();
      if (startDate) qParams.append('startDate', startDate);
      if (endDate) qParams.append('endDate', endDate);

      const response = await api.get(`/attendance/my?${qParams.toString()}`);
      if (response.data?.success) {
        const data = response.data.data as AttendanceType[];
        setPersonalLogs(data);

        // Spot clock-in for today
        const todayStr = new Date().toISOString().split('T')[0];
        const recordToday = data.find((r) => r.date === todayStr);
        setTodayRecord(recordToday || null);
      }
    } catch (err) {
      console.error('Failed to retrieve personal attendance', err);
    } finally {
      setPersonalLoading(false);
    }
  };

  const fetchGlobalLogs = async () => {
    if (user?.role !== 'Admin' && user?.role !== 'Manager') return;
    setGlobalLoading(true);
    try {
      const qParams = new URLSearchParams();
      if (startDate) qParams.append('startDate', startDate);
      if (endDate) qParams.append('endDate', endDate);
      if (department) qParams.append('department', department);

      const response = await api.get(`/attendance/all?${qParams.toString()}`);
      if (response.data?.success) {
        setGlobalLogs(response.data.data);
      }
    } catch (err) {
      console.error('Failed to retrieve global attendance roster', err);
    } finally {
      setGlobalLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonalLogs();
    if (user?.role === 'Admin' || user?.role === 'Manager') {
      fetchGlobalLogs();
    }
  }, [user, startDate, endDate, department]);

  const handleClockIn = async () => {
    setActionLoading(true);
    setMessage(null);
    try {
      const response = await api.post('/attendance/clock-in');
      if (response.data?.success) {
        setMessage({ type: 'success', text: 'Clock-in recorded successfully for today.' });
        fetchPersonalLogs();
        if (user?.role === 'Admin' || user?.role === 'Manager') {
          fetchGlobalLogs();
        }
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Clock-in failed' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    setActionLoading(true);
    setMessage(null);
    try {
      const response = await api.post('/attendance/clock-out');
      if (response.data?.success) {
        setMessage({ type: 'success', text: 'Clock-out processed. Attendance saved.' });
        fetchPersonalLogs();
        if (user?.role === 'Admin' || user?.role === 'Manager') {
          fetchGlobalLogs();
        }
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Clock-out failed' });
    } finally {
      setActionLoading(false);
    }
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setDepartment('');
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-[#E2E8D5] text-olive border-[#A3AD9A]/40';
      case 'half-day':
        return 'bg-[#F3E9D2] text-[#8B713A] border-[#A3AD9A]/25';
      case 'on-leave':
        return 'bg-[#FAF9F6] text-[#5A5A40] border-[#A3AD9A]/15';
      default:
        return 'bg-rose-50 text-rose-700 border-rose-100';
    }
  };

  return (
    <div id="attendance_page" className="space-y-6 font-sans">
      <div>
        <h1 className="text-4xl font-light font-serif text-ink italic tracking-tight">Time & Attendance System</h1>
        <p className="text-xs text-sage uppercase tracking-widest mt-1.5 font-sans">Punch your professional shifts, check daily clockings, and monitor team activities.</p>
      </div>

      {/* Grid: Left Punch widget | Right Date filter control */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time punching clock widget */}
        <div className="bg-white border border-slate-100 rounded-[32px] p-6 flex flex-col justify-between min-h-[290px] shadow-[0_4px_24px_rgba(0,0,0,0.015)]">
          <div>
            <div className="flex items-center justify-between border-b border-cream pb-3">
              <span className="text-[10px] font-bold text-sage uppercase tracking-wider block">Time Clocking Terminal</span>
              <span className="flex items-center space-x-1.5 text-[9px] text-olive bg-[#E2E8D5] border border-[#A3AD9A]/30 px-2.5 py-0.5 rounded-full font-mono font-bold uppercase select-none">
                <MapPin className="h-3 w-3 inline text-olive" /> Offline Shield
              </span>
            </div>

            <div className="py-8 text-center">
              <h2 className="text-4xl font-light font-serif text-ink tracking-wide leading-none">
                {time.toLocaleTimeString('en-US', { hour12: false })}
              </h2>
              <span className="text-[11px] font-mono text-sage uppercase tracking-wider block mt-3">
                {time.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </div>

          {message && (
            <div className={`p-3 rounded-2xl text-[11px] leading-relaxed mb-4 flex items-start space-x-2 border ${
              message.type === 'success' ? 'bg-[#E2E8D5]/80 text-olive border-[#A3AD9A]/30' : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              {message.type === 'success' ? <CheckCircle className="h-4.5 w-4.5 text-olive mt-0.5 shrink-0" /> : <XCircle className="h-4.5 w-4.5 text-rose-600 mt-0.5 shrink-0" />}
              <span>{message.text}</span>
            </div>
          )}

          <div className="flex gap-4">
            {!todayRecord ? (
              <button
                id="btn_clock_in"
                onClick={handleClockIn}
                disabled={actionLoading}
                className="flex-1 py-3 bg-olive hover:opacity-95 active:scale-95 text-white text-xs font-semibold rounded-full flex items-center justify-center space-x-2 shadow-md cursor-pointer transition-all border-none"
              >
                <Clock className="h-4 w-4" />
                <span>Clock In Now</span>
              </button>
            ) : !todayRecord.clockOut ? (
              <button
                id="btn_clock_out"
                onClick={handleClockOut}
                disabled={actionLoading}
                className="flex-1 py-3 bg-[#8B713A] hover:opacity-95 active:scale-95 text-white text-xs font-semibold rounded-full flex items-center justify-center space-x-2 shadow-md cursor-pointer transition-all border-none"
              >
                <Clock3 className="h-4 w-4" />
                <span>Clock Out Now</span>
              </button>
            ) : (
              <div className="flex-1 py-3 bg-cream border border-cream text-sage text-xs font-semibold rounded-full text-center flex items-center justify-center space-x-1 select-none">
                <CheckCircle className="h-4 w-4 text-olive animate-pulse" />
                <span>Shift Complete Today</span>
              </div>
            )}
          </div>
        </div>

        {/* Date Filter Panel */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-[32px] p-6 flex flex-col justify-between shadow-[0_4px_24px_rgba(0,0,0,0.015)]">
          <div>
            <div className="flex items-center space-x-2 mb-4 border-b border-cream pb-3">
              <Filter className="h-4 w-4 text-olive" />
              <h3 className="font-serif text-lg font-semibold text-ink">Attendance Filters</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-sage font-bold mb-1.5 uppercase tracking-wider text-[10px]">Start Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 bg-[#FAF9F6] border border-[#A3AD9A]/30 rounded-2xl text-ink outline-none focus:border-olive select-text transition-all"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sage font-bold mb-1.5 uppercase tracking-wider text-[10px]">End Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 bg-[#FAF9F6] border border-[#A3AD9A]/30 rounded-2xl text-ink outline-none focus:border-olive select-text transition-all"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              {(user?.role === 'Admin' || user?.role === 'Manager') && (
                <div>
                  <label className="block text-sage font-bold mb-1.5 uppercase tracking-wider text-[10px]">Department</label>
                  <select
                    className="w-full px-3 py-2 bg-[#FAF9F6] border border-[#A3AD9A]/30 rounded-2xl text-ink outline-none focus:border-olive select-text transition-all"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
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
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-cream">
            <button
              onClick={clearFilters}
              className="px-5 py-2.5 bg-[#FAF9F6] hover:bg-cream border border-slate-100 hover:border-[#A3AD9A]/30 text-ink/70 text-xs font-semibold rounded-full transition-all cursor-pointer"
            >
              Clear Filter Set
            </button>
            <button
              onClick={() => {
                fetchPersonalLogs();
                if (user?.role === 'Admin' || user?.role === 'Manager') {
                  fetchGlobalLogs();
                }
              }}
              className="px-5 py-2.5 bg-olive hover:opacity-90 active:scale-95 text-white text-xs font-semibold rounded-full flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh Records</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tables Area */}
      {/* 1. PERSONAL SHIFT HISTORY */}
      <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.015)]">
        <div className="mb-4">
          <h3 className="font-serif text-xl font-semibold text-ink">Your Personal Clockings</h3>
          <p className="text-[10px] text-sage">Chronological history of your personal work shifts.</p>
        </div>

        {personalLoading ? (
          <div className="text-center py-10 font-mono text-xs text-sage">
            Parsing personal shift registries...
          </div>
        ) : personalLogs.length > 0 ? (
          (() => {
            const itemsPerPage = 10;
            const totalPages = Math.ceil(personalLogs.length / itemsPerPage);
            const currentPage = Math.min(personalPage, totalPages || 1);
            const paginatedPersonal = personalLogs.slice(
              (currentPage - 1) * itemsPerPage,
              currentPage * itemsPerPage
            );

            return (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs select-text">
                    <thead>
                      <tr className="bg-[#FAF9F6] border-b border-[#F5F5F0] text-sage font-semibold uppercase tracking-wider text-[10px]">
                        <th className="py-3.5 px-4 font-mono">Date</th>
                        <th className="py-3.5 px-4 font-mono">Clock In</th>
                        <th className="py-3.5 px-4 font-mono">Clock Out</th>
                        <th className="py-3.5 px-4 font-mono">Total Time</th>
                        <th className="py-3.5 px-4 font-mono text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cream text-ink/80">
                      {paginatedPersonal.map((log) => {
                        let hours = 'Incomplete';
                        if (log.clockIn && log.clockOut) {
                          try {
                            const [inH, inM] = log.clockIn.split(':').map(Number);
                            const [outH, outM] = log.clockOut.split(':').map(Number);
                            const diff = (outH * 60 + outM) - (inH * 60 + inM);
                            hours = `${Math.floor(diff / 60)}h ${diff % 60}m`;
                          } catch {
                            hours = 'N/A';
                          }
                        }

                        return (
                          <tr key={log.id} className="hover:bg-cream/10 transition-colors">
                            <td className="py-3 px-4 font-mono font-medium text-ink">{log.date}</td>
                            <td className="py-3 px-4 font-mono">{log.clockIn}</td>
                            <td className="py-3 px-4 font-mono">{log.clockOut || <span className="text-olive italic font-semibold">Shift Running</span>}</td>
                            <td className="py-3 px-4 font-mono">{hours}</td>
                            <td className="py-3 px-4 text-right">
                              <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-bold uppercase ${getStatusStyle(log.status)}`}>
                                {log.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#F5F5F0] select-none text-xs">
                    <button
                      id="btn_personal_attendance_prev"
                      disabled={currentPage === 1}
                      onClick={() => setPersonalPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1.5 rounded-xl border border-[#A3AD9A]/20 text-xs text-ink/75 hover:text-olive hover:bg-cream/50 disabled:opacity-30 disabled:hover:text-ink/75 disabled:hover:bg-transparent transition-all cursor-pointer font-medium"
                    >
                      Previous
                    </button>
                    <span className="text-[10px] font-mono text-sage uppercase tracking-wider font-semibold">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      id="btn_personal_attendance_next"
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
          <div className="p-8 text-center text-sage font-mono text-xs">
            No punch records logged matching your filter parameters
          </div>
        )}
      </div>

      {/* 2. GLOBAL TEAM ATTENDANCE (Admins/Managers only) */}
      {(user?.role === 'Admin' || user?.role === 'Manager') && (
        <div id="global_attendance_card" className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.015)]">
          <div className="mb-4">
            <h3 className="font-serif text-xl font-semibold text-ink">Operational Team Shifts Log ({globalLogs.length})</h3>
            <p className="text-[10px] text-sage">Consolidated live check-in logs across the entire organizational registry.</p>
          </div>

          {globalLoading ? (
            <div className="text-center py-10 font-mono text-xs text-sage">
              Generating active company rosters...
            </div>
          ) : globalLogs.length > 0 ? (
            (() => {
              const itemsPerPage = 10;
              const totalPages = Math.ceil(globalLogs.length / itemsPerPage);
              const currentPage = Math.min(globalPage, totalPages || 1);
              const paginatedGlobal = globalLogs.slice(
                (currentPage - 1) * itemsPerPage,
                currentPage * itemsPerPage
              );

              return (
                <>
                  <div className="overflow-x-auto text-xs">
                    <table className="w-full text-left border-collapse select-text">
                      <thead>
                        <tr className="bg-[#FAF9F6] border-b border-[#F5F5F0] text-sage font-semibold uppercase tracking-wider text-[10px]">
                          <th className="py-3.5 px-4 font-mono">Employee</th>
                          <th className="py-3.5 px-4 font-mono">Department</th>
                          <th className="py-3.5 px-4 font-mono">Date</th>
                          <th className="py-3.5 px-4 font-mono">Clock In</th>
                          <th className="py-3.5 px-4 font-mono">Clock Out</th>
                          <th className="py-3.5 px-4 font-mono text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-cream text-ink/80">
                        {paginatedGlobal.map((log) => (
                          <tr key={log.id} className="hover:bg-cream/10 transition-colors">
                            <td className="py-3.5 px-4 font-semibold text-ink">{log.employeeName}</td>
                            <td className="py-3.5 px-4 font-sans text-sage font-medium">{log.department}</td>
                            <td className="py-3.5 px-4 font-mono text-ink/70">{log.date}</td>
                            <td className="py-3.5 px-4 font-mono">{log.clockIn}</td>
                            <td className="py-3.5 px-4 font-mono">{log.clockOut || <span className="text-olive inline-flex font-semibold">Active Punch</span>}</td>
                            <td className="py-3.5 px-4 text-right">
                              <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-bold uppercase ${getStatusStyle(log.status)}`}>
                                {log.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#F5F5F0] select-none text-xs">
                      <button
                        id="btn_global_attendance_prev"
                        disabled={currentPage === 1}
                        onClick={() => setGlobalPage((p) => Math.max(1, p - 1))}
                        className="px-3 py-1.5 rounded-xl border border-[#A3AD9A]/20 text-xs text-ink/75 hover:text-olive hover:bg-cream/50 disabled:opacity-30 disabled:hover:text-ink/75 disabled:hover:bg-transparent transition-all cursor-pointer font-medium"
                      >
                        Previous
                      </button>
                      <span className="text-[10px] font-mono text-sage uppercase tracking-wider font-semibold">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        id="btn_global_attendance_next"
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
              No general worker clock logs mapped to these parameters
            </div>
          )}
        </div>
      )}
    </div>
  );
};

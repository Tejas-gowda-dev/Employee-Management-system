import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import api from '../services/api.js';
import { AdminDashboardData, EmployeeDashboardData } from '../types.js';
import { 
  Users, 
  Clock, 
  FileText, 
  TrendingUp, 
  AlertCircle, 
  CalendarDays, 
  UserCheck, 
  BellRing,
  Award,
  BookOpen,
  Calendar
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { motion } from 'motion/react';

const COLORS = ['#5A5A40', '#A3AD9A', '#CDD5C5', '#8B713A', '#D8C3A5', '#EAE7DC'];

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [adminData, setAdminData] = useState<AdminDashboardData | null>(null);
  const [employeeData, setEmployeeData] = useState<EmployeeDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination states for dashboard activity log and notifications feed
  const [adminActivityPage, setAdminActivityPage] = useState(1);
  const [empActivityPage, setEmpActivityPage] = useState(1);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        if (user.role === 'Admin' || user.role === 'Manager') {
          const response = await api.get('/dashboard/admin');
          if (response.data?.success) {
            setAdminData(response.data.data);
          }
        } else {
          const response = await api.get('/dashboard/employee');
          if (response.data?.success) {
            setEmployeeData(response.data.data);
          }
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to aggregate active analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div id="dashboard_loader" className="flex flex-col items-center justify-center p-20 select-none font-sans">
        <div className="h-10 w-10 border-4 border-slate-200 border-t-olive rounded-full animate-spin"></div>
        <p className="text-sm text-sage mt-4 font-medium uppercase tracking-wider text-[11px]">Aggregating workforce intelligence...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div id="dashboard_error_panel" className="p-6 bg-rose-50 border border-rose-200 rounded-[24px] flex items-start space-x-3 text-rose-800">
        <AlertCircle className="h-5 w-5 mt-0.5 text-rose-600 shrink-0" />
        <div>
          <h3 className="font-semibold text-sm">Analytical Loading Fail</h3>
          <p className="text-xs text-rose-700 mt-1 leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  // --- RENDERING ADMIN / MANAGER DASHBOARD ---
  if (user?.role === 'Admin' || user?.role === 'Manager') {
    const stats = adminData?.stats;
    const charts = adminData?.charts;
    const recentActivity = adminData?.recentActivity || [];

    return (
      <motion.div 
        id="admin_dashboard" 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-light font-serif text-ink italic tracking-tight">Managerial Control Panel</h1>
            <p className="text-xs text-sage uppercase tracking-widest mt-1.5 font-sans">Real-time attendance schedules, leaves pipelines, and organizational summaries.</p>
          </div>
          <div className="flex items-center space-x-2 bg-white border border-slate-100 px-4 py-2 rounded-full text-xs text-olive font-medium shadow-sm select-none">
            <UserCheck className="h-4 w-4 text-olive" />
            <span>Operational Mode: {user.role}</span>
          </div>
        </div>

        {/* Dynamic Bento Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white border border-slate-100 p-6 rounded-[32px] flex items-center space-x-4 shadow-[0_4px_24px_rgba(0,0,0,0.015)]">
              <div className="h-11 w-11 bg-cream rounded-2xl flex items-center justify-center text-olive shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] text-sage uppercase tracking-wider block font-semibold mb-1">Total Roster</span>
                <span className="text-3.5xl font-light font-serif text-ink tracking-tight block">{stats.totalEmployees}</span>
                <span className="text-[10px] text-sage block leading-none font-mono mt-0.5">{stats.activeEmployees} active</span>
              </div>
            </div>

            <div className="bg-white border border-slate-100 p-6 rounded-[32px] flex items-center space-x-4 shadow-[0_4px_24px_rgba(0,0,0,0.015)]">
              <div className="h-11 w-11 bg-cream rounded-2xl flex items-center justify-center text-olive shrink-0">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] text-sage uppercase tracking-wider block font-semibold mb-1">Present Today</span>
                <span className="text-3.5xl font-light font-serif text-ink tracking-tight block">{stats.activeAttendanceToday}</span>
                <span className="text-[10px] text-sage block leading-none font-mono mt-0.5">
                  {stats.presentToday} full / {stats.halfDayToday} half
                </span>
              </div>
            </div>

            <div className="bg-white border border-slate-100 p-6 rounded-[32px] flex items-center space-x-4 shadow-[0_4px_24px_rgba(0,0,0,0.015)]">
              <div className="h-11 w-11 bg-[#F3E9D2]/70 rounded-2xl flex items-center justify-center text-[#8B713A] shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] text-sage uppercase tracking-wider block font-semibold mb-1">Leave Backlog</span>
                <span className="text-3.5xl font-light font-serif text-ink tracking-tight block">{stats.pendingLeaves}</span>
                <span className="text-[10px] text-[#8B713A] block leading-none font-medium mt-0.5">Requires approval</span>
              </div>
            </div>

            <div className="bg-white border border-slate-100 p-6 rounded-[32px] flex items-center space-x-4 shadow-[0_4px_24px_rgba(0,0,0,0.015)]">
              <div className="h-11 w-11 bg-cream rounded-2xl flex items-center justify-center text-olive shrink-0">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] text-sage uppercase tracking-wider block font-semibold mb-1">Out of Office</span>
                <span className="text-3.5xl font-light font-serif text-ink tracking-tight block">{stats.onLeaveToday}</span>
                <span className="text-[10px] text-olive block leading-none font-mono mt-0.5">On approved leave</span>
              </div>
            </div>
          </div>
        )}

        {/* Charts Section */}
        {charts && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Interactive Weekly Trend (Takes 2 cols) */}
            <div className="lg:col-span-2 bg-white border border-slate-100 rounded-[32px] p-6 flex flex-col min-h-[350px] shadow-[0_4px_24px_rgba(0,0,0,0.015)]">
              <div className="mb-4">
                <h3 className="font-serif text-xl font-semibold text-ink">Attendance Frequency Trend</h3>
                <p className="text-[11px] text-sage">Weekly tracking of full-day, half-day, or on-leave employees.</p>
              </div>
              <div className="flex-1 w-full text-xs" style={{ minHeight: '220px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={charts.weeklyTrend} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f0" />
                    <XAxis dataKey="date" stroke="#A3AD9A" tickLine={false} />
                    <YAxis stroke="#A3AD9A" tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid #A3AD9A', backgroundColor: '#FFFFFF', color: '#2D2D2A' }} />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                    <Line type="monotone" dataKey="Present" stroke="#5A5A40" strokeWidth={2.5} activeDot={{ r: 6 }} name="Present" />
                    <Line type="monotone" dataKey="Half-Day" stroke="#A3AD9A" strokeWidth={2} name="Half-Day" />
                    <Line type="monotone" dataKey="OnLeave" stroke="#8B713A" strokeWidth={2} name="On Leave" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right: Departmental distribution (Takes 1 col) */}
            <div className="bg-white border border-slate-100 rounded-[32px] p-6 flex flex-col min-h-[350px] shadow-[0_4px_24px_rgba(0,0,0,0.015)]">
              <div className="mb-4">
                <h3 className="font-serif text-xl font-semibold text-ink">Departmental Ratios</h3>
                <p className="text-[11px] text-sage">Division count across operational branches.</p>
              </div>
              {charts.departmentSplit.length > 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={charts.departmentSplit}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={65}
                          fill="#A3AD9A"
                          dataKey="employees"
                        >
                          {charts.departmentSplit.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Legend */}
                  <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-2 max-h-[100px] overflow-auto">
                    {charts.departmentSplit.map((dept, index) => (
                      <div key={dept.name} className="flex items-center space-x-1.5 text-[10px] text-sage font-mono">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                        <span className="truncate max-w-[90px]">{dept.name} ({dept.employees})</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-sage text-xs">
                  No active department records found
                </div>
              )}
            </div>
          </div>
        )}

        {/* Lower pane: Recent system actions list */}
        <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.015)]">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="font-serif text-xl font-semibold text-ink">Staff Notifications & Activity Streams</h3>
              <p className="text-[11px] text-sage mt-0.5">Summary of chronological employee workflows.</p>
            </div>
            <BellRing className="text-sage h-5 w-5" />
          </div>

          {recentActivity.length > 0 ? (
            (() => {
              const itemsPerPage = 5;
              const totalPages = Math.ceil(recentActivity.length / itemsPerPage);
              const currentPage = Math.min(adminActivityPage, totalPages || 1);
              const paginatedActivity = recentActivity.slice(
                (currentPage - 1) * itemsPerPage,
                currentPage * itemsPerPage
              );

              return (
                <>
                  <div className="divide-y divide-[#F5F5F0]">
                    {paginatedActivity.map((activity) => (
                      <div key={activity.id} className="py-3.5 flex items-start justify-between gap-4 text-xs transition-colors hover:bg-cream/20 -mx-4 px-4 rounded-2xl">
                        <div className="flex items-start space-x-3">
                          <div className="h-8 w-8 bg-cream rounded-xl flex items-center justify-center text-olive mt-0.5 shrink-0">
                            <Clock className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-ink font-medium leading-normal">{activity.message}</p>
                            {activity.user && (
                              <div className="flex items-center space-x-1.5 mt-1">
                                <span className="text-[10px] text-sage font-semibold">{activity.user.name}</span>
                                <span className="text-[8px] bg-[#E2E8D5] text-[#5A5A40] border border-[#A3AD9A]/30 font-bold px-1.5 py-0.2 rounded-full uppercase">{activity.user.role}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-sage whitespace-nowrap">
                          {new Date(activity.createdAt).toLocaleDateString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#F5F5F0] select-none">
                      <button
                        id="btn_admin_activity_prev"
                        disabled={currentPage === 1}
                        onClick={() => setAdminActivityPage((p) => Math.max(1, p - 1))}
                        className="px-3 py-1.5 rounded-xl border border-[#A3AD9A]/20 text-xs text-ink/75 hover:text-olive hover:bg-cream/50 disabled:opacity-30 disabled:hover:text-ink/75 disabled:hover:bg-transparent transition-all cursor-pointer font-medium"
                      >
                        Previous
                      </button>
                      <span className="text-[10px] font-mono text-sage uppercase tracking-wider">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        id="btn_admin_activity_next"
                        disabled={currentPage === totalPages}
                        onClick={() => setAdminActivityPage((p) => Math.min(totalPages, p + 1))}
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
            <div className="p-8 text-center text-sage text-xs">
              No recent notifications logged on this server bounds
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // --- RENDERING EMPLOYEE DASHBOARD ---
  const empStats = employeeData?.stats;
  const leaveBalance = employeeData?.leaveBalance;
  const upcomingLeaves = employeeData?.upcomingLeaves || [];
  const notifications = employeeData?.notifications || [];

  return (
    <motion.div 
      id="employee_dashboard" 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-light font-serif text-ink italic tracking-tight">Personal Workspace</h1>
          <p className="text-xs text-sage uppercase tracking-widest mt-1.5 font-sans">Track your shifts, register leaves, and review core notifications.</p>
        </div>
        <div className="flex items-center space-x-3 select-none">
          <span className="text-xs font-mono text-slate-500 bg-white border border-slate-100 px-4 py-1.5 rounded-full shadow-sm">
            Joined: {user?.joinDate}
          </span>
        </div>
      </div>

      {/* Stats Summary Cards */}
      {empStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white border border-slate-100 p-6 rounded-[32px] flex items-center space-x-4 shadow-[0_4px_24px_rgba(0,0,0,0.015)]">
            <div className="h-11 w-11 bg-cream rounded-2xl flex items-center justify-center text-olive shrink-0">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] text-sage uppercase tracking-wider block font-semibold mb-1">Logged Present</span>
              <span className="text-3.5xl font-light font-serif text-ink tracking-tight block">{empStats.presentDays}</span>
              <span className="text-[10px] text-sage block font-mono mt-0.5">Full shifts</span>
            </div>
          </div>

          <div className="bg-white border border-slate-100 p-6 rounded-[32px] flex items-center space-x-4 shadow-[0_4px_24px_rgba(0,0,0,0.015)]">
            <div className="h-11 w-11 bg-[#F3E9D2]/70 rounded-2xl flex items-center justify-center text-[#8B713A] shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] text-sage uppercase tracking-wider block font-semibold mb-1">Half-Days</span>
              <span className="text-3.5xl font-light font-serif text-ink tracking-tight block">{empStats.halfDays}</span>
              <span className="text-[10px] text-[#8B713A] block font-mono mt-0.5">4-hour shift equivalents</span>
            </div>
          </div>

          <div className="bg-white border border-slate-100 p-6 rounded-[32px] flex items-center space-x-4 shadow-[0_4px_24px_rgba(0,0,0,0.015)]">
            <div className="h-11 w-11 bg-cream rounded-2xl flex items-center justify-center text-olive shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] text-sage uppercase tracking-wider block font-semibold mb-1">Work Hours</span>
              <span className="text-3.5xl font-light font-serif text-ink tracking-tight block">{empStats.totalHoursLogged}</span>
              <span className="text-[10px] text-sage block font-mono mt-0.5">Estimated total logged</span>
            </div>
          </div>

          <div className="bg-white border border-slate-100 p-6 rounded-[32px] flex items-center space-x-4 shadow-[0_4px_24px_rgba(0,0,0,0.015)]">
            <div className="h-11 w-11 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-700 shrink-0">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] text-sage uppercase tracking-wider block font-semibold mb-1">Absences</span>
              <span className="text-3.5xl font-light font-serif text-ink tracking-tight block">{empStats.absentDays}</span>
              <span className="text-[10px] text-rose-600 block font-mono mt-0.5">Unexcused shifts</span>
            </div>
          </div>
        </div>
      )}

      {/* Leave balance tallies */}
      {leaveBalance && (
        <div className="space-y-4">
          <h3 className="font-serif text-xl font-semibold text-ink">Remaining Leave Allocations</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white border border-slate-105 p-6 rounded-[32px] select-none relative overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.015)]">
              <div className="relative z-10">
                <span className="text-[10px] font-bold text-sage uppercase tracking-widest block">Annual Allotment</span>
                <span className="text-3.5xl font-light font-serif text-olive mt-3 block tracking-tight">{leaveBalance.annual} <span className="text-xs font-normal font-sans text-sage">Days remaining</span></span>
              </div>
              <Calendar className="absolute right-[-10px] bottom-[-10px] h-24 w-24 text-sage/10 rotate-12" />
            </div>

            <div className="bg-[#FAF9F6] border border-[#A3AD9A]/10 p-6 rounded-[32px] select-none relative overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.01)]">
              <div className="relative z-10">
                <span className="text-[10px] font-bold text-sage uppercase tracking-widest block">Sickness Escrow</span>
                <span className="text-3.5xl font-light font-serif text-olive mt-3 block tracking-tight">{leaveBalance.sick} <span className="text-xs font-normal font-sans text-sage">Days remaining</span></span>
              </div>
              <Award className="absolute right-[-10px] bottom-[-10px] h-24 w-24 text-sage/15 rotate-12" />
            </div>

            <div className="bg-[#FAF9F6] border border-[#A3AD9A]/10 p-6 rounded-[32px] select-none relative overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.01)]">
              <div className="relative z-10">
                <span className="text-[10px] font-bold text-sage uppercase tracking-widest block">Casual / Personal Days</span>
                <span className="text-3.5xl font-light font-serif text-olive mt-3 block tracking-tight">{leaveBalance.casual} <span className="text-xs font-normal font-sans text-sage">Days remaining</span></span>
              </div>
              <BookOpen className="absolute right-[-10px] bottom-[-10px] h-24 w-24 text-sage/15 rotate-12" />
            </div>
          </div>
        </div>
      )}

      {/* Lower modules row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Private Alert Feeds */}
        <div className="lg:col-span-2 bg-white border border-slate-105 rounded-[32px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.015)]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-serif text-xl font-semibold text-ink">Personal Activity Feed</h3>
            <BellRing className="text-sage h-5 w-5" />
          </div>

          {notifications.length > 0 ? (
            (() => {
              const itemsPerPage = 5;
              const totalPages = Math.ceil(notifications.length / itemsPerPage);
              const currentPage = Math.min(empActivityPage, totalPages || 1);
              const paginatedNotifs = notifications.slice(
                (currentPage - 1) * itemsPerPage,
                currentPage * itemsPerPage
              );

              return (
                <>
                  <div className="divide-y divide-[#F5F5F0]">
                    {paginatedNotifs.map((notif) => (
                      <div key={notif.id} className="py-3 flex items-start justify-between text-xs gap-3">
                        <div className="flex items-start space-x-3">
                          <span className="h-2 w-2 rounded-full bg-olive mt-1.5 shrink-0"></span>
                          <p className="text-ink/80 leading-normal">{notif.message}</p>
                        </div>
                        <span className="text-[9px] font-mono text-sage whitespace-nowrap mt-0.5">
                          {new Date(notif.createdAt).toLocaleDateString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#F5F5F0] select-none">
                      <button
                        id="btn_emp_activity_prev"
                        disabled={currentPage === 1}
                        onClick={() => setEmpActivityPage((p) => Math.max(1, p - 1))}
                        className="px-3 py-1.5 rounded-xl border border-[#A3AD9A]/20 text-xs text-ink/75 hover:text-olive hover:bg-cream/50 disabled:opacity-30 disabled:hover:text-ink/75 disabled:hover:bg-transparent transition-all cursor-pointer font-medium"
                      >
                        Previous
                      </button>
                      <span className="text-[10px] font-mono text-sage uppercase tracking-wider">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        id="btn_emp_activity_next"
                        disabled={currentPage === totalPages}
                        onClick={() => setEmpActivityPage((p) => Math.min(totalPages, p + 1))}
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
            <div className="p-8 text-center text-sage text-xs font-mono">
              Notifications log is currently pristine
            </div>
          )}
        </div>

        {/* Right: Plan upcoming approved leave scopes */}
        <div className="bg-white border border-slate-105 rounded-[32px] p-6 flex flex-col shadow-[0_4px_24px_rgba(0,0,0,0.015)]">
          <div className="mb-4">
            <h3 className="font-serif text-xl font-semibold text-ink">Upcoming Leave Calendars</h3>
            <p className="text-[10px] text-sage mt-0.5">Approved future periods of absence.</p>
          </div>

          <div className="flex-1 overflow-auto max-h-[250px] space-y-3">
            {upcomingLeaves.length > 0 ? (
              upcomingLeaves.map((lv) => (
                <div key={lv.id} className="p-4 bg-cream/40 border border-[#A3AD9A]/15 rounded-2xl space-y-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-olive uppercase tracking-wide text-[10px]">{lv.leaveType} leave</span>
                    <span className="text-[8px] tracking-wider uppercase bg-[#E2E8D5] text-olive border border-[#A3AD9A]/30 font-bold px-1.5 rounded-full">Approved</span>
                  </div>
                  <p className="text-sage font-mono text-[10px] mt-1">{lv.startDate} to {lv.endDate}</p>
                  <p className="text-[#2D2D2A]/80 leading-normal italic mt-2 font-sans select-text">"{lv.reason}"</p>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center text-sage text-xs font-mono">
                No future leaves currently scheduled
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

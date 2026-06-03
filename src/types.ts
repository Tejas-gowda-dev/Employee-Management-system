export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Employee';
  department: string;
  profilePicture?: string;
  documents: { name: string; path: string }[];
  joinDate: string;
  isActive: boolean;
}

export interface Attendance {
  id: string;
  userId: string;
  date: string;
  clockIn: string;
  clockOut?: string;
  status: 'present' | 'absent' | 'half-day' | 'on-leave';
  employeeName?: string;
  department?: string;
}

export interface Leave {
  id: string;
  userId: string;
  leaveType: 'annual' | 'sick' | 'casual';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  createdAt: string;
  employeeName?: string;
  department?: string;
}

export interface LeaveBalance {
  id: string;
  userId: string;
  annual: number;
  sick: number;
  casual: number;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface AdminDashboardData {
  stats: {
    totalEmployees: number;
    activeEmployees: number;
    activeAttendanceToday: number;
    pendingLeaves: number;
    presentToday: number;
    halfDayToday: number;
    onLeaveToday: number;
  };
  charts: {
    departmentSplit: { name: string; employees: number }[];
    weeklyTrend: { date: string; Present: number; 'Half-Day': number; OnLeave: number }[];
  };
  recentActivity: {
    id: string;
    message: string;
    createdAt: string;
    user: { name: string; role: string } | null;
  }[];
}

export interface EmployeeDashboardData {
  stats: {
    presentDays: number;
    halfDays: number;
    absentDays: number;
    totalHoursLogged: string;
  };
  leaveBalance: {
    annual: number;
    sick: number;
    casual: number;
  };
  charts: {
    leaveUsage: { name: string; Used: number; Left: number }[];
  };
  upcomingLeaves: Leave[];
  notifications: Notification[];
}

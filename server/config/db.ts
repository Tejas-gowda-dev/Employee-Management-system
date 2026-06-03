import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

// Create the data directory if it doesn't exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Hashed password, optionally omitted when returning user objects
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
  date: string; // YYYY-MM-DD
  clockIn: string; // HH:MM:SS
  clockOut?: string; // HH:MM:SS
  status: 'present' | 'absent' | 'half-day' | 'on-leave';
}

export interface Leave {
  id: string;
  userId: string;
  leaveType: 'annual' | 'sick' | 'casual';
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  createdAt: string;
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

class Collection<T extends { id: string }> {
  private filePath: string;

  constructor(private name: string) {
    this.filePath = path.join(DATA_DIR, `${name}.json`);
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([], null, 2), 'utf-8');
    }
  }

  private read(): T[] {
    try {
      const content = fs.readFileSync(this.filePath, 'utf-8');
      return JSON.parse(content || '[]');
    } catch {
      return [];
    }
  }

  private write(data: T[]): void {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  public find(filter?: (item: T) => boolean): T[] {
    const list = this.read();
    if (!filter) return list;
    return list.filter(filter);
  }

  public findOne(filter: (item: T) => boolean): T | null {
    const list = this.read();
    const found = list.find(filter);
    return found || null;
  }

  public findById(id: string): T | null {
    const list = this.read();
    const found = list.find((item) => item.id === id);
    return found || null;
  }

  public create(item: Omit<T, 'id'>): T {
    const list = this.read();
    const id = `${this.name.substring(0, 3)}_${Math.random().toString(36).substr(2, 9)}`;
    const newItem = { ...item, id } as unknown as T;
    list.push(newItem);
    this.write(list);
    return newItem;
  }

  public update(id: string, update: Partial<Omit<T, 'id'>>): T | null {
    const list = this.read();
    const index = list.findIndex((item) => item.id === id);
    if (index === -1) return null;
    const updatedItem = { ...list[index], ...update } as T;
    list[index] = updatedItem;
    this.write(list);
    return updatedItem;
  }

  public delete(id: string): boolean {
    const list = this.read();
    const filtered = list.filter((item) => item.id !== id);
    if (filtered.length === list.length) return false;
    this.write(filtered);
    return true;
  }
}

export const dbResult = {
  users: new Collection<User>('users'),
  attendance: new Collection<Attendance>('attendance'),
  leaves: new Collection<Leave>('leaves'),
  leaveBalances: new Collection<LeaveBalance>('leaveBalances'),
  notifications: new Collection<Notification>('notifications'),
};

export default dbResult;

export interface Member {
  id: string;
  name: string;
  phone: string;
  balance: number;
  goal: number;
  initials: string;
  color: string;
}

export interface Transaction {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  type: 'deposit' | 'withdrawal';
  timestamp: Date;
}

const COLORS = [
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-blue-100 text-blue-700',
  'bg-rose-100 text-rose-700',
  'bg-violet-100 text-violet-700',
  'bg-cyan-100 text-cyan-700',
  'bg-orange-100 text-orange-700',
  'bg-teal-100 text-teal-700',
];

export const members: Member[] = [
  { id: '1', name: 'Amina Yusuf', phone: '0803 456 7890', balance: 35000, goal: 50000, initials: 'AY', color: COLORS[0] },
  { id: '2', name: 'Chinedu Okoro', phone: '0815 234 5678', balance: 22000, goal: 50000, initials: 'CO', color: COLORS[1] },
  { id: '3', name: 'Babatunde Ali', phone: '0706 789 0123', balance: 48000, goal: 50000, initials: 'BA', color: COLORS[2] },
  { id: '4', name: 'Funke Adeyemi', phone: '0901 345 6789', balance: 15000, goal: 50000, initials: 'FA', color: COLORS[3] },
  { id: '5', name: 'Ibrahim Musa', phone: '0812 567 8901', balance: 30000, goal: 50000, initials: 'IM', color: COLORS[4] },
  { id: '6', name: 'Ngozi Eze', phone: '0703 890 1234', balance: 42000, goal: 50000, initials: 'NE', color: COLORS[5] },
  { id: '7', name: 'Yemi Ogunleye', phone: '0816 012 3456', balance: 28000, goal: 50000, initials: 'YO', color: COLORS[6] },
  { id: '8', name: 'Halima Bello', phone: '0905 678 9012', balance: 50000, goal: 50000, initials: 'HB', color: COLORS[7] },
  { id: '9', name: 'Emeka Nwosu', phone: '0809 123 4567', balance: 18000, goal: 50000, initials: 'EN', color: COLORS[0] },
  { id: '10', name: 'Aisha Abdullahi', phone: '0701 234 5678', balance: 12000, goal: 50000, initials: 'AA', color: COLORS[1] },
  { id: '11', name: 'Oluwaseun Balogun', phone: '0813 456 7890', balance: 39000, goal: 50000, initials: 'OB', color: COLORS[2] },
  { id: '12', name: 'Kemi Falade', phone: '0907 890 1234', balance: 25000, goal: 50000, initials: 'KF', color: COLORS[3] },
  { id: '13', name: 'Usman Garba', phone: '0805 012 3456', balance: 8000, goal: 50000, initials: 'UG', color: COLORS[4] },
  { id: '14', name: 'Blessing Okafor', phone: '0710 345 6789', balance: 33000, goal: 50000, initials: 'BO', color: COLORS[5] },
  { id: '15', name: 'Tunde Ajayi', phone: '0818 678 9012', balance: 44000, goal: 50000, initials: 'TA', color: COLORS[6] },
  { id: '16', name: 'Zainab Mohammed', phone: '0903 901 2345', balance: 11000, goal: 50000, initials: 'ZM', color: COLORS[7] },
  { id: '17', name: 'Chioma Igwe', phone: '0807 234 5678', balance: 27000, goal: 50000, initials: 'CI', color: COLORS[0] },
  { id: '18', name: 'Adamu Sani', phone: '0714 567 8901', balance: 19000, goal: 50000, initials: 'AS', color: COLORS[1] },
  { id: '19', name: 'Folake Oyedepo', phone: '0811 890 1234', balance: 36000, goal: 50000, initials: 'FO', color: COLORS[2] },
  { id: '20', name: 'Musa Lawal', phone: '0906 012 3456', balance: 14000, goal: 50000, initials: 'ML', color: COLORS[3] },
  { id: '21', name: 'Nneka Chukwu', phone: '0804 345 6789', balance: 41000, goal: 50000, initials: 'NC', color: COLORS[4] },
  { id: '22', name: 'Segun Adebayo', phone: '0719 678 9012', balance: 23000, goal: 50000, initials: 'SA', color: COLORS[5] },
  { id: '23', name: 'Fatima Umar', phone: '0810 901 2345', balance: 31000, goal: 50000, initials: 'FU', color: COLORS[6] },
  { id: '24', name: 'Obinna Agu', phone: '0902 234 5678', balance: 17000, goal: 50000, initials: 'OA', color: COLORS[7] },
];

export const transactions: Transaction[] = [
  { id: '1', memberId: '1', memberName: 'Amina Yusuf', amount: 5000, type: 'deposit', timestamp: new Date(2026, 2, 8, 9, 15) },
  { id: '2', memberId: '3', memberName: 'Babatunde Ali', amount: 3000, type: 'deposit', timestamp: new Date(2026, 2, 8, 8, 42) },
  { id: '3', memberId: '6', memberName: 'Ngozi Eze', amount: 2000, type: 'deposit', timestamp: new Date(2026, 2, 8, 8, 10) },
  { id: '4', memberId: '5', memberName: 'Ibrahim Musa', amount: 5000, type: 'deposit', timestamp: new Date(2026, 2, 7, 17, 30) },
  { id: '5', memberId: '8', memberName: 'Halima Bello', amount: 10000, type: 'deposit', timestamp: new Date(2026, 2, 7, 16, 55) },
  { id: '6', memberId: '2', memberName: 'Chinedu Okoro', amount: 2000, type: 'deposit', timestamp: new Date(2026, 2, 7, 15, 20) },
  { id: '7', memberId: '11', memberName: 'Oluwaseun Balogun', amount: 4000, type: 'deposit', timestamp: new Date(2026, 2, 7, 14, 0) },
  { id: '8', memberId: '15', memberName: 'Tunde Ajayi', amount: 4000, type: 'deposit', timestamp: new Date(2026, 2, 7, 12, 30) },
  { id: '9', memberId: '19', memberName: 'Folake Oyedepo', amount: 6000, type: 'deposit', timestamp: new Date(2026, 2, 6, 18, 0) },
  { id: '10', memberId: '14', memberName: 'Blessing Okafor', amount: 3000, type: 'deposit', timestamp: new Date(2026, 2, 6, 16, 45) },
  { id: '11', memberId: '21', memberName: 'Nneka Chukwu', amount: 1000, type: 'deposit', timestamp: new Date(2026, 2, 6, 15, 10) },
  { id: '12', memberId: '7', memberName: 'Yemi Ogunleye', amount: 3000, type: 'deposit', timestamp: new Date(2026, 2, 6, 11, 20) },
  { id: '13', memberId: '4', memberName: 'Funke Adeyemi', amount: 5000, type: 'deposit', timestamp: new Date(2026, 2, 5, 10, 0) },
  { id: '14', memberId: '10', memberName: 'Aisha Abdullahi', amount: 2000, type: 'deposit', timestamp: new Date(2026, 2, 5, 9, 30) },
  { id: '15', memberId: '23', memberName: 'Fatima Umar', amount: 1000, type: 'deposit', timestamp: new Date(2026, 2, 5, 8, 15) },
];

export const totalSavings = members.reduce((sum, m) => sum + m.balance, 0);
export const activeMembers = members.length;

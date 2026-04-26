/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type StaffCategory = 'Nurse' | 'Attendant' | 'Caretaker' | 'Baby Sitter' | 'Doctor';
export type StaffDesignation = 'RN' | 'BSN' | 'Midwife' | 'ICU/Anes' | 'Attendant';
export type PaymentMethod = 'Cash' | 'JazzCash' | 'EasyPesa' | 'Bank';
export type PatientStatus = 'Active' | 'Pending' | 'Completed' | 'Cancelled';
export type ServiceType = '24hr' | '12hr' | '8hr';
export type ShiftType = 'Day' | 'Night' | 'Full';

export interface Staff {
  id: string;
  fullName: string;
  cnic: string;
  gender: 'Male' | 'Female' | 'Other';
  category: StaffCategory;
  designation: StaffDesignation;
  phonePrimary: string;
  whatsappNumber: string;
  email?: string;
  areaTown: string;
  completeAddress: string;
  rating: number;
  experienceYears: number;
  skills: string[];
  isAvailable: boolean;
  isActive: boolean;
  isVerified: boolean;
  preferredPayment: PaymentMethod;
  expectedSalary?: number;
  acknowledgmentSigned: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface Patient {
  id: string;
  fullName: string;
  cnic: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  mobileNumber: string;
  areaTown: string;
  completeAddress: string;
  primaryDiagnosis: string;
  currentMedications: string[];
  allergies: string[];
  serviceType: ServiceType;
  shiftType: ShiftType;
  startDate: string;
  duration: string;
  status: PatientStatus;
  assignedStaffId?: string;
  monthlyPackage: number;
  createdAt: any;
  updatedAt: any;
}

export interface ShiftRow {
  id: string;
  patientId: string;
  staffId: string;
  date: string;
  salary: number;
  isCompleted: boolean;
  isPaid: boolean;
  createdAt: any;
}

export interface FinancialRecord {
  id: string;
  patientId: string;
  month: string; // YYYY-MM
  revenue: number;
  totalSalaries: number;
  margin: number;
}

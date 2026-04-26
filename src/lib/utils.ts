import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPKR(amount: number) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCNIC(cnic: string) {
  const cleaned = cnic.replace(/\D/g, '');
  if (cleaned.length !== 13) return cnic;
  return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 12)}-${cleaned.slice(12)}`;
}

export function formatPhone(phone: string) {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('92')) return `+${cleaned}`;
  if (cleaned.startsWith('0')) return `+92 ${cleaned.slice(1)}`;
  return phone;
}

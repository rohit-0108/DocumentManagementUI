import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO } from 'date-fns';

/** shadcn/ui class merge helper. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value?: string | null, pattern = 'dd MMM yyyy'): string {
  if (!value) return '—';
  try {
    return format(parseISO(value), pattern);
  } catch {
    return '—';
  }
}

export function formatDateTime(value?: string | null): string {
  return formatDate(value, 'dd MMM yyyy, HH:mm');
}

export function formatRelative(value?: string | null): string {
  if (!value) return '—';
  try {
    return formatDistanceToNow(parseISO(value), { addSuffix: true });
  } catch {
    return '—';
  }
}

export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit++;
  }
  return `${size.toFixed(unit === 0 ? 0 : 2)} ${units[unit]}`;
}

export function getInitials(name?: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('');
}

export function truncate(value: string, max = 40): string {
  return value.length <= max ? value : `${value.slice(0, max)}…`;
}

/** Triggers a browser download for a Blob. */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

/** Reads the filename out of a Content-Disposition header. */
export function parseFileName(contentDisposition?: string, fallback = 'download'): string {
  if (!contentDisposition) return fallback;
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition);
  if (utf8?.[1]) return decodeURIComponent(utf8[1]);
  const plain = /filename="?([^";]+)"?/i.exec(contentDisposition);
  return plain?.[1] ?? fallback;
}
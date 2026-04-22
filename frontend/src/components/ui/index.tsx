// src/components/ui/index.tsx
import { forwardRef, ReactNode, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import clsx from 'clsx';

// ─── Button ───────────────────────────────────────────────────────────────────

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, children, className, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    const variants = {
      primary: 'bg-brand-600 text-white hover:bg-brand-700 focus:ring-brand-500',
      secondary: 'bg-surface-100 text-surface-700 hover:bg-surface-200 focus:ring-surface-300 border border-surface-200',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
      ghost: 'text-surface-600 hover:bg-surface-100 hover:text-surface-900 focus:ring-surface-300',
    };
    const sizes = {
      sm: 'text-xs px-3 py-1.5 h-7',
      md: 'text-sm px-4 py-2 h-9',
      lg: 'text-sm px-5 py-2.5 h-11',
    };
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

// ─── Input ────────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-surface-700">{label}</label>}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400">{icon}</div>
        )}
        <input
          ref={ref}
          className={clsx(
            'w-full border rounded-lg text-sm text-surface-900 placeholder:text-surface-400 bg-white transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
            error ? 'border-red-400' : 'border-surface-200 hover:border-surface-300',
            icon ? 'pl-9 pr-3 py-2' : 'px-3 py-2',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
);
Input.displayName = 'Input';

// ─── Textarea ─────────────────────────────────────────────────────────────────

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-surface-700">{label}</label>}
      <textarea
        ref={ref}
        className={clsx(
          'w-full border rounded-lg text-sm text-surface-900 placeholder:text-surface-400 bg-white transition-colors resize-none',
          'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
          error ? 'border-red-400' : 'border-surface-200 hover:border-surface-300',
          'px-3 py-2',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
);
Textarea.displayName = 'Textarea';

// ─── Select ───────────────────────────────────────────────────────────────────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-surface-700">{label}</label>}
      <select
        ref={ref}
        className={clsx(
          'w-full border rounded-lg text-sm text-surface-900 bg-white transition-colors appearance-none',
          'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
          error ? 'border-red-400' : 'border-surface-200 hover:border-surface-300',
          'px-3 py-2',
          className
        )}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
);
Select.displayName = 'Select';

// ─── Badge ────────────────────────────────────────────────────────────────────

type BadgeVariant = 'blue' | 'green' | 'red' | 'yellow' | 'gray' | 'purple' | 'orange';

const badgeStyles: Record<BadgeVariant, string> = {
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  green: 'bg-green-50 text-green-700 border-green-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  gray: 'bg-surface-100 text-surface-600 border-surface-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
};

export function Badge({ children, variant = 'gray', className }: {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span className={clsx(
      'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border',
      badgeStyles[variant],
      className
    )}>
      {children}
    </span>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export function Card({ children, className, onClick }: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-white rounded-xl border border-surface-200 shadow-sm',
        onClick && 'cursor-pointer hover:border-brand-300 hover:shadow-md transition-all',
        className
      )}
    >
      {children}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export function Modal({ open, onClose, title, children, footer }: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
          <h3 className="font-semibold text-surface-900">{title}</h3>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-600 p-1">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-surface-200 flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

export function Spinner({ size = 20, className }: { size?: number; className?: string }) {
  return <Loader2 size={size} className={clsx('animate-spin text-brand-600', className)} />;
}

// ─── Score Ring ───────────────────────────────────────────────────────────────

export function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 80 ? '#16a34a' :
    score >= 60 ? '#d97706' :
    '#dc2626';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={8} />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <span className="absolute text-sm font-bold" style={{ color }}>{score}</span>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

export function EmptyState({ icon, title, description, action }: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 bg-surface-100 rounded-full flex items-center justify-center mb-4 text-surface-400">
        {icon}
      </div>
      <h3 className="font-semibold text-surface-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-surface-500 mb-4 max-w-xs">{description}</p>}
      {action}
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; variant: BadgeVariant }> = {
  PENDING: { label: 'Pending', variant: 'yellow' },
  IN_PROGRESS: { label: 'In Progress', variant: 'blue' },
  COMPLETED: { label: 'Completed', variant: 'purple' },
  EVALUATED: { label: 'Evaluated', variant: 'green' },
  EXPIRED: { label: 'Expired', variant: 'gray' },
  STRONG_HIRE: { label: 'Strong Hire', variant: 'green' },
  HIRE: { label: 'Hire', variant: 'green' },
  NEUTRAL: { label: 'Neutral', variant: 'yellow' },
  REJECT: { label: 'Reject', variant: 'red' },
  MOVE_FORWARD: { label: 'Move Forward', variant: 'green' },
  ON_HOLD: { label: 'On Hold', variant: 'orange' },
  EASY: { label: 'Easy', variant: 'green' },
  MEDIUM: { label: 'Medium', variant: 'yellow' },
  HARD: { label: 'Hard', variant: 'red' },
};

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { label: status, variant: 'gray' as BadgeVariant };
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

// ─── Page Header ──────────────────────────────────────────────────────────────

export function PageHeader({ title, description, action }: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-xl font-bold text-surface-900">{title}</h1>
        {description && <p className="text-sm text-surface-500 mt-0.5">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ─── Toast (simple) ───────────────────────────────────────────────────────────

export function useToast() {
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' }[]>([]);

  const show = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };

  const ToastContainer = () => (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className={clsx(
          'px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white min-w-48',
          t.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        )}>
          {t.message}
        </div>
      ))}
    </div>
  );

  return { show, ToastContainer };
}

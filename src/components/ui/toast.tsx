import { CircleCheckIcon, InfoIcon, OctagonXIcon, TriangleAlertIcon } from 'lucide-react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

/**
 * Terminal-style toasts (adapted from Afterglow's Sonner wrapper).
 * Uses the app's own slate/cyan palette and keeps rounded corners in both
 * light and dark mode, matching the rest of the UI.
 */
function Toaster(props: ToasterProps) {
  return (
    <Sonner
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4 text-emerald-600 dark:text-emerald-400" />,
        info: <InfoIcon className="size-4 text-cyan-600 dark:text-cyan-400" />,
        warning: <TriangleAlertIcon className="size-4 text-amber-600 dark:text-amber-400" />,
        error: <OctagonXIcon className="size-4 text-rose-600 dark:text-rose-400" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            'terminal-toast flex w-[var(--width)] items-center gap-2 rounded-lg border border-cyan-500/50 bg-white p-4 font-mono text-xs text-slate-700 shadow-lg dark:border-cyan-400/40 dark:bg-[#0B0F17] dark:text-slate-200 dark:shadow-[0_0_24px_rgb(34_211_238/0.12)] data-[type=success]:border-emerald-500/60 dark:data-[type=success]:border-emerald-400/50',
          content: 'flex min-w-0 flex-1 flex-col gap-0.5',
          title: 'font-semibold text-cyan-700 dark:text-cyan-300 group-data-[type=success]:text-emerald-700 dark:group-data-[type=success]:text-emerald-300',
          description: 'text-slate-500 dark:text-slate-400',
          icon: 'flex size-4 shrink-0 items-center',
          actionButton:
            'press ml-auto flex min-h-7 shrink-0 cursor-pointer items-center rounded-md bg-cyan-500 px-2 font-mono font-semibold text-slate-950 hover:bg-cyan-400',
          cancelButton:
            'press ml-auto flex min-h-7 shrink-0 cursor-pointer items-center rounded-md bg-slate-100 px-2 font-mono font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200',
        },
      }}
      {...props}
    />
  );
}

export { toast } from 'sonner';
export { Toaster };

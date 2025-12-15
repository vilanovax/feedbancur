"use client";

import * as React from "react";

interface AlertDialogContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const AlertDialogContext = React.createContext<AlertDialogContextType | undefined>(undefined);

interface AlertDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const AlertDialog = ({ open: controlledOpen, onOpenChange, children }: AlertDialogProps) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);

  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
  const setOpen = onOpenChange || setUncontrolledOpen;

  return (
    <AlertDialogContext.Provider value={{ open, setOpen }}>
      {children}
    </AlertDialogContext.Provider>
  );
};

const AlertDialogContent = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const context = React.useContext(AlertDialogContext);
  if (!context) throw new Error("AlertDialogContent must be used within AlertDialog");

  if (!context.open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={() => context.setOpen(false)} />
      <div className={`fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-lg sm:rounded-lg ${className || ""}`}>
        {children}
      </div>
    </>
  );
};

const AlertDialogHeader = ({ children }: { children: React.ReactNode }) => {
  return <div className="flex flex-col space-y-2 text-center sm:text-right">{children}</div>;
};

const AlertDialogFooter = ({ children }: { children: React.ReactNode }) => {
  return <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 sm:space-x-reverse mt-4">{children}</div>;
};

const AlertDialogTitle = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return <h2 className={`text-lg font-semibold text-gray-900 dark:text-white ${className || ""}`}>{children}</h2>;
};

const AlertDialogDescription = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return <p className={`text-sm text-gray-500 dark:text-gray-400 ${className || ""}`}>{children}</p>;
};

const AlertDialogAction = ({ onClick, children }: { onClick?: () => void; children: React.ReactNode }) => {
  const context = React.useContext(AlertDialogContext);

  return (
    <button
      type="button"
      onClick={() => {
        onClick?.();
        context?.setOpen(false);
      }}
      className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
    >
      {children}
    </button>
  );
};

const AlertDialogCancel = ({ onClick, children }: { onClick?: () => void; children: React.ReactNode }) => {
  const context = React.useContext(AlertDialogContext);

  return (
    <button
      type="button"
      onClick={() => {
        onClick?.();
        context?.setOpen(false);
      }}
      className="mt-2 sm:mt-0 inline-flex h-10 items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 transition-colors hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
    >
      {children}
    </button>
  );
};

export {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};

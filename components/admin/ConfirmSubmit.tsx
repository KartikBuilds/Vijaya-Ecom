"use client";
import type { MouseEvent } from "react";
export function ConfirmSubmit({ message, children, className }: { message: string; children: React.ReactNode; className?: string }) {
  return <button type="submit" className={className} onClick={(event: MouseEvent<HTMLButtonElement>) => { if (!window.confirm(message)) event.preventDefault(); }}>{children}</button>;
}

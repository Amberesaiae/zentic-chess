import { WarningCircle, X } from "@phosphor-icons/react";

type Props = {
  message?: string;
  onDismiss: () => void;
};

export function ErrorBanner({ message, onDismiss }: Props) {
  if (!message) return null;

  return <div className="inline-error" role="alert">
    <WarningCircle size={18} weight="fill" />
    <span>{message}</span>
    <button onClick={onDismiss} aria-label="Dismiss error" type="button"><X size={15} weight="bold" /></button>
  </div>;
}

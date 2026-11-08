interface FormServerErrorProps {
  message?: string;
  className?: string;
}

export function FormServerError({ message, className }: FormServerErrorProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className={
        className ||
        "rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-destructive text-sm font-medium text-center"
      }
    >
      {message}
    </div>
  );
}

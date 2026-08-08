interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps): React.ReactElement {
  return (
    <div
      className={['rounded-lg border border-gray-200 bg-surface p-4 shadow-sm', className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}

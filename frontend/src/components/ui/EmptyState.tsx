interface EmptyStateProps {
  title: string;
  description?: string;
}

export function EmptyState({ title, description }: EmptyStateProps): React.ReactElement {
  return (
    <div className="flex flex-col items-center gap-1 rounded border border-dashed border-gray-300 px-4 py-10 text-center">
      <p className="font-medium text-gray-700">{title}</p>
      {description !== undefined && <p className="text-sm text-gray-500">{description}</p>}
    </div>
  );
}

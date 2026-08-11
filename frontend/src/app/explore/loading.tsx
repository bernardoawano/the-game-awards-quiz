import { Spinner } from '@/components/ui/Spinner';

export default function Loading(): React.ReactElement {
  return (
    <div className="flex justify-center py-16">
      <Spinner />
    </div>
  );
}

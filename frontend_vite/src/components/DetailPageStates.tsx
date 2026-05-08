import { Spinner } from '@/components/ui/spinner';

export const LoadingScreen = () => (
    <div className="flex justify-center items-center h-screen bg-[var(--bg-light-primary)]">
        <Spinner className="h-12 w-12" />
    </div>
);

export const ErrorScreen = ({ message }: { message: string }) => (
    <p className="text-destructive text-center mt-8">{message}</p>
);

import { FileQuestion } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';

export default function NotFound() {
    return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <FileQuestion className="h-8 w-8 text-muted-foreground" />
            </div>
            <h1 className="mt-4 text-3xl font-bold">404 — Page not found</h1>
            <p className="mt-2 text-muted-foreground">
                The page you're looking for doesn't exist or has been moved.
            </p>
            <Link to="/documents" className="mt-6">
                <Button>Back to documents</Button>
            </Link>
        </div>
    );
}
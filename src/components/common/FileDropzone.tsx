import { File as FileIcon, FileSpreadsheet, FileText, Image as ImageIcon, Upload, X } from 'lucide-react';
import { useCallback, useRef, useState, type DragEvent } from 'react';
import { ALLOWED_EXTENSIONS, MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from '@/lib/constants';
import { cn, formatFileSize } from '@/lib/utils';

interface FileDropzoneProps {
  value?: File | null;
  onChange: (file: File | null) => void;
  error?: string;
  disabled?: boolean;
  progress?: number;
}

function getFileIcon(fileName: string) {
  const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
  if (['.png', '.jpg', '.jpeg'].includes(ext)) return ImageIcon;
  if (['.xls', '.xlsx'].includes(ext)) return FileSpreadsheet;
  if (['.pdf', '.doc', '.docx'].includes(ext)) return FileText;
  return FileIcon;
}

/** Validates a file against the same rules the server enforces. */
export function validateFile(file: File): string | null {
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return `File type "${ext}" is not allowed. Permitted: ${ALLOWED_EXTENSIONS.join(', ')}`;
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `File is ${formatFileSize(file.size)} — the maximum is ${MAX_FILE_SIZE_MB} MB.`;
  }
  if (file.size === 0) {
    return 'The selected file is empty.';
  }
  return null;
}

export function FileDropzone({ value, onChange, error, disabled, progress }: FileDropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      const validationError = validateFile(file);
      if (validationError) {
        setLocalError(validationError);
        onChange(null);
        return;
      }
      setLocalError(null);
      onChange(file);
    },
    [onChange],
  );

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    handleFile(e.dataTransfer.files?.[0]);
  };

  const displayError = error ?? localError;
  const Icon = value ? getFileIcon(value.name) : Upload;

  return (
    <div className="space-y-2">
      {!value ? (
        <div
          role="button"
          tabIndex={0}
          onClick={() => !disabled && inputRef.current?.click()}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors',
            dragging ? 'border-primary bg-primary/5' : 'border-input hover:border-primary/50 hover:bg-accent/40',
            disabled && 'cursor-not-allowed opacity-60',
            displayError && 'border-destructive',
          )}
        >
          <Upload className="h-9 w-9 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">
            Drop a file here, or <span className="text-primary">browse</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {ALLOWED_EXTENSIONS.join(', ')} — max {MAX_FILE_SIZE_MB} MB
          </p>

          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept={ALLOWED_EXTENSIONS.join(',')}
            disabled={disabled}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>
      ) : (
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{value.name}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(value.size)}</p>
            </div>

            {!disabled && (
              <button
                type="button"
                onClick={() => {
                  onChange(null);
                  setLocalError(null);
                  if (inputRef.current) inputRef.current.value = '';
                }}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                aria-label="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {typeof progress === 'number' && progress > 0 && progress < 100 && (
            <div className="mt-3">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{progress}% uploaded</p>
            </div>
          )}
        </div>
      )}

      {displayError && <p className="text-sm text-destructive">{displayError}</p>}
    </div>
  );
}
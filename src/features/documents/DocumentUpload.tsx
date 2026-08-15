import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Upload } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { documentApi, extractErrorMessage } from '@/api';
import { FileDropzone, FormField } from '@/components/common';
import {
  Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Select, Textarea,
} from '@/components/ui';
import { useAuth } from '@/hooks';
import { queryKeys } from '@/lib/queryKeys';
import { uploadDocumentSchema, type UploadDocumentFormValues } from '@/lib/validationSchemas';
import { DEPARTMENTS } from '@/types';

export default function DocumentUpload() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [progress, setProgress] = useState(0);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UploadDocumentFormValues>({
    resolver: zodResolver(uploadDocumentSchema),
    defaultValues: {
      title: '',
      description: '',
      department: user?.department ?? '',
      file: undefined as unknown as File,
    },
  });

  const mutation = useMutation({
    mutationFn: (values: UploadDocumentFormValues) =>
      documentApi.upload(
        {
          title: values.title,
          description: values.description || undefined,
          department: values.department,
          file: values.file,
        },
        setProgress,
      ),
    onSuccess: (document) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(`"${document.title}" uploaded and is pending approval.`);
      reset();
      setProgress(0);
      navigate(`/documents/${document.documentId}`);
    },
    onError: (error) => {
      setProgress(0);
      toast.error(extractErrorMessage(error, 'Upload failed.'));
    },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/documents">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Upload a document</h1>
          <p className="text-sm text-muted-foreground">
            Uploaded documents start as <span className="font-medium">Pending</span> until an
            approver reviews them.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Document details</CardTitle>
          <CardDescription>
            File type and size are validated on the server as well as here.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handleSubmit((values) => mutation.mutate(values))}
            className="space-y-5"
            noValidate
          >
            <FormField label="Title" htmlFor="title" required error={errors.title?.message}>
              <Input
                id="title"
                placeholder="e.g. Q3 Financial Report"
                error={!!errors.title}
                disabled={mutation.isPending}
                {...register('title')}
              />
            </FormField>

            <FormField
              label="Department"
              htmlFor="department"
              required
              error={errors.department?.message}
            >
              <Select
                id="department"
                error={!!errors.department}
                disabled={mutation.isPending}
                {...register('department')}
              >
                <option value="">Select a department…</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField
              label="Description"
              htmlFor="description"
              error={errors.description?.message}
              hint="Optional — up to 1000 characters."
            >
              <Textarea
                id="description"
                rows={3}
                placeholder="Brief summary of the document…"
                disabled={mutation.isPending}
                {...register('description')}
              />
            </FormField>

            <FormField label="File" required error={errors.file?.message as string | undefined}>
              <Controller
                name="file"
                control={control}
                render={({ field }) => (
                  <FileDropzone
                    value={field.value ?? null}
                    onChange={(file) => field.onChange(file ?? undefined)}
                    disabled={mutation.isPending}
                    progress={mutation.isPending ? progress : undefined}
                  />
                )}
              />
            </FormField>

            <div className="flex justify-end gap-2 border-t pt-4">
              <Link to="/documents">
                <Button type="button" variant="outline" disabled={mutation.isPending}>
                  Cancel
                </Button>
              </Link>
              <Button type="submit" loading={mutation.isPending}>
                <Upload className="h-4 w-4" />
                {mutation.isPending ? `Uploading… ${progress}%` : 'Upload document'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
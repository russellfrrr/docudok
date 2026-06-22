import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Upload,
  X,
} from 'lucide-react';
import type { ChangeEvent, RefObject } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatFileSize } from '@/lib/format';
import { PDF_MIME_TYPE } from '@/lib/upload';

interface DocumentUploadCardProps {
  title: string;
  selectedFile: File | null;
  fileError: string;
  uploadIsPending: boolean;
  uploadIsSuccess: boolean;
  uploadErrorMessage: string | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onTitleChange: (title: string) => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onClearFile: () => void;
  onSubmit: () => void;
}

export const DocumentUploadCard = ({
  title,
  selectedFile,
  fileError,
  uploadIsPending,
  uploadIsSuccess,
  uploadErrorMessage,
  fileInputRef,
  onTitleChange,
  onFileChange,
  onClearFile,
  onSubmit,
}: DocumentUploadCardProps) => {
  return (
    <Card className="mb-6 border bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Upload PDF</CardTitle>
      </CardHeader>

      <CardContent>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <Input
            placeholder="Document title optional"
            aria-label="Document title"
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
          />

          <div className="rounded-lg border border-dashed bg-background p-5">
            <input
              ref={fileInputRef}
              type="file"
              accept={PDF_MIME_TYPE}
              className="hidden"
              onChange={onFileChange}
            />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-md border bg-muted">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {selectedFile ? selectedFile.name : 'Choose a PDF document'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedFile
                      ? `Ready to upload - ${formatFileSize(selectedFile.size)}`
                      : 'PDF files only, up to 10MB'}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Choose PDF file"
                >
                  Choose file
                </Button>

                {selectedFile && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={onClearFile}
                    aria-label="Clear selected file"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-fit"
            disabled={!selectedFile || Boolean(fileError) || uploadIsPending}
          >
            <Upload className="h-4 w-4" />
            {uploadIsPending ? 'Uploading...' : 'Upload document'}
          </Button>
        </form>

        {fileError && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{fileError}</AlertDescription>
          </Alert>
        )}

        {uploadIsSuccess && (
          <Alert className="mt-4">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Document uploaded. It may take a moment to finish processing.
            </AlertDescription>
          </Alert>
        )}

        {uploadErrorMessage && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{uploadErrorMessage}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

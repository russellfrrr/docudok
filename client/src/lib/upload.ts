export const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024;
export const PDF_MIME_TYPE = 'application/pdf';

export const getPdfFileError = (file: File): string => {
  if (file.type !== PDF_MIME_TYPE) {
    return 'Only PDF files are allowed';
  }

  if (file.size > MAX_PDF_SIZE_BYTES) {
    return 'PDF file must be 10MB or smaller';
  }

  return '';
};

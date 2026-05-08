import { FileText } from 'lucide-react';

export const AppLogo = () => {
  return (
    <div className="flex items-center gap-2">
      <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <FileText className="size-4" />
      </div>
      <div className="leading-none">
        <div className="text-sm font-semibold text-foreground">DocuDok</div>
        <div className="text-xs text-muted-foreground">Document intelligence</div>
      </div>
    </div>
  );
};

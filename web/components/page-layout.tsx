import { cn } from "@/lib/utils";

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function PageLayout({ children, className }: PageLayoutProps): React.ReactElement {
  return (
    <div className={cn("min-h-screen bg-background", className)}>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {children}
      </div>
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ 
  title, 
  description, 
  actions,
  className 
}: PageHeaderProps): React.ReactElement {
  return (
    <div className={cn("mb-6 sm:mb-8", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

interface PageContentProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContent({ children, className }: PageContentProps): React.ReactElement {
  return (
    <div className={cn(className)}>
      {children}
    </div>
  );
}

import { Skeleton } from '@/components/ui/skeleton';

export function ProfileHeroSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm p-4 sm:p-6">
      <div className="flex items-start justify-between gap-2 mb-4 sm:mb-5">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          <Skeleton className="h-16 w-16 sm:h-20 sm:w-20 rounded-full shrink-0" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-6 sm:h-8 w-40 max-w-full" />
            <Skeleton className="h-3 sm:h-4 w-24 max-w-full" />
          </div>
        </div>
        <Skeleton className="h-8 w-8 sm:w-20 rounded-md shrink-0" />
      </div>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-background p-3 sm:p-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Skeleton className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg shrink-0" />
            <div className="space-y-1.5 min-w-0 w-full">
              <Skeleton className="h-2.5 w-12" />
              <Skeleton className="h-4 sm:h-5 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TabsSkeleton() {
  return (
    <div className="w-full">
      <div className="grid w-full grid-cols-4 bg-card border border-border h-auto p-1 gap-1 rounded-md">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 sm:h-9 w-full rounded-sm" />
        ))}
      </div>
      <div className="mt-4 space-y-4">
        <div className="rounded-xl border border-border bg-card shadow-sm p-4 space-y-3">
          <Skeleton className="h-5 w-40" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-7 w-24 rounded-full" />
            <Skeleton className="h-7 w-28 rounded-full" />
            <Skeleton className="h-7 w-20 rounded-full" />
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card shadow-sm p-4 space-y-3">
          <Skeleton className="h-5 w-44" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SidebarWidgetSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm p-5 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <Skeleton className="h-9 w-full rounded-md" />
    </div>
  );
}

export default function ProfilePageSkeleton() {
  return (
    <div className="container max-w-6xl px-3 sm:px-4">
      <ProfileHeroSkeleton />
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        <div className="min-w-0">
          <TabsSkeleton />
        </div>
        <aside className="space-y-4">
          <SidebarWidgetSkeleton />
          <SidebarWidgetSkeleton />
          <SidebarWidgetSkeleton />
        </aside>
      </div>
    </div>
  );
}

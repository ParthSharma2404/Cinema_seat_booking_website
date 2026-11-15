import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className = '', ...props }: SkeletonProps) {
  return (
    <div
      className={`skeleton-shimmer rounded-2xl ${className}`}
      {...props}
    />
  );
}

// 4 Metric Cards Skeleton for Dashboard
export function StatsGridSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="p-6 rounded-3xl border border-white/10 bg-[#0d0f17]/90 shadow-2xl backdrop-blur-xl space-y-3"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-20 rounded-md" />
            <Skeleton className="h-5 w-5 rounded-full" />
          </div>
          <Skeleton className="h-8 w-28 rounded-lg" />
          <div className="flex items-center gap-2 pt-1">
            <Skeleton className="h-3 w-16 rounded-md" />
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-3 w-16 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Table Skeleton with Shimmer Rows
export function TableSkeleton({ rows = 6, cols = 8 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#0d0f17]/90 overflow-hidden shadow-2xl backdrop-blur-xl animate-pulse">
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <Skeleton className="h-4 w-48 rounded-md" />
        <Skeleton className="h-4 w-24 rounded-full" />
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div
            key={rIdx}
            className="flex items-center justify-between gap-4 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04]"
          >
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-36 rounded-md" />
              <Skeleton className="h-2.5 w-24 rounded-md" />
            </div>
            <Skeleton className="h-3.5 w-20 rounded-md hidden sm:block" />
            <Skeleton className="h-3.5 w-12 rounded-md" />
            <Skeleton className="h-3.5 w-12 rounded-md hidden md:block" />
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-3.5 w-16 rounded-md" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Movie Catalog Grid Skeleton
export function MovieCatalogSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="p-5 rounded-3xl border border-white/10 bg-[#0d0f17]/90 shadow-2xl backdrop-blur-xl flex flex-col justify-between gap-4"
        >
          <div className="flex gap-4 items-start">
            <Skeleton className="w-20 aspect-[2/3] rounded-2xl shrink-0" />
            <div className="flex-1 space-y-2.5 min-w-0">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-16 rounded-md" />
                <Skeleton className="h-4 w-10 rounded-full" />
              </div>
              <Skeleton className="h-4 w-32 rounded-md" />
              <Skeleton className="h-3 w-full rounded-md" />
              <Skeleton className="h-3 w-3/4 rounded-md" />
              <div className="flex items-center gap-2 pt-1">
                <Skeleton className="h-2.5 w-12 rounded-md" />
                <Skeleton className="h-2.5 w-16 rounded-md" />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-20 rounded-full" />
              <Skeleton className="h-7 w-24 rounded-full" />
            </div>
            <Skeleton className="h-7 w-7 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Staff Screening Sidebar Skeleton
export function StaffScreeningSkeleton() {
  return (
    <div className="space-y-3.5 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <Skeleton className="h-4 w-32 rounded-md" />
              <Skeleton className="h-3 w-24 rounded-md" />
            </div>
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
          <div className="flex justify-between">
            <Skeleton className="h-2.5 w-20 rounded-md" />
            <Skeleton className="h-2.5 w-14 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Checkout Page Skeleton
export function CheckoutSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-pulse">
      <div className="lg:col-span-7 space-y-6">
        <div className="rounded-3xl border border-white/10 bg-[#0d0f17]/90 p-8 space-y-6 shadow-2xl backdrop-blur-xl">
          <div className="space-y-2">
            <Skeleton className="h-3 w-32 rounded-md" />
            <div className="grid grid-cols-3 gap-3">
              <Skeleton className="h-16 rounded-2xl" />
              <Skeleton className="h-16 rounded-2xl" />
              <Skeleton className="h-16 rounded-2xl" />
            </div>
          </div>
          <Skeleton className="h-20 rounded-2xl" />
          <div className="space-y-4 pt-2">
            <Skeleton className="h-12 w-full rounded-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-12 rounded-full" />
              <Skeleton className="h-12 rounded-full" />
            </div>
            <Skeleton className="h-14 w-full rounded-full" />
          </div>
        </div>
      </div>
      <div className="lg:col-span-5 space-y-4">
        <div className="rounded-3xl border border-white/10 bg-[#0d0f17]/90 p-7 space-y-5 shadow-2xl backdrop-blur-xl">
          <div className="flex justify-between">
            <Skeleton className="h-3 w-24 rounded-md" />
            <Skeleton className="h-3 w-28 rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16 rounded-full" />
            <Skeleton className="h-6 w-44 rounded-md" />
            <Skeleton className="h-3 w-36 rounded-md" />
          </div>
          <div className="space-y-3 pt-3 border-t border-white/10">
            <Skeleton className="h-3.5 w-full rounded-md" />
            <Skeleton className="h-3.5 w-full rounded-md" />
            <Skeleton className="h-3.5 w-full rounded-md" />
          </div>
          <div className="pt-4 border-t border-white/10 flex justify-between items-baseline">
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-7 w-28 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Full Admin Layout Page Skeleton
export function AdminLayoutSkeleton() {
  return (
    <div className="min-h-screen bg-[#090b10] text-zinc-100 font-sans relative pt-24 px-4 sm:px-8 pb-16 max-w-7xl mx-auto w-full space-y-8 animate-pulse">
      {/* Admin Management Strip Skeleton */}
      <div className="p-6 sm:p-7 rounded-3xl border border-white/10 bg-[#0d0f17]/90 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-5 w-48 rounded-md" />
              <Skeleton className="h-4 w-14 rounded-full" />
            </div>
            <Skeleton className="h-3 w-64 rounded-md" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-28 rounded-full" />
          <Skeleton className="h-8 w-28 rounded-full" />
        </div>
      </div>

      {/* Tabs Strip Skeleton */}
      <div className="flex items-center gap-2 p-1.5 rounded-full bg-[#0d0f17]/90 border border-white/10 max-w-fit">
        <Skeleton className="h-8 w-36 rounded-full" />
        <Skeleton className="h-8 w-28 rounded-full" />
        <Skeleton className="h-8 w-36 rounded-full" />
        <Skeleton className="h-8 w-28 rounded-full" />
        <Skeleton className="h-8 w-32 rounded-full" />
      </div>

      {/* Main Content Skeleton */}
      <StatsGridSkeleton />
      <TableSkeleton rows={6} />
    </div>
  );
}

// Auditorium Seating Matrix Skeleton for Shows/Auditorium Editor
export function AuditoriumLayoutSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 rounded-3xl bg-[#0d0f17]/90 border border-white/10 space-y-2">
            <Skeleton className="h-3 w-20 rounded-md" />
            <Skeleton className="h-7 w-24 rounded-lg" />
            <Skeleton className="h-2.5 w-16 rounded-md" />
          </div>
        ))}
      </div>

      {/* Multiplier Bar Skeleton */}
      <div className="p-5 rounded-3xl bg-[#0d0f17]/90 border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-44 rounded-md" />
          <Skeleton className="h-3 w-64 rounded-md" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      </div>

      {/* Visual Seating Chamber Skeleton */}
      <div className="p-8 rounded-3xl bg-[#0d0f17]/90 border border-white/10 flex flex-col items-center space-y-6">
        <Skeleton className="h-5 w-64 rounded-full" />
        <div className="space-y-2.5 w-full max-w-xl">
          {Array.from({ length: 6 }).map((_, r) => (
            <div key={r} className="flex items-center justify-center gap-2">
              <Skeleton className="h-6 w-6 rounded-md" />
              <div className="flex gap-1.5">
                {Array.from({ length: 4 }).map((_, s) => (
                  <Skeleton key={s} className="h-6 w-6 rounded-md" />
                ))}
              </div>
              <div className="w-4" />
              <div className="flex gap-1.5">
                {Array.from({ length: 4 }).map((_, s) => (
                  <Skeleton key={s} className="h-6 w-6 rounded-md" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Staff Layout Skeleton
export function StaffLayoutSkeleton() {
  return (
    <div className="min-h-screen bg-[#090b10] text-zinc-100 pt-24 pb-16 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto space-y-8 font-sans animate-pulse">
      {/* Staff Header Strip */}
      <div className="p-6 sm:p-7 rounded-3xl bg-[#0d0f17]/90 border border-white/10 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-5 w-48 rounded-md" />
              <Skeleton className="h-4 w-20 rounded-full" />
            </div>
            <Skeleton className="h-3 w-64 rounded-md" />
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-8 w-28 rounded-full" />
        </div>
      </div>

      {/* 2-Column Operational Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-3xl bg-[#0d0f17]/90 border border-white/10 p-6 sm:p-8 space-y-6">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-40 rounded-md" />
              <Skeleton className="h-3 w-28 rounded-md" />
            </div>
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-full" />
          </div>
        </div>
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-3xl bg-[#0d0f17]/90 border border-white/10 p-6 space-y-4">
            <Skeleton className="h-4 w-36 rounded-md" />
            <StaffScreeningSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}

// Authentication Card Skeleton (Login / Register)
export function AuthCardSkeleton() {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#0d0f17]/90 p-8 shadow-2xl backdrop-blur-xl font-sans space-y-6 animate-pulse">
      <div className="flex flex-col items-center space-y-3">
        <Skeleton className="w-12 h-12 rounded-2xl" />
        <Skeleton className="h-6 w-48 rounded-md" />
        <Skeleton className="h-3 w-64 rounded-md" />
      </div>

      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5">
        <Skeleton className="h-2.5 w-36 rounded-md" />
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-8 rounded-full" />
          <Skeleton className="h-8 rounded-full" />
          <Skeleton className="h-8 rounded-full" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-24 rounded-md" />
          <Skeleton className="h-11 w-full rounded-full" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-20 rounded-md" />
          <Skeleton className="h-11 w-full rounded-full" />
        </div>
        <Skeleton className="h-12 w-full rounded-full" />
      </div>
    </div>
  );
}

export default function SettingsLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-slate-200 border-t-slate-800" />
        <p className="text-sm font-medium text-slate-500">Loading...</p>
      </div>
    </div>
  );
}

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t bg-white/50 px-6 py-4 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/50">
      <div className="flex flex-col items-center justify-between gap-2 text-gray-400 text-xs dark:text-gray-500 sm:flex-row">
        <p>© {year} Exceed Training Center. All rights reserved.</p>
        <p className="flex items-center gap-1">
          Powered by{" "}
          <span className="font-semibold text-gray-600 dark:text-gray-400">
            Dev Fraol
          </span>
          <span className="text-base">⚡</span>
        </p>
      </div>
    </footer>
  );
}

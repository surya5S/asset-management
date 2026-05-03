export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-surface-border
                       bg-surface-card/80 backdrop-blur-md"
    >
      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 h-12 flex items-center
                      justify-between"
      >
        <p className="text-surface-muted text-xs">
          © {year} AssetManager. All rights reserved.
        </p>
        <div className="flex items-center gap-4">
          <span className="text-surface-muted text-xs">
            Built with .NET · React · PostgreSQL
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        </div>
      </div>
    </footer>
  );
}

/*
  CONCEPTS IN THIS FILE:
  ─────────────────────────────────────────────
  1. Fixed Footer                 - `fixed bottom-0 left-0 right-0` pins the footer to the
                                    bottom of the viewport. Always visible regardless of scroll.
  2. z-30                         - Below the navbar (z-40) and modals (z-50) in the stack.
                                    Correct stacking order: footer → navbar → modal.
  3. animate-pulse                - Tailwind's built-in pulse animation. The green dot
                                    pulses to indicate the app is live/connected. Small
                                    but effective status indicator.
  4. Dynamic year                 - `new Date().getFullYear()` keeps the copyright year
                                    current automatically. Never manually update it again.
*/

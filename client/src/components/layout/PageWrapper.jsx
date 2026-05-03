export default function PageWrapper({ children }) {
  return (
    <main className="min-h-screen pt-20 pb-16 bg-surface">{children}</main>
  );
}

/*
  CONCEPTS IN THIS FILE:
  ─────────────────────────────────────────────
  1. Layout Component             - Wraps every page with consistent spacing. pt-20 clears
                                    the fixed navbar (64px + breathing room). pb-16 clears
                                    the fixed footer (48px + breathing room).
  2. children prop                - The standard React pattern for wrapper components.
                                    Whatever JSX you put between <PageWrapper> tags becomes
                                    `children` and renders in the slot.
  3. Single source of layout      - Change pt-20 here once and every page updates.
                                    No copy-pasting padding values across 10 page files.
*/

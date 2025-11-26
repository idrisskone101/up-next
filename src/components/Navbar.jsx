// Upnext logo icon component
const UpnextLogo = (props) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M7 3L17 12L7 21V3Z"
      fill="currentColor"
      className="text-primary"
    />
    <rect x="18" y="3" width="3" height="18" fill="currentColor" className="text-primary" />
  </svg>
);

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/30">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-3 text-foreground hover:text-primary transition-colors group"
          aria-label="upNext home"
        >
          <UpnextLogo className="h-8 w-8 text-primary transition-transform group-hover:scale-110" />
          <span className="text-xl font-bold tracking-tighter">upNext</span>
        </button>
      </div>
    </header>
  );
}

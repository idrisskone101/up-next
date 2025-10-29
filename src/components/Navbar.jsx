import { useState, useEffect, useRef } from "react";
import { Menu, User } from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

const cn = (...classes) => classes.filter(Boolean).join(' ');

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

// Simple mobile menu
const MobileMenu = ({ isOpen, onClose, navigationLinks }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-0 top-0 bottom-0 w-64 bg-background border-r border-border/40 p-6 shadow-lg animate-slide-in">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2 text-lg font-bold">
            <UpnextLogo className="h-6 w-6" />
            <span>Upnext</span>
          </div>
          <nav className="flex flex-col gap-2">
            {navigationLinks.map((link) => (
              <button
                key={link.label}
                onClick={(e) => {
                  e.preventDefault();
                  onClose();
                }}
                className={cn(
                  "px-4 py-2 text-left rounded-md transition-colors",
                  link.active
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-foreground/80 hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {link.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
};

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const navigationLinks = [
    { label: "Home", active: true },
    { label: "My Watchlist", active: false },
    { label: "Genres", active: false },
  ];

  useEffect(() => {
    const checkWidth = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          {/* Left side */}
          <div className="flex items-center gap-6">
            {/* Mobile menu button */}
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}

            {/* Logo */}
            <button
              onClick={(e) => e.preventDefault()}
              className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
            >
              <UpnextLogo className="h-6 w-6" />
              <span className="text-xl font-bold">Upnext</span>
            </button>

            {/* Desktop navigation */}
            {!isMobile && (
              <nav className="flex items-center gap-1">
                {navigationLinks.map((link) => (
                  <button
                    key={link.label}
                    onClick={(e) => e.preventDefault()}
                    className={cn(
                      "relative px-4 py-2 text-sm font-medium transition-colors rounded-md",
                      "before:absolute before:bottom-0 before:left-0 before:right-0 before:h-0.5 before:bg-primary before:scale-x-0 before:transition-transform before:duration-300 hover:before:scale-x-100",
                      link.active
                        ? "text-primary before:scale-x-100"
                        : "text-foreground/80 hover:text-foreground hover:bg-accent"
                    )}
                  >
                    {link.label}
                  </button>
                ))}
              </nav>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-sm font-medium"
              onClick={(e) => e.preventDefault()}
            >
              Log In
            </Button>
            <Avatar className="h-9 w-9 cursor-pointer hover:opacity-80 transition-opacity">
              <AvatarFallback className="bg-[#D4B896] text-white text-sm font-medium">
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        navigationLinks={navigationLinks}
      />
    </>
  );
}

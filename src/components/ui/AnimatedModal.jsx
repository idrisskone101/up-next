import { cn } from "../../lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const ModalContext = createContext(undefined);

export const ModalProvider = ({ children }) => {
  const [open, setOpen] = useState(false);

  return (
    <ModalContext.Provider value={{ open, setOpen }}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};

export function Modal({ children }) {
  return <ModalProvider>{children}</ModalProvider>;
}

export const ModalTrigger = ({ children, className }) => {
  const { setOpen } = useModal();
  return (
    <button
      className={cn(
        "px-4 py-2 rounded-md",
        className
      )}
      onClick={() => setOpen(true)}
    >
      {children}
    </button>
  );
};

export const ModalBody = ({ children, className }) => {
  const { open, setOpen } = useModal();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
    } else {
      document.body.style.overflow = "auto";
      document.body.style.position = "";
      document.body.style.width = "";
    }
  }, [open]);

  const modalRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, setOpen]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, backdropFilter: "blur(10px)" }}
          exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
          className="fixed inset-0 h-full w-full flex items-end md:items-center justify-center z-50"
        >
          <Overlay />
          <motion.div
            ref={modalRef}
            className={cn(
              "w-full h-dvh md:h-auto md:max-h-[90vh] md:max-w-4xl glass border border-white/20 md:rounded-2xl relative z-50 flex flex-col overflow-hidden",
              className
            )}
            initial={{ opacity: 0, scale: 0.5, rotateX: 40, y: 40 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, rotateX: 10 }}
            transition={{ type: "spring", stiffness: 260, damping: 15 }}
          >
            <CloseIcon />
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const ModalContent = ({ children, className }) => {
  return (
    <div className={cn("flex flex-col flex-1 p-4 md:p-8 pb-safe overflow-y-auto", className)}>
      {children}
    </div>
  );
};

const Overlay = ({ className }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, backdropFilter: "blur(10px)" }}
      exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
      className={cn("fixed inset-0 h-full w-full bg-black/80 z-50", className)}
    />
  );
};

const CloseIcon = () => {
  const { setOpen } = useModal();
  return (
    <button
      onClick={() => setOpen(false)}
      className="sticky top-4 right-4 z-10 float-right p-3 glass rounded-full hover:bg-white/20 transition-colors active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center"
      aria-label="Close modal"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-white h-6 w-6 group-hover:scale-125 group-hover:rotate-3 transition duration-200"
      >
        <path d="M18 6l-12 12" />
        <path d="M6 6l12 12" />
      </svg>
    </button>
  );
};

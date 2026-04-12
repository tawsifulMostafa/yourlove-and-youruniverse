"use client";

export default function Modal({ isOpen, onClose, children, maxWidth = "max-w-2xl" }) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className={`w-full ${maxWidth} rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]`}
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
}

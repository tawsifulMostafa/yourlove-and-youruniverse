"use client";

export default function Modal({ isOpen, onClose, children, maxWidth = "max-w-2xl" }) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className={`w-full ${maxWidth} rounded-3xl bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.12)]`}
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
}
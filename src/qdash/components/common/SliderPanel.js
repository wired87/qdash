import React, { useEffect } from "react";
import { Button } from "@heroui/react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SliderPanel = ({
    isOpen,
    onClose,
    title,
    subtitle,
    children,
    side = "right",
    width = "400px",
    className = "",
}) => {
    // Close on escape key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    const variants = {
        closed: {
            x: side === "right" ? "100%" : "-100%",
            opacity: 0,
            transition: { type: "spring", stiffness: 300, damping: 30 }
        },
        open: {
            x: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 300, damping: 30 }
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[49]"
                    />

                    {/* Panel */}
                    <motion.div
                        initial="closed"
                        animate="open"
                        exit="closed"
                        variants={variants}
                        style={{ width }}
                        className={`fixed top-0 ${side === "right" ? "right-0" : "left-0"} h-screen bg-slate-50 dark:bg-slate-950 z-[50] flex flex-col ${className}`}
                    >
                        {/* Header */}
                        <div className="flex-shrink-0 p-5 flex justify-between items-center bg-white dark:bg-slate-900">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                                    {title}
                                </h2>
                                {subtitle && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        {subtitle}
                                    </p>
                                )}
                            </div>
                            <Button
                                isIconOnly
                                variant="light"
                                onPress={onClose}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <X size={20} />
                            </Button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default SliderPanel;

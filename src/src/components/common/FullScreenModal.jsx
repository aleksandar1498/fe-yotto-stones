"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export default function FullScreenModal({ isOpen, onClose, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-[2000]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal Content */}
          <motion.div
            className="fixed inset-0 z-[2003] flex flex-col"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {/* Close Button */}
            <div className="absolute top-4 right-4 z-[2004]">
              <button
                onClick={onClose}
                className="bg-gray-200 hover:bg-red-500 hover:text-white rounded-full p-2 transition"
                aria-label="Затвори"
              >
                <X size={20} />
              </button>
            </div>

            {/* BabylonScene or any content */}
            <motion.div
              className="flex-1 z-[2003]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.4 }}
            >
              {children}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

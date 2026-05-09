import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, LogOut, Settings } from 'lucide-react';

/**
 * UserInfoCard: Fixed top-right corner component displaying user info
 * Shows avatar, email, and provides logout action
 */
const UserInfoCard = ({ user, userProfile, onLogout, loading }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const displayName = user.displayName || user.email?.split('@')[0] || 'User';
  const photoURL = user.photoURL;
  const email = user.email;

  return (
    <div className="fixed top-4 right-4 z-[100]">
      <motion.div
        className="relative"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Main User Badge Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-400/30 hover:border-blue-400/60 backdrop-blur-md hover:bg-gradient-to-br hover:from-blue-500/30 hover:to-purple-500/30 transition-all duration-200 shadow-lg"
        >
          {photoURL ? (
            <img
              src={photoURL}
              alt={displayName}
              className="w-7 h-7 rounded-full object-cover ring-2 ring-blue-400/50"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex flex-col items-start gap-0.5 max-w-[150px]">
            <span className="text-xs font-semibold text-white truncate">
              {displayName}
            </span>
            <span className="text-[10px] text-blue-200/70 truncate">
              {email}
            </span>
          </div>

          <ChevronDown
            className={`w-3.5 h-3.5 text-blue-300 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full right-0 mt-2 w-56 rounded-lg bg-slate-900/95 border border-blue-400/30 backdrop-blur-md shadow-2xl overflow-hidden z-50"
            >
              {/* User Profile Section */}
              <div className="p-4 border-b border-blue-400/20">
                <div className="flex items-center gap-3">
                  {photoURL ? (
                    <img
                      src={photoURL}
                      alt={displayName}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-400/50"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">
                      {displayName}
                    </p>
                    <p className="text-xs text-blue-300/70 truncate">
                      {email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="p-2 flex flex-col gap-1">
                <button className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-blue-200 hover:bg-blue-500/20 transition-colors duration-150">
                  <Settings className="w-4 h-4" />
                  <span>Account Settings</span>
                </button>

                <button
                  onClick={() => {
                    setIsOpen(false);
                    onLogout();
                  }}
                  disabled={loading}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-red-300 hover:bg-red-500/20 transition-colors duration-150 disabled:opacity-50"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{loading ? 'Signing out...' : 'Sign Out'}</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default UserInfoCard;

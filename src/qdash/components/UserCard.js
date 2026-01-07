import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Shield, CreditCard, LogOut, Info, Settings } from 'lucide-react';
import { Button } from '@heroui/react';

export const UserCard = ({ user, userProfile, onLogout }) => {
    const [isHovered, setIsHovered] = useState(false);

    if (!user) return null;

    return (
        <div
            className="fixed top-4 right-4 z-[110]"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <motion.div
                initial={false}
                animate={isHovered ? { width: 320, height: 'auto' } : { width: 48, height: 48 }}
                className="bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-2xl rounded-[24px] overflow-hidden transition-all duration-300 ease-out"
                style={{
                    boxShadow: isHovered
                        ? '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.8) inset'
                        : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.8) inset'
                }}
            >
                {/* Compact State (Avatar/Initial) */}
                <div className="h-[48px] w-full flex items-center justify-center cursor-pointer">
                    {!isHovered && (
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs ring-2 ring-blue-100 ring-offset-2 ring-offset-white/10">
                            {user.email?.charAt(0).toUpperCase() || 'U'}
                        </div>
                    )}
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                    {isHovered && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="p-6 pt-0"
                        >
                            {/* Profile Header */}
                            <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-5">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                    <User size={28} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-slate-900 truncate">{user.email || 'Anonymous User'}</h4>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Session</p>
                                    </div>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="space-y-4">
                                <div className="group/item">
                                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-tight mb-1.5 group-hover/item:text-blue-500 transition-colors">
                                        <div className="flex items-center gap-1.5">
                                            <Shield size={12} />
                                            <span>User Identity</span>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 font-mono text-xs text-slate-600 break-all leading-relaxed shadow-sm">
                                        {user.uid}
                                    </div>
                                </div>

                                <div className="group/item">
                                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-tight mb-1.5 group-hover/item:text-blue-500 transition-colors">
                                        <div className="flex items-center gap-1.5">
                                            <CreditCard size={12} />
                                            <span>Pricing Plan</span>
                                        </div>
                                        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">
                                            {userProfile?.plan || 'Free Tier'}
                                        </span>
                                    </div>
                                    <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 flex items-center justify-between shadow-sm">
                                        <span className="text-xs font-semibold text-slate-700">Compute Balance</span>
                                        <span className="text-xs font-black text-blue-600">
                                            {userProfile?.balance?.compute_hours || 0} hrs
                                        </span>
                                    </div>
                                </div>

                                <div className="group/item">
                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-tight mb-1.5 group-hover/item:text-blue-500 transition-colors">
                                        <Info size={12} />
                                        <span>General Info</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="flex-1 bg-slate-50/80 rounded-xl p-3 border border-slate-100 text-center shadow-sm">
                                            <div className="text-[10px] text-slate-400 font-bold mb-1 uppercase">Region</div>
                                            <div className="text-xs font-black text-slate-700 uppercase">Eu-Central</div>
                                        </div>
                                        <div className="flex-1 bg-slate-50/80 rounded-xl p-3 border border-slate-100 text-center shadow-sm">
                                            <div className="text-[10px] text-slate-400 font-bold mb-1 uppercase">Status</div>
                                            <div className="text-xs font-black text-emerald-600 uppercase">Verified</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="mt-6 pt-5 border-t border-slate-100 flex gap-2">
                                <Button
                                    size="sm"
                                    color="danger"
                                    variant="flat"
                                    className="flex-1 font-bold rounded-xl h-10 border border-red-50 hover:bg-red-500 hover:text-white transition-all duration-300"
                                    onPress={onLogout}
                                    startContent={<LogOut size={16} />}
                                >
                                    Log Out
                                </Button>
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant="flat"
                                    className="rounded-xl h-10 w-10 border border-slate-100 group/settings bg-slate-50"
                                >
                                    <Settings size={18} className="text-slate-400 group-hover/settings:text-slate-600 group-hover/settings:rotate-45 transition-all duration-500" />
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

import React, { useState } from 'react';
import {
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    Input,
    Button,
    Divider,
    Link,
    Image
} from "@heroui/react";
import { motion } from "framer-motion";

export const AuthForm = ({ onLogin, onSignup, onGoogleLogin, error }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isLogin) {
            onLogin(email, password);
        } else {
            onSignup(email, password);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-950 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="z-10 w-full max-w-md px-4"
            >
                <Card className="w-full bg-slate-900/80 backdrop-blur-xl">
                    <CardHeader className="flex flex-col gap-3 items-center pt-8 pb-6">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center mb-2 shadow-lg shadow-blue-500/20">
                            <span className="text-3xl font-bold text-white">Q</span>
                        </div>
                        <div className="text-center">
                            <h1 className="text-2xl font-bold text-white tracking-tight">
                                {isLogin ? 'Welcome Back' : 'Create Account'}
                            </h1>
                            <p className="text-slate-400 text-sm mt-1">
                                {isLogin ? 'Enter your credentials to access the engine' : 'Sign up to start your journey'}
                            </p>
                        </div>
                    </CardHeader>

                    <CardBody className="px-8 py-4">
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <Input
                                type="email"
                                label="Email"
                                placeholder="Enter your email"
                                variant="bordered"
                                classNames={{
                                    inputWrapper: "bg-slate-800/50",
                                    label: "text-slate-400",
                                    input: "text-slate-200"
                                }}
                                value={email}
                                onValueChange={setEmail}
                                isRequired
                            />
                            <Input
                                type="password"
                                label="Password"
                                placeholder="Enter your password"
                                variant="bordered"
                                classNames={{
                                    inputWrapper: "bg-slate-800/50",
                                    label: "text-slate-400",
                                    input: "text-slate-200"
                                }}
                                value={password}
                                onValueChange={setPassword}
                                isRequired
                            />

                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 text-red-400 text-sm text-center">
                                    {error.message || "An error occurred. Please try again."}
                                </div>
                            )}

                            <Button
                                type="submit"
                                color="primary"
                                size="lg"
                                className="w-full font-semibold shadow-lg shadow-blue-500/20 mt-2"
                            >
                                {isLogin ? 'Sign In' : 'Sign Up'}
                            </Button>
                        </form>


                    </CardBody>

                    <CardFooter className="justify-center pb-8 pt-0">
                        <p className="text-slate-400 text-sm">
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <Link
                                as="button"
                                className="text-blue-400 hover:text-blue-300 cursor-pointer"
                                onPress={() => setIsLogin(!isLogin)}
                            >
                                {isLogin ? 'Sign Up' : 'Log In'}
                            </Link>
                        </p>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    );
};

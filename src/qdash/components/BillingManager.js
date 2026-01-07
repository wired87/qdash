import React, { useState, useEffect } from 'react';
import { CreditCard, TrendingUp, Calendar, DollarSign, Zap, Award, Clock, Check, X } from 'lucide-react';

/**
 * Billing & Subscription Management Component
 * Handles Free, Monthly, Annual, and PAYG plans
 */
const BillingManager = ({ user, userProfile, onClose, getPaymentUrl, updateUserPlan }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [isLoading, setIsLoading] = useState(false);
    const [billingHistory, setBillingHistory] = useState([]);

    // Fetch billing history on mount
    useEffect(() => {
        // In production, this would fetch from Firebase/backend
        // Mock data for now
        setBillingHistory([
            { id: 1, date: '2025-01-15', amount: 49.99, plan: 'Monthly Pro', status: 'Paid' },
            { id: 2, date: '2024-12-15', amount: 49.99, plan: 'Monthly Pro', status: 'Paid' },
            { id: 3, date: '2024-11-15', amount: 49.99, plan: 'Monthly Pro', status: 'Paid' },
        ]);
    }, []);

    // Plan definitions
    const plans = {
        free: {
            name: 'Free',
            price: 0,
            billing: 'Forever',
            features: [
                { text: '1 Environment', included: true },
                { text: '10 Compute Hours/month', included: true },
                { text: 'Basic Analytics', included: true },
                { text: 'Community Support', included: true },
                { text: 'Advanced Features', included: false },
                { text: 'Priority Support', included: false },
            ],
            color: 'slate',
            icon: Award
        },
        monthly: {
            name: 'Pro Monthly',
            price: 49.99,
            billing: 'Per Month',
            features: [
                { text: 'Unlimited Environments', included: true },
                { text: '100 Compute Hours/month', included: true },
                { text: 'Advanced Analytics', included: true },
                { text: 'Priority Support', included: true },
                { text: 'API Access', included: true },
                { text: 'Custom Integrations', included: true },
            ],
            color: 'blue',
            icon: Zap
        },
        annual: {
            name: 'Pro Annual',
            price: 499.99,
            billing: 'Per Year',
            savings: 'Save $100/year',
            features: [
                { text: 'Everything in Monthly', included: true },
                { text: '1200 Compute Hours/year', included: true },
                { text: 'Advanced Analytics', included: true },
                { text: 'Priority Support', included: true },
                { text: 'API Access', included: true },
                { text: 'Dedicated Account Manager', included: true },
            ],
            color: 'purple',
            icon: Award
        },
        payg: {
            name: 'Pay As You Go',
            price: 0.75,
            billing: 'Per Compute Hour',
            features: [
                { text: 'No Monthly Commitment', included: true },
                { text: 'Pay for what you use', included: true },
                { text: 'All Pro Features', included: true },
                { text: 'Flexible Scaling', included: true },
                { text: 'API Access', included: true },
                { text: 'Email Support', included: true },
            ],
            color: 'green',
            icon: TrendingUp
        }
    };

    const currentPlan = userProfile?.plan || 'free';
    const balance = userProfile?.balance || { compute_hours: 10, credits: 0 };

    const handleUpgrade = async (planType) => {
        setIsLoading(true);
        try {
            if (planType === 'free') {
                await updateUserPlan(user.uid, { plan: 'free' });
                alert('Downgraded to Free plan');
            } else if (getPaymentUrl) {
                const url = await getPaymentUrl(planType);
                if (url) window.open(url, '_blank');
            } else {
                alert(`Upgrade to ${plans[planType].name} - Payment integration needed`);
            }
        } catch (error) {
            console.error('Upgrade error:', error);
            alert('Failed to process upgrade');
        } finally {
            setIsLoading(false);
        }
    };

    const PlanCard = ({ planKey, plan, isCurrent }) => (
        <div style={{
            border: isCurrent ? `2px solid var(--${plan.color}-600)` : '1px solid #e5e7eb',
            borderRadius: '1rem',
            padding: '1.5rem',
            backgroundColor: isCurrent ? `rgba(var(--${plan.color}-50))` : 'white',
            boxShadow: isCurrent ? '0 10px 25px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.05)',
            transition: 'all 0.3s',
            position: 'relative'
        }}>
            {isCurrent && (
                <div style={{
                    position: 'absolute',
                    top: '-12px',
                    right: '20px',
                    backgroundColor: `var(--${plan.color}-600)`,
                    color: 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '1rem',
                    fontSize: '0.75rem',
                    fontWeight: '700'
                }}>
                    CURRENT PLAN
                </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <plan.icon size={24} color={`var(--${plan.color}-600)`} />
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>
                        {plan.name}
                    </h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                    <span style={{ fontSize: '2rem', fontWeight: '800', color: '#1f2937' }}>
                        ${plan.price}
                    </span>
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        {plan.billing}
                    </span>
                </div>
                {plan.savings && (
                    <div style={{
                        marginTop: '0.5rem',
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#dcfce7',
                        color: '#166534',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        display: 'inline-block'
                    }}>
                        {plan.savings}
                    </div>
                )}
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
                {plan.features.map((feature, idx) => (
                    <div key={idx} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.5rem',
                        color: feature.included ? '#1f2937' : '#9ca3af'
                    }}>
                        {feature.included ? (
                            <Check size={16} color="#10b981" />
                        ) : (
                            <X size={16} color="#ef4444" />
                        )}
                        <span style={{ fontSize: '0.875rem' }}>{feature.text}</span>
                    </div>
                ))}
            </div>

            {!isCurrent && (
                <button
                    onClick={() => handleUpgrade(planKey)}
                    disabled={isLoading}
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        backgroundColor: `var(--${plan.color}-600)`,
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        opacity: isLoading ? 0.5 : 1,
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => !isLoading && (e.currentTarget.style.transform = 'scale(1.02)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                    {isLoading ? 'Processing...' : planKey === 'free' ? 'Downgrade' : 'Upgrade'}
                </button>
            )}
            {isCurrent && (
                <div style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#f3f4f6',
                    color: '#6b7280',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    textAlign: 'center'
                }}>
                    Active Plan
                </div>
            )}
        </div>
    );

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '1rem',
                maxWidth: '1200px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'auto',
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1f2937', margin: 0 }}>
                            Billing & Subscriptions
                        </h2>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                            Manage your subscription and view billing history
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '0.5rem',
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#6b7280'
                        }}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    padding: '1rem 1.5rem',
                    borderBottom: '1px solid #e5e7eb'
                }}>
                    {[
                        { id: 'overview', label: 'Overview', icon: DollarSign },
                        { id: 'plans', label: 'Plans', icon: Award },
                        { id: 'history', label: 'Billing History', icon: Calendar }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 1rem',
                                backgroundColor: activeTab === tab.id ? '#eff6ff' : 'transparent',
                                border: 'none',
                                borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
                                color: activeTab === tab.id ? '#3b82f6' : '#6b7280',
                                cursor: 'pointer',
                                fontWeight: activeTab === tab.id ? '600' : '400',
                                fontSize: '0.875rem',
                                transition: 'all 0.2s'
                            }}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div style={{ padding: '1.5rem' }}>
                    {activeTab === 'overview' && (
                        <div>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                                gap: '1rem',
                                marginBottom: '2rem'
                            }}>
                                <div style={{
                                    padding: '1.5rem',
                                    backgroundColor: '#f8fafc',
                                    borderRadius: '0.75rem',
                                    border: '1px solid #e5e7eb'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <Clock size={20} color="#3b82f6" />
                                        <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6b7280' }}>
                                            Compute Hours
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '2rem', fontWeight: '800', color: '#1f2937' }}>
                                        {balance.compute_hours}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                        hours remaining
                                    </div>
                                </div>

                                <div style={{
                                    padding: '1.5rem',
                                    backgroundColor: '#f8fafc',
                                    borderRadius: '0.75rem',
                                    border: '1px solid #e5e7eb'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <CreditCard size={20} color="#10b981" />
                                        <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6b7280' }}>
                                            Credits
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '2rem', fontWeight: '800', color: '#1f2937' }}>
                                        ${balance.credits?.toFixed(2) || '0.00'}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                        available balance
                                    </div>
                                </div>

                                <div style={{
                                    padding: '1.5rem',
                                    backgroundColor: '#f8fafc',
                                    borderRadius: '0.75rem',
                                    border: '1px solid #e5e7eb'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <Award size={20} color="#8b5cf6" />
                                        <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6b7280' }}>
                                            Current Plan
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1f2937' }}>
                                        {plans[currentPlan]?.name || 'Free'}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                        {plans[currentPlan]?.billing || 'Forever'}
                                    </div>
                                </div>
                            </div>

                            <div style={{
                                padding: '1.5rem',
                                backgroundColor: '#eff6ff',
                                borderRadius: '0.75rem',
                                border: '1px solid #bfdbfe'
                            }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#1e40af', marginBottom: '0.5rem' }}>
                                    💡 Resource Usage Tips
                                </h3>
                                <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#1e40af', fontSize: '0.875rem' }}>
                                    <li>Compute hours reset monthly on your renewal date</li>
                                    <li>Unused credits roll over to the next month</li>
                                    <li>Upgrade anytime to get more resources</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {activeTab === 'plans' && (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                            gap: '1.5rem'
                        }}>
                            {Object.entries(plans).map(([key, plan]) => (
                                <PlanCard
                                    key={key}
                                    planKey={key}
                                    plan={plan}
                                    isCurrent={currentPlan === key}
                                />
                            ))}
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                                        <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Date</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Plan</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Amount</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {billingHistory.map(bill => (
                                        <tr key={bill.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                            <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#1f2937' }}>{bill.date}</td>
                                            <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#1f2937' }}>{bill.plan}</td>
                                            <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#1f2937', textAlign: 'right' }}>${bill.amount}</td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                <span style={{
                                                    padding: '0.25rem 0.75rem',
                                                    backgroundColor: '#dcfce7',
                                                    color: '#166534',
                                                    borderRadius: '0.25rem',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '600'
                                                }}>
                                                    {bill.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
        :root {
          --slate-50: rgb(248, 250, 252);
          --slate-600: rgb(71, 85, 105);
          --blue-50: rgb(239, 246, 255);
          --blue-600: rgb(37, 99, 235);
          --purple-50: rgb(250, 245, 255);
          --purple-600: rgb(147, 51, 234);
          --green-50: rgb(240, 253, 244);
          --green-600: rgb(22, 163, 74);
        }
      `}</style>
        </div>
    );
};

export default BillingManager;

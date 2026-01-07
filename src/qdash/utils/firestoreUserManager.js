import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Firestore User Management
 * Handles user document creation, updates, and resource tracking
 */

// Default user profile structure
const DEFAULT_USER_PROFILE = {
    plan: 'free',
    balance: {
        compute_hours: 10,
        credits: 0.00
    },
    resources: {
        environments: 0,
        total_compute_used: 0,
        total_simulations: 0,
        total_injections: 0,
    },
    subscription: {
        status: 'active',
        current_period_start: null,
        current_period_end: null,
        cancel_at_period_end: false,
    },
    billing: {
        customer_id: null,
        payment_method: null,
        last_payment_date: null,
        next_billing_date: null,
    },
    usage_limits: {
        max_environments: 1,
        max_compute_hours: 10,
        api_access: false,
        priority_support: false,
    },
    metadata: {
        created_at: null,
        last_login: null,
        last_updated: null,
        account_status: 'active',
    }
};

/**
 * Create or update user document in Firestore
 * @param {Object} firebaseDb - Firestore instance
 * @param {Object} user - Firebase Auth user object
 * @returns {Promise<Object>} - User profile data
 */
export const createOrUpdateUser = async (firebaseDb, user) => {
    if (!firebaseDb || !user) {
        console.warn('Firestore or user not available');
        return null;
    }

    try {
        const userRef = doc(firebaseDb, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        const now = serverTimestamp();

        if (!userSnap.exists()) {
            // Create new user document
            const newUserData = {
                ...DEFAULT_USER_PROFILE,
                uid: user.uid,
                email: user.email,
                display_name: user.displayName || user.email?.split('@')[0] || 'User',
                photo_url: user.photoURL || null,
                metadata: {
                    created_at: now,
                    last_login: now,
                    last_updated: now,
                    account_status: 'active',
                }
            };

            await setDoc(userRef, newUserData);
            console.log('✅ New user document created:', user.uid);

            return newUserData;
        } else {
            // Update existing user - just update last_login
            await updateDoc(userRef, {
                'metadata.last_login': now,
                'metadata.last_updated': now,
            });

            console.log('✅ User login updated:', user.uid);
            return userSnap.data();
        }
    } catch (error) {
        console.error('❌ Error creating/updating user:', error);
        return null;
    }
};

/**
 * Update user plan
 * @param {Object} firebaseDb - Firestore instance
 * @param {string} userId - User ID
 * @param {string} plan - Plan type: 'free', 'monthly', 'annual', 'payg'
 */
export const updateUserPlan = async (firebaseDb, userId, plan) => {
    if (!firebaseDb || !userId) return;

    const planLimits = {
        free: { max_environments: 1, max_compute_hours: 10, api_access: false, priority_support: false },
        monthly: { max_environments: -1, max_compute_hours: 100, api_access: true, priority_support: true },
        annual: { max_environments: -1, max_compute_hours: 1200, api_access: true, priority_support: true },
        payg: { max_environments: -1, max_compute_hours: -1, api_access: true, priority_support: false },
    };

    const limits = planLimits[plan] || planLimits.free;

    try {
        const userRef = doc(firebaseDb, 'users', userId);
        await updateDoc(userRef, {
            plan: plan,
            'usage_limits': limits,
            'balance.compute_hours': plan === 'free' ? 10 : plan === 'monthly' ? 100 : plan === 'annual' ? 1200 : 0,
            'metadata.last_updated': serverTimestamp(),
        });
        console.log('✅ User plan updated:', userId, plan);
    } catch (error) {
        console.error('❌ Error updating user plan:', error);
        throw error;
    }
};

/**
 * Update user resources (compute hours, credits, etc.)
 * @param {Object} firebaseDb - Firestore instance
 * @param {string} userId - User ID
 * @param {Object} updates - Resource updates
 */
export const updateUserResources = async (firebaseDb, userId, updates) => {
    if (!firebaseDb || !userId) return;

    try {
        const userRef = doc(firebaseDb, 'users', userId);
        const updateData = {
            'metadata.last_updated': serverTimestamp(),
        };

        // Handle nested updates
        Object.entries(updates).forEach(([key, value]) => {
            if (key.includes('.')) {
                updateData[key] = value;
            } else {
                updateData[key] = value;
            }
        });

        await updateDoc(userRef, updateData);
        console.log('✅ User resources updated:', userId);
    } catch (error) {
        console.error('❌ Error updating user resources:', error);
        throw error;
    }
};

/**
 * Track resource usage (increment counters)
 * @param {Object} firebaseDb - Firestore instance
 * @param {string} userId - User ID
 * @param {string} resourceType - Type of resource: 'environments', 'compute', 'simulations', 'injections'
 * @param {number} amount - Amount to increment (default: 1)
 */
export const trackResourceUsage = async (firebaseDb, userId, resourceType, amount = 1) => {
    if (!firebaseDb || !userId) return;

    try {
        const userRef = doc(firebaseDb, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            console.warn('User not found for resource tracking');
            return;
        }

        const userData = userSnap.data();
        const updates = {
            'metadata.last_updated': serverTimestamp(),
        };

        switch (resourceType) {
            case 'environments':
                updates['resources.environments'] = (userData.resources?.environments || 0) + amount;
                break;
            case 'compute':
                updates['resources.total_compute_used'] = (userData.resources?.total_compute_used || 0) + amount;
                updates['balance.compute_hours'] = Math.max(0, (userData.balance?.compute_hours || 0) - amount);
                break;
            case 'simulations':
                updates['resources.total_simulations'] = (userData.resources?.total_simulations || 0) + amount;
                break;
            case 'injections':
                updates['resources.total_injections'] = (userData.resources?.total_injections || 0) + amount;
                break;
        }

        await updateDoc(userRef, updates);
        console.log('✅ Resource usage tracked:', userId, resourceType, amount);
    } catch (error) {
        console.error('❌ Error tracking resource usage:', error);
    }
};

/**
 * Get user profile
 * @param {Object} firebaseDb - Firestore instance
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - User profile data
 */
export const getUserProfile = async (firebaseDb, userId) => {
    if (!firebaseDb || !userId) return null;

    try {
        const userRef = doc(firebaseDb, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            return userSnap.data();
        } else {
            console.warn('User profile not found:', userId);
            return null;
        }
    } catch (error) {
        console.error('❌ Error fetching user profile:', error);
        return null;
    }
};

/**
 * Add billing transaction
 * @param {Object} firebaseDb - Firestore instance
 * @param {string} userId - User ID
 * @param {Object} transaction - Transaction details
 */
export const addBillingTransaction = async (firebaseDb, userId, transaction) => {
    if (!firebaseDb || !userId) return;

    try {
        const userRef = doc(firebaseDb, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            console.warn('User not found for billing transaction');
            return;
        }

        const userData = userSnap.data();
        const billing_history = userData.billing_history || [];

        billing_history.push({
            ...transaction,
            timestamp: serverTimestamp(),
        });

        await updateDoc(userRef, {
            billing_history,
            'metadata.last_updated': serverTimestamp(),
        });

        console.log('✅ Billing transaction added:', userId);
    } catch (error) {
        console.error('❌ Error adding billing transaction:', error);
    }
};

export default {
    createOrUpdateUser,
    updateUserPlan,
    updateUserResources,
    trackResourceUsage,
    getUserProfile,
    addBillingTransaction,
};

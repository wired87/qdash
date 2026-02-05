import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
    setSessions,
    setActiveSessionEnvs,
    setActiveSessionModules,
    setActiveSessionFields,
    setLoading as setSessionLoading
} from './slices/sessionSlice';
import { setUserEnvs, removeEnv, addEnv, setLoading as setEnvLoading } from './slices/envSlice';
import { setUserModules, setLoading as setModuleLoading } from './slices/moduleSlice';
import { setLoading as setFieldLoading } from './slices/fieldSlice';
import { setUserInjections, updateInjectionDetail, setLoading as setInjectionLoading } from './slices/injectionSlice';
import { setUserMethods, setLoading as setMethodLoading } from './slices/methodSlice';

import { setConnectionStatus } from './slices/websocketSlice';

const ReduxWebSocketBridge = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        const handleMessage = (event) => {
            const msg = event.detail; // CustomEvent detail
            if (!msg) return;

            const { type, data } = msg;

            switch (type) {
                // --- Sessions ---
                case 'USERS_SESSIONS':
                case 'LIST_USERS_SESSIONS':
                    dispatch(setSessions(data?.sessions || []));
                    dispatch(setSessionLoading(false));
                    break;

                // --- Environments ---
                case 'GET_USERS_ENVS':
                case 'LIST_USERS_ENVS':
                case 'LIST_ENVS':
                    // Preserve field_id on each env from received data
                    dispatch(setUserEnvs(data?.envs || []));
                    dispatch(setEnvLoading(false));
                    break;
                case 'GET_SESSIONS_ENVS':
                    dispatch(setActiveSessionEnvs(data?.envs || []));
                    dispatch(setEnvLoading(false)); // Maybe unrelated loading status now?
                    // Or keep session loading?
                    break;
                case 'ENV_DELETED':
                case 'DEL_ENV':
                    dispatch(removeEnv(msg.env_id));
                    break;

                // --- Modules ---
                case 'LIST_USERS_MODULES':
                    dispatch(setUserModules(data?.modules || []));
                    dispatch(setModuleLoading(false));
                    break;
                case 'GET_SESSIONS_MODULES':
                    dispatch(setActiveSessionModules(data?.modules || []));
                    dispatch(setModuleLoading(false));
                    break;

                // --- Fields ---
                case 'SESSIONS_FIELDS':
                case 'GET_MODULES_FIELDS':
                    dispatch(setActiveSessionFields(data?.fields || []));
                    dispatch(setFieldLoading(false));
                    break;

                // --- Injections ---
                case 'GET_INJ_USER':
                case 'INJ_LIST_USER':
                    dispatch(setUserInjections(data?.injections || data?.data?.injections || []));
                    dispatch(setInjectionLoading(false));
                    break;
                case 'GET_INJECTION':
                    if (data) {
                        dispatch(updateInjectionDetail(data));
                    }
                    break;

                // --- Methods ---
                case 'GET_USERS_METHODS':
                case 'LIST_USERS_METHODS':
                    dispatch(setUserMethods(data?.methods || []));
                    dispatch(setMethodLoading(false));
                    break;

                default:
                    break;
            }
        };

        const handleStatus = (event) => {
            const { status, isConnected, error } = event.detail;
            dispatch(setConnectionStatus({ status, isConnected, error }));
        };

        window.addEventListener('qdash-ws-message', handleMessage);
        window.addEventListener('qdash-ws-status', handleStatus);

        return () => {
            window.removeEventListener('qdash-ws-message', handleMessage);
            window.removeEventListener('qdash-ws-status', handleStatus);
        };
    }, [dispatch]);

    return null; // Interface-less component
};

export default ReduxWebSocketBridge;

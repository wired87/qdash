import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';

/**
 * Hexagon spinner loading animation
 * Can be used as full-screen overlay or inline background
 */
const HexagonSpinner = ({ inline = false, extend = false, message, submessage, size }) => {
    const { status } = useSelector(state => state.websocket);

    const shouldRender = useCallback(() => {
        if (extend && status === 'disconnected') {
            return false;
        }
        return true;
    }, [extend, status]);

    if (!shouldRender()) return null;
    const containerStyle = inline ? {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(248, 250, 252, 0.95)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        borderRadius: '0.5rem'
    } : {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
    };

    // Determine dimensions based on size prop or inline status
    const isSmall = size === 'sm' || (inline && !size);
    const hexWidth = isSmall ? '60px' : '100px';
    const hexHeight = isSmall ? '35px' : '58px';
    const hexMargin = isSmall ? '17px 0' : '29px 0';
    const borderSize = isSmall ? '30px' : '50px';
    const borderHeight = isSmall ? '17px' : '29px';

    // Dot sizes
    const dotGap = isSmall ? '6px' : '8px';
    const dotMargin = isSmall ? '20px' : '40px';
    const dotSize = isSmall ? '8px' : '12px';

    return (
        <div style={containerStyle}>
            <style>{`
                @keyframes hexagon-spin {
                    0% { transform: rotate(0deg) scale(1); }
                    50% { transform: rotate(180deg) scale(1.1); }
                    100% { transform: rotate(360deg) scale(1); }
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.6; }
                }
                
                .hexagon {
                    width: ${hexWidth};
                    height: ${hexHeight};
                    position: relative;
                    margin: ${hexMargin};
                }
                
                .hexagon:before,
                .hexagon:after {
                    content: "";
                    position: absolute;
                    width: 0;
                    border-left: ${borderSize} solid transparent;
                    border-right: ${borderSize} solid transparent;
                }
                
                .hexagon:before {
                    bottom: 100%;
                    border-bottom: ${borderHeight} solid #3b82f6;
                }
                
                .hexagon:after {
                    top: 100%;
                    width: 0;
                    border-top: ${borderHeight} solid #3b82f6;
                }
                
                .hexagon-inner {
                    width: ${hexWidth};
                    height: ${hexHeight};
                    background-color: #3b82f6;
                }
                
                .hexagon-container {
                    animation: hexagon-spin 2s linear infinite;
                }
                
                .dot-container {
                    display: flex;
                    gap: ${dotGap};
                    margin-top: ${dotMargin};
                }
                
                .dot {
                    width: ${dotSize};
                    height: ${dotSize};
                    border-radius: 50%;
                    background-color: #3b82f6;
                    animation: pulse 1.4s ease-in-out infinite;
                }
                
                .dot:nth-child(2) {
                    animation-delay: 0.2s;
                }
                
                .dot:nth-child(3) {
                    animation-delay: 0.4s;
                }
            `}</style>

            <div className="hexagon-container">
                <div className="hexagon">
                    <div className="hexagon-inner"></div>
                </div>
            </div>

            <div style={{
                color: inline ? '#1f2937' : '#ffffff',
                fontSize: isSmall ? '0.875rem' : '1.25rem',
                fontWeight: '600',
                marginTop: isSmall ? '1rem' : '2rem',
                textAlign: 'center'
            }}>
                {message}
            </div>

            <div className="dot-container">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
            </div>

            <div style={{
                color: inline ? '#6b7280' : '#9ca3af',
                fontSize: isSmall ? '0.75rem' : '0.875rem',
                marginTop: isSmall ? '0.5rem' : '1rem',
                textAlign: 'center'
            }}>
                {submessage}
            </div>
        </div>
    );
};

export default HexagonSpinner;

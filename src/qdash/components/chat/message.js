import React, { useCallback } from 'react';


// Hilfsfunktion zum Kopieren von Text in die Zwischenablage
const copyToClipboard = (text) => {
    // Verwendung von document.execCommand('copy') aufgrund von iFrame-Einschränkungen
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed'; // Verhindert Scrollen auf der Seite
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
        document.execCommand('copy');
        console.log('Text erfolgreich kopiert:', text);
    } catch (err) {
        console.error('Fehler beim Kopieren des Textes:', err);
    }
    document.body.removeChild(textarea);
};

export const SingleMessage = ({ item }) => {
    // Konvertiere die ID in eine Zahl für die Hintergrundfarb-Logik
    const messageIdNum = Number(item.id);

    // Bestimme die Hintergrundfarbe basierend auf der ID und dem Typ der Nachricht
    // bg-blue-600 für User-Nachrichten (gerade ID oder explizit 'user')
    // bg-gray-700 für AI-Nachrichten (ungerade ID oder explizit 'ai')
    const backgroundColorClass =
        (item.class === 'user' || messageIdNum % 2 === 0)
            ? 'bg-blue-600'
            : 'bg-gray-700';

    const handleCopyClick = useCallback(() => {
        copyToClipboard(item.message);
    }, [item.message]);

    return (
        // Haupt-Container für die Nachricht
        <div
            className={`
                flex flex-col p-4 mb-3 justify-between rounded-xl min-h-[70px] pb-5 relative
                border border-gray-500 shadow-md
                max-w-lg mx-auto w-4/5 // Responsive Breite
                ${backgroundColorClass}
                ${item.class === 'user' ? 'self-end' : 'self-start'} // Ausrichtung basierend auf dem Typ
            `}

            style={{
                marginTop: '12px',
                            }}
        >
            {item.file && (
                <img
                    className="object-cover w-full h-[200px] rounded-xl mb-3"
                    src={item.file}
                    alt="Nachrichtenanhang"
                    onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = `https://placehold.co/400x200/cccccc/333333?text=Bild+nicht+gefunden`;
                    }} // Fallback-Bild bei Fehler
                />
            )}

            {/* Hauptnachrichtentext */}
            <p className="text-white text-base leading-relaxed mb-2">
                {item.message}
            </p>

            {/* Zeitstempel der Nachricht */}
            <p className="text-gray-300 text-xs text-right mt-auto">
                {item.timeToken.toString()}
            </p>

            {/* Copy Button */}
            <button
                onClick={handleCopyClick}
                className="absolute bottom-2 right-2 p-1.5 bg-blue-500 hover:bg-blue-700 rounded-full text-white text-xs font-semibold
                           focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transition-colors duration-200"
                aria-label="Nachricht kopieren"
                title="Nachricht kopieren"
            >
                {/* Einfaches Kopier-Icon oder Text */}
                📋
            </button>
        </div>
    );
};


// Ein Beispiel zur Verwendung der SingleMessage Komponente in einer App
// Dies wäre typischerweise ein übergeordneter Container, der Nachrichten rendert
export default function DemoApp() {
    const mockMessages= [
        { id: "1", message: "Hallo Benedikt, wie geht es dir heute?", timeToken: "10:00", class: "user" },
        { id: "2", message: "Mir geht es gut, danke! Und dir?", timeToken: "10:01", class: "ai" },
        { id: "3", message: "Ich bin auch gut. Ich habe gerade ein interessantes Bild gesehen.", timeToken: "10:02", class: "user", file: "https://placehold.co/600x400/FF0000/FFFFFF?text=Awesome+Image" },
        { id: "4", message: "Das klingt spannend! Was war es denn für ein Bild?", timeToken: "10:03", class: "ai" },
        { id: "5", message: "Es war ein wunderschöner Sonnenuntergang über den Bergen.", timeToken: "10:05", class: "user" },
        { id: "6", message: "Könntest du mir mehr Details zu diesem Sonnenuntergang geben?", timeToken: "10:06", class: "ai" },
    ];

    return (
        <div className="flex flex-col h-screen p-4 bg-gray-900 overflow-y-auto">
            <h1 className="text-3xl font-bold text-white mb-6 text-center">Chat-Nachrichten (Demo)</h1>
            <div className="flex flex-col items-center space-y-4 w-full"> {/* Zentriert die Nachrichten */}
                {mockMessages.map((msg) => (
                    <SingleMessage key={msg.id} item={msg} />
                ))}
            </div>
        </div>
    );
}

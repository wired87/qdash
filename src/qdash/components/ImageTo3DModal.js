import React, { useState, useRef } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, Button } from '@heroui/react';
import { X, Upload, ImageIcon } from 'lucide-react';

const HEIGHTMAP_SIZE = 32;

/**
 * Convert image to heightmap data using grayscale luminance.
 * Returns Float32Array of size w*h, values 0..1.
 */
export function imageToHeightmap(image, width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(image, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const out = new Float32Array(width * height);
    for (let i = 0; i < width * height; i++) {
        const r = data[i * 4];
        const g = data[i * 4 + 1];
        const b = data[i * 4 + 2];
        const a = data[i * 4 + 3] / 255;
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        out[i] = luminance * a;
    }
    return out;
}

/**
 * ImageTo3DModal: upload image, generate heightmap, add to scene.
 * Client-side only: uses Canvas API for heightmap extrusion.
 */
const ImageTo3DModal = ({ isOpen, onClose, onAddToScene }) => {
    const [preview, setPreview] = useState(null);
    const [heightmap, setHeightmap] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setError(null);
        setHeightmap(null);

        const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            setError('Please select a PNG, JPG, or WebP image.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            const dataUrl = ev.target.result;
            setPreview(dataUrl);
            const img = new Image();
            img.onload = () => {
                setIsProcessing(true);
                try {
                    const w = Math.min(HEIGHTMAP_SIZE, img.width);
                    const h = Math.min(HEIGHTMAP_SIZE, img.height);
                    const hm = imageToHeightmap(img, w, h);
                    if (hm) {
                        setHeightmap({ data: Array.from(hm), width: w, height: h });
                    }
                } catch (err) {
                    setError(err.message || 'Failed to process image.');
                } finally {
                    setIsProcessing(false);
                }
            };
            img.onerror = () => setError('Failed to load image.');
            img.src = dataUrl;
        };
        reader.readAsDataURL(file);
    };

    const handleAddToScene = () => {
        if (!heightmap) return;
        const id = `form-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        onAddToScene?.({ id, type: 'image_3d', heightmap: heightmap.data, heightmapWidth: heightmap.width, heightmapHeight: heightmap.height });
        handleClose();
    };

    const handleClose = () => {
        setPreview(null);
        setHeightmap(null);
        setError(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        onClose?.();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} size="md" classNames={{ base: 'bg-slate-900 border border-slate-700' }}>
            <ModalContent>
                <ModalHeader className="flex items-center justify-between border-b border-slate-700">
                    <span className="text-slate-100 font-semibold flex items-center gap-2">
                        <ImageIcon size={20} className="text-cyan-400" />
                        Image to 3D
                    </span>
                    <Button aria-label="Close modal" isIconOnly size="sm" variant="light" onPress={handleClose} className="text-slate-400 hover:text-white">
                        <X size={18} />
                    </Button>
                </ModalHeader>
                <ModalBody className="py-4">
                    <p className="text-sm text-slate-400 mb-4">
                        Upload an image to convert it into a 3D heightmap mesh. Uses grayscale luminance as height.
                    </p>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    <Button
                        onPress={() => fileInputRef.current?.click()}
                        variant="bordered"
                        className="w-full border-dashed border-slate-600 hover:border-cyan-500/50"
                        startContent={<Upload size={18} />}
                        isDisabled={isProcessing}
                    >
                        {isProcessing ? 'Processing...' : 'Choose image'}
                    </Button>

                    {error && <p className="text-sm text-red-400 mt-2">{error}</p>}

                    {preview && (
                        <div className="mt-4 flex flex-col gap-4">
                            <div className="rounded-lg overflow-hidden border border-slate-700 bg-slate-800/50 max-h-40">
                                <img src={preview} alt="Preview" className="w-full h-auto object-contain max-h-40" />
                            </div>
                            {heightmap && (
                                <Button color="primary" onPress={handleAddToScene} className="w-full font-semibold">
                                    Add to 3D scene
                                </Button>
                            )}
                        </div>
                    )}
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

/**
 * Process a File into heightmap data. Returns Promise<{ data, width, height }>.
 */
export function processImageFile(file) {
    return new Promise((resolve, reject) => {
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            reject(new Error('Invalid image type. Use PNG, JPG, or WebP.'));
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
                const w = Math.min(HEIGHTMAP_SIZE, img.width);
                const h = Math.min(HEIGHTMAP_SIZE, img.height);
                const hm = imageToHeightmap(img, w, h);
                if (hm) resolve({ data: Array.from(hm), width: w, height: h });
                else reject(new Error('Failed to extract heightmap.'));
            };
            img.onerror = () => reject(new Error('Failed to load image.'));
            img.src = ev.target.result;
        };
        reader.onerror = () => reject(new Error('Failed to read file.'));
        reader.readAsDataURL(file);
    });
}

export default ImageTo3DModal;

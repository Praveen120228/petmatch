import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/cropImage';
import Button from './Button';
import { X, Check } from '@phosphor-icons/react';

interface ImageCropperProps {
    imageSrc: string;
    onCropComplete: (croppedImage: string) => void;
    onCancel: () => void;
    aspectRatio?: number; // Default 1 (square)
}

const ImageCropper = ({ imageSrc, onCropComplete, onCancel, aspectRatio = 1 }: ImageCropperProps) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [aspect, setAspect] = useState(aspectRatio);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

    const onCropChange = (crop: { x: number; y: number }) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom: number) => {
        setZoom(zoom);
    };

    const onCropCompleteCallback = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        try {
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
            onCropComplete(croppedImage);
        } catch (e) {
            console.error(e);
            alert("Failed to crop image");
        }
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
        }}>
            <div style={{
                position: 'relative',
                width: '100%',
                maxWidth: '500px',
                height: '400px',
                background: '#333',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}>
                <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={aspect}
                    onCropChange={onCropChange}
                    onCropComplete={onCropCompleteCallback}
                    onZoomChange={onZoomChange}
                />
            </div>

            <div style={{
                marginTop: '1.5rem',
                width: '100%',
                maxWidth: '500px',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                background: 'white',
                padding: '1rem',
                borderRadius: '16px'
            }}>
                {/* Aspect Ratio Controls */}
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    {[1, 4 / 3, 16 / 9].map((ratio) => (
                        <button
                            key={ratio}
                            onClick={() => setAspect(ratio)}
                            style={{
                                flex: 1,
                                padding: '0.5rem',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
                                background: aspect === ratio ? 'var(--primary-50)' : 'white',
                                color: aspect === ratio ? 'var(--primary-700)' : '#4b5563',
                                fontWeight: 600,
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {ratio === 1 ? 'Square' : ratio === 4 / 3 ? '4:3' : '16:9'}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#4b5563' }}>Zoom</span>
                    <input
                        type="range"
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        aria-labelledby="Zoom"
                        onChange={(e) => setZoom(Number(e.target.value))}
                        style={{ flex: 1, accentColor: 'var(--primary-600)' }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <Button variant="outline" onClick={onCancel} style={{ flex: 1 }}>
                        <X size={20} /> Cancel
                    </Button>
                    <Button variant="secondary" onClick={() => onCropComplete(imageSrc)} style={{ flex: 1 }}>
                        Use Original
                    </Button>
                    <Button variant="primary" onClick={handleSave} style={{ flex: 1 }}>
                        <Check size={20} /> Save Crop
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ImageCropper;

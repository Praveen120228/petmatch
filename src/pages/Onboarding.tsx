import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { User, MapPin, Camera, Crop } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../lib/userService';
import ImageCropper from '../components/ImageCropper';
import SuccessOverlay from '../components/SuccessOverlay';

const Onboarding = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [username, setUsername] = useState('');
    const [name, setName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [location, setLocation] = useState('');
    const [country, setCountry] = useState('');
    const [state, setState] = useState('');
    const [coords, setCoords] = useState<{ lat: number, lng: number } | null>(null);
    const [image, setImage] = useState<string | null>(null);
    const [croppingImage, setCroppingImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false); // Premium Delight

    // Load existing profile if available
    useEffect(() => {
        if (user) {
            userService.getProfile(user.id).then(p => {
                if (p) {
                    setUsername(p.username || '');
                    if (p.name) setName(p.name);
                    if (p.phone_number) setPhoneNumber(p.phone_number);
                    setLocation(p.location || '');
                    setCountry(p.country || '');
                    setState(p.state || '');
                    if (p.avatar_url) setImage(p.avatar_url);
                    if (p.latitude && p.longitude) setCoords({ lat: p.latitude, lng: p.longitude });
                }
            });
        }
    }, [user]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = () => {
                setImage(reader.result as string);
                // setCroppingImage(reader.result as string); // Skip auto-crop
            };
            reader.readAsDataURL(file);
            e.target.value = '';
        }
    };

    const handleCropComplete = (croppedBase64: string) => {
        setImage(croppedBase64);
        setCroppingImage(null);
    };

    const handleGetLocation = () => {
        if (!navigator.geolocation) return alert("Geolocation is not supported by your browser");

        setIsLoadingLocation(true);
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude, longitude } = pos.coords;
            setCoords({ lat: latitude, lng: longitude });
            try {
                // Approximate reverse geocoding via OpenStreetMap (Nominatim)
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                const data = await res.json();

                let city = '';
                let state = '';
                let countryName = '';

                if (data.address) {
                    city = data.address.city || data.address.town || data.address.village || data.address.county || '';
                    state = data.address.state || '';
                    countryName = data.address.country || '';
                }

                if (countryName) setCountry(countryName);
                if (state) setState(state);

                if (city) {
                    setLocation(state ? `${city}, ${state}` : city);
                } else {
                    setLocation(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
                }
            } catch (err) {
                console.error("Geocoding failed", err);
                setLocation(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
            } finally {
                setIsLoadingLocation(false);
            }
        }, (err) => {
            console.error(err);
            alert("Could not retrieve location. Please allow location access.");
            setIsLoadingLocation(false);
        });
    };

    const handleFinish = async () => {
        if (!user) return alert("Please login first");
        if (!username.trim()) return alert("Please choose a username");
        if (!name.trim()) return alert("Please enter your name");
        if (!phoneNumber.trim()) return alert("Please enter your phone number");
        if (!location.trim()) return alert("Please enter your location");

        setIsSubmitting(true);

        try {
            // Check availability
            const isAvailable = await userService.checkUsernameAvailability(username, user.id);
            if (!isAvailable) {
                alert("Username is already taken. Please choose another.");
                setIsSubmitting(false);
                return;
            }
            // Update Profile
            await userService.updateProfile(user.id, {
                username: username,
                name: name,
                phone_number: phoneNumber,
                location: location,
                country: country,
                state: state,
                latitude: coords?.lat,
                longitude: coords?.lng,
                avatar_url: image || undefined
            });

            // Trigger Delight Overlay
            setShowSuccess(true);

        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to complete setup. Please try again.");
            setIsSubmitting(false);
        }
    };

    // Controlled navigation after overlay animation
    const handleSuccessComplete = () => {
        navigate('/profile');
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '80vh',
            padding: '1rem',
            position: 'relative'
        }}>
            {showSuccess && (
                <SuccessOverlay type="onboarding" onComplete={handleSuccessComplete} />
            )}
            <Card style={{
                width: '100%',
                maxWidth: '500px',
                padding: '2rem 1.5rem',
                textAlign: 'center'
            }}>
                <div style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Welcome!</h2>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Let's get your profile set up. You can add your pets later.</p>
                </div>

                {/* Avatar Upload */}
                <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            width: '120px',
                            height: '120px',
                            borderRadius: '50%',
                            background: image ? `url(${image}) center/cover no-repeat` : '#f3f4f6',
                            border: '4px solid white',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            position: 'relative'
                        }}
                    >
                        {!image && <User size={48} weight="duotone" color="#9ca3af" />}

                        {/* Camera / Upload Button */}
                        <div style={{
                            position: 'absolute',
                            bottom: '0',
                            right: '0',
                            background: 'var(--primary-600)',
                            color: 'white',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px solid white',
                            zIndex: 10
                        }}>
                            <Camera size={18} weight="bold" />
                        </div>

                        {/* Optional Crop Button (Only if image exists) */}
                        {image && (
                            <div
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCroppingImage(image);
                                }}
                                style={{
                                    position: 'absolute',
                                    bottom: '0',
                                    left: '0',
                                    background: 'white',
                                    color: 'var(--gray-700)',
                                    borderRadius: '50%',
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '1px solid var(--gray-200)',
                                    zIndex: 10,
                                    cursor: 'pointer'
                                }}
                                title="Crop Image"
                            >
                                <Crop size={18} weight="bold" />
                            </div>
                        )}

                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept="image/*"
                            style={{ display: 'none' }}
                        />
                    </div>
                </div>

                <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
                    <Input
                        label="Name"
                        placeholder="Your Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        fullWidth
                        required
                    />

                    <Input
                        label="Phone Number"
                        placeholder="+1 234 567 8900"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        fullWidth
                        required
                        type="tel"
                    />

                    <Input
                        label="Username"
                        placeholder="@username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                        fullWidth
                        required
                    />

                    <div style={{ position: 'relative' }}>
                        <Input
                            label="Location"
                            placeholder="City, State"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            fullWidth
                            disabled={isLoadingLocation}
                            required
                        />
                        <button
                            onClick={handleGetLocation}
                            disabled={isLoadingLocation}
                            type="button"
                            style={{
                                position: 'absolute',
                                right: '8px',
                                top: '38px',
                                background: 'transparent',
                                border: 'none',
                                color: isLoadingLocation ? 'var(--gray-400)' : 'var(--primary-600)',
                                cursor: isLoadingLocation ? 'wait' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.875rem',
                                fontWeight: 600
                            }}
                            title="Find my location"
                        >
                            {isLoadingLocation ? (
                                <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⌛</span>
                            ) : (
                                <MapPin size={20} weight="fill" />
                            )}
                            <span className="hide-on-mobile">Locate Me</span>
                        </button>
                    </div>
                </div>

                <Button
                    onClick={handleFinish}
                    fullWidth
                    size="lg"
                    variant="primary"
                    disabled={isSubmitting}
                    loading={isSubmitting}
                >
                    Complete Setup
                </Button>
            </Card>
            {croppingImage && (
                <ImageCropper
                    imageSrc={croppingImage}
                    onCropComplete={handleCropComplete}
                    onCancel={() => setCroppingImage(null)}
                    aspectRatio={1}
                />
            )}
        </div>
    );
};

export default Onboarding;

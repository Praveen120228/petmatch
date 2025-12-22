import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { User, MapPin } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../lib/userService';

const Onboarding = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [username, setUsername] = useState('');
    const [location, setLocation] = useState('');
    const [coords, setCoords] = useState<{ lat: number, lng: number } | null>(null);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

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

                if (data.address) {
                    city = data.address.city || data.address.town || data.address.village || data.address.county || '';
                    state = data.address.state || data.address.country || '';
                }

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
                location: location,
                latitude: coords?.lat,
                longitude: coords?.lng,
                // Ensure bio is initialized if null? Not strictly needed if optional.
            });

            // Redirect to Profile (where they can add pets)
            navigate('/profile');
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to complete setup. Please try again.");
            setIsSubmitting(false);
        }
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
            <Card style={{
                width: '100%',
                maxWidth: '500px',
                padding: '2rem 1.5rem',
                textAlign: 'center'
            }}>
                <div style={{ marginBottom: '2rem' }}>
                    <User size={48} color="var(--color-primary)" weight="duotone" style={{ marginBottom: '1rem' }} />
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Welcome!</h2>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Let's get your profile set up. You can add your pets later.</p>
                </div>

                <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
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
        </div>
    );
};

export default Onboarding;

import confetti from 'canvas-confetti';

/**
 * Basic success confetti (defaults)
 */
export const celebrateSuccess = () => {
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
    });
};

/**
 * Big celebration for Account Creation
 * Explosion from center
 */
export const celebrateAccountCreation = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    (function frame() {
        // launch a few confetti from the left edge
        confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#a855f7', '#d8b4fe', '#f472b6'] // Purple/Pink theme
        });
        // and launch a few from the right edge
        confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#a855f7', '#d8b4fe', '#f472b6']
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    }());
};

/**
 * Fireworks for Onboarding Completion
 */
export const celebrateOnboarding = () => {
    const duration = 5000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        // since particles fall down, start a bit higher than random
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
};

/**
 * Custom burst for Pet Types
 */
export const celebratePetAdd = (type: string) => {
    const typeLower = type.toLowerCase();

    let colors = ['#ffffff', '#ff0000']; // default
    let scalar = 1;

    if (typeLower === 'dog') {
        colors = ['#8B4513', '#D2691E', '#CD853F', '#F4A460']; // Brown/Orange
    } else if (typeLower === 'cat') {
        colors = ['#FF69B4', '#FFC0CB', '#808080', '#D3D3D3']; // Pink/Grey
    } else if (typeLower === 'bird') {
        colors = ['#FFD700', '#00BFFF', '#32CD32', '#FF4500']; // Vivid
    } else {
        colors = ['#a855f7', '#d8b4fe', '#f472b6', '#22c55e']; // Brand
    }

    confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: colors,
        scalar: scalar
    });
};

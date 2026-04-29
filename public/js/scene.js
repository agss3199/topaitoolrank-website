import * as THREE from 'three';

// Scene setup
let scene, camera, renderer, particles, lines, particleVelocities;
const canvas = document.getElementById('canvas-3d');
const container = canvas.parentElement;

let isSceneActive = false;

// Initialize Three.js scene
function initScene() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e27);
    scene.fog = new THREE.Fog(0x0a0e27, 2000, 3500);

    // Camera
    camera = new THREE.PerspectiveCamera(
        75,
        canvas.clientWidth / canvas.clientHeight,
        0.1,
        10000
    );
    camera.position.z = 100;

    // Renderer
    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
    });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Create particle system
    createParticles();

    // Handle window resize
    window.addEventListener('resize', onWindowResize);

    // Start animation loop
    animate();

    // Observer to pause/resume when off-screen
    const heroObserver = new IntersectionObserver((entries) => {
        isSceneActive = entries[0].isIntersecting;
    }, { threshold: 0 });
    heroObserver.observe(container);
}

// Create particles and connecting lines
function createParticles() {
    const particleCount = 100;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    particleVelocities = [];

    // Generate random particles
    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;

        // Position (spread across a large area)
        positions[i3] = (Math.random() - 0.5) * 400;
        positions[i3 + 1] = (Math.random() - 0.5) * 300;
        positions[i3 + 2] = (Math.random() - 0.5) * 200;

        // Velocity
        particleVelocities.push({
            x: (Math.random() - 0.5) * 0.5,
            y: (Math.random() - 0.5) * 0.5,
            z: (Math.random() - 0.5) * 0.5
        });

        // Color - gradient from blue to cyan
        const hue = Math.random() * 0.2; // Blue to cyan range
        const color = new THREE.Color().setHSL(0.5 + hue * 0.5, 1, 0.5);
        colors[i3] = color.r;
        colors[i3 + 1] = color.g;
        colors[i3 + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Create points material
    const pointsMaterial = new THREE.PointsMaterial({
        size: 3,
        sizeAttenuation: true,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        fog: true
    });

    particles = new THREE.Points(geometry, pointsMaterial);
    scene.add(particles);

    // Create lines to connect nearby particles
    createConnectingLines();
}

// Create lines between nearby particles
function createConnectingLines() {
    const lineGeometry = new THREE.BufferGeometry();
    const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x00d9ff,
        transparent: true,
        opacity: 0.4,
        fog: true
    });

    lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);
}

// Update connecting lines each frame
function updateConnectingLines() {
    const positions = particles.geometry.attributes.position.array;
    const linePositions = [];

    const maxDistance = 80;
    const particleCount = positions.length / 3;

    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const x1 = positions[i3];
        const y1 = positions[i3 + 1];
        const z1 = positions[i3 + 2];

        for (let j = i + 1; j < particleCount; j++) {
            const j3 = j * 3;
            const x2 = positions[j3];
            const y2 = positions[j3 + 1];
            const z2 = positions[j3 + 2];

            const dx = x2 - x1;
            const dy = y2 - y1;
            const dz = z2 - z1;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (distance < maxDistance) {
                linePositions.push(x1, y1, z1, x2, y2, z2);
            }
        }
    }

    lines.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePositions), 3));
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    if (!isSceneActive) {
        return;
    }

    // Update particle positions
    const positions = particles.geometry.attributes.position.array;

    for (let i = 0; i < positions.length; i += 3) {
        const velocity = particleVelocities[i / 3];

        positions[i] += velocity.x;
        positions[i + 1] += velocity.y;
        positions[i + 2] += velocity.z;

        // Bounce particles off boundaries
        const boundSize = 200;
        if (Math.abs(positions[i]) > boundSize) velocity.x *= -1;
        if (Math.abs(positions[i + 1]) > boundSize) velocity.y *= -1;
        if (Math.abs(positions[i + 2]) > boundSize) velocity.z *= -1;

        // Slow down particles slightly
        velocity.x *= 0.99;
        velocity.y *= 0.99;
        velocity.z *= 0.99;
    }

    particles.geometry.attributes.position.needsUpdate = true;

    // Update connecting lines
    updateConnectingLines();

    // Gentle rotation
    particles.rotation.x += 0.0001;
    particles.rotation.y += 0.0002;

    // Render
    renderer.render(scene, camera);
}

// Handle window resize
function onWindowResize() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

// Error handling for WebGL
function checkWebGLSupport() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        return !!gl;
    } catch (e) {
        return false;
    }
}

// Initialize on page load
if (checkWebGLSupport()) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initScene);
    } else {
        initScene();
    }
} else {
    console.warn('WebGL not supported, 3D animation disabled');
    canvas.style.background = 'linear-gradient(135deg, #0066ff 0%, #00d9ff 100%)';
}

// Handle tab visibility
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        isSceneActive = false;
    } else {
        isSceneActive = true;
    }
});

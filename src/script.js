import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import particlesVertexShader from "./shaders/particles/vertex.glsl";
import particlesFragmentShader from "./shaders/particles/fragment.glsl";

/**
 * Base
 */
// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

// Loaders
const textureLoader = new THREE.TextureLoader();

/**
 * Sizes
 */
const sizes = {
	width: window.innerWidth,
	height: window.innerHeight,
	pixelRatio: Math.min(window.devicePixelRatio, 2),
};

window.addEventListener("resize", () => {
	// Update sizes
	sizes.width = window.innerWidth;
	sizes.height = window.innerHeight;
	sizes.pixelRatio = Math.min(window.devicePixelRatio, 2);

	// Materials
	particlesMaterial.uniforms.uResolution.value.set(
		sizes.width * sizes.pixelRatio,
		sizes.height * sizes.pixelRatio
	);

	// Update camera
	camera.aspect = sizes.width / sizes.height;
	camera.updateProjectionMatrix();

	// Update renderer
	renderer.setSize(sizes.width, sizes.height);
	renderer.setPixelRatio(sizes.pixelRatio);
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
	35,
	sizes.width / sizes.height,
	0.1,
	100
);
camera.position.set(0, 0, 18);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
	canvas: canvas,
	antialias: true,
});
renderer.setClearColor("#181818");
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(sizes.pixelRatio);
/**
 * Displacment
 */
const displacment = {};

// 2d canvas
displacment.canvas = document.createElement("canvas");
displacment.canvas.width = 128;
displacment.canvas.height = 128;
// show debug canvas
displacment.canvas.style.position = "fixed";
displacment.canvas.style.width = "128px";
displacment.canvas.style.height = "128px";
displacment.canvas.style.top = 0;
displacment.canvas.style.left = 0;
displacment.canvas.style.zIndex = 10;
document.body.append(displacment.canvas);

// Contex
displacment.contex = displacment.canvas.getContext("2d");
displacment.contex.fillRect(
	0,
	0,
	displacment.canvas.width,
	displacment.canvas.height
);

// Glow image
displacment.glowImage = new Image();
displacment.glowImage.src = "/glow.png";

// interactivr plane
displacment.interactivePlane = new THREE.Mesh(
	new THREE.PlaneGeometry(10, 10),
	new THREE.MeshBasicMaterial({ color: "red", side: THREE.DoubleSide })
);
scene.add(displacment.interactivePlane);
displacment.interactivePlane.visible = false;

// Raycaster
displacment.raycaster = new THREE.Raycaster();

// Cords
displacment.screenCursor = new THREE.Vector2(9999, 9999);
displacment.canvasCursor = new THREE.Vector2(9999, 9999);
displacment.canvasCursorPrevious = new THREE.Vector2(9999, 9999);

// Cursor listner
window.addEventListener("pointermove", (event) => {
	displacment.screenCursor.x = (event.clientX / sizes.width) * 2 - 1;
	displacment.screenCursor.y = -(event.clientY / sizes.height) * 2 + 1;
});

// Texture
displacment.texture = new THREE.CanvasTexture(displacment.canvas);

/**
 * Particles
 */
const particlesGeometry = new THREE.PlaneGeometry(10, 10, 128, 128);
particlesGeometry.setIndex(null);
particlesGeometry.deleteAttribute("normal");

const instesityArray = new Float32Array(
	particlesGeometry.attributes.position.count
);
const anglesArray = new Float32Array(
	particlesGeometry.attributes.position.count
);

for (let i = 0; i < particlesGeometry.attributes.position.count; i++) {
	instesityArray[i] = Math.random();
	anglesArray[i] = Math.random() * Math.PI * 2;
}

particlesGeometry.setAttribute(
	"aIntensity",
	new THREE.BufferAttribute(instesityArray, 1)
);

particlesGeometry.setAttribute(
	"aAngels",
	new THREE.BufferAttribute(anglesArray, 1)
);

const particlesMaterial = new THREE.ShaderMaterial({
	// blending: THREE.AdditiveBlending,
	vertexShader: particlesVertexShader,
	fragmentShader: particlesFragmentShader,
	uniforms: {
		uResolution: new THREE.Uniform(
			new THREE.Vector2(
				sizes.width * sizes.pixelRatio,
				sizes.height * sizes.pixelRatio
			)
		),
		uPictureTexture: new THREE.Uniform(
			textureLoader.load("/black_and_white_2.jpg")
		),
		uDisplacmentTexture: new THREE.Uniform(displacment.texture),
	},
});
const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);

/**
 * Animate
 */
const tick = () => {
	// Update controls
	controls.update();

	/**
	 * Raycaster
	 */
	displacment.raycaster.setFromCamera(displacment.screenCursor, camera);
	const intersects = displacment.raycaster.intersectObject(
		displacment.interactivePlane
	);
	if (intersects.length) {
		const uv = intersects[0].uv;

		displacment.canvasCursor.x = uv.x * displacment.canvas.width;
		displacment.canvasCursor.y = (1 - uv.y) * displacment.canvas.height;
	}

	/**
	 * Displasment
	 */
	// Fade out
	displacment.contex.globalCompositeOperation = "source-over";
	displacment.contex.globalAlpha = 0.02;
	displacment.contex.fillRect(
		0,
		0,
		displacment.canvas.width,
		displacment.canvas.height
	);

	// Speed alpha
	const cursorDistance = displacment.canvasCursorPrevious.distanceTo(
		displacment.canvasCursor
	);
	displacment.canvasCursorPrevious.copy(displacment.canvasCursor);
	const alpha = Math.min(cursorDistance * 0.1, 1);

	// Draw glow
	const glowSize = displacment.canvas.width * 0.25;
	displacment.contex.globalCompositeOperation = "lighten";
	displacment.contex.globalAlpha = alpha;
	displacment.contex.drawImage(
		displacment.glowImage,
		displacment.canvasCursor.x - glowSize * 0.5,
		displacment.canvasCursor.y - glowSize * 0.5,
		glowSize,
		glowSize
	);

	// Texture
	displacment.texture.needsUpdate = true;

	// Render
	renderer.render(scene, camera);

	// Call tick again on the next frame
	window.requestAnimationFrame(tick);
};

tick();

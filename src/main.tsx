import * as THREE from 'three';

// Debug elements
const debugEl = document.getElementById('debug') as HTMLElement;
const hoverEl = document.getElementById('hover-indicator') as HTMLElement;

function log(message: string) {
  debugEl.textContent = message;
  console.log(message);
}

function updateHoverInfo(message: string) {
  hoverEl.textContent = message;
}

// Basic Three.js setup
const scene = new THREE.Scene();
scene.background = new THREE.Color('#87CEEB'); // Sky blue
scene.fog = new THREE.Fog('#87CEEB', 20, 60); // Add fog for depth

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(12, 12, 12);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('app')?.appendChild(renderer.domElement);

// Add lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffcc, 0.8);
directionalLight.position.set(20, 30, 20);
directionalLight.castShadow = true;
directionalLight.shadow.camera.near = 1;
directionalLight.shadow.camera.far = 100;
directionalLight.shadow.camera.left = -30;
directionalLight.shadow.camera.right = 30;
directionalLight.shadow.camera.top = 30;
directionalLight.shadow.camera.bottom = -30;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

// Add a semi-transparent cube to show placement position
const placementCube = new THREE.Mesh(
  new THREE.BoxGeometry(1.01, 1.01, 1.01),
  new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.5,
    wireframe: false
  })
);
placementCube.visible = false;

// Set a special layer to exclude from raycasting
placementCube.layers.set(1);

scene.add(placementCube);

// Create voxel materials and geometry
const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const voxelMaterials: Record<string, THREE.MeshStandardMaterial> = {
  '#4caf50': new THREE.MeshStandardMaterial({
    color: '#4caf50',
    roughness: 0.7,
    metalness: 0.0
  }),
  '#8b4513': new THREE.MeshStandardMaterial({
    color: '#8b4513',
    roughness: 0.8,
    metalness: 0.0
  }),
  '#9e9e9e': new THREE.MeshStandardMaterial({
    color: '#9e9e9e',
    roughness: 0.5,
    metalness: 0.3
  }),
  '#a0522d': new THREE.MeshStandardMaterial({
    color: '#a0522d',
    roughness: 0.7,
    metalness: 0.0
  }),
  '#2196f3': new THREE.MeshStandardMaterial({
    color: '#2196f3',
    roughness: 0.4,
    metalness: 0.3
  })
};

// State
let activeColor = '#4caf50';
let isRemoveMode = false;
let hoverPosition: null | string | { x: number; y: number; z: number } = null;
const voxels = new Map(); // Map to store voxels with position as key
const protectedVoxels = new Set(); // Set to store positions of voxels that can't be removed

// Controls setup
let isDragging = false;
let dragStartPosition = { x: 0, y: 0 };
const orbitSpeed = 0.003;

// Flag to track if world has been created
let worldCreated = false;

// Create grass ground terrain
function createGrassGround() {
  // Don't recreate if already created
  if (worldCreated) return;

  // Constants for the terrain
  const size = 50;
  const halfSize = size / 2;

  // Create a flat terrain with slight variations
  for (let x = -halfSize; x < halfSize; x++) {
    for (let z = -halfSize; z < halfSize; z++) {
      // Skip if too far from the center (create a circular-ish terrain)
      const distanceFromCenter = Math.sqrt(x*x + z*z);
      if (distanceFromCenter > halfSize - 5) continue;

      // Determine the height based on distance from center
      // Add some random variations for a more natural look
      let height = -1;
      if (Math.random() < 0.1) { // 10% chance for small height variation
        height += (Math.random() > 0.5 ? 0.2 : -0.2);
      }

      // Add the voxel at the calculated height
      if (Math.random() < 0.95) { // 95% chance for grass
        addVoxel(x, height, z, '#4caf50', false);
        // Mark this voxel as protected (can't be removed)
        protectedVoxels.add(getPositionKey(x, height, z));
      } else { // 5% chance for dirt patches
        addVoxel(x, height, z, '#8b4513', false);
        protectedVoxels.add(getPositionKey(x, height, z));
      }

      // Sometimes add flowers (small colored blocks above the ground)
      if (Math.random() < 0.03 && distanceFromCenter < halfSize - 10) {
        const flowerColors = ['#FF5722', '#FFEB3B', '#E91E63', '#9C27B0'];
        const randomColor = flowerColors[Math.floor(Math.random() * flowerColors.length)];
        const flowerMaterial = new THREE.MeshStandardMaterial({
          color: randomColor,
          roughness: 0.7,
          metalness: 0.0
        });

        // Create a smaller flower block
        const flowerGeometry = new THREE.BoxGeometry(0.3, 0.4, 0.3);
        const flower = new THREE.Mesh(flowerGeometry, flowerMaterial);
        flower.position.set(x, height + 0.7, z);
        flower.castShadow = true;
        flower.receiveShadow = true;
        scene.add(flower);
      }
    }
  }

  // Mark world as created
  worldCreated = true;

  log("World created! Click on block faces to start building.");
}

// Get position key
function getPositionKey(x: number, y: number, z: number): string {
  return `${Math.round(x)},${Math.round(y)},${Math.round(z)}`;
}

// Calculate block position based on face normal
function getBlockPositionFromFace(point: THREE.Vector3, normal: THREE.Vector3) {
  // Create a copy of the intersection point
  const position = point.clone();

  // Add the normal to the position (this places it on the face)
  position.add(normal.multiplyScalar(0.5));

  // Round to ensure it snaps to the grid
  return {
    x: Math.round(position.x),
    y: Math.round(position.y),
    z: Math.round(position.z)
  };
}

// Add a voxel to the scene
function addVoxel(x: number, y: number, z: number, color: string, checkOccupied = true) {
  const position = getPositionKey(x, y, z);

  // Don't add if a voxel already exists at this position
  if (checkOccupied && voxels.has(position)) {
    log(`Position ${position} already occupied`);
    return false;
  }

  // Get the appropriate material for this voxel
  const material = voxelMaterials[color] ? voxelMaterials[color].clone() : voxelMaterials['#4caf50'].clone();

  // Create the voxel mesh
  const voxel = new THREE.Mesh(boxGeometry, material);

  // Set position and add shadows
  voxel.position.set(Math.round(x), Math.round(y), Math.round(z));
  voxel.castShadow = true;
  voxel.receiveShadow = true;

  // Add metadata to the voxel
  voxel.userData.position = position;
  voxel.userData.isVoxel = true;
  voxel.userData.color = color;

  scene.add(voxel);
  voxels.set(position, voxel);
  return true;
}

// Remove a voxel
function removeVoxel(position: string) {
  // Don't remove protected voxels (part of the base terrain)
  if (protectedVoxels.has(position)) {
    log(`Cannot remove base terrain block at ${position}`);
    return false;
  }

  if (voxels.has(position)) {
    const voxel = voxels.get(position);
    scene.remove(voxel);
    voxels.delete(position);
    log(`Removed voxel at ${position}`);
    return true;
  }
  log(`No voxel at ${position}`);
  return false;
}

// Raycaster for mouse interaction
const raycaster = new THREE.Raycaster();

// Configure raycaster to only check layer 0 (exclude placement cube)
raycaster.layers.set(0);

const mouse = new THREE.Vector2();

// Update mouse position
function updateMousePosition(event: MouseEvent) {
  // Calculate mouse position in normalized device coordinates
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

// Check what's under the mouse pointer
function checkIntersection() {
  // Update the raycaster with the mouse position
  raycaster.setFromCamera(mouse, camera);

  // Find intersections (excluding the placement cube)
  const intersects = raycaster.intersectObjects(scene.children);

  if (intersects.length > 0) {
    return intersects[0];
  }

  return null;
}

// Handle mouse down
function onMouseDown(event: MouseEvent) {
  // Only handle clicks on the canvas, not on the UI
  if (event.target !== renderer.domElement) return;

  // Store the starting position for drag detection
  dragStartPosition = { x: event.clientX, y: event.clientY };
  isDragging = false;

  // Update mouse position for raycasting
  updateMousePosition(event);
}

// Handle mouse move
function onMouseMove(event: MouseEvent) {
  // Update mouse position
  updateMousePosition(event);

  // If the mouse button is down, check for dragging
  if (event.buttons === 1) {
    const deltaX = Math.abs(event.clientX - dragStartPosition.x);
    const deltaY = Math.abs(event.clientY - dragStartPosition.y);

    // If we've moved more than a few pixels, it's a drag
    if (deltaX > 3 || deltaY > 3) {
      isDragging = true;

      // Rotate the camera
      const rotationX = (event.clientX - dragStartPosition.x) * orbitSpeed;
      const rotationY = (event.clientY - dragStartPosition.y) * orbitSpeed;

      // Create a rotation quaternion
      const quaternion = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(rotationY, rotationX, 0, 'XYZ')
      );

      // Apply the rotation to the camera's position
      const cameraPosition = new THREE.Vector3().copy(camera.position);
      cameraPosition.applyQuaternion(quaternion);
      camera.position.copy(cameraPosition);
      camera.lookAt(0, 0, 0);

      // Update drag start position
      dragStartPosition = { x: event.clientX, y: event.clientY };
    }
  }

  // Check for hover effects regardless of dragging
  const intersection = checkIntersection();

  if (intersection) {
    if (isRemoveMode) {
      // In remove mode, highlight voxels we can remove
      if (intersection.object.userData.isVoxel) {
        const position = intersection.object.userData.position;

        // Don't allow removing protected voxels
        if (protectedVoxels.has(position)) {
          placementCube.visible = false;
          updateHoverInfo('Cannot remove base terrain blocks');
          hoverPosition = null;
        } else {
          placementCube.position.copy(intersection.object.position);
          placementCube.visible = true;
          placementCube.material.color.set('#ff0000');
          updateHoverInfo(`Remove at: ${intersection.object.position.x}, ${intersection.object.position.y}, ${intersection.object.position.z}`);
          hoverPosition = position;
        }
      } else {
        placementCube.visible = false;
        updateHoverInfo('');
        hoverPosition = null;
      }
    } else {
      // In build mode, show where a block would be placed
      if (intersection.object.userData.isVoxel && intersection.face) {
        // Get the normal of the face that was intersected
        const normal = intersection.face.normal.clone();
        normal.transformDirection(intersection.object.matrixWorld);

        // Calculate the position for the new block based on the face normal
        const newPosition = getBlockPositionFromFace(intersection.point, normal);

        // Create a position key to check if this position is already occupied
        const posKey = getPositionKey(newPosition.x, newPosition.y, newPosition.z);

        // Only show if position is empty
        if (!voxels.has(posKey)) {
          placementCube.position.set(newPosition.x, newPosition.y, newPosition.z);
          placementCube.visible = true;
          placementCube.material.color.set(activeColor);
          updateHoverInfo(`Place at: ${newPosition.x}, ${newPosition.y}, ${newPosition.z}`);
          hoverPosition = newPosition;
        } else {
          placementCube.visible = false;
          updateHoverInfo('Position already occupied');
          hoverPosition = null;
        }
      } else {
        placementCube.visible = false;
        updateHoverInfo('Click on a block face to build');
        hoverPosition = null;
      }
    }
  } else {
    placementCube.visible = false;
    updateHoverInfo('');
    hoverPosition = null;
  }
}

// Handle mouse up (clicks)
function onMouseUp(event: MouseEvent) {
  // Only handle clicks on the canvas
  if (event.target !== renderer.domElement) return;

  // Ignore drags
  if (isDragging) {
    isDragging = false;
    return;
  }

  // If we have a hover position, use it
  if (hoverPosition) {
    if (isRemoveMode && typeof hoverPosition === 'string') {
      // Remove the voxel at hover position
      removeVoxel(hoverPosition);
    } else if (typeof hoverPosition === 'object') {
      // Add a voxel at hover position
      const success = addVoxel(hoverPosition.x, hoverPosition.y, hoverPosition.z, activeColor);
      if (success) {
        log(`Added ${activeColor} block at ${hoverPosition.x}, ${hoverPosition.y}, ${hoverPosition.z}`);
      }
    }
  } else {
    log("Click on a block face to build");
  }
}

// Handle mouse wheel for zoom
function onMouseWheel(event: WheelEvent) {
  event.preventDefault();
  const zoomSpeed = 0.1;

  // Calculate zoom direction
  const zoomDelta = Math.sign(event.deltaY) * zoomSpeed;

  // Apply zoom
  const direction = new THREE.Vector3()
    .subVectors(camera.position, new THREE.Vector3(0, 0, 0))
    .normalize();

  camera.position.addScaledVector(direction, zoomDelta);

  // Limit min/max distance
  const distance = camera.position.length();
  if (distance < 5) {
    camera.position.setLength(5);
  } else if (distance > 50) {
    camera.position.setLength(50);
  }
}

// Convert degrees to radians
function toRadians(angle: number) {
  return angle * (Math.PI / 180);
}

// Set up UI event handlers in a way that prevents them from affecting the 3D scene
// First prevent the default click behavior that could affect scene interactions
const controlsUI = document.getElementById('controls');
controlsUI?.addEventListener('mousedown', (e) => {
  e.stopPropagation(); // Prevent events from reaching the 3D scene
});
controlsUI?.addEventListener('click', (e) => {
  e.stopPropagation(); // Prevent events from reaching the 3D scene
});

// Handle color selection
document.querySelectorAll('.color-btn').forEach(btn => {
  // Use a direct click handler that doesn't affect the scene
  btn.addEventListener('click', (e) => {
    // Prevent any propagation
    e.stopPropagation();

    // Update active color UI
    document.querySelector('.color-btn.active')?.classList.remove('active');
    btn.classList.add('active');

    // Update color state
    activeColor = btn.getAttribute('data-color') || '#4caf50';

    // Update preview if visible
    if (placementCube.visible && !isRemoveMode) {
      placementCube.material.color.set(activeColor);
    }

    // Log color change
    log(`Color changed to ${activeColor}`);
  });
});

// Handle mode selection
document.querySelectorAll('.mode-btn').forEach(btn => {
  // Use a direct click handler that doesn't affect the scene
  btn.addEventListener('click', (e) => {
    // Prevent any propagation
    e.stopPropagation();

    // Update active mode UI
    document.querySelector('.mode-btn.active')?.classList.remove('active');
    btn.classList.add('active');

    // Update mode state
    isRemoveMode = btn.getAttribute('data-mode') === 'remove';

    // Update preview if visible
    if (placementCube.visible) {
      placementCube.material.color.set(isRemoveMode ? '#ff0000' : activeColor);
    }

    // Log mode change
    log(`Mode changed to ${isRemoveMode ? 'REMOVE' : 'BUILD'}`);
  });
});

// Resize handler
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Add event listeners
window.addEventListener('resize', onWindowResize);
window.addEventListener('mousedown', onMouseDown);
window.addEventListener('mousemove', onMouseMove);
window.addEventListener('mouseup', onMouseUp);
window.addEventListener('wheel', onMouseWheel, { passive: false });

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

// Initialize and start
createGrassGround();
animate();
log("Voxel Sandbox initialized - BUILD mode active");

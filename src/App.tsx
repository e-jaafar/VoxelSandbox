import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, useTexture } from '@react-three/drei';

// Interface for voxel data
interface VoxelData {
  position: [number, number, number];
  color: string;
}

// Color options for blocks
const BLOCK_COLORS = {
  grass: '#4caf50',
  dirt: '#8b4513',
  stone: '#9e9e9e',
  wood: '#a0522d',
  blue: '#2196f3'
};

// Component for individual voxel
function Voxel({ position, color, onClick }: {
  position: [number, number, number];
  color: string;
  onClick: () => void;
}) {
  return (
    <mesh position={position} onClick={onClick}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

// Component for the ground plane
function Ground({ onClick }: { onClick: (position: [number, number, number]) => void }) {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.5, 0]}
      receiveShadow
      onClick={(e) => {
        e.stopPropagation();
        if (e.point) {
          const x = Math.round(e.point.x);
          const z = Math.round(e.point.z);
          onClick([x, 0, z]);
        }
      }}
    >
      <planeGeometry args={[50, 50]} />
      <meshStandardMaterial color="#cccccc" transparent opacity={0.5} />
    </mesh>
  );
}

// Component for controls UI
function ControlPanel({
  activeColor,
  setActiveColor,
  isRemoving,
  setIsRemoving
}: {
  activeColor: string;
  setActiveColor: (color: string) => void;
  isRemoving: boolean;
  setIsRemoving: (value: boolean) => void;
}) {
  return (
    <div className="absolute left-4 top-4 z-10 bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-3">Voxel Sandbox</h2>

      <div className="mb-4">
        <p className="text-sm font-medium mb-2">Block Colors:</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(BLOCK_COLORS).map(([name, color]) => (
            <button
              key={name}
              className={`w-10 h-10 rounded-md transition-transform ${
                activeColor === color ? 'ring-2 ring-blue-500 scale-110' : 'hover:scale-105'
              }`}
              style={{ backgroundColor: color }}
              onClick={() => setActiveColor(color)}
              title={name}
            />
          ))}
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm font-medium mb-2">Mode:</p>
        <div className="flex gap-2">
          <button
            className={`px-3 py-1 rounded-md ${
              !isRemoving ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
            }`}
            onClick={() => setIsRemoving(false)}
          >
            <span className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M12 4v16m8-8H4" />
              </svg>
              Build
            </span>
          </button>
          <button
            className={`px-3 py-1 rounded-md ${
              isRemoving ? 'bg-red-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
            }`}
            onClick={() => setIsRemoving(true)}
          >
            <span className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
              Remove
            </span>
          </button>
        </div>
      </div>

      <div className="text-xs text-gray-600 bg-gray-100 p-2 rounded">
        <p>• Click to place blocks</p>
        <p>• Click blocks to add/remove</p>
        <p>• Right click + drag to rotate</p>
        <p>• Scroll to zoom</p>
      </div>
    </div>
  );
}

// Main App component
function App() {
  const [voxels, setVoxels] = useState<VoxelData[]>([]);
  const [activeColor, setActiveColor] = useState<string>(BLOCK_COLORS.grass);
  const [isRemoving, setIsRemoving] = useState(false);

  // Create initial platform
  useEffect(() => {
    const initialVoxels: VoxelData[] = [];

    // Create a flat platform
    for (let x = -3; x <= 3; x++) {
      for (let z = -3; z <= 3; z++) {
        initialVoxels.push({
          position: [x, -1, z],
          color: BLOCK_COLORS.stone
        });
      }
    }

    setVoxels(initialVoxels);
  }, []);

  // Add a new voxel
  const addVoxel = (position: [number, number, number]) => {
    // Check if position is already occupied
    const exists = voxels.some(v =>
      v.position[0] === position[0] &&
      v.position[1] === position[1] &&
      v.position[2] === position[2]
    );

    if (!exists) {
      setVoxels([...voxels, { position, color: activeColor }]);
    }
  };

  // Handle voxel click
  const handleVoxelClick = (index: number, position: [number, number, number]) => {
    if (isRemoving) {
      // Remove the voxel
      const updatedVoxels = [...voxels];
      updatedVoxels.splice(index, 1);
      setVoxels(updatedVoxels);
    } else {
      // Add a voxel on top of the clicked one
      const newPosition: [number, number, number] = [
        position[0],
        position[1] + 1,
        position[2]
      ];
      addVoxel(newPosition);
    }
  };

  return (
    <div className="w-full h-screen bg-gray-100">
      <ControlPanel
        activeColor={activeColor}
        setActiveColor={setActiveColor}
        isRemoving={isRemoving}
        setIsRemoving={setIsRemoving}
      />

      <Canvas shadows camera={{ position: [10, 10, 10], fov: 50 }}>
        <color attach="background" args={['#87CEEB']} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 10]} intensity={1} castShadow />

        {/* Render voxels */}
        {voxels.map((voxel, index) => (
          <Voxel
            key={`voxel-${index}`}
            position={voxel.position}
            color={voxel.color}
            onClick={() => handleVoxelClick(index, voxel.position)}
          />
        ))}

        {/* Ground for placing the first voxels */}
        <Ground onClick={addVoxel} />

        {/* Grid for reference */}
        <gridHelper args={[50, 50]} position={[0, 0.01, 0]} />

        {/* Camera controls */}
        <OrbitControls minDistance={5} maxDistance={50} />
      </Canvas>
    </div>
  );
}

export default App;

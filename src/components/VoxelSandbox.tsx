import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky } from '@react-three/drei';
import { VoxelWorld } from './VoxelWorld';
import { VoxelControls } from './VoxelControls';

type BlockType = 'grass' | 'dirt' | 'stone' | 'wood' | 'leaves';

export function VoxelSandbox() {
  const [selectedBlock, setSelectedBlock] = useState<BlockType>('grass');
  const [isRemoving, setIsRemoving] = useState(false);

  return (
    <div className="h-screen w-screen">
      <div className="absolute top-4 left-4 z-10">
        <VoxelControls
          selectedBlock={selectedBlock}
          setSelectedBlock={setSelectedBlock}
          isRemoving={isRemoving}
          setIsRemoving={setIsRemoving}
        />
      </div>
      <Canvas
        camera={{ position: [10, 10, 10], fov: 75 }}
      >
        <color attach="background" args={['#87CEEB']} />
        <ambientLight intensity={0.5} />
        <directionalLight
          castShadow
          position={[10, 20, 15]}
          intensity={1.5}
        />
        <VoxelWorld selectedBlock={selectedBlock} isRemoving={isRemoving} />
        <OrbitControls
          minDistance={5}
          maxDistance={50}
        />
        <Sky sunPosition={[100, 100, 100]} />
      </Canvas>
    </div>
  );
}

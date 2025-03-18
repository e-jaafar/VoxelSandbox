import { useRef, useState, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { Vector3, Group } from 'three';
import { Voxel } from './Voxel';

type BlockType = 'grass' | 'dirt' | 'stone' | 'wood' | 'leaves';

interface VoxelData {
  position: [number, number, number];
  type: BlockType;
}

interface VoxelWorldProps {
  selectedBlock: BlockType;
  isRemoving: boolean;
}

export function VoxelWorld({ selectedBlock, isRemoving }: VoxelWorldProps) {
  const [voxels, setVoxels] = useState<VoxelData[]>([]);
  const [hoveredPosition, setHoveredPosition] = useState<Vector3 | null>(null);
  const groupRef = useRef<Group>(null);

  // Create initial ground plane of grass blocks
  useEffect(() => {
    const initialVoxels: VoxelData[] = [];
    for (let x = -5; x <= 5; x++) {
      for (let z = -5; z <= 5; z++) {
        initialVoxels.push({
          position: [x, 0, z],
          type: 'grass',
        });
      }
    }
    setVoxels(initialVoxels);
  }, []);

  // Add a new voxel
  const addVoxel = (position: Vector3) => {
    const roundedPos: [number, number, number] = [
      Math.round(position.x),
      Math.round(position.y),
      Math.round(position.z)
    ];

    // Check if there's already a voxel at this position
    const exists = voxels.some(
      voxel =>
        voxel.position[0] === roundedPos[0] &&
        voxel.position[1] === roundedPos[1] &&
        voxel.position[2] === roundedPos[2]
    );

    if (!exists) {
      setVoxels([...voxels, {
        position: roundedPos,
        type: selectedBlock
      }]);
    }
  };

  // Remove a voxel
  const removeVoxel = (position: Vector3) => {
    const roundedPos: [number, number, number] = [
      Math.round(position.x),
      Math.round(position.y),
      Math.round(position.z)
    ];

    setVoxels(voxels.filter(
      voxel =>
        voxel.position[0] !== roundedPos[0] ||
        voxel.position[1] !== roundedPos[1] ||
        voxel.position[2] !== roundedPos[2]
    ));
  };

  // Handle voxel click
  const handleVoxelClick = (position: Vector3, index: number) => {
    if (isRemoving) {
      setVoxels(voxels.filter((_, i) => i !== index));
    } else {
      // Add a new voxel above the clicked one
      const newPosition = position.clone().add(new Vector3(0, 1, 0));
      addVoxel(newPosition);
    }
  };

  // Handle ground click
  const handleGroundClick = (event: any) => {
    if (!isRemoving) {
      const position = event.point.clone();
      position.y = 1; // Just above the ground
      addVoxel(position);
    }
  };

  return (
    <group ref={groupRef}>
      {/* Grid for reference */}
      <gridHelper args={[20, 20]} position={[0, 0.01, 0]} />

      {/* Voxels */}
      {voxels.map((voxel, index) => (
        <Voxel
          key={`${voxel.position.join('-')}-${index}`}
          position={new Vector3(...voxel.position)}
          type={voxel.type}
          onClick={() => handleVoxelClick(new Vector3(...voxel.position), index)}
        />
      ))}

      {/* Ground plane for placing first blocks */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.5, 0]}
        receiveShadow
        onClick={handleGroundClick}
      >
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial visible={false} />
      </mesh>
    </group>
  );
}

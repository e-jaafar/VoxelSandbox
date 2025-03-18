import { useRef } from 'react';
import { Vector3, Mesh } from 'three';

type BlockType = 'grass' | 'dirt' | 'stone' | 'wood' | 'leaves';

interface VoxelProps {
  position: Vector3;
  type: BlockType;
  onClick?: () => void;
}

export function Voxel({ position, type, onClick }: VoxelProps) {
  const meshRef = useRef<Mesh>(null);

  // Get the appropriate color for the block type
  const getBlockColor = (): string => {
    switch (type) {
      case 'grass': return '#4caf50';
      case 'dirt': return '#8b4513';
      case 'stone': return '#9e9e9e';
      case 'wood': return '#a0522d';
      case 'leaves': return '#2e7d32';
      default: return '#ffffff';
    }
  };

  return (
    <mesh
      ref={meshRef}
      position={position}
      castShadow
      receiveShadow
      onClick={onClick ? (e) => {
        e.stopPropagation();
        onClick();
      } : undefined}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={getBlockColor()}
        roughness={0.7}
        metalness={0.1}
      />
    </mesh>
  );
}

import React, { useState } from 'react';

type BlockType = 'grass' | 'dirt' | 'stone' | 'wood' | 'leaves';

interface VoxelControlsProps {
  selectedBlock: BlockType;
  setSelectedBlock: (block: BlockType) => void;
  isRemoving: boolean;
  setIsRemoving: (removing: boolean) => void;
}

export function VoxelControls({
  selectedBlock,
  setSelectedBlock,
  isRemoving,
  setIsRemoving,
}: VoxelControlsProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const blocks: { type: BlockType; name: string }[] = [
    { type: 'grass', name: 'Grass Block' },
    { type: 'dirt', name: 'Dirt Block' },
    { type: 'stone', name: 'Stone Block' },
    { type: 'wood', name: 'Wood Block' },
    { type: 'leaves', name: 'Leaf Block' },
  ];

  const getBlockColor = (blockType: BlockType): string => {
    switch (blockType) {
      case 'grass':
        return 'bg-green-500';
      case 'dirt':
        return 'bg-amber-800';
      case 'stone':
        return 'bg-gray-500';
      case 'wood':
        return 'bg-amber-600';
      case 'leaves':
        return 'bg-green-600';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className="relative">
      {/* Collapse toggle button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 -top-3 z-20 bg-blue-500 text-white w-7 h-7 rounded-full flex items-center justify-center shadow-md hover:bg-blue-600 transition-colors"
        aria-label={isCollapsed ? 'Expand controls' : 'Collapse controls'}
      >
        {isCollapsed ? '+' : '−'}
      </button>

      <div className={`bg-white/90 p-4 rounded-lg shadow-lg backdrop-blur-sm transition-all duration-200 ${isCollapsed ? 'w-14 h-14 overflow-hidden' : 'w-auto'}`}>
        {isCollapsed ? (
          <div className="h-6 w-6 bg-blue-500 rounded-md"></div>
        ) : (
          <>
            <h2 className="text-lg font-bold mb-4 text-gray-800">Voxel Sandbox</h2>
            <div className="flex flex-col gap-5">
              <div>
                <p className="font-medium mb-2 text-gray-700">Block Types:</p>
                <div className="flex gap-2 flex-wrap">
                  {blocks.map((block) => (
                    <button
                      key={block.type}
                      className={`w-12 h-12 ${getBlockColor(
                        block.type
                      )} rounded-md flex items-center justify-center text-xs capitalize ${
                        selectedBlock === block.type
                          ? 'ring-2 ring-blue-500 ring-offset-2 transform scale-110'
                          : 'hover:transform hover:scale-105'
                      } transition-all duration-150 shadow-md`}
                      onClick={() => setSelectedBlock(block.type)}
                      title={block.name}
                    >
                      {block.type.slice(0, 4)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-medium mb-2 text-gray-700">Mode:</p>
                <div className="flex gap-2">
                  <button
                    className={`px-3 py-2 rounded-md transition-colors shadow-md ${
                      !isRemoving
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    onClick={() => setIsRemoving(false)}
                  >
                    <span className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Place
                    </span>
                  </button>
                  <button
                    className={`px-3 py-2 rounded-md transition-colors shadow-md ${
                      isRemoving
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    onClick={() => setIsRemoving(true)}
                  >
                    <span className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Remove
                    </span>
                  </button>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-600 bg-gray-100 p-3 rounded-md">
                <p className="font-medium mb-1 text-gray-700">Controls:</p>
                <ul className="space-y-1 list-disc pl-5">
                  <li>Click to place/remove blocks</li>
                  <li>Right click + drag to rotate</li>
                  <li>Scroll to zoom in/out</li>
                </ul>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

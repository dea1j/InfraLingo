import { useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  applyNodeChanges,
  applyEdgeChanges,
} from "@xyflow/react";
import type { NodeChange, EdgeChange } from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import { useAppStore } from "../../store/useAppStore";

export default function ArchitectureCanvas() {
  const { nodes, edges, setNodes, setEdges } = useAppStore();

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes(applyNodeChanges(changes, nodes)),
    [nodes, setNodes]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges(applyEdgeChanges(changes, edges)),
    [edges, setEdges]
  );

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        colorMode="dark"
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#475569" gap={16} />
        <Controls />
        <MiniMap nodeColor="#3B82F6" maskColor="rgba(15, 23, 42, 0.8)" />
      </ReactFlow>
    </div>
  );
}

import { useState, useCallback, useEffect, useMemo } from "react";
import {
  ReactFlow,
  Controls,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { getReasoningSteps, buildGraphElements, type ReasoningStep } from "@/data/reasoningSteps";
import ReasoningNode from "./ReasoningNode";
import AnimatedEdge from "./AnimatedEdge";
import DetailPanel from "./DetailPanel";

const nodeTypes = { reasoning: ReasoningNode };
const edgeTypes = { animated: AnimatedEdge };

interface ReasoningGraphProps {
  ticker: string;
  running: boolean;
}

const ReasoningGraph = ({ ticker, running }: ReasoningGraphProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedStep, setSelectedStep] = useState<ReasoningStep | null>(null);

  const steps = useMemo(() => getReasoningSteps(ticker), [ticker]);
  const { nodes: allNodes, edges: allEdges } = useMemo(() => buildGraphElements(steps), [steps]);

  useEffect(() => {
    if (!running) return;

    setNodes([]);
    setEdges([]);
    setSelectedStep(null);

    allNodes.forEach((node, i) => {
      setTimeout(() => {
        setNodes((prev) => [...prev, node]);
      }, i * 700);
    });

    allEdges.forEach((edge, i) => {
      setTimeout(() => {
        setEdges((prev) => [...prev, edge]);
      }, (i + 1) * 700 + 300);
    });
  }, [running, allNodes, allEdges, setNodes, setEdges]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const step = (node.data as { step: ReasoningStep }).step;
      setSelectedStep((prev) => (prev?.id === step.id ? null : step));
    },
    []
  );

  return (
    <div className="flex flex-1 min-h-0">
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.4 }}
          proOptions={{ hideAttribution: true }}
          minZoom={0.5}
          maxZoom={1.5}
          nodesDraggable={true}
          nodesConnectable={false}
        >
          <Controls showInteractive={false} className="!bg-card !border-border !shadow-sm" />
        </ReactFlow>
      </div>

      {selectedStep && (
        <DetailPanel step={selectedStep} onClose={() => setSelectedStep(null)} />
      )}
    </div>
  );
};

export default ReasoningGraph;

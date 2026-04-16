import { memo } from "react";
import { BaseEdge, getSmoothStepPath, type EdgeProps } from "@xyflow/react";

const AnimatedEdge = (props: EdgeProps) => {
  const [edgePath] = getSmoothStepPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
    sourcePosition: props.sourcePosition,
    targetPosition: props.targetPosition,
    borderRadius: 16,
  });

  return (
    <BaseEdge
      id={props.id}
      path={edgePath}
      style={{ stroke: "#2D9E8F", strokeWidth: 2 }}
      className="animated-edge"
    />
  );
};

export default memo(AnimatedEdge);

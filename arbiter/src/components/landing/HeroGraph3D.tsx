import { useMemo, useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const TEAL = new THREE.Color("#2D9E8F");
const TEAL_DEEP = new THREE.Color("#1F7A6E");

interface NodeDef {
    pos: THREE.Vector3;
    phase: number;
}

function buildGraph(count = 32) {
    const nodes: NodeDef[] = [];
    const phi = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i++) {
        const y = 1 - (i / (count - 1)) * 2;
        const r = Math.sqrt(1 - y * y);
        const theta = phi * i;
        const x = Math.cos(theta) * r;
        const z = Math.sin(theta) * r;
        const radius = 3.6 + (Math.random() - 0.5) * 0.7;
        nodes.push({
            pos: new THREE.Vector3(x * radius, y * radius, z * radius),
            phase: Math.random() * Math.PI * 2,
        });
    }

    const edges: [number, number][] = [];
    const seen = new Set<string>();
    nodes.forEach((n, i) => {
        const dists = nodes
            .map((m, j) => ({ j, d: n.pos.distanceTo(m.pos) }))
            .filter((x) => x.j !== i)
            .sort((a, b) => a.d - b.d)
            .slice(0, 3);
        dists.forEach(({ j }) => {
            const key = i < j ? `${i}-${j}` : `${j}-${i}`;
            if (!seen.has(key)) {
                seen.add(key);
                edges.push([i, j]);
            }
        });
    });

    return { nodes, edges };
}

function Nodes({ nodes }: { nodes: NodeDef[] }) {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    useFrame(({ clock, mouse }) => {
        if (!meshRef.current) return;
        const t = clock.getElapsedTime();
        nodes.forEach((n, i) => {
            const pulse = 1 + Math.sin(t * 1.5 + n.phase) * 0.18;
            // Slight repulsion from cursor in screen-space-ish way
            const mx = mouse.x * 4;
            const my = mouse.y * 4;
            const dx = n.pos.x - mx;
            const dy = n.pos.y - my;
            const d = Math.sqrt(dx * dx + dy * dy);
            const push = Math.max(0, 1.2 - d * 0.3) * 0.25;
            dummy.position.set(
                n.pos.x + (dx / (d || 1)) * push,
                n.pos.y + (dy / (d || 1)) * push,
                n.pos.z
            );
            dummy.scale.setScalar(0.09 * pulse);
            dummy.updateMatrix();
            meshRef.current!.setMatrixAt(i, dummy.matrix);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, nodes.length]}>
            <sphereGeometry args={[1, 24, 24]} />
            <meshBasicMaterial color={TEAL_DEEP} toneMapped={false} />
        </instancedMesh>
    );
}

function NodeGlows({ nodes }: { nodes: NodeDef[] }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    useFrame(({ clock }) => {
        if (!ref.current) return;
        const t = clock.getElapsedTime();
        nodes.forEach((n, i) => {
            const pulse = 1 + Math.sin(t * 1.5 + n.phase) * 0.4;
            dummy.position.copy(n.pos);
            dummy.scale.setScalar(0.32 * pulse);
            dummy.updateMatrix();
            ref.current!.setMatrixAt(i, dummy.matrix);
        });
        ref.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={ref} args={[undefined, undefined, nodes.length]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshBasicMaterial color={TEAL} transparent opacity={0.18} depthWrite={false} toneMapped={false} />
        </instancedMesh>
    );
}

function Edges({ nodes, edges }: { nodes: NodeDef[]; edges: [number, number][] }) {
    const geom = useMemo(() => {
        const positions = new Float32Array(edges.length * 2 * 3);
        edges.forEach(([a, b], i) => {
            const pa = nodes[a].pos;
            const pb = nodes[b].pos;
            positions.set([pa.x, pa.y, pa.z, pb.x, pb.y, pb.z], i * 6);
        });
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        return g;
    }, [nodes, edges]);

    return (
        <lineSegments geometry={geom}>
            <lineBasicMaterial color={TEAL} transparent opacity={0.55} toneMapped={false} />
        </lineSegments>
    );
}

function Scene() {
    const groupRef = useRef<THREE.Group>(null);
    const { mouse, clock } = useThree();
    const targetRot = useRef(new THREE.Vector2(0, 0));

    const { nodes, edges } = useMemo(() => buildGraph(32), []);

    useFrame((_, dt) => {
        if (!groupRef.current) return;
        targetRot.current.x = mouse.y * 0.6;
        targetRot.current.y = mouse.x * 0.9;
        groupRef.current.rotation.y += dt * 0.06;
        groupRef.current.rotation.x += (targetRot.current.x - groupRef.current.rotation.x) * 0.04;
        groupRef.current.rotation.y += (targetRot.current.y - groupRef.current.rotation.y) * 0.002;
    });

    useEffect(() => {
        const handleVisibility = () => {
            if (document.visibilityState === "visible") {
                clock.start(); // resets elapsed time
            }
        };
        document.addEventListener("visibilitychange", handleVisibility);
        return () => document.removeEventListener("visibilitychange", handleVisibility);
    }, [clock]);

    // rest of your code stays exactly the same
    return (
        <group ref={groupRef}>
            <Edges nodes={nodes} edges={edges} />
            <NodeGlows nodes={nodes} />
            <Nodes nodes={nodes} />
        </group>
    );
}

export const HeroGraph3D = () => {
    return (
        <Canvas
            camera={{ position: [0, 0, 9], fov: 55 }}
            dpr={[1, 2]}
            gl={{ antialias: true, alpha: true }}
            className="!absolute inset-0"
        >
            <Scene />
        </Canvas>
    );
};

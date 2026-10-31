import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, OrbitControls, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  Store,
  Users,
  Package,
  Layers,
  Search,
  RotateCcw,
  Eye,
  Sliders,
  DollarSign,
  TrendingUp,
  X,
} from 'lucide-react';

export interface CustomerNodeData {
  id: string;
  name: string;
  spend: number;
  billsCount: number;
}

export interface ProductNodeData {
  id: string;
  name: string;
  category: string;
  price: number;
  unitsSold: number;
}

interface BusinessNetwork3DProps {
  storeName?: string;
  totalRevenue?: number;
  customers?: CustomerNodeData[];
  products?: ProductNodeData[];
  onSelectNode?: (node: { type: 'hub' | 'customer' | 'product'; data: any }) => void;
}

// ── 1. Central Store Hub ──────────────────────────────────────────────────────
function StoreHub({
  name,
  revenue,
  isSelected,
  onClick,
}: {
  name: string;
  revenue: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.4;
      meshRef.current.rotation.x = Math.sin(t * 0.2) * 0.15;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = -t * 0.3;
      ringRef.current.rotation.y = t * 0.2;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Outer energy rings */}
      <group ref={ringRef}>
        <mesh rotation={[Math.PI / 3, 0, 0]}>
          <torusGeometry args={[2.0, 0.03, 16, 64]} />
          <meshBasicMaterial color={hovered || isSelected ? '#38bdf8' : '#06b6d4'} transparent opacity={0.7} />
        </mesh>
        <mesh rotation={[-Math.PI / 4, 0, 0]}>
          <torusGeometry args={[2.4, 0.02, 16, 64]} />
          <meshBasicMaterial color="#10b981" transparent opacity={0.5} />
        </mesh>
      </group>

      {/* Core Glowing Crystal / Dodecahedron */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <dodecahedronGeometry args={[1.2, 0]} />
        <meshPhysicalMaterial
          color={hovered || isSelected ? '#10b981' : '#059669'}
          emissive="#10b981"
          emissiveIntensity={hovered || isSelected ? 0.8 : 0.4}
          roughness={0.1}
          metalness={0.8}
          clearcoat={1}
          wireframe={false}
        />
      </mesh>

      {/* Floating Store Name & Revenue Label */}
      <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2}>
        <Text
          position={[0, 1.8, 0]}
          fontSize={0.28}
          color="#38bdf8"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#020617"
        >
          {name}
        </Text>
        <Text
          position={[0, 1.5, 0]}
          fontSize={0.2}
          color="#10b981"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.015}
          outlineColor="#020617"
        >
          {`₹${revenue.toLocaleString('en-IN')}`}
        </Text>
      </Float>
    </group>
  );
}

// ── 2. Customer Party Node ───────────────────────────────────────────────────
function CustomerNode({
  customer,
  position,
  isSelected,
  onClick,
}: {
  customer: CustomerNodeData;
  position: [number, number, number];
  isSelected: boolean;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Size proportional to spend
  const radius = Math.min(0.7, Math.max(0.35, 0.35 + (customer.spend / 10000) * 0.35));

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    meshRef.current.position.y = position[1] + Math.sin(t * 1.5 + position[0]) * 0.12;
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[radius, 32, 32]} />
        <meshPhysicalMaterial
          color={hovered || isSelected ? '#00e5ff' : '#0284c7'}
          emissive="#00e5ff"
          emissiveIntensity={hovered || isSelected ? 0.9 : 0.3}
          roughness={0.2}
          metalness={0.7}
          clearcoat={0.8}
        />
      </mesh>

      <Text
        position={[0, radius + 0.3, 0]}
        fontSize={0.2}
        color="#e2e8f0"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#020617"
      >
        {customer.name}
      </Text>
      <Text
        position={[0, radius + 0.12, 0]}
        fontSize={0.14}
        color="#38bdf8"
        anchorX="center"
        anchorY="middle"
      >
        {`₹${customer.spend.toLocaleString('en-IN')}`}
      </Text>
    </group>
  );
}

// ── 3. Product Catalog Node ───────────────────────────────────────────────────
function ProductNode({
  product,
  position,
  isSelected,
  onClick,
}: {
  product: ProductNodeData;
  position: [number, number, number];
  isSelected: boolean;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Color by category
  const colorMap: Record<string, string> = {
    Grains: '#f59e0b',
    Dairy: '#06b6d4',
    Flour: '#10b981',
    Spices: '#ec4899',
    General: '#8b5cf6',
  };
  const baseColor = colorMap[product.category] || '#10b981';

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    meshRef.current.rotation.y = t * 0.8;
    meshRef.current.position.y = position[1] + Math.cos(t * 1.2 + position[0]) * 0.1;
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <octahedronGeometry args={[0.42, 0]} />
        <meshPhysicalMaterial
          color={hovered || isSelected ? '#ffffff' : baseColor}
          emissive={baseColor}
          emissiveIntensity={hovered || isSelected ? 0.9 : 0.4}
          roughness={0.2}
          metalness={0.7}
        />
      </mesh>

      <Text
        position={[0, 0.65, 0]}
        fontSize={0.18}
        color="#f1f5f9"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#020617"
      >
        {product.name.length > 15 ? product.name.slice(0, 14) + '…' : product.name}
      </Text>
      <Text
        position={[0, 0.48, 0]}
        fontSize={0.14}
        color="#fbbf24"
        anchorX="center"
        anchorY="middle"
      >
        {`₹${product.price} • ${product.unitsSold} sold`}
      </Text>
    </group>
  );
}

// ── 4. Flow Pathway Curve (Connecting Tubes) ─────────────────────────────────
function FlowPathway({
  start,
  end,
  color = '#06b6d4',
  pulseSpeed = 2,
}: {
  start: [number, number, number];
  end: [number, number, number];
  color?: string;
  pulseSpeed?: number;
}) {
  const curve = useMemo(() => {
    const vStart = new THREE.Vector3(...start);
    const vEnd = new THREE.Vector3(...end);
    const mid = new THREE.Vector3()
      .addVectors(vStart, vEnd)
      .multiplyScalar(0.5)
      .add(new THREE.Vector3(0, 0.8, 0));
    return new THREE.QuadraticBezierCurve3(vStart, mid, vEnd);
  }, [start, end]);

  const points = useMemo(() => curve.getPoints(30), [curve]);
  const lineGeometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);

  // Animated particle travelling along path
  const particleRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!particleRef.current) return;
    const t = (state.clock.getElapsedTime() * pulseSpeed * 0.25) % 1;
    const pt = curve.getPoint(t);
    particleRef.current.position.set(pt.x, pt.y, pt.z);
  });

  return (
    <group>
      <primitive object={new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.3 }))} />
      {/* Glowing Energy Flow Bead */}
      <mesh ref={particleRef}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}

// ── 5. Main 3D Network Canvas Component ───────────────────────────────────────
export default function BusinessNetwork3D({
  storeName = 'Sharma Kirana Store',
  totalRevenue = 5500,
  customers = [
    { id: 'c-1', name: 'Ramesh Kumar', spend: 1450, billsCount: 4 },
    { id: 'c-2', name: 'Suresh Patel', spend: 3200, billsCount: 6 },
    { id: 'c-3', name: 'Priya Sharma', spend: 850, billsCount: 2 },
  ],
  products = [
    { id: 'p-1', name: 'Basmati Rice 5kg', category: 'Grains', price: 450, unitsSold: 5 },
    { id: 'p-2', name: 'Amul Milk 1L', category: 'Dairy', price: 66, unitsSold: 9 },
    { id: 'p-3', name: 'Aashirvaad Atta 10kg', category: 'Flour', price: 380, unitsSold: 5 },
    { id: 'p-4', name: 'Tata Salt 1kg', category: 'Spices', price: 28, unitsSold: 3 },
  ],
  onSelectNode,
}: BusinessNetwork3DProps) {
  const [selectedNode, setSelectedNode] = useState<{ type: 'hub' | 'customer' | 'product'; data: any } | null>({
    type: 'hub',
    data: { name: storeName, totalRevenue, customersCount: customers.length, productsCount: products.length },
  });
  const [filterText, setFilterText] = useState('');
  const [viewMode2D, setViewMode2D] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const controlsRef = useRef<any>(null);

  // Filtered lists
  const filteredCustomers = useMemo(
    () => customers.filter((c) => c.name.toLowerCase().includes(filterText.toLowerCase())),
    [customers, filterText]
  );
  const filteredProducts = useMemo(
    () =>
      products.filter(
        (p) =>
          p.name.toLowerCase().includes(filterText.toLowerCase()) ||
          p.category.toLowerCase().includes(filterText.toLowerCase())
      ),
    [products, filterText]
  );

  // Position customers on the left arc
  const customerPositions = useMemo(() => {
    return filteredCustomers.map((_, i) => {
      const angle = (Math.PI * 0.7) + (i / Math.max(1, filteredCustomers.length - 1 || 1)) * (Math.PI * 0.6);
      const radius = 4.2;
      return [Math.cos(angle) * radius, (i - 1) * 0.8, Math.sin(angle) * radius * 0.6] as [number, number, number];
    });
  }, [filteredCustomers]);

  // Position products on the right arc
  const productPositions = useMemo(() => {
    return filteredProducts.map((_, i) => {
      const angle = -(Math.PI * 0.3) + (i / Math.max(1, filteredProducts.length - 1 || 1)) * (Math.PI * 0.6);
      const radius = 4.4;
      return [Math.cos(angle) * radius, (i - 1.5) * 0.7, Math.sin(angle) * radius * 0.6] as [number, number, number];
    });
  }, [filteredProducts]);

  const handleSelect = (node: { type: 'hub' | 'customer' | 'product'; data: any }) => {
    setSelectedNode(node);
    if (onSelectNode) onSelectNode(node);
  };

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  return (
    <div className="relative w-full h-[520px] rounded-2xl overflow-hidden bg-slate-950/90 border border-white/10 shadow-2xl flex flex-col">
      {/* Top Controls Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 text-xs shadow-lg">
          <Store className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-slate-100">3D Business Network</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Live Flows
          </span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Search / Filter Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Filter customer or product..."
              className="bg-slate-900/90 backdrop-blur-md text-xs text-slate-100 pl-8 pr-3 py-1.5 rounded-xl border border-white/10 focus:outline-none focus:border-cyan-500/50 w-48 transition-all"
            />
            {filterText && (
              <button
                onClick={() => setFilterText('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Reset Camera Button */}
          <button
            onClick={handleResetCamera}
            title="Reset View"
            className="p-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* 2D / 3D Toggle */}
          <button
            onClick={() => setViewMode2D(!viewMode2D)}
            title="Toggle 2D / 3D Mode"
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors flex items-center gap-1.5 backdrop-blur-md ${
              viewMode2D
                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-900/90 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            {viewMode2D ? '2D View' : '3D View'}
          </button>
        </div>
      </div>

      {/* 2D Fallback Mode */}
      {viewMode2D ? (
        <div className="w-full h-full p-6 pt-20 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-950/80">
          {/* Customers Column */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-white/5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wider">
              <Users className="w-4 h-4" />
              Customer Network ({filteredCustomers.length})
            </div>
            <div className="space-y-2">
              {filteredCustomers.map((c) => (
                <div
                  key={c.id}
                  onClick={() => handleSelect({ type: 'customer', data: c })}
                  className="p-3 rounded-lg bg-white/5 hover:bg-sky-500/10 border border-white/5 hover:border-sky-500/30 cursor-pointer transition-all flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-semibold text-slate-200">{c.name}</div>
                    <div className="text-[10px] text-slate-400">{c.billsCount} bills</div>
                  </div>
                  <div className="text-xs font-mono font-bold text-sky-400">
                    ₹{c.spend.toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Central Hub Column */}
          <div className="bg-gradient-to-b from-cyan-950/40 to-emerald-950/40 p-5 rounded-xl border border-cyan-500/30 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-glow-cyan">
              <Store className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">{storeName}</h3>
              <p className="text-xs text-slate-400">Central Ledger & Invoicing Hub</p>
            </div>
            <div className="w-full p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
              <div className="text-[11px] text-slate-400">Total Recorded Sales</div>
              <div className="text-xl font-bold font-mono text-emerald-400">
                ₹{totalRevenue.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Products Column */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-white/5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <Package className="w-4 h-4" />
              Active Catalog ({filteredProducts.length})
            </div>
            <div className="space-y-2">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleSelect({ type: 'product', data: p })}
                  className="p-3 rounded-lg bg-white/5 hover:bg-amber-500/10 border border-white/5 hover:border-amber-500/30 cursor-pointer transition-all flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-semibold text-slate-200">{p.name}</div>
                    <div className="text-[10px] text-slate-400">{p.category}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-amber-400">₹{p.price}</div>
                    <div className="text-[10px] text-slate-500">{p.unitsSold} sold</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* 3D WebGL Canvas Scene */
        <Canvas
          camera={{ position: [0, 2, 9], fov: 48 }}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        >
          <ambientLight intensity={0.6} />
          <pointLight position={[10, 10, 10]} intensity={1.2} color="#00e5ff" />
          <pointLight position={[-10, -5, -5]} intensity={0.8} color="#10b981" />
          <directionalLight position={[0, 8, 4]} intensity={0.5} />

          {/* Central Hub */}
          <StoreHub
            name={storeName}
            revenue={totalRevenue}
            isSelected={selectedNode?.type === 'hub'}
            onClick={() =>
              handleSelect({
                type: 'hub',
                data: { name: storeName, totalRevenue, customersCount: customers.length, productsCount: products.length },
              })
            }
          />

          {/* Customer Nodes & Connections */}
          {filteredCustomers.map((cust, i) => {
            const pos = customerPositions[i] || [-(i + 2), 0, 0];
            return (
              <React.Fragment key={cust.id}>
                <CustomerNode
                  customer={cust}
                  position={pos}
                  isSelected={selectedNode?.type === 'customer' && selectedNode.data.id === cust.id}
                  onClick={() => handleSelect({ type: 'customer', data: cust })}
                />
                <FlowPathway start={pos} end={[0, 0, 0]} color="#00e5ff" pulseSpeed={1.5} />
              </React.Fragment>
            );
          })}

          {/* Product Nodes & Connections */}
          {filteredProducts.map((prod, i) => {
            const pos = productPositions[i] || [i + 2, 0, 0];
            return (
              <React.Fragment key={prod.id}>
                <ProductNode
                  product={prod}
                  position={pos}
                  isSelected={selectedNode?.type === 'product' && selectedNode.data.id === prod.id}
                  onClick={() => handleSelect({ type: 'product', data: prod })}
                />
                <FlowPathway start={[0, 0, 0]} end={pos} color="#f59e0b" pulseSpeed={1.2} />
              </React.Fragment>
            );
          })}

          <OrbitControls
            ref={controlsRef}
            enablePan={true}
            enableZoom={true}
            maxDistance={15}
            minDistance={4}
            dampingFactor={0.05}
          />
        </Canvas>
      )}

      {/* Bottom Inspection Card / Drawer */}
      {selectedNode && (
        <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-none">
          <div className="pointer-events-auto max-w-lg mx-auto bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  selectedNode.type === 'hub'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : selectedNode.type === 'customer'
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}
              >
                {selectedNode.type === 'hub' && <Store className="w-5 h-5" />}
                {selectedNode.type === 'customer' && <Users className="w-5 h-5" />}
                {selectedNode.type === 'product' && <Package className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase text-slate-400 tracking-wider">
                    {selectedNode.type === 'hub' ? 'Store Hub' : selectedNode.type === 'customer' ? 'Customer Profile' : 'Product Details'}
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-100">
                  {selectedNode.data.name}
                </div>
                <div className="text-xs text-slate-400">
                  {selectedNode.type === 'hub' &&
                    `Total Revenue: ₹${selectedNode.data.totalRevenue?.toLocaleString('en-IN')} • ${selectedNode.data.customersCount} Customers • ${selectedNode.data.productsCount} Products`}
                  {selectedNode.type === 'customer' &&
                    `Total Purchases: ₹${selectedNode.data.spend?.toLocaleString('en-IN')} across ${selectedNode.data.billsCount} bills`}
                  {selectedNode.type === 'product' &&
                    `Default Selling Price: ₹${selectedNode.data.price} • ${selectedNode.data.unitsSold} units sold (${selectedNode.data.category})`}
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedNode(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

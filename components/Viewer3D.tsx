
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { SplatData, SceneAnalysis } from '../types';

interface Viewer3DProps {
  splatData: SplatData | null;
  analysis: SceneAnalysis | null;
  selectedObjectName: string | null;
  settings: {
    splatScale: number;
    depthIntensity: number;
    pointSize: number;
  };
  onHover: (object: { name: string; description: string; historicalContext?: string } | null, mouseX: number, mouseY: number) => void;
  onSelect: (name: string | null) => void;
}

const Viewer3D: React.FC<Viewer3DProps> = ({ splatData, analysis, selectedObjectName, settings, onHover, onSelect }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const groupRef = useRef<THREE.Group>(new THREE.Group());
  const pointsRef = useRef<THREE.Points | null>(null);
  
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const frameIdRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x08080a);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 20000);
    camera.position.set(0, 0, 800);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    scene.add(groupRef.current);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.5;
    controls.maxDistance = 5000;
    controls.minDistance = 50;

    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      const elapsedTime = (Date.now() - startTimeRef.current) / 1000;
      if (pointsRef.current && pointsRef.current.material instanceof THREE.ShaderMaterial) {
        pointsRef.current.material.uniforms.uTime.value = elapsedTime;
      }
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!rendererRef.current || !cameraRef.current || !pointsRef.current || !analysis) return;
      const rect = rendererRef.current.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      raycasterRef.current.params.Points.threshold = Math.max(2.0, settings.pointSize * settings.splatScale * 0.8);
      const intersects = raycasterRef.current.intersectObject(pointsRef.current);

      if (intersects.length > 0) {
        const point = intersects[0].point;
        const localPos = pointsRef.current.worldToLocal(point.clone());
        const geometry = pointsRef.current.geometry;
        if (!geometry.boundingBox) geometry.computeBoundingBox();
        const bbox = geometry.boundingBox!;
        const width = bbox.max.x - bbox.min.x;
        const height = bbox.max.y - bbox.min.y;
        const normX = width !== 0 ? ((localPos.x - bbox.min.x) / width) * 100 : 0;
        const normY = height !== 0 ? (1.0 - (localPos.y - bbox.min.y) / height) * 100 : 0;

        let found = null;
        for (const obj of analysis.objects) {
          if (obj.boundingBox) {
            const [ymin, xmin, ymax, xmax] = obj.boundingBox;
            if (normX >= xmin && normX <= xmax && normY >= ymin && normY <= ymax) {
              found = obj;
              break;
            }
          }
        }

        const mat = pointsRef.current.material as THREE.ShaderMaterial;
        if (found) {
          onHover({ name: found.name, description: found.description, historicalContext: found.historicalContext }, event.clientX, event.clientY);
          mat.uniforms.uHoveredBox.value.set(found.boundingBox![1] / 100, found.boundingBox![0] / 100, found.boundingBox![3] / 100, found.boundingBox![2] / 100);
        } else {
          onHover(null, 0, 0);
          mat.uniforms.uHoveredBox.value.set(-1, -1, -1, -1);
        }
      } else {
        onHover(null, 0, 0);
        if (pointsRef.current) (pointsRef.current.material as THREE.ShaderMaterial).uniforms.uHoveredBox.value.set(-1, -1, -1, -1);
      }
    };

    const handleClick = () => {
        if (!rendererRef.current || !cameraRef.current || !pointsRef.current || !analysis) return;
        raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
        const intersects = raycasterRef.current.intersectObject(pointsRef.current);
        if (intersects.length > 0) {
            const point = intersects[0].point;
            const localPos = pointsRef.current.worldToLocal(point.clone());
            const geometry = pointsRef.current.geometry;
            const bbox = geometry.boundingBox!;
            const width = bbox.max.x - bbox.min.x;
            const height = bbox.max.y - bbox.min.y;
            const normX = width !== 0 ? ((localPos.x - bbox.min.x) / width) * 100 : 0;
            const normY = height !== 0 ? (1.0 - (localPos.y - bbox.min.y) / height) * 100 : 0;

            let found = null;
            for (const obj of analysis.objects) {
                if (obj.boundingBox) {
                    const [ymin, xmin, ymax, xmax] = obj.boundingBox;
                    if (normX >= xmin && normX <= xmax && normY >= ymin && normY <= ymax) {
                        found = obj;
                        break;
                    }
                }
            }
            onSelect(found ? found.name : null);
        } else {
            onSelect(null);
        }
    }

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      cancelAnimationFrame(frameIdRef.current);
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [analysis, onHover, onSelect, settings.pointSize, settings.splatScale]);

  // Handle selected object uniform updates
  useEffect(() => {
    if (!pointsRef.current || !analysis) return;
    const mat = pointsRef.current.material as THREE.ShaderMaterial;
    const selectedObj = analysis.objects.find(o => o.name === selectedObjectName);
    if (selectedObj && selectedObj.boundingBox) {
        mat.uniforms.uSelectedBox.value.set(
            selectedObj.boundingBox[1] / 100,
            selectedObj.boundingBox[0] / 100,
            selectedObj.boundingBox[3] / 100,
            selectedObj.boundingBox[2] / 100
        );
    } else {
        mat.uniforms.uSelectedBox.value.set(-1, -1, -1, -1);
    }
  }, [selectedObjectName, analysis]);

  useEffect(() => {
    if (!splatData || splatData.positions.length === 0) return;
    if (pointsRef.current) {
      groupRef.current.remove(pointsRef.current);
      pointsRef.current.geometry.dispose();
      (pointsRef.current.material as THREE.ShaderMaterial).dispose();
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(splatData.positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(splatData.colors, 3));
    geometry.computeBoundingBox();
    const bbox = geometry.boundingBox!;
    const width = bbox.max.x - bbox.min.x;
    const height = bbox.max.y - bbox.min.y;
    const count = splatData.positions.length / 3;
    const uv = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      const px = splatData.positions[i * 3];
      const py = splatData.positions[i * 3 + 1];
      uv[i * 2] = width !== 0 ? (px - bbox.min.x) / width : 0.5;
      uv[i * 2 + 1] = height !== 0 ? 1.0 - (py - bbox.min.y) / height : 0.5;
    }
    geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPointSize: { value: settings.pointSize },
        uHoveredBox: { value: new THREE.Vector4(-1, -1, -1, -1) },
        uSelectedBox: { value: new THREE.Vector4(-1, -1, -1, -1) },
        uOpacity: { value: 0.9 },
      },
      vertexShader: `
        attribute vec3 color;
        varying vec3 vColor;
        varying float vHighlight;
        varying float vSelected;
        varying float vNoise;
        varying float vAlpha;
        uniform float uTime;
        uniform float uPointSize;
        uniform vec4 uHoveredBox;
        uniform vec4 uSelectedBox;

        float rand(vec2 co){
            return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
        }
        
        void main() {
          vColor = color;
          vHighlight = 0.0;
          vSelected = 0.0;
          if (uv.x >= uHoveredBox.x && uv.x <= uHoveredBox.z && uv.y >= uHoveredBox.y && uv.y <= uHoveredBox.w) vHighlight = 1.0;
          if (uv.x >= uSelectedBox.x && uv.x <= uSelectedBox.z && uv.y >= uSelectedBox.y && uv.y <= uSelectedBox.w) vSelected = 1.0;

          vNoise = rand(uv);
          float frequency = 0.04;
          float amp = 1.2;
          float driftX = sin(uTime * 0.4 + position.y * frequency + vNoise * 6.0) * amp;
          float driftY = cos(uTime * 0.3 + position.x * frequency + vNoise * 5.0) * amp;
          float driftZ = sin(uTime * 0.2 + (position.x + position.y) * 0.01) * amp * 0.5;
          vec3 displacedPos = position + vec3(driftX, driftY, driftZ);
          vec4 mvPosition = modelViewMatrix * vec4(displacedPos, 1.0);
          vec4 projectedPosition = projectionMatrix * mvPosition;
          vec3 ndc = projectedPosition.xyz / projectedPosition.w;
          bool isOutside = abs(ndc.x) > 1.1 || abs(ndc.y) > 1.1 || ndc.z < -1.1 || ndc.z > 1.1;
          if (isOutside) {
            gl_PointSize = 0.0;
            gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
            return;
          }
          float dist = length(mvPosition.xyz);
          float density = 1.0;
          if (dist > 800.0) density = mix(1.0, 0.4, smoothstep(800.0, 2000.0, dist));
          if (dist > 2000.0) density = mix(0.4, 0.1, smoothstep(2000.0, 4000.0, dist));
          if (vNoise > density && vHighlight < 0.5 && vSelected < 0.5) {
            gl_PointSize = 0.0;
            gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
            return;
          }
          float sizeFactor = 600.0 / max(20.0, dist);
          vAlpha = 1.0 - smoothstep(2500.0, 5000.0, dist);
          if (vAlpha <= 0.01) {
            gl_PointSize = 0.0;
            gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
            return;
          }
          gl_PointSize = uPointSize * sizeFactor;
          if (vHighlight > 0.5 || vSelected > 0.5) gl_PointSize *= 1.5;
          gl_PointSize = clamp(gl_PointSize, 0.0, 512.0);
          gl_Position = projectedPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vHighlight;
        varying float vSelected;
        varying float vNoise;
        varying float vAlpha;
        uniform float uOpacity;
        uniform float uTime;
        
        void main() {
          vec2 jitter = vec2(sin(uTime * 6.0 + vNoise * 50.0), cos(uTime * 5.0 + vNoise * 45.0)) * 0.015;
          vec2 cxy = 2.0 * (gl_PointCoord + jitter) - 1.0;
          float r = dot(cxy, cxy);
          if (r > 1.0) discard;
          
          float mainSplat = exp(-4.5 * r);
          float coreRepulsion = 0.25 * exp(-30.0 * r);
          float falloff = clamp(mainSplat - coreRepulsion, 0.0, 1.0);
          float pulse = 0.95 + 0.05 * sin(uTime * 2.0 + vNoise * 10.0);
          float alpha = falloff * uOpacity * pulse * vAlpha;
          alpha *= (1.0 - smoothstep(0.85, 1.0, r));
          
          vec3 finalColor = vColor;
          if (vHighlight > 0.5) {
            finalColor = mix(vColor, vec3(0.3, 0.6, 1.0), 0.3);
            alpha = mix(alpha, 1.0, 0.4);
          }
          if (vSelected > 0.5) {
            float scan = sin(uTime * 4.0 - vNoise * 2.0) * 0.5 + 0.5;
            finalColor = mix(finalColor, vec3(0.1, 0.8, 1.0), 0.5 + scan * 0.3);
            alpha = mix(alpha, 1.0, 0.6);
          }
          
          finalColor += exp(-12.0 * r) * 0.1;
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
    });

    const points = new THREE.Points(geometry, material);
    pointsRef.current = points;
    groupRef.current.add(points);
    const center = new THREE.Vector3();
    bbox.getCenter(center);
    points.position.copy(center).multiplyScalar(-1);
    groupRef.current.scale.set(settings.splatScale, settings.splatScale, settings.depthIntensity);
  }, [splatData, settings.depthIntensity, settings.pointSize, settings.splatScale]);

  useEffect(() => {
    if (groupRef.current) groupRef.current.scale.set(settings.splatScale, settings.splatScale, settings.depthIntensity);
    if (pointsRef.current && pointsRef.current.material instanceof THREE.ShaderMaterial) {
      pointsRef.current.material.uniforms.uPointSize.value = settings.pointSize;
      pointsRef.current.material.needsUpdate = true;
    }
  }, [settings.splatScale, settings.depthIntensity, settings.pointSize]);

  return <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />;
};

export default Viewer3D;

import * as THREE from 'three';

// Helper to generate positions for the tree (Cone shape) vs Exploded (Sphere cloud)
export const generateParticles = (count: number, type: 'leaf' | 'ribbon' | 'gold') => {
  const data = new Float32Array(count * 6); // x,y,z (tree), x,y,z (explode)
  
  const treeHeight = 16;
  const treeRadius = 7;

  for (let i = 0; i < count; i++) {
    const i3 = i * 6;

    // --- TREE FORMATION ---
    let tx, ty, tz;
    
    if (type === 'leaf' || type === 'gold') {
      // Random volume inside cone
      const h = Math.random(); // 0 to 1 height factor
      // For gold ornaments, push them slightly more towards the surface but still mixed in
      const rScale = type === 'gold' ? 0.9 : 1.0; 
      const rMax = (1 - h) * treeRadius * rScale;
      
      // Bias gold distribution slightly outward
      const rRand = Math.random();
      const r = (type === 'gold' ? Math.sqrt(rRand) : rRand) * rMax; 
      
      const theta = Math.random() * Math.PI * 2;
      
      ty = (h * treeHeight) - (treeHeight / 2);
      tx = r * Math.cos(theta);
      tz = r * Math.sin(theta);
    } else {
      // Ribbon: Spiral on surface
      // Optimize for elegance: tighter spiral, smooth follow
      const turns = 4.5; // More loops for elegance
      const t = i / count; // 0 to 1 along the ribbon
      
      // Non-linear height for better visual flow (ease-out)
      const h = t; 
      
      // Radius tapers as it goes up, sits slightly outside the leaves
      const r = (1 - h) * (treeRadius + 0.8); 
      const theta = t * Math.PI * 2 * turns;
      
      ty = (h * treeHeight) - (treeHeight / 2);
      tx = r * Math.cos(theta);
      tz = r * Math.sin(theta);
    }

    data[i3] = tx;
    data[i3 + 1] = ty;
    data[i3 + 2] = tz;

    // --- EXPLODE FORMATION (Random Sphere) ---
    const phi = Math.acos(-1 + (2 * i) / count);
    const sqrtPi = Math.sqrt(count * Math.PI) * phi;
    
    // Gold and Ribbon particles explode further out for dramatic effect
    const radiusBase = type === 'leaf' ? 15 : 20;
    const explodeR = radiusBase + Math.random() * 10;
    
    data[i3 + 3] = explodeR * Math.cos(sqrtPi) * Math.sin(phi);
    data[i3 + 4] = explodeR * Math.sin(sqrtPi) * Math.sin(phi);
    data[i3 + 5] = explodeR * Math.cos(phi);
  }
  
  return data;
};
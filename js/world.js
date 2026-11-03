import * as THREE from 'three';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';

/*
  The 3D world behind the page.
  - Hero: a brass dulang with the Nasi Ambeng Talam in the middle.
  - "Sajian Pilihan": the camera flies past each featured dish, one per stage card.
  - Finale: the camera rises and every dish lands back on the dulang.
  The page works without this file; it only adds the scene when WebGL is available.
*/

const BG = 0x2a120c;
const SPACING = 7;
const PATH_Z0 = -8;
const PLATE_R = 1.55;
const CENTER_R = 1.0;
const FINALE = new THREE.Vector3(0, -9, 0);
const NARROW_SCALE = 0.82;

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (t) => t * t * (3 - 2 * t);
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a, b, t) => a + (b - a) * t;

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function veins(ctx, w, h, mid, step, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  for (let x = -h; x < w + h; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, mid);
    ctx.lineTo(x + h * 0.6, 0);
    ctx.moveTo(x, mid);
    ctx.lineTo(x + h * 0.6, h);
    ctx.stroke();
  }
}

function drawLeaf(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#3c7a31');
  g.addColorStop(0.5, '#5f9d45');
  g.addColorStop(1, '#2d6628');
  ctx.beginPath();
  ctx.moveTo(w * 0.01, h * 0.5);
  ctx.bezierCurveTo(w * 0.22, h * 0.02, w * 0.78, h * 0.03, w * 0.995, h * 0.5);
  ctx.bezierCurveTo(w * 0.78, h * 0.97, w * 0.22, h * 0.98, w * 0.01, h * 0.5);
  ctx.closePath();
  ctx.fillStyle = g;
  ctx.fill();
  ctx.save();
  ctx.clip();
  veins(ctx, w, h, h * 0.5, 6, 'rgba(18,48,16,0.30)', 1.1);
  veins(ctx, w, h, h * 0.5, 29, 'rgba(200,236,160,0.10)', 4);
  ctx.strokeStyle = 'rgba(214,236,176,0.8)';
  ctx.lineWidth = h * 0.028;
  ctx.beginPath();
  ctx.moveTo(w * 0.01, h * 0.5);
  ctx.quadraticCurveTo(w * 0.5, h * 0.47, w * 0.995, h * 0.5);
  ctx.stroke();
  ctx.restore();
}

function drawTrayLining(ctx, w, h) {
  const r = w / 2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(r, r, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = '#3f7a33';
  ctx.fillRect(0, 0, w, h);
  for (let k = 0; k < 3; k++) {
    ctx.save();
    ctx.translate(r, r);
    ctx.rotate(k * 1.15 + 0.3);
    ctx.translate(-r, -r);
    if (k > 0) {
      ctx.beginPath();
      ctx.rect(0, 0, w, h / 2);
      ctx.clip();
    }
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, k % 2 ? '#4f8f3b' : '#3b7430');
    g.addColorStop(1, k % 2 ? '#386f2d' : '#5a9a44');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    veins(ctx, w, h, h * 0.5, 9, 'rgba(16,44,14,0.28)', 1.6);
    veins(ctx, w, h, h * 0.5, 41, 'rgba(206,238,168,0.09)', 6);
    ctx.strokeStyle = 'rgba(214,236,176,0.55)';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.5);
    ctx.lineTo(w, h * 0.5);
    ctx.stroke();
    ctx.restore();
  }
  const edge = ctx.createRadialGradient(r, r, r * 0.55, r, r, r);
  edge.addColorStop(0, 'rgba(0,0,0,0)');
  edge.addColorStop(1, 'rgba(18,30,10,0.45)');
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function drawDot(ctx, w, h) {
  const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function plateGeometry(R) {
  const p = [
    [0.001, 0], [0.6, 0], [0.63, -0.04], [0.67, -0.04], [0.7, 0.01], [0.9, 0.08],
    [1.0, 0.15], [1.0, 0.17], [0.985, 0.178], [0.88, 0.11], [0.8, 0.05], [0.001, 0.045],
  ].map(([x, y]) => new THREE.Vector2(x * R, y * R));
  return new THREE.LatheGeometry(p, 96);
}

function dulangGeometry() {
  const p = [
    [0.001, 0], [2.55, 0], [2.62, 0.02], [2.75, 0.16], [2.82, 0.3], [2.88, 0.31],
    [2.88, 0.34], [2.8, 0.34], [2.71, 0.2], [2.6, 0.08], [2.52, 0.06], [0.001, 0.06],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  return new THREE.LatheGeometry(p, 128);
}

function makePlate(R, map, ceramic) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(plateGeometry(R), ceramic);
  const food = new THREE.Mesh(
    new THREE.CircleGeometry(R * 0.8, 72),
    new THREE.MeshBasicMaterial({ map, toneMapped: false, color: 0xf6f2ec, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })
  );
  food.rotation.x = -Math.PI / 2;
  food.position.y = R * 0.06;
  g.add(body, food);
  return g;
}

export async function startWorld({ canvas, centerpiece, plates }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.Fog(BG, 13, 40);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.75;

  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 140);
  scene.add(camera);
  const key = new THREE.DirectionalLight(0xffd6a0, 2.3);
  key.position.set(-3, 4, 2);
  key.target.position.set(0, 0, -6);
  camera.add(key, key.target);
  scene.add(new THREE.HemisphereLight(0xffe4bd, 0x2a120c, 0.85));

  const loader = new THREE.TextureLoader();
  const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const load = async (url) => {
    const t = await loader.loadAsync(url);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = maxAniso;
    return t;
  };
  const [centerTex, ...plateTex] = await Promise.all([load(centerpiece), ...plates.map((p) => load(p.tex))]);

  const ceramic = new THREE.MeshStandardMaterial({ color: 0xf3ede2, roughness: 0.28, metalness: 0, side: THREE.DoubleSide });
  const brass = new THREE.MeshStandardMaterial({ color: 0xd2a04a, roughness: 0.3, metalness: 1, side: THREE.DoubleSide });

  const dulang = new THREE.Group();
  dulang.add(new THREE.Mesh(dulangGeometry(), brass));
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.6, 0.42, 96, 1, true), brass);
  foot.position.y = -0.21;
  dulang.add(foot);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(2.86, 0.045, 12, 160), brass);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.34;
  dulang.add(rim);
  const lining = new THREE.Mesh(
    new THREE.CircleGeometry(2.62, 96),
    new THREE.MeshStandardMaterial({ map: canvasTexture(1024, 1024, drawTrayLining), roughness: 0.55 })
  );
  lining.rotation.x = -Math.PI / 2;
  lining.position.y = 0.064;
  dulang.add(lining);
  const centerPlate = makePlate(CENTER_R, centerTex, ceramic);
  centerPlate.position.y = 0.1;
  dulang.add(centerPlate);
  scene.add(dulang);

  const plateMeshes = plateTex.map((t) => {
    const m = makePlate(PLATE_R, t, ceramic);
    scene.add(m);
    return m;
  });

  const leafTex = canvasTexture(512, 192, drawLeaf);
  const leafMat = new THREE.MeshStandardMaterial({ map: leafTex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.6 });
  const leafGeo = new THREE.PlaneGeometry(3.4, 1.28, 16, 1);
  const lp = leafGeo.attributes.position;
  for (let i = 0; i < lp.count; i++) lp.setZ(i, Math.sin((lp.getX(i) / 3.4 + 0.5) * Math.PI) * 0.35);
  leafGeo.computeVertexNormals();
  const leaves = [];
  const leafSpots = [
    [3.4, 3.9, -3.5], [4.6, -3.6, 1.0], [-6.0, 2.4, -11.5], [6.2, -2.2, -18.5],
    [-6.4, -2.4, -25.5], [6.0, 2.6, -32.5], [-5.8, 2.0, -38],
  ];
  leafSpots.forEach(([x, y, z], i) => {
    const m = new THREE.Mesh(leafGeo, leafMat);
    m.position.set(x, y, z);
    m.userData = { base: new THREE.Vector3(x, y, z), seed: i * 1.7 };
    scene.add(m);
    leaves.push(m);
  });

  const COUNT = 520;
  const pos = new Float32Array(COUNT * 3);
  const speed = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 26;
    pos[i * 3 + 1] = -13 + Math.random() * 21;
    pos[i * 3 + 2] = 12 - Math.random() * 58;
    speed[i] = 0.08 + Math.random() * 0.22;
  }
  const dotsGeo = new THREE.BufferGeometry();
  dotsGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dots = new THREE.Points(
    dotsGeo,
    new THREE.PointsMaterial({
      size: 0.075, map: canvasTexture(64, 64, drawDot), color: 0xffc06a, transparent: true,
      opacity: 0.75, depthWrite: false, blending: THREE.AdditiveBlending,
    })
  );
  scene.add(dots);

  let wide = true;
  let anchors = { chain: [], finaleTop: null, finaleH: 0 };

  const tmpQ = new THREE.Quaternion();
  const qa = new THREE.Quaternion();
  const qb = new THREE.Quaternion();
  const AX = new THREE.Vector3(1, 0, 0);
  const AY = new THREE.Vector3(0, 1, 0);

  function plateOrientation(out, yaw, pitch, spin) {
    out.setFromAxisAngle(AY, yaw);
    qa.setFromAxisAngle(AX, pitch);
    qb.setFromAxisAngle(AY, spin);
    return out.multiply(qa).multiply(qb);
  }

  function plateDistance() {
    const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    return Math.min(14, Math.max(7.5, (PLATE_R * NARROW_SCALE * 1.1) / (tanHalf * camera.aspect)));
  }

  function pathPos(j, out) {
    const z = PATH_Z0 - j * SPACING;
    return wide ? out.set(j % 2 === 0 ? 1.6 : -1.6, 0.1, z) : out.set(0, 0.05, z);
  }

  const S = { pos: new THREE.Vector3(), look: new THREE.Vector3() };
  const A = { pos: new THREE.Vector3(), look: new THREE.Vector3() };
  const B = { pos: new THREE.Vector3(), look: new THREE.Vector3() };

  function chainState(k, out) {
    if (k <= 0) {
      if (wide) {
        out.pos.set(-2.4, 2.3, 10.2);
        out.look.set(-2.4, -0.15, 0);
      } else {
        out.pos.set(0, 4.8, 20.5);
        out.look.set(0, -2.9, 0);
      }
      return out;
    }
    const z = PATH_Z0 - (k - 1) * SPACING;
    if (wide) {
      out.pos.set(0, 0.5, z + 6.9);
      out.look.set(0, 0.15, z - 4);
    } else {
      const d = plateDistance();
      out.pos.set(0, -0.55, z + d);
      out.look.set(0, -0.16 * d, z - 1);
    }
    return out;
  }

  function finaleState(c, out) {
    const f = FINALE;
    if (wide) {
      out.look.set(f.x - 2.9, f.y, f.z + 0.2);
      out.pos.set(f.x - 2.9, f.y + lerp(7.8, 10.8, c), f.z + lerp(9.6, 3.4, c));
    } else {
      out.look.set(f.x, f.y, f.z + 3.9);
      out.pos.set(f.x, f.y + lerp(12, 18, c), f.z + lerp(17, 7.4, c));
    }
    return out;
  }

  function measure() {
    const y = window.scrollY;
    const ih = window.innerHeight;
    const chain = [];
    document.querySelectorAll('[data-world="hero"], [data-world="dish"]').forEach((el) => {
      const r = el.getBoundingClientRect();
      chain.push(el.dataset.world === 'hero' ? 0 : r.top + y + r.height / 2 - ih / 2);
    });
    const fin = document.querySelector('[data-world="finale"]');
    if (fin) {
      const r = fin.getBoundingClientRect();
      anchors = { chain, finaleTop: r.top + y, finaleH: r.height };
    } else {
      anchors = { chain, finaleTop: null, finaleH: 0 };
    }
  }

  function chainT(y, ih) {
    const c = anchors.chain;
    if (!c.length || y <= c[0]) return 0;
    for (let k = 0; k < c.length - 1; k++) {
      if (y < c[k + 1]) return k + (y - c[k]) / Math.max(1, c[k + 1] - c[k]);
    }
    return c.length - 1 + Math.min(0.45, (y - c[c.length - 1]) / ih);
  }

  function finaleQ(y, ih) {
    const { finaleTop: top, finaleH: h } = anchors;
    if (top == null) return -1;
    if (y < top) return Math.max(-1, (y - top) / ih);
    return (y - top) / Math.max(1, h - ih);
  }

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    wide = camera.aspect >= 0.9;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, wide ? 2 : 1.75) * quality);
    renderer.setSize(w, h, false);
    measure();
  }

  let quality = 1;
  let Tc = 0;
  let qc = -1;
  let owner = '';
  let mx = 0;
  let my = 0;
  let tmx = 0;
  let tmy = 0;
  let time = 0;
  const v1 = new THREE.Vector3();
  const v2 = new THREE.Vector3();

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    tmx = e.clientX / window.innerWidth - 0.5;
    tmy = e.clientY / window.innerHeight - 0.5;
  }, { passive: true });

  function update(dt) {
    time += dt;
    const y = window.scrollY;
    const ih = window.innerHeight;
    const now = anchors.finaleTop != null && y + ih > anchors.finaleTop ? 'finale' : 'chain';
    const Tt = chainT(y, ih);
    const qt = finaleQ(y, ih);
    if (now !== owner) {
      owner = now;
      Tc = Tt;
      qc = qt;
    } else {
      const k = 1 - Math.exp(-dt * 6);
      Tc += (Tt - Tc) * k;
      qc += (qt - qc) * k;
    }
    mx += (tmx - mx) * (1 - Math.exp(-dt * 3));
    my += (tmy - my) * (1 - Math.exp(-dt * 3));

    const n = plateMeshes.length;
    if (owner === 'chain') {
      const k = Math.floor(Tc);
      const t = easeInOut(clamp01(Tc - k));
      chainState(k, A);
      chainState(k + 1, B);
      S.pos.lerpVectors(A.pos, B.pos, t);
      S.look.lerpVectors(A.look, B.look, t);
      const down = smooth(clamp01((Tc - 0.05) / 0.85));
      dulang.position.set(0, 0, 0).lerp(FINALE, down);
      dulang.quaternion.setFromAxisAngle(AX, lerp(0.78, 0.2, down)).multiply(qa.setFromAxisAngle(AY, time * 0.12));
      for (let j = 0; j < n; j++) {
        const m = plateMeshes[j];
        pathPos(j, m.position);
        m.position.y += Math.sin(time * 0.9 + j * 1.3) * 0.07;
        const side = wide ? (j % 2 === 0 ? 1 : -1) : 0;
        // once the camera moves on to the next dish, this one glides aside to let it pass
        const pass = smooth(clamp01((Tc - (j + 1) - 0.1) / 0.55));
        const out = j % 2 === 0 ? 1 : -1;
        m.position.x += out * pass * (wide ? 3.2 : 4.6);
        m.position.y += pass * 1.1;
        plateOrientation(m.quaternion, -side * 0.28 - out * pass * 0.9, Math.PI / 2 - 0.42, Math.sin(time * 0.4 + j) * 0.12);
        m.scale.setScalar(wide ? 1 : NARROW_SCALE);
      }
    } else {
      const c = easeInOut(clamp01(qc));
      finaleState(c, S);
      dulang.position.copy(FINALE);
      dulang.quaternion.setFromAxisAngle(AY, time * 0.06);
      const g = smooth(clamp01((qc - 0.05) / 0.7));
      for (let j = 0; j < n; j++) {
        const m = plateMeshes[j];
        const a = Math.PI / n + (j * Math.PI * 2) / n + time * 0.06;
        const ha = Math.PI / n + (j * Math.PI * 2) / n;
        v1.set(FINALE.x + Math.cos(ha) * 5.4, FINALE.y + 3.4 + (j % 2) * 0.9, FINALE.z + Math.sin(ha) * 5.4);
        v1.y += Math.sin(time * 0.9 + j * 1.3) * 0.08;
        v2.set(FINALE.x + Math.cos(a) * 1.82, FINALE.y + 0.12, FINALE.z + Math.sin(a) * 1.82);
        m.position.lerpVectors(v1, v2, g);
        m.position.y += Math.sin(g * Math.PI) * 1.4;
        plateOrientation(tmpQ, -ha + Math.PI / 2, 0.9, Math.sin(time * 0.4 + j) * 0.12);
        qb.setFromAxisAngle(AY, -a);
        m.quaternion.slerpQuaternions(tmpQ, qb, g);
        m.scale.setScalar(lerp(0.72, 0.48, g));
      }
    }

    if (wide) {
      S.pos.x += mx * 0.45;
      S.pos.y -= my * 0.25;
    }
    S.pos.x += Math.sin(time * 0.31) * 0.06;
    S.pos.y += Math.cos(time * 0.27) * 0.05;
    camera.position.copy(S.pos);
    camera.lookAt(S.look);

    const leftLeaves = owner === 'chain' ? smooth(clamp01((Tc - 0.35) / 0.5)) : 1;
    for (const leaf of leaves) {
      const { base, seed } = leaf.userData;
      leaf.scale.setScalar(base.x < 0 ? Math.max(0.001, leftLeaves) : 1);
      leaf.position.set(base.x, base.y + Math.sin(time * 0.5 + seed) * 0.25, base.z);
      leaf.rotation.set(0.4 + Math.sin(time * 0.3 + seed) * 0.25, seed + time * 0.08, Math.sin(time * 0.2 + seed) * 0.3);
    }

    const p = dotsGeo.attributes.position;
    for (let i = 0; i < COUNT; i++) {
      let yy = p.array[i * 3 + 1] + speed[i] * dt;
      if (yy > 8) yy = -13;
      p.array[i * 3 + 1] = yy;
    }
    p.needsUpdate = true;
  }

  let visible = new Set();
  let running = false;
  let raf = 0;
  let last = 0;
  let slow = 0;
  let frames = 0;

  function frame(t) {
    raf = 0;
    if (!running) return;
    const dt = Math.min(0.05, (t - last) / 1000 || 0.016);
    last = t;
    if (dt > 0.034) slow++;
    if (++frames === 90) {
      if (slow > 45 && quality > 0.6) {
        quality = 0.6;
        resize();
      }
      frames = 0;
      slow = 0;
    }
    update(dt);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }

  function setRunning() {
    const want = visible.size > 0 && !document.hidden;
    if (want === running) return;
    running = want;
    if (running && !raf) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  }

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) visible.add(e.target);
      else visible.delete(e.target);
    }
    setRunning();
  });
  const observeAll = () => {
    io.disconnect();
    visible = new Set();
    document.querySelectorAll('.world-sec').forEach((el) => io.observe(el));
  };
  observeAll();
  document.addEventListener('visibilitychange', setRunning);
  window.addEventListener('resize', resize);
  new ResizeObserver(() => measure()).observe(document.body);

  resize();
  update(0.016);
  renderer.render(scene, camera);
  if (/[?&]debug3d\b/.test(location.search)) window.__world = { scene, camera, renderer, dulang };

  return {
    refresh() {
      measure();
      observeAll();
    },
  };
}

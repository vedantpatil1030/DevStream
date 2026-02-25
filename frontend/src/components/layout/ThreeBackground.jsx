// src/components/layout/ThreeBackground.jsx
// 3D Streaming Workstation Scene - Pure JS compatible

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeBackground() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // ── Renderer ─────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // ── Scene ─────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020408, 0.033);

    // ── Camera ────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(
      55,
      mount.clientWidth / mount.clientHeight,
      0.1,
      200
    );
    camera.position.set(0, 8, 22);
    camera.lookAt(0, 2, 0);

    // ── Material helpers ──────────────────────────────────────────
    const stdMat = (hex, rough = 0.65, metal = 0.4) =>
      new THREE.MeshStandardMaterial({ color: hex, roughness: rough, metalness: metal });

    const emitMat = (hex, intensity = 2.0) =>
      new THREE.MeshStandardMaterial({ color: hex, emissive: new THREE.Color(hex), emissiveIntensity: intensity });

    // ── Lights ────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x08101e, 3));
    scene.add(new THREE.HemisphereLight(0x0d1830, 0x020408, 0.5));
    const keyDir = new THREE.DirectionalLight(0x102030, 1.2);
    keyDir.position.set(-8, 14, 8);
    keyDir.castShadow = true;
    scene.add(keyDir);

    // ═══════════════════════════════════════════════════════════════
    // FLOOR
    // ═══════════════════════════════════════════════════════════════
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100),
      new THREE.MeshStandardMaterial({ color: 0x020408, roughness: 1 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -3.35;
    floor.receiveShadow = true;
    scene.add(floor);

    // Grid (using LineSegments for safe multi-material handling)
    const gridHelper = new THREE.GridHelper(70, 50, 0x06b6d4, 0x0d1424);
    gridHelper.position.y = -3.32;
    // GridHelper.material can be array or single - handle both
    const mats = Array.isArray(gridHelper.material) ? gridHelper.material : [gridHelper.material];
    mats.forEach(m => { m.transparent = true; m.opacity = 0.14; });
    scene.add(gridHelper);

    // ═══════════════════════════════════════════════════════════════
    // DESK GROUP
    // ═══════════════════════════════════════════════════════════════
    const deskG = new THREE.Group();
    scene.add(deskG);

    // Surface
    const deskSurf = new THREE.Mesh(
      new THREE.BoxGeometry(15, 0.22, 5),
      stdMat(0x0c1220, 0.45, 0.5)
    );
    deskSurf.receiveShadow = true;
    deskG.add(deskSurf);

    // Front LED edge strip
    const edgeStrip = new THREE.Mesh(
      new THREE.BoxGeometry(15.1, 0.06, 0.06),
      emitMat(0x06b6d4, 1.6)
    );
    edgeStrip.position.set(0, 0.08, 2.5);
    deskG.add(edgeStrip);

    // Legs
    const legM = stdMat(0x080c16, 0.5, 0.85);
    [[-6.8, -1.6], [6.8, -1.6], [-6.8, 1.6], [6.8, 1.6]].forEach(([x, z]) => {
      const l = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.4, 0.2), legM);
      l.position.set(x, -1.8, z);
      deskG.add(l);
    });

    // ═══════════════════════════════════════════════════════════════
    // MONITOR BUILDER
    // ═══════════════════════════════════════════════════════════════
    const monLights = [];

    function buildMonitor(x, z, rotY, glowHex, titleText, lines) {
      const mg = new THREE.Group();
      mg.position.set(x, 0.12, z);
      mg.rotation.y = rotY;
      deskG.add(mg);

      // Stand base
      const sBase = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.07, 0.55), stdMat(0x090d1a, 0.5, 0.8));
      sBase.position.y = 0.035;
      mg.add(sBase);

      // Pole
      const sPole = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.4, 0.1), stdMat(0x0a0f1e, 0.5, 0.8));
      sPole.position.y = 0.74;
      mg.add(sPole);

      // Bezel
      const bezel = new THREE.Mesh(new THREE.BoxGeometry(4.7, 2.9, 0.17), stdMat(0x07090f, 0.6, 0.5));
      bezel.position.y = 2.3;
      bezel.castShadow = true;
      mg.add(bezel);

      // Screen emissive backing
      const screen = new THREE.Mesh(
        new THREE.BoxGeometry(4.3, 2.56, 0.04),
        emitMat(glowHex, 0.3)
      );
      screen.position.set(0, 2.3, 0.09);
      mg.add(screen);

      // Canvas texture for content
      const cvs = document.createElement("canvas");
      cvs.width = 640; cvs.height = 400;
      const ctx = cvs.getContext("2d");

      // bg
      ctx.fillStyle = "#04080f";
      ctx.fillRect(0, 0, 640, 400);

      // title bar
      ctx.fillStyle = "#0c1428";
      ctx.fillRect(0, 0, 640, 32);
      [["#ef4444", 14], ["#f59e0b", 30], ["#22c55e", 46]].forEach(([c, px]) => {
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.arc(px, 16, 5.5, 0, Math.PI * 2); ctx.fill();
      });
      ctx.fillStyle = "rgba(148,163,184,0.35)";
      ctx.font = "11px monospace";
      ctx.fillText(titleText, 68, 21);

      // line gutter
      ctx.fillStyle = "#0a1020";
      ctx.fillRect(0, 32, 38, 368);

      lines.forEach((line, i) => {
        const y = 58 + i * 22;
        ctx.fillStyle = "rgba(100,116,139,0.3)";
        ctx.font = "10px monospace";
        ctx.fillText(`${i + 1}`, 7, y);
        ctx.fillStyle = line.c;
        ctx.font = "13px 'Courier New'";
        ctx.fillText(line.t, 48, y);
      });

      // blinking cursor
      ctx.fillStyle = "#06b6d4";
      ctx.fillRect(48, 58 + lines.length * 22 - 13, 8, 15);

      const tex = new THREE.CanvasTexture(cvs);
      const contentMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(4.25, 2.52),
        new THREE.MeshBasicMaterial({ map: tex })
      );
      contentMesh.position.set(0, 2.3, 0.12);
      mg.add(contentMesh);

      // Screen glow point light
      const sl = new THREE.PointLight(glowHex, 2.0, 8);
      sl.position.set(0, 2.3, 0.8);
      mg.add(sl);
      monLights.push(sl);
    }

    // LEFT: VS Code
    buildMonitor(-4.3, -0.4, 0.2, 0x06b6d4, "stream.ts — DevStream IDE", [
      { t: "import { StreamEngine } from '@core'", c: "#c084fc" },
      { t: "import { WebRTC, Chat } from './lib'", c: "#c084fc" },
      { t: "", c: "#fff" },
      { t: "export class LiveStream {", c: "#22d3ee" },
      { t: "  isLive = false; viewers = 0", c: "#94a3b8" },
      { t: "", c: "#fff" },
      { t: "  async go(cfg) {", c: "#4ade80" },
      { t: "    this.isLive = true", c: "#f1f5f9" },
      { t: "    await WebRTC.connect(cfg)", c: "#f1f5f9" },
      { t: "    this.broadcast()", c: "#f1f5f9" },
      { t: "  }", c: "#4ade80" },
      { t: "}", c: "#22d3ee" },
    ]);

    // CENTER: OBS stats
    buildMonitor(0, -1.2, 0, 0xa855f7, "OBS Studio — LIVE  01:14:33", [
      { t: "● LIVE  ● REC    01:14:33", c: "#ef4444" },
      { t: "", c: "#fff" },
      { t: `  Title: "Building DevStream Live"`, c: "#e2e8f0" },
      { t: "  Bitrate:  6000 kbps  ████████░░", c: "#4ade80" },
      { t: "  FPS:      60/60      ██████████", c: "#4ade80" },
      { t: "  CPU:      38%        ████░░░░░░", c: "#f59e0b" },
      { t: "  GPU:      52%        █████░░░░░", c: "#f59e0b" },
      { t: "", c: "#fff" },
      { t: "  Live Viewers:  1,842  🔴", c: "#22d3ee" },
      { t: "  Peak:          2,104", c: "#94a3b8" },
      { t: "  New Subs:      +47  🎉", c: "#4ade80" },
      { t: "  Chat:          31 msg/min ↑", c: "#c084fc" },
    ]);

    // RIGHT: Chat
    buildMonitor(4.3, -0.4, -0.2, 0x06b6d4, "DevStream Chat  👥 1,842", [
      { t: "coder_Xx:   lets GOOOOO 🔥🔥", c: "#22d3ee" },
      { t: "theo_b:     this is fire bro", c: "#4ade80" },
      { t: "devgirl:    how did u do that?", c: "#c084fc" },
      { t: "_anon123:   OMEGALUL KEKW", c: "#f59e0b" },
      { t: "rustlover:  nice type safety", c: "#22d3ee" },
      { t: "jsmaster:   explain hooks pls?", c: "#f1f5f9" },
      { t: "pydev:      when python? 🐍", c: "#4ade80" },
      { t: "linuxfan:   btw i use arch 🫡", c: "#94a3b8" },
      { t: "codergirl:  SO cool omg", c: "#c084fc" },
      { t: "newbie:     learning so much!", c: "#22d3ee" },
      { t: "hackerX:    10x engineer spotted", c: "#f59e0b" },
      { t: "> Send a message...        ➤", c: "#1e2d40" },
    ]);

    // ═══════════════════════════════════════════════════════════════
    // KEYBOARD (RGB)
    // ═══════════════════════════════════════════════════════════════
    const kbG = new THREE.Group();
    kbG.position.set(-0.5, 0.17, 1.3);
    deskG.add(kbG);

    kbG.add(new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.12, 1.4), stdMat(0x0a0e1a, 0.5, 0.7)));

    const keyM = stdMat(0x111827, 0.6, 0.4);
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 13; c++) {
        const k = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.06, 0.19), keyM);
        k.position.set(-1.73 + c * 0.28, 0.09, -0.43 + r * 0.3);
        kbG.add(k);
      }
    }

    const rgbStrip = new THREE.Mesh(
      new THREE.BoxGeometry(4.02, 0.035, 1.42),
      emitMat(0x06b6d4, 1.4)
    );
    rgbStrip.position.y = -0.04;
    kbG.add(rgbStrip);

    // ═══════════════════════════════════════════════════════════════
    // MOUSE
    // ═══════════════════════════════════════════════════════════════
    const mG = new THREE.Group();
    mG.position.set(2.3, 0.17, 1.4);
    deskG.add(mG);

    // Mouse body using box + sphere approximation (no CapsuleGeometry needed)
    const mBody = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.15, 0.62), stdMat(0x0a0e1a, 0.4, 0.7));
    mBody.position.y = 0.1;
    mG.add(mBody);
    const mFront = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.5), stdMat(0x0a0e1a, 0.4, 0.7));
    mFront.position.set(0, 0.1, -0.3);
    mG.add(mFront);

    const mouseGlow = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.5, 0.05),
      emitMat(0xa855f7, 2.5)
    );
    mouseGlow.position.set(0, 0.22, 0);
    mG.add(mouseGlow);

    // ═══════════════════════════════════════════════════════════════
    // PC TOWER
    // ═══════════════════════════════════════════════════════════════
    const towerG = new THREE.Group();
    towerG.position.set(-9.5, -0.95, -0.2);
    scene.add(towerG);

    towerG.add(new THREE.Mesh(new THREE.BoxGeometry(2.1, 6.2, 3.6), stdMat(0x080c18, 0.5, 0.75)));

    // Glass side panel
    const glassPanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 5.8, 3.2),
      new THREE.MeshPhysicalMaterial({
        color: 0x06b6d4, emissive: new THREE.Color(0x06b6d4),
        emissiveIntensity: 0.08, transparent: true, opacity: 0.22,
        roughness: 0.05, metalness: 0.1,
      })
    );
    glassPanel.position.x = 1.02;
    towerG.add(glassPanel);

    // RGB fan rings (torus)
    const fanRings = [];
    [[1.0, 0x06b6d4], [0, 0xa855f7], [-1.0, 0x4ade80]].forEach(([fz, col], i) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.52, 0.07, 8, 24),
        emitMat(col, 2.8)
      );
      ring.position.set(-0.1, i * 0.3, fz);
      ring.rotation.y = Math.PI / 2;
      towerG.add(ring);
      fanRings.push(ring);
    });

    // Power button ring
    const pwrRing = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.02, 6, 16), emitMat(0x4ade80, 3.5));
    pwrRing.position.set(1.03, 2.6, 0.9);
    pwrRing.rotation.y = -Math.PI / 2;
    towerG.add(pwrRing);

    const towerLight = new THREE.PointLight(0x06b6d4, 1.5, 7);
    towerLight.position.set(-9.5, 0.5, 0);
    scene.add(towerLight);

    // ═══════════════════════════════════════════════════════════════
    // HEADPHONES (on desk)
    // ═══════════════════════════════════════════════════════════════
    const hpG = new THREE.Group();
    hpG.position.set(6.8, 0.55, 0.3);
    deskG.add(hpG);

    const hpBand = new THREE.Mesh(
      new THREE.TorusGeometry(0.52, 0.058, 6, 20, Math.PI),
      stdMat(0x0a0e1a, 0.4, 0.8)
    );
    hpBand.rotation.z = Math.PI / 2;
    hpG.add(hpBand);

    [0.52, -0.52].forEach((hy) => {
      const cup = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.27, 0.18, 14),
        stdMat(0x080c16, 0.5, 0.6)
      );
      cup.position.set(0, hy, 0);
      cup.rotation.z = Math.PI / 2;
      const led = new THREE.Mesh(new THREE.CircleGeometry(0.09, 10), emitMat(0xa855f7, 2.5));
      led.position.x = 0.11;
      cup.add(led);
      hpG.add(cup);
    });

    const hpLight = new THREE.PointLight(0xa855f7, 0.7, 3.5);
    hpG.add(hpLight);

    // ═══════════════════════════════════════════════════════════════
    // COFFEE MUG
    // ═══════════════════════════════════════════════════════════════
    const mugG = new THREE.Group();
    mugG.position.set(-7.5, 0.25, 0.8);
    deskG.add(mugG);

    mugG.add(new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.19, 0.5, 12),
      stdMat(0x0d1424, 0.7, 0.3)
    ));
    const handle = new THREE.Mesh(
      new THREE.TorusGeometry(0.14, 0.04, 6, 10, Math.PI),
      stdMat(0x0d1424, 0.7, 0.3)
    );
    handle.position.set(0.25, 0, 0);
    handle.rotation.y = Math.PI / 2;
    mugG.add(handle);

    // Steam particles (spheres)
    const steamSpheres = [];
    for (let s = 0; s < 3; s++) {
      const steam = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 6, 6),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, emissive: new THREE.Color(0x94a3b8), emissiveIntensity: 0.3, transparent: true, opacity: 0.25 })
      );
      steam.position.set((s - 1) * 0.09, 0.4 + s * 0.15, 0);
      mugG.add(steam);
      steamSpheres.push({ mesh: steam, idx: s });
    }

    // ═══════════════════════════════════════════════════════════════
    // STREAMER SILHOUETTE (box-based, no CapsuleGeometry)
    // ═══════════════════════════════════════════════════════════════
    const personG = new THREE.Group();
    personG.position.set(0, -3.33, 5.6);
    scene.add(personG);

    const pMat = new THREE.MeshStandardMaterial({ color: 0x0b1020, roughness: 0.85 });

    // Head
    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.54, 12, 10), pMat);
    headMesh.position.y = 7.5;
    headMesh.castShadow = true;
    personG.add(headMesh);

    // Hair cap
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.57, 12, 6, 0, Math.PI * 2, 0, Math.PI * 0.5),
      pMat
    );
    hair.position.y = 7.78;
    personG.add(hair);

    // Neck
    personG.add(new THREE.Mesh(
      new THREE.CylinderGeometry(0.17, 0.17, 0.48, 8),
      pMat
    )).position.set(0, 6.76, 0);

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(1.75, 2.3, 0.65), pMat);
    torso.position.y = 5.4;
    torso.castShadow = true;
    personG.add(torso);

    // Arms (using cylinders)
    [[-1.1, 0.45], [1.1, -0.45]].forEach(([ax, az]) => {
      // upper arm
      const uArm = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.1, 8), pMat);
      uArm.position.set(ax, 5.0, 0.1);
      uArm.rotation.z = ax < 0 ? 0.45 : -0.45;
      personG.add(uArm);

      // forearm
      const fArm = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.9, 8), pMat);
      fArm.position.set(ax * 1.05, 4.15, -0.55);
      fArm.rotation.x = -0.7;
      fArm.rotation.z = ax < 0 ? 0.2 : -0.2;
      personG.add(fArm);
    });

    // Hips
    personG.add(new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.65, 0.65), pMat)).position.set(0, 3.95, 0);

    // Thighs (horizontal - seated)
    [-0.55, 0.55].forEach(tx => {
      const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.22, 1.3, 8), pMat);
      thigh.position.set(tx * 1.1, 3.45, 0.6);
      thigh.rotation.x = Math.PI / 2;
      personG.add(thigh);
    });

    // Face glow
    const faceGlow = new THREE.PointLight(0xa855f7, 0.8, 4.5);
    faceGlow.position.set(0, 7.5, -1.3);
    personG.add(faceGlow);

    // ── CHAIR ─────────────────────────────────────────────────────
    const cMat = stdMat(0x090d18, 0.7, 0.3);

    const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.19, 2.1), cMat);
    chairSeat.position.y = 3.08;
    personG.add(chairSeat);

    const chairBack = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.6, 0.17), cMat);
    chairBack.position.set(0, 4.5, 1.15);
    chairBack.castShadow = true;
    personG.add(chairBack);

    // Chair RGB strip
    const chairStrip = new THREE.Mesh(
      new THREE.BoxGeometry(2.32, 0.055, 0.055),
      emitMat(0x06b6d4, 1.8)
    );
    chairStrip.position.set(0, 3.65, 1.16);
    personG.add(chairStrip);

    // Chair legs (5 arms radiating)
    const clMat = stdMat(0x060a10, 0.4, 0.9);
    for (let i = 0; i < 5; i++) {
      const ang = (i / 5) * Math.PI * 2;
      const arm = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.09, 0.14), clMat);
      arm.position.set(Math.cos(ang) * 0.6, 1.02, Math.sin(ang) * 0.6 + 0.8);
      arm.rotation.y = ang;
      personG.add(arm);
    }
    const hubCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.0, 8), clMat);
    hubCyl.position.set(0, 1.65, 0.75);
    personG.add(hubCyl);

    // ═══════════════════════════════════════════════════════════════
    // FLOATING CHAT BUBBLES (sprites)
    // ═══════════════════════════════════════════════════════════════
    const chatMsgs = [
      { t: "PogChamp 🔥", c: "#22d3ee" },
      { t: "KEKW OMEGALUL", c: "#f59e0b" },
      { t: "lets GOOO!! 🎉", c: "#4ade80" },
      { t: "sub hype PogChamp", c: "#c084fc" },
      { t: "W stream bro", c: "#22d3ee" },
      { t: "monkaS monkaS", c: "#f87171" },
      { t: "peepoHappy vibin", c: "#4ade80" },
      { t: "HYPERS HYPERS", c: "#f59e0b" },
      { t: "ez clap 👏", c: "#22d3ee" },
      { t: "based & redpilled", c: "#c084fc" },
      { t: "10/10 stream 💯", c: "#4ade80" },
      { t: "!sub !socials", c: "#94a3b8" },
    ];

    const chatSprites = [];
    chatMsgs.forEach((msg, i) => {
      const cvs = document.createElement("canvas");
      cvs.width = 220; cvs.height = 54;
      const cx = cvs.getContext("2d");
      cx.fillStyle = "rgba(5,8,16,0.88)";
      cx.beginPath();
      cx.roundRect(0, 0, 220, 54, 10);
      cx.fill();
      cx.strokeStyle = i % 2 === 0 ? "rgba(6,182,212,0.55)" : "rgba(168,85,247,0.55)";
      cx.lineWidth = 1.5;
      cx.beginPath();
      cx.roundRect(1, 1, 218, 52, 9);
      cx.stroke();
      cx.fillStyle = msg.c;
      cx.font = "bold 15px monospace";
      cx.fillText(msg.t, 12, 34);

      const tex = new THREE.CanvasTexture(cvs);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.8 }));
      const ang = (i / chatMsgs.length) * Math.PI * 2;
      const r = 10 + Math.random() * 5;
      sp.position.set(Math.cos(ang) * r, 2.5 + Math.random() * 5, Math.sin(ang) * r - 6);
      sp.scale.set(2.6, 0.67, 1);
      sp.userData = { ang, r, baseY: sp.position.y, speed: 0.28 + Math.random() * 0.45, off: Math.random() * Math.PI * 2 };
      scene.add(sp);
      chatSprites.push(sp);
    });

    // ═══════════════════════════════════════════════════════════════
    // FLOATING CODE SNIPPETS
    // ═══════════════════════════════════════════════════════════════
    const codeSnips = [
      { t: "const live = true;", c: "#4ade80" },
      { t: "await stream.go()", c: "#22d3ee" },
      { t: "git push origin main", c: "#c084fc" },
      { t: "npm run dev  ✓", c: "#4ade80" },
      { t: "ws.emit('frame', data)", c: "#22d3ee" },
      { t: "// 1,842 watching 🔴", c: "#f87171" },
    ];

    const codeSprites = [];
    codeSnips.forEach((snip, i) => {
      const cvs = document.createElement("canvas");
      cvs.width = 280; cvs.height = 46;
      const cx = cvs.getContext("2d");
      cx.fillStyle = "rgba(5,8,16,0.72)";
      cx.beginPath();
      cx.roundRect(0, 0, 280, 46, 6);
      cx.fill();
      cx.fillStyle = snip.c;
      cx.font = "13px 'Courier New'";
      cx.fillText(snip.t, 12, 30);
      const tex = new THREE.CanvasTexture(cvs);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.55 }));
      sp.position.set(-12 + i * 4.8, 5 + Math.random() * 4, -10 + Math.random() * 3);
      sp.scale.set(3.2, 0.58, 1);
      sp.userData = { baseY: sp.position.y, speed: 0.2 + Math.random() * 0.3, off: Math.random() * Math.PI * 2 };
      scene.add(sp);
      codeSprites.push(sp);
    });

    // ═══════════════════════════════════════════════════════════════
    // ANIMATION LOOP
    // ═══════════════════════════════════════════════════════════════
    const clock = new THREE.Clock();
    let rafId;
    const camR = 22;

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Slow orbital camera
      camera.position.x = Math.sin(t * 0.04) * camR;
      camera.position.z = Math.cos(t * 0.04) * camR;
      camera.position.y = 8 + Math.sin(t * 0.12) * 1.8;
      camera.lookAt(0, 2.5, 0);

      // Keyboard RGB cycle
      const hue = (t * 55) % 360;
      const rgb = new THREE.Color(`hsl(${hue},100%,60%)`);
      rgbStrip.material.emissive.copy(rgb);
      rgbStrip.material.color.copy(rgb);

      // Fan ring spin + colour
      fanRings.forEach((ring, i) => {
        ring.rotation.z = t * (0.9 + i * 0.35);
        const fc = new THREE.Color(`hsl(${(hue + i * 45) % 360},100%,65%)`);
        ring.material.emissive.copy(fc);
      });

      // Tower light pulse
      towerLight.intensity = 1.3 + Math.sin(t * 1.8) * 0.5;

      // Monitor glow flicker
      monLights.forEach((sl, i) => {
        sl.intensity = 1.8 + Math.sin(t * (2 + i * 0.7)) * 0.25;
      });

      // Edge strip breathe
      edgeStrip.material.emissiveIntensity = 1.2 + Math.sin(t * 1.5) * 0.5;

      // Chair RGB strip cycle
      const cColor = new THREE.Color(`hsl(${(hue + 160) % 360},80%,58%)`);
      chairStrip.material.emissive.copy(cColor);

      // Head subtle bob (typing sim)
      headMesh.position.y = 7.5 + Math.sin(t * 2.2) * 0.035 + Math.sin(t * 0.9) * 0.025;

      // Face glow colour cycle
      faceGlow.color.setHSL((t * 0.05) % 1, 0.75, 0.5);

      // Chat bubbles orbit + float
      chatSprites.forEach((sp) => {
        const { ang, r, baseY, speed, off } = sp.userData;
        const na = ang + t * 0.055;
        sp.position.x = Math.cos(na) * r;
        sp.position.z = Math.sin(na) * r - 6;
        sp.position.y = baseY + Math.sin(t * speed + off) * 0.7;
        sp.material.opacity = 0.5 + Math.sin(t * speed * 0.5 + off) * 0.3;
      });

      // Code snippets float
      codeSprites.forEach((sp) => {
        const { baseY, speed, off } = sp.userData;
        sp.position.y = baseY + Math.sin(t * speed + off) * 0.9;
        sp.material.opacity = 0.35 + Math.sin(t * speed + off) * 0.2;
      });

      // Steam above mug
      steamSpheres.forEach(({ mesh, idx }) => {
        mesh.position.y = 0.38 + idx * 0.17 + Math.sin(t * 1.5 + idx) * 0.06;
        mesh.material.opacity = 0.15 + Math.sin(t * 0.8 + idx * 1.2) * 0.12;
      });

      renderer.render(scene, camera);
    };

    animate();

    // ── Resize ────────────────────────────────────────────────────
    const onResize = () => {
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
    />
  );
}

// src/components/Mascot.jsx
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { getTodayIST } from '../utils/dateUtils';

// Cat Sprites
import catWalk from '../assets/cat-walk.png';
import catIdle from '../assets/cat-idle.png';
import catRun from '../assets/cat-run.png';
import catJump from '../assets/cat-jump.png';
import catGroom from '../assets/cat-groom.png';

// Knight Sprites
import knightIdle from '../assets/knight-idle.png';
import knightWalk from '../assets/knight-walk.png';
import knightRun from '../assets/knight-run.png';
import knightAttack1 from '../assets/knight-attack1.png';
import knightAttack2 from '../assets/knight-attack2.png';
import knightAttack3 from '../assets/knight-attack3.png';

const DEBUG_MODE = false; // Change to true to see the invisible bounding boxes!
const WALK_SPEED = 0.8; 
const RUN_SPEED = 2.5;
const ANIM_SPEED = 8;  

// NEW: Dedicated scale and offset settings for each character
const MASCOT_SETTINGS = {
  cat: { scale: 0.8, offsetY: 13 },
  knight: { scale: 1.5, offsetY: 39 } // <-- Tweak this number if the knight is still floating!
};

const MASCOT_CONFIGS = {
  cat: {
    IDLE:   { src: catIdle,  frames: 8 },
    WALK_R: { src: catWalk,  frames: 12 },
    WALK_L: { src: catWalk,  frames: 12 }, 
    RUN_R:  { src: catRun,   frames: 8 },
    RUN_L:  { src: catRun,   frames: 8 },  
    JUMP:   { src: catJump,  frames: 3 },
    GROOM:  { src: catGroom, frames: 8 }
  },
  knight: {
    IDLE:     { src: knightIdle,    frames: 7 },
    WALK_R:   { src: knightWalk,    frames: 8 },
    WALK_L:   { src: knightWalk,    frames: 8 },
    RUN_R:    { src: knightRun,     frames: 8 },
    RUN_L:    { src: knightRun,     frames: 8 },
    ATTACK_1: { src: knightAttack1, frames: 5 },
    ATTACK_2: { src: knightAttack2, frames: 6 },
    ATTACK_3: { src: knightAttack3, frames: 6 }
  }
};

export default function Mascot({ entriesMap = {}, tasks = [] }) {
  const canvasRef = useRef(null);
  const [activeMascot, setActiveMascot] = useState('cat');

  const { status, message } = useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return { status: 'WAITING FOR TASKS', message: '"Add a task below to get started!"' };
    }
    const today = new Date(`${getTodayIST()}T00:00:00`);
    let totalPossible = 0, totalCompleted = 0;

    for (let i = 0; i < 3; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
      tasks.forEach(task => {
        totalPossible++;
        if (entriesMap[`${task.id}-${dateStr}`]) totalCompleted++;
      });
    }

    const ratio = totalPossible === 0 ? 1 : totalCompleted / totalPossible;
    if (ratio >= 0.7) return { status: 'ON FIRE', message: activeMascot === 'cat' ? '"Purrfect! Keep the streak alive!"' : '"Victory is assured! Keep pushing!"' };
    if (ratio >= 0.4) return { status: 'COASTING', message: activeMascot === 'cat' ? '"Meow? We are doing okay, but we can do better!"' : '"Stay vigilant! Do not falter now."' };
    return { status: 'NEEDS ATTENTION', message: activeMascot === 'cat' ? '"Meow... I need energy."' : '"Resting too much rusts the armor!"' };
  }, [entriesMap, tasks, activeMascot]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    let animationFrameId;
    const loadedImages = {};
    let imagesLoaded = 0;
    
    const currentConfig = MASCOT_CONFIGS[activeMascot];
    const settings = MASCOT_SETTINGS[activeMascot];
    const totalImages = Object.keys(currentConfig).filter(key => !key.endsWith('_L')).length;

    Object.keys(currentConfig).forEach(state => {
      if (state.endsWith('_L')) return; 
      
      const img = new Image();
      img.src = currentConfig[state].src;
      img.onload = () => {
        imagesLoaded++;
        if (imagesLoaded === totalImages) {
          loop(); 
        }
      };
      loadedImages[state] = img;
    });

    loadedImages['WALK_L'] = loadedImages['WALK_R'];
    loadedImages['RUN_L'] = loadedImages['RUN_R'];

    let char = {
      x: 50,
      y: 0, 
      vy: 0, 
      state: 'IDLE',
      frameX: 0,
      tick: 0 
    };

    const jumpPower = -11;
    const gravity = 0.8;

    const updateAI = () => {
      if (char.state !== 'JUMP' && !char.state.startsWith('ATTACK') && char.tick % 150 === 0) {
        if (Math.random() < 0.4) { 
          let choices = [];
          if (activeMascot === 'cat') {
            choices = ['IDLE', 'WALK_R', 'WALK_L', 'RUN_R', 'RUN_L', 'GROOM'];
          } else {
            choices = ['IDLE', 'WALK_R', 'WALK_L', 'RUN_R', 'RUN_L'];
          }
          char.state = choices[Math.floor(Math.random() * choices.length)];
          char.frameX = 0; 
        }
      }
    };

    const updatePhysics = (currentImg, frames) => {
      const frameWidth = currentImg.width / frames;
      const frameHeight = currentImg.height;
      const dWidth = frameWidth * settings.scale;
      const dHeight = frameHeight * settings.scale;
      
      const floorY = canvas.height - dHeight + settings.offsetY;
      
      if (char.state !== 'JUMP') {
        char.y = floorY;
      }

      if (char.state === 'JUMP') {
        char.y += char.vy;
        char.vy += gravity;
        if (char.y >= floorY) {
          char.y = floorY;
          char.vy = 0;
          char.state = 'IDLE';
        }
      }

      if (!char.state.startsWith('ATTACK')) {
        if (char.state === 'WALK_R') {
          char.x += WALK_SPEED; 
          if (char.x >= canvas.width - dWidth) { char.state = 'WALK_L'; char.frameX = 0; }
        } else if (char.state === 'WALK_L') {
          char.x -= WALK_SPEED;
          if (char.x <= 0) { char.state = 'WALK_R'; char.frameX = 0; }
        } else if (char.state === 'RUN_R') {
          char.x += RUN_SPEED;
          if (char.x >= canvas.width - dWidth) { char.state = 'RUN_L'; char.frameX = 0; }
        } else if (char.state === 'RUN_L') {
          char.x -= RUN_SPEED;
          if (char.x <= 0) { char.state = 'RUN_R'; char.frameX = 0; }
        }
      }

      if (char.tick % ANIM_SPEED === 0) {
        if (char.state === 'JUMP' || char.state.startsWith('ATTACK')) {
            if (char.frameX === frames - 1) {
                if (char.state.startsWith('ATTACK')) {
                  char.state = 'IDLE';
                }
            } else {
                char.frameX++;
            }
        } else {
            char.frameX = (char.frameX + 1) % frames;
        }
      }
      
      char.tick++;
      return { frameWidth, frameHeight, dWidth, dHeight };
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height); 
      
      const config = currentConfig[char.state];
      const img = loadedImages[char.state];
      if (!img) return;

      const { frameWidth, frameHeight, dWidth, dHeight } = updatePhysics(img, config.frames);

      ctx.save();
      
      let renderX = char.x;
      let isFlipped = false;

      if (activeMascot === 'cat') {
        isFlipped = (char.state === 'WALK_R' || char.state === 'RUN_R');
      } else {
        isFlipped = (char.state === 'WALK_L' || char.state === 'RUN_L');
      }

      if (isFlipped) {
        ctx.scale(-1, 1);
        renderX = -char.x - dWidth; 
      }

      const sourceX = char.frameX * frameWidth;

      ctx.drawImage(
        img,
        sourceX, 0, frameWidth, frameHeight, 
        renderX, char.y, dWidth, dHeight
      );

      if (DEBUG_MODE) {
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.strokeRect(renderX, char.y, dWidth, dHeight);
      }

      ctx.restore();
    };

    const loop = () => {
      updateAI();
      draw();
      animationFrameId = requestAnimationFrame(loop);
    };

    const handleInteraction = (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * scaleY;

      if (
        mouseX >= char.x - 20 && mouseX <= char.x + 80 &&
        mouseY >= char.y - 20 && mouseY <= char.y + 80
      ) {
        if (activeMascot === 'cat') {
          if (char.state !== 'JUMP') {
            char.state = 'JUMP';
            char.frameX = 0;
            char.vy = jumpPower;
          }
        } else {
          if (!char.state.startsWith('ATTACK')) {
            const attacks = ['ATTACK_1', 'ATTACK_2', 'ATTACK_3'];
            char.state = attacks[Math.floor(Math.random() * attacks.length)];
            char.frameX = 0;
          }
        }
      }
    };

    canvas.addEventListener('mousedown', handleInteraction);

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener('mousedown', handleInteraction);
    };
  }, [activeMascot]); 

  return (
    <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', alignItems: 'stretch' }}>
      
      <div style={{
        background: 'white', border: '4px solid var(--text-dark)', padding: '12px',
        boxShadow: '6px 6px 0px var(--text-dark)', width: '280px', flexShrink: 0,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85rem' }}>
          <div style={{ color: 'var(--secondary-accent)', fontWeight: 'bold', marginBottom: '5px' }}>MOOD:<br/>{status}</div>
          <div style={{ fontFamily: 'monospace', minHeight: '40px' }}>{message}</div>
        </div>
        
        <button 
          className="retro-btn" 
          style={{ padding: '4px', fontSize: '0.8rem', marginTop: '10px' }}
          onClick={() => setActiveMascot(prev => prev === 'cat' ? 'knight' : 'cat')}
        >
          SWITCH TO {activeMascot === 'cat' ? 'KNIGHT' : 'CAT'}
        </button>
      </div>

      <div style={{
        flexGrow: 1,
        borderBottom: '4px solid var(--text-dark)', 
        position: 'relative'
      }}>
        <canvas 
          ref={canvasRef}
          width={800} 
          height={120} 
          style={{ 
            position: 'absolute', 
            bottom: 0, left: 20, cursor: 'pointer',
            imageRendering: 'pixelated',
            mixBlendMode: 'multiply' 
          }}
        />
      </div>

    </div>
  );
}
let time = 0; // 用於控制 noise 隨時間變化的變數
let seaweeds = []; // 存放所有水草的陣列
let bubbles = [];  // 存放所有小氣泡的陣列
let particles = []; // 存放水泡破掉後的粒子陣列
let fishes = [];   // 存放小魚的陣列
let rays = [];     // 存放光影的陣列
const colors = ['#f94144', '#f3722c', '#f8961e', '#f9844a', '#f9c74f', '#90be6d', '#43aa8b', '#4d908e', '#577590', '#277da1'];
const fishColors = ['#ffb703', '#fb8500', '#ffd166', '#8ecae6', '#219ebc'];

let popSound; // 存放音效的變數

function preload() {
  // 在程式開始前預先載入音效檔案
  popSound = loadSound('pop.mp3');
}

function setup() {
  // 產生一個全螢幕的畫布
  createCanvas(windowWidth, windowHeight);
  initSeaweeds();
  initBubbles();
  initFishes();
  initRays();
}

function initBubbles() {
  bubbles = [];
  // 依照畫面寬度決定氣泡的數量
  let count = width / 10; 
  for (let i = 0; i < count; i++) {
    bubbles.push({
      x: random(width),           // 氣泡的 X 座標
      y: random(height),          // 氣泡的 Y 座標 (初始先散佈在整個畫面上)
      size: random(4, 12),        // 氣泡的大小
      speed: random(1, 3),        // 往上飄的速度
      noiseOffset: random(1000),  // 獨立的左右搖晃偏移量
      targetY: random(0, height * 0.8) // 水泡破掉的目標隨機高度
    });
  }
}

function initFishes() {
  fishes = [];
  // 依照畫面寬度決定小魚的數量
  let count = width / 100;
  for (let i = 0; i < count; i++) {
    fishes.push({
      x: random(width),
      y: random(height * 0.6, height * 0.9), // 改為在水草範圍內 (畫面中下層) 生成
      vx: random(-2, 2),
      vy: random(-1, 1),
      baseSpeed: random(0.5, 1.5), // 基本游動速度 (改慢一點)
      size: random(8, 15),       // 小魚的大小
      color: color(random(fishColors)),
      noiseOffset: random(1000)
    });
  }
}

function initRays() {
  rays = [];
  // 依照畫面寬度決定光線的數量
  let count = width / 40; 
  for (let i = 0; i < count; i++) {
    rays.push({
      x: random(-width * 0.5, width * 1.5), // 讓光線可以從畫面外射入
      topW: random(20, 120),                // 頂部光線的寬度
      botW: random(200, 500),               // 底部光線擴散的寬度
      length: random(height * 0.8, height * 1.2), // 光線的長度
      alpha: random(5, 15),                 // 基礎透明度 (設定很低以產生柔和感)
      noiseOffset: random(1000)             // 獨立的閃爍偏移量
    });
  }
}

function initSeaweeds() {
  seaweeds = [];
  // 讓水草從左到右分佈，縮小間距到 20，讓水草變得更密集
  let count = ceil(width / 20) + 1; 
  for (let i = 0; i < count; i++) {
    // 將隨機選出的顏色轉換為 p5.Color 物件，並設定透明度
    let c = color(random(colors));
    c.setAlpha(160); // 設定透明度 (範圍 0~255)，160 大約是 60% 不透明度

    seaweeds.push({
      x: i * 20 + random(-15, 15),           // 水草的 X 座標
      color: c,                              // 套用帶有透明度的顏色
      thickness: random(40, 50),             // 粗細 40 ~ 50
      h: random(height * 0.1, height / 3),   // 高度為視窗的 10% 到 1/3
      speed: random(0.5, 2.0),               // 搖晃速度差異
      noiseOffset: random(1000)              // 獨立的 noise 偏移量，讓搖晃不同步
    });
  }
}

function draw() {
  // 明確設定混合模式為 BLEND (加上透明度即可產生重疊效果)
  blendMode(BLEND);

  // 清除前一個影格的畫布，避免半透明背景不斷疊加變成不透明
  clear();

  // 將背景顏色改為帶有 0.3 透明度 (255 * 0.3 = 76.5) 的指定色碼 RGB(189, 224, 254)
  background(189, 224, 254, 76.5);
  
  // 繪製光影 (God Rays)
  blendMode(SCREEN); // 使用 SCREEN 讓光線疊加產生發光感
  noStroke();
  
  // 根據滑鼠位置計算光線底部偏移量 (滑鼠在左，光線往右斜)
  let lightShift = map(mouseX, 0, width, width * 0.5, -width * 0.5);
  if (mouseX === 0 && mouseY === 0) lightShift = 0; // 初始無偏移防呆

  for (let i = 0; i < rays.length; i++) {
    let r = rays[i];
    // 利用 noise 產生光線明暗閃爍的呼吸感
    let currentAlpha = r.alpha + (noise(time * 0.5 + r.noiseOffset) * 15);
    fill(255, 255, 230, currentAlpha); // 微微偏黃的白光
    
    beginShape();
    vertex(r.x, 0);
    vertex(r.x + r.topW, 0);
    vertex(r.x + r.topW + r.botW + lightShift, r.length);
    vertex(r.x - r.botW + lightShift, r.length);
    endShape(CLOSE);
  }
  
  blendMode(BLEND); // 畫完光影後將混合模式設定回來
  
  noFill();          // 不填滿內部，只畫線條

  let shadowOffsetX = lightShift * 0.05; // 根據光線偏移決定陰影 X 偏移
  let shadowOffsetY = 20;                // 陰影預設往下偏移

  // 1. 先畫所有水草的陰影
  stroke(0, 0, 0, 50); // 黑色半透明陰影
  for (let i = 0; i < seaweeds.length; i++) {
    let s = seaweeds[i];
    strokeWeight(s.thickness);
    beginShape();
    let startX = s.x;
    let startY = height;
    let endY = height - s.h;
    curveVertex(startX + shadowOffsetX, startY + shadowOffsetY);
    let lastX = startX;
    let lastY = startY;
    for (let y = startY; y >= endY; y -= 10) {
      let factor = map(y, startY, endY, 0, 1);
      let maxSway = pow(factor, 2) * 50; 
      let wave = sin(time * 1.5 * s.speed + y * 0.01 + s.noiseOffset);         
      let n = noise(y * 0.02, time * s.speed + s.noiseOffset) * 2 - 1;         
      let offsetX = (wave * 0.7 + n * 0.3) * maxSway;
      lastX = startX + offsetX;
      lastY = y;
      curveVertex(lastX + shadowOffsetX, lastY + shadowOffsetY);
    }
    curveVertex(lastX + shadowOffsetX, lastY + shadowOffsetY);
    endShape();
  }

  // 迴圈把所有水草畫出來
  for (let i = 0; i < seaweeds.length; i++) {
    let s = seaweeds[i];
    
    // 設定每一根水草的繪圖樣式
    stroke(s.color); 
    strokeWeight(s.thickness);

    // 開始繪製形狀
    beginShape();
    
    let startX = s.x;        // 水草的 X 軸基準點
    let startY = height;     // 水草從畫面最底部開始長
    let endY = height - s.h; // 水草能生長到的最高點
    
    // 第一個點必須重複一次做為「控制點」
    curveVertex(startX, startY);
    
    let lastX = startX;
    let lastY = startY;

    // 使用迴圈從下往上產生頂點
    for (let y = startY; y >= endY; y -= 10) {
      let factor = map(y, startY, endY, 0, 1);
      let maxSway = pow(factor, 2) * 50; // 將搖晃幅度由 150 降低到 50，看起來更自然
      
      // 結合 sin 與 noise，並加上每根水草獨立的搖晃速度與偏移量
      let wave = sin(time * 1.5 * s.speed + y * 0.01 + s.noiseOffset);         
      let n = noise(y * 0.02, time * s.speed + s.noiseOffset) * 2 - 1;         
      
      let offsetX = (wave * 0.7 + n * 0.3) * maxSway;
      
      lastX = startX + offsetX;
      lastY = y;
      curveVertex(lastX, lastY);
    }
    
    // 重複最後一個點做為「終點控制點」
    curveVertex(lastX, lastY);
    endShape();
  }

  // 繪製與更新氣泡
  noStroke();
  for (let i = 0; i < bubbles.length; i++) {
    let b = bubbles[i];
    
    // 利用 sin() 產生左右漂浮的搖晃感
    let currentX = b.x + sin(time * 2 + b.noiseOffset) * 15;
    
    // 繪製氣泡陰影
    fill(0, 0, 0, 30);
    circle(currentX + shadowOffsetX, b.y + shadowOffsetY, b.size);

    // 1. 畫出氣泡主體 (透明度 120)
    fill(255, 255, 255, 120);
    circle(currentX, b.y, b.size); // 畫出氣泡
    
    // 2. 畫出水泡左上角的高光反光 (透明度 200，比主體更不透明)
    fill(255, 255, 255, 200);
    circle(currentX - b.size * 0.2, b.y - b.size * 0.2, b.size * 0.3);

    // 讓氣泡往上飄
    b.y -= b.speed;
    
    // 檢查是否碰到小魚
    let poppedByFish = false;
    for (let j = 0; j < fishes.length; j++) {
      let f = fishes[j];
      if (dist(currentX, b.y, f.x, f.y) < (b.size / 2) + f.size) {
        poppedByFish = true;
        break;
      }
    }

    // 如果氣泡到達目標高度、飄出畫面頂端，或是被小魚碰到，產生破裂效果並重新生成
    if (b.y <= b.targetY || b.y < -b.size || poppedByFish) {
      // 根據氣泡大小 (4 ~ 12) 映射到音量大小 (0.1 ~ 1.0)
      let vol = map(b.size, 4, 12, 0.1, 1.0);
      popSound.setVolume(vol);
      
      // 播放破裂音效
      popSound.play();

      // 產生 4~6 個小粒子來模擬破掉效果
      let pCount = int(random(4, 7));
      for (let p = 0; p < pCount; p++) {
        particles.push({
          x: currentX,
          y: b.y,
          vx: random(-2, 2),  // X軸擴散速度
          vy: random(-2, 2),  // Y軸擴散速度
          life: 200,          // 粒子的初始透明度 (生命值)
          size: random(1, 3)  // 粒子的大小
        });
      }

      // 將水泡移回底部重新生成
      b.y = height + b.size;
      b.x = random(width); // 重新指派一個隨機的水平位置
      b.targetY = random(0, height * 0.8); // 重新指派新的破裂高度
    }
  }

  // 繪製與更新破裂粒子
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 10; // 每一幀減少透明度，產生淡出效果
    
    fill(255, 255, 255, p.life);
    circle(p.x, p.y, p.size);
    
    // 當粒子完全透明時，將其從陣列中移除以節省效能
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }

  // 繪製與更新小魚
  for (let i = 0; i < fishes.length; i++) {
    let f = fishes[i];

    // 1. 利用 noise 產生有機的隨機游動
    let angle = noise(f.noiseOffset + time * 0.5) * TWO_PI * 2;
    f.vx += cos(angle) * 0.1;
    f.vy += sin(angle) * 0.1;

    let repulsionX = 0;
    let repulsionY = 0;

    // 2. 躲避水草邏輯
    for (let k = 0; k < seaweeds.length; k++) {
      let s = seaweeds[k];
      let endY = height - s.h; // 水草頂端 Y 座標

      // 只在小魚處於該根水草的高度範圍內時才計算躲避
      if (f.y > endY && f.y < height) {
        // 重建水草在小魚高度 (f.y) 時的 X 偏移量
        let factor = map(f.y, height, endY, 0, 1);
        let maxSway = pow(factor, 2) * 50; 
        let wave = sin(time * 1.5 * s.speed + f.y * 0.01 + s.noiseOffset);         
        let n = noise(f.y * 0.02, time * s.speed + s.noiseOffset) * 2 - 1;         
        let seaweedX = s.x + (wave * 0.7 + n * 0.3) * maxSway;
        
        let dx = f.x - seaweedX;
        let safeDist = (s.thickness / 2) + f.size + 15; // 水草半徑 + 魚身 + 緩衝距離
        
        if (abs(dx) < safeDist) {
          let force = map(abs(dx), 0, safeDist, 2, 0); // 越近排斥力越強
          repulsionX += (dx > 0 ? 1 : -1) * force; // 水平躲避
          repulsionY -= force * 0.2; // 稍微往上游以避開糾纏，避免卡死在水草底部
        }
      }
    }

    f.vx += repulsionX;
    f.vy += repulsionY;

    // 限制與維持游動速度
    let speed = sqrt(f.vx * f.vx + f.vy * f.vy);
    if (speed > f.baseSpeed * 2.5) {
      f.vx = (f.vx / speed) * f.baseSpeed * 2.5;
      f.vy = (f.vy / speed) * f.baseSpeed * 2.5;
    }
    // 施加一點摩擦力讓魚躲避衝刺後會緩下來
    f.vx *= 0.98;
    f.vy *= 0.98;
    
    // 確保最低速度不會停下來
    speed = sqrt(f.vx * f.vx + f.vy * f.vy);
    if (speed < f.baseSpeed) {
      f.vx = (f.vx / speed) * f.baseSpeed;
      f.vy = (f.vy / speed) * f.baseSpeed;
    }

    // 更新位置
    f.x += f.vx;
    f.y += f.vy;

    // 邊界處理 (從左右兩側循環，上下邊界往回推)
    if (f.x < -f.size * 3) f.x = width + f.size * 3;
    if (f.x > width + f.size * 3) f.x = -f.size * 3;
    if (f.y < height * 0.5) f.vy += 0.2; // 讓魚盡量保持在畫面下方水草區附近
    if (f.y > height * 0.95) f.vy -= 0.2; // 避免沉到畫面最底端外

    // 繪製小魚陰影
    push();
    translate(f.x + shadowOffsetX * 1.5, f.y + shadowOffsetY * 1.5); // 稍微加深偏移量產生懸浮感
    rotate(atan2(f.vy, f.vx));
    noStroke();
    fill(0, 0, 0, 40);
    let shadowTailWiggle = sin(time * 15 + f.noiseOffset) * f.size * 0.5;
    triangle(-f.size * 0.8, 0, -f.size * 1.8, -f.size * 0.7 + shadowTailWiggle, -f.size * 1.8, f.size * 0.7 + shadowTailWiggle);
    triangle(-f.size * 0.3, -f.size * 0.4, f.size * 0.2, -f.size * 0.5, -f.size * 0.6, -f.size * 1.2);
    let shadowFinWiggle = sin(time * 15 + f.noiseOffset) * f.size * 0.3;
    triangle(-f.size * 0.3, f.size * 0.4, f.size * 0.2, f.size * 0.5, -f.size * 0.5 + shadowFinWiggle, f.size * 1.1);
    ellipse(0, 0, f.size * 2, f.size * 1.2);
    pop();

    // 繪製小魚
    push();
    translate(f.x, f.y);
    rotate(atan2(f.vy, f.vx)); // 利用速度的 X 與 Y 計算游動的朝向角度
    noStroke();
    
    // 尾巴
    fill(f.color);
    let tailWiggle = sin(time * 15 + f.noiseOffset) * f.size * 0.5;
    triangle(-f.size * 0.8, 0, -f.size * 1.8, -f.size * 0.7 + tailWiggle, -f.size * 1.8, f.size * 0.7 + tailWiggle);
    
    // 上魚鰭 (背鰭)
    triangle(-f.size * 0.3, -f.size * 0.4, f.size * 0.2, -f.size * 0.5, -f.size * 0.6, -f.size * 1.2);
    
    // 下魚鰭 (腹鰭/胸鰭) - 加入一點 sin() 產生來回划水的動態感
    let finWiggle = sin(time * 15 + f.noiseOffset) * f.size * 0.3;
    triangle(-f.size * 0.3, f.size * 0.4, f.size * 0.2, f.size * 0.5, -f.size * 0.5 + finWiggle, f.size * 1.1);

    // 身體
    ellipse(0, 0, f.size * 2, f.size * 1.2);
    
    // 眼睛
    fill(255);
    ellipse(f.size * 0.5, -f.size * 0.2, f.size * 0.4, f.size * 0.4);
    fill(0);
    ellipse(f.size * 0.5 + 1, -f.size * 0.2, f.size * 0.15, f.size * 0.15);
    
    pop();
  }

  // 每一個 frame 增加時間值，推動 noise 往前演進，產生連續的搖晃效果
  time += 0.015;
}

// 確保視窗縮放時，畫布大小也會跟著自動調整
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initSeaweeds(); // 重新產生水草以適應新畫布寬度
  initBubbles();  // 重新產生氣泡以適應新畫布寬度
  initFishes();   // 重新產生小魚以適應新畫布寬度
  initRays();     // 重新產生光線以適應新畫布寬度
}

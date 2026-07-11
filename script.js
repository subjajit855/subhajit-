const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const AudioEngine = window.AudioContext || window.webkitAudioContext;

document.body.classList.add("intro-active");

const revealItems = document.querySelectorAll(".reveal");

if (prefersReducedMotion || !("IntersectionObserver" in window)) {
  revealItems.forEach((item) => item.classList.add("visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.14 }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
}

const letterDialog = document.querySelector("#letterDialog");
const openLetterButton = document.querySelector("#openLetter");
const closeLetterButton = document.querySelector("#closeLetter");

openLetterButton.addEventListener("click", () => {
  letterDialog.showModal();
  playChime([523.25, 659.25, 783.99]);
});

closeLetterButton.addEventListener("click", () => letterDialog.close());

letterDialog.addEventListener("click", (event) => {
  const bounds = letterDialog.getBoundingClientRect();
  const outside =
    event.clientX < bounds.left ||
    event.clientX > bounds.right ||
    event.clientY < bounds.top ||
    event.clientY > bounds.bottom;

  if (outside) letterDialog.close();
});

let audioContext;
let soundEnabled = false;
let songTimer;
let songNodes = [];
const soundToggle = document.querySelector("#soundToggle");
const soundLabel = soundToggle.querySelector(".sound-label");
const musicStatus = document.querySelector("#musicStatus");
const welcomeScreen = document.querySelector("#welcomeScreen");
const enterButton = document.querySelector("#enterButton");
const enterQuietly = document.querySelector("#enterQuietly");

enterButton.addEventListener("click", () => enterCelebration(true));
enterQuietly.addEventListener("click", () => enterCelebration(false));

function enterCelebration(withMusic) {
  if (withMusic) startBirthdaySong();
  welcomeScreen.classList.add("leaving");
  document.body.classList.remove("intro-active");
  releasePetals(24);

  window.setTimeout(() => {
    welcomeScreen.hidden = true;
  }, 950);
}

soundToggle.addEventListener("click", () => {
  if (soundEnabled) {
    stopBirthdaySong();
  } else {
    startBirthdaySong();
  }
});

function playChime(notes) {
  if (!soundEnabled) return;

  audioContext ||= new AudioEngine();
  const startTime = audioContext.currentTime;

  notes.forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0, startTime + index * 0.12);
    gain.gain.linearRampToValueAtTime(0.09, startTime + index * 0.12 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + index * 0.12 + 0.55);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(startTime + index * 0.12);
    oscillator.stop(startTime + index * 0.12 + 0.58);
  });
}

const birthdayMelody = [
  [392, 0.28], [392, 0.18], [440, 0.48], [392, 0.48], [523.25, 0.48], [493.88, 0.82],
  [392, 0.28], [392, 0.18], [440, 0.48], [392, 0.48], [587.33, 0.48], [523.25, 0.82],
  [392, 0.28], [392, 0.18], [783.99, 0.48], [659.25, 0.48], [523.25, 0.48], [493.88, 0.48], [440, 0.82],
  [698.46, 0.28], [698.46, 0.18], [659.25, 0.48], [523.25, 0.48], [587.33, 0.48], [523.25, 0.9]
];

function startBirthdaySong() {
  if (!AudioEngine || soundEnabled) return;
  audioContext ||= new AudioEngine();
  if (audioContext.state === "suspended") audioContext.resume();
  soundEnabled = true;
  updateSoundUI();
  scheduleMelody();
}

function stopBirthdaySong() {
  soundEnabled = false;
  window.clearTimeout(songTimer);
  songNodes.forEach((node) => {
    try {
      node.stop();
    } catch {
      // The note has already finished naturally.
    }
  });
  songNodes = [];
  updateSoundUI();
}

function updateSoundUI() {
  soundToggle.setAttribute("aria-pressed", String(soundEnabled));
  soundToggle.setAttribute(
    "aria-label",
    soundEnabled ? "Pause birthday song" : "Play birthday song"
  );
  soundLabel.textContent = soundEnabled ? "Pause song" : "Play song";
  musicStatus.classList.toggle("show", soundEnabled);
}

function scheduleMelody() {
  if (!soundEnabled) return;

  const masterGain = audioContext.createGain();
  masterGain.gain.value = 0.14;
  masterGain.connect(audioContext.destination);
  let noteTime = audioContext.currentTime + 0.08;

  birthdayMelody.forEach(([frequency, duration], index) => {
    const oscillator = audioContext.createOscillator();
    const noteGain = audioContext.createGain();
    const harmony = audioContext.createOscillator();
    const harmonyGain = audioContext.createGain();
    const attack = 0.025;
    const release = Math.min(0.18, duration * 0.35);

    oscillator.type = "triangle";
    oscillator.frequency.value = frequency;
    harmony.type = "sine";
    harmony.frequency.value = frequency / 2;

    noteGain.gain.setValueAtTime(0.001, noteTime);
    noteGain.gain.exponentialRampToValueAtTime(0.72, noteTime + attack);
    noteGain.gain.setValueAtTime(0.72, noteTime + duration - release);
    noteGain.gain.exponentialRampToValueAtTime(0.001, noteTime + duration);
    harmonyGain.gain.setValueAtTime(0.001, noteTime);
    harmonyGain.gain.exponentialRampToValueAtTime(0.13, noteTime + attack);
    harmonyGain.gain.exponentialRampToValueAtTime(0.001, noteTime + duration);

    oscillator.connect(noteGain);
    harmony.connect(harmonyGain);
    noteGain.connect(masterGain);
    harmonyGain.connect(masterGain);
    oscillator.start(noteTime);
    harmony.start(noteTime);
    oscillator.stop(noteTime + duration + 0.02);
    harmony.stop(noteTime + duration + 0.02);
    songNodes.push(oscillator, harmony);

    noteTime += duration + (index % 6 === 5 ? 0.22 : 0.06);
  });

  const loopDelay = Math.max(1000, (noteTime - audioContext.currentTime + 1.4) * 1000);
  songTimer = window.setTimeout(() => {
    songNodes = [];
    scheduleMelody();
  }, loopDelay);
}

const wishButton = document.querySelector("#wishButton");
const flame = document.querySelector("#flame");
const wishHint = document.querySelector("#wishHint");
const toast = document.querySelector("#toast");
let wishMade = false;

wishButton.addEventListener("click", () => {
  if (wishMade) return;
  wishMade = true;
  flame.classList.add("out");
  wishButton.textContent = "Wish made ✦";
  wishButton.disabled = true;
  wishHint.textContent = "May every bit of it come true";
  toast.classList.add("show");
  playChime([783.99, 987.77, 1174.66, 1567.98]);
  launchConfetti();
  releasePetals(16);
  window.setTimeout(() => toast.classList.remove("show"), 3200);
});

function releasePetals(amount) {
  if (prefersReducedMotion) return;
  const container = document.querySelector("#petals");

  for (let index = 0; index < amount; index += 1) {
    const petal = document.createElement("span");
    petal.className = "petal";
    petal.style.left = `${Math.random() * 100}vw`;
    petal.style.setProperty("--duration", `${4 + Math.random() * 4}s`);
    petal.style.setProperty("--drift", `${-80 + Math.random() * 160}px`);
    petal.style.animationDelay = `${Math.random() * 1.2}s`;
    petal.style.background = Math.random() > 0.45 ? "#b96a70" : "#d5a84d";
    container.appendChild(petal);
    petal.addEventListener("animationend", () => petal.remove());
  }
}

const canvas = document.querySelector("#confetti");
const context = canvas.getContext("2d");

function sizeCanvas() {
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * pixelRatio;
  canvas.height = window.innerHeight * pixelRatio;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

sizeCanvas();
window.addEventListener("resize", sizeCanvas);

function launchConfetti() {
  if (prefersReducedMotion) return;

  const colors = ["#d5a84d", "#b96a70", "#91a98c", "#fffaf0"];
  const particles = Array.from({ length: 150 }, () => ({
    x: window.innerWidth / 2,
    y: window.innerHeight * 0.58,
    velocityX: (Math.random() - 0.5) * 14,
    velocityY: -5 - Math.random() * 11,
    gravity: 0.18 + Math.random() * 0.08,
    rotation: Math.random() * Math.PI,
    spin: (Math.random() - 0.5) * 0.25,
    size: 5 + Math.random() * 7,
    color: colors[Math.floor(Math.random() * colors.length)],
    life: 1
  }));

  function animate() {
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);

    particles.forEach((particle) => {
      particle.x += particle.velocityX;
      particle.y += particle.velocityY;
      particle.velocityY += particle.gravity;
      particle.velocityX *= 0.995;
      particle.rotation += particle.spin;
      particle.life -= 0.008;

      context.save();
      context.globalAlpha = Math.max(particle.life, 0);
      context.translate(particle.x, particle.y);
      context.rotate(particle.rotation);
      context.fillStyle = particle.color;
      context.fillRect(-particle.size / 2, -particle.size / 3, particle.size, particle.size * 0.66);
      context.restore();
    });

    if (particles.some((particle) => particle.life > 0 && particle.y < window.innerHeight + 40)) {
      requestAnimationFrame(animate);
    } else {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
  }

  animate();
}

if (!prefersReducedMotion) {
  const hero = document.querySelector(".hero");
  const heroTitle = document.querySelector(".hero-title");

  hero.addEventListener("pointermove", (event) => {
    const horizontal = (event.clientX / window.innerWidth - 0.5) * 12;
    const vertical = (event.clientY / window.innerHeight - 0.5) * 8;
    heroTitle.style.transform = `translate3d(${horizontal}px, ${vertical}px, 0)`;
  });

  hero.addEventListener("pointerleave", () => {
    heroTitle.style.transform = "translate3d(0, 0, 0)";
  });
}

/* =========================================================
   SETTINGS
   ========================================================= */

// Apna email yahan likho (contact form isi par message bhejega)
const EMAIL = 'rohitkabdwal50578@gmail.com';

// Agar user ne device mein "reduce motion" on kiya hai to animations kam kar do
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Chhoti screen (phone) ke liye 3D halka rakhenge
const mobile = innerWidth < 800;

// Footer mein current year
document.getElementById('yr').textContent = new Date().getFullYear();


/* =========================================================
   1. 3D SCENE (Three.js)
   ========================================================= */

const canvas = document.getElementById('bg');

// Renderer = jo 3D ko screen par draw karta hai
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  alpha: true,
  antialias: !mobile
});
renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.2 : 1.8));

// Scene = 3D duniya, Camera = hum kahan se dekh rahe hain
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
camera.position.z = 6;

// Group = knot aur wireframe ko ek saath move/rotate karne ke liye
const group = new THREE.Group();
scene.add(group);

// --- Chamakta hua 3D knot ---
const knotGeometry = new THREE.TorusKnotGeometry(
  1,                    // radius
  0.32,                 // tube ki motai
  mobile ? 120 : 220,   // smoothness (lambai)
  mobile ? 16 : 36      // smoothness (gol)
);

const knotMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x7c5cff,
  metalness: 0.65,
  roughness: 0.15,
  clearcoat: 1,
  clearcoatRoughness: 0.1
});

const knot = new THREE.Mesh(knotGeometry, knotMaterial);
group.add(knot);

// --- Knot ke around cyan wireframe ---
const wireGeometry = new THREE.WireframeGeometry(
  new THREE.IcosahedronGeometry(1.95, 1)
);

const wireMaterial = new THREE.LineBasicMaterial({
  color: 0x22d3ee,
  transparent: true,
  opacity: 0.28
});

const wire = new THREE.LineSegments(wireGeometry, wireMaterial);
group.add(wire);

// --- Lights ---
scene.add(new THREE.AmbientLight(0xffffff, 0.45));

const purpleLight = new THREE.PointLight(0x8b5cf6, 2.2, 30);
purpleLight.position.set(4, 3, 4);
scene.add(purpleLight);

const cyanLight = new THREE.PointLight(0x22d3ee, 2.2, 30);
cyanLight.position.set(-4, -3, 3);
scene.add(cyanLight);

// --- Background ke chhote particles (stars) ---
const particleCount = mobile ? 350 : 900;
const positions = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount * 3; i++) {
  // har 3rd value z hai, usko kam failao
  const spread = (i % 3 === 2) ? 12 : 22;
  positions[i] = (Math.random() - 0.5) * spread;
}

const particleGeometry = new THREE.BufferGeometry();
particleGeometry.setAttribute(
  'position',
  new THREE.BufferAttribute(positions, 3)
);

const particleMaterial = new THREE.PointsMaterial({
  size: 0.025,
  color: 0xb9a8ff,
  transparent: true,
  opacity: 0.8
});

const particles = new THREE.Points(particleGeometry, particleMaterial);
scene.add(particles);

// --- Screen resize par canvas ka size theek karo ---
function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
resize();
addEventListener('resize', resize);

// --- Mouse position aur scroll progress track karo ---
let mouseX = 0;   // -0.5 se 0.5
let mouseY = 0;   // -0.5 se 0.5
let progress = 0; // 0 (page ka top) se 1 (page ka end)

addEventListener('mousemove', function (e) {
  mouseX = e.clientX / innerWidth - 0.5;
  mouseY = e.clientY / innerHeight - 0.5;
});

addEventListener('scroll', function () {
  const maxScroll = document.documentElement.scrollHeight - innerHeight;
  progress = scrollY / Math.max(1, maxScroll);
}, { passive: true });

// --- Tab hidden ho to animation rok do (battery bachti hai) ---
const clock = new THREE.Clock();
let tabVisible = true;

document.addEventListener('visibilitychange', function () {
  tabVisible = !document.hidden;
});

// --- Animation loop: har frame par chalta hai ---
function animate() {
  requestAnimationFrame(animate);

  if (!tabVisible) return;

  const time = clock.getElapsedTime();

  // Object kahan jayega: scroll ke saath left-right
  // Phone par seedha beech mein rahega
  const targetX = mobile ? 0 : 2.9 * Math.cos(progress * Math.PI * 3);
  const targetY = mobile ? 1.4 : Math.sin(time * 0.8) * 0.15 - progress * 0.4;
  const targetScale = mobile ? 0.62 : 1;

  // 0.05 = smooth movement (jitna chhota utna slow/smooth)
  group.position.x += (targetX - group.position.x) * 0.05;
  group.position.y += (targetY - group.position.y) * 0.05;
  group.scale.setScalar(
    group.scale.x + (targetScale - group.scale.x) * 0.05
  );

  // Rotation: time + scroll + mouse ka mix
  const spin = reduce ? 0 : 1;
  const targetRotY = time * 0.25 * spin + progress * 7 + mouseX * 1.2;
  const targetRotX = mouseY * 0.9 + progress * 2;

  group.rotation.y += (targetRotY - group.rotation.y) * 0.06;
  group.rotation.x += (targetRotX - group.rotation.x) * 0.06;

  // Wireframe aur particles ki slow rotation
  wire.rotation.z = time * 0.12 * spin;
  particles.rotation.y = time * 0.02 * spin + progress * 0.6;

  // Camera mouse ke hisaab se halka sa side mein
  camera.position.x += (mouseX * 0.5 - camera.position.x) * 0.04;

  renderer.render(scene, camera);
}
animate();


/* =========================================================
   2. CUSTOM CURSOR (dot + ring)
   ========================================================= */

const dot = document.getElementById('dot');
const ring = document.getElementById('ring');

let cursorX = 0;
let cursorY = 0;
let ringX = 0;
let ringY = 0;

// Dot mouse ke saath turant chalta hai
addEventListener('mousemove', function (e) {
  cursorX = e.clientX;
  cursorY = e.clientY;
  dot.style.transform = 'translate(' + (cursorX - 3.5) + 'px, ' + (cursorY - 3.5) + 'px)';
});

// Ring thodi der se peeche aati hai (smooth feel)
function moveRing() {
  ringX += (cursorX - ringX) * 0.15;
  ringY += (cursorY - ringY) * 0.15;
  ring.style.transform = 'translate(' + (ringX - 19) + 'px, ' + (ringY - 19) + 'px)';
  requestAnimationFrame(moveRing);
}
moveRing();

// Links/buttons par hover karne par ring bada ho jaye
const hoverTargets = document.querySelectorAll('a, .btn, input, textarea, .chips span');

hoverTargets.forEach(function (el) {
  el.addEventListener('mouseenter', function () {
    ring.classList.add('big');
  });
  el.addEventListener('mouseleave', function () {
    ring.classList.remove('big');
  });
});


/* =========================================================
   3. NAVBAR (scroll down par chhup jaye, up par aaye)
   ========================================================= */

const header = document.getElementById('hd');
let lastScrollY = 0;

addEventListener('scroll', function () {
  const y = scrollY;

  // Thoda scroll hone par background blur wala ho jaye
  header.classList.toggle('solid', y > 40);

  // Neeche scroll = hide, upar scroll = show
  header.classList.toggle('hide', y > lastScrollY && y > 200);

  lastScrollY = y;
}, { passive: true });


/* =========================================================
   4. PROJECT CARDS - 3D TILT (mouse ke saath jhukte hain)
   ========================================================= */

document.querySelectorAll('.card').forEach(function (card) {

  card.addEventListener('mousemove', function (e) {
    const box = card.getBoundingClientRect();

    // Mouse card ke andar kahan hai: -0.5 se 0.5
    const x = (e.clientX - box.left) / box.width - 0.5;
    const y = (e.clientY - box.top) / box.height - 0.5;

    card.style.transform =
      'rotateY(' + (x * 12) + 'deg) ' +
      'rotateX(' + (-y * 12) + 'deg) ' +
      'translateZ(10px)';
  });

  // Mouse hatne par card wapas seedha
  card.addEventListener('mouseleave', function () {
    card.style.transform = '';
  });
});


/* =========================================================
   5. CONTACT FORM (submit par email app khulega)
   ========================================================= */

document.getElementById('cf').addEventListener('submit', function (e) {
  e.preventDefault();

  const data = new FormData(e.target);
  const name = data.get('n');
  const email = data.get('e');
  const message = data.get('m');

  const body = message + '\n\nFrom: ' + name + ' (' + email + ')';
  const subject = 'Portfolio message from ' + name;

  location.href =
    'mailto:' + EMAIL +
    '?subject=' + encodeURIComponent(subject) +
    '&body=' + encodeURIComponent(body);

  document.getElementById('note').textContent =
    'Opening your email app. Press send there to finish.';
});


/* =========================================================
   6. INTRO ANIMATION (preloader ke baad naam aata hai)
   ========================================================= */

// Naam ke har letter ko alag <span> mein todo, taaki ek-ek karke aaye
document.querySelectorAll('#name .ln').forEach(function (line) {
  const letters = line.textContent.split('');
  line.innerHTML = letters
    .map(function (letter) {
      return '<span class="ch">' + letter + '</span>';
    })
    .join('');
});

const preloader = document.getElementById('pre');
const counter = document.getElementById('cnt');

// Preloader hatne ke baad hero ka animation
function playIntro() {
  preloader.style.display = 'none';

  if (reduce || !window.gsap) return;

  // Letters neeche se upar aate hain
  gsap.from('.ch', {
    yPercent: 110,
    rotate: 6,
    duration: 1,
    stagger: 0.04,
    ease: 'power4.out'
  });

  // Baaki hero content fade + upar
  gsap.from('.hello, .tag, .btns, .scroll', {
    opacity: 0,
    y: 24,
    duration: 0.9,
    stagger: 0.12,
    delay: 0.5,
    ease: 'power3.out'
  });
}


/* =========================================================
   7. SCROLL ANIMATIONS (sections neeche se upar aate hain)
   ========================================================= */

function setupScrollAnimations() {
  // Agar animation band hai ya GSAP load nahi hua, to seedha dikha do
  if (reduce || !window.gsap) {
    document.querySelectorAll('.rv').forEach(function (el) {
      el.classList.remove('rv');
    });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  gsap.utils.toArray('.rv').forEach(function (el, index) {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: 'power3.out',
      delay: (index % 3) * 0.08,
      scrollTrigger: {
        trigger: el,
        start: 'top 88%',
        once: true
      }
    });
  });
}

setupScrollAnimations();


/* 8. PRELOADER COUNTER (0 se 100 tak ginti) */

const count = { value: 0 };

function finishPreloader() {
  if (window.gsap && !reduce) {
    gsap.to(preloader, {
      opacity: 0,
      duration: 0.6,
      onComplete: playIntro
    });
  } else {
    playIntro();
  }
}

if (window.gsap && !reduce) {
  gsap.to(count, {
    value: 100,
    duration: 1.3,
    ease: 'power2.inOut',
    onUpdate: function () {
      counter.textContent = Math.round(count.value);
    },
    onComplete: finishPreloader
  });
} else {
  finishPreloader();
}
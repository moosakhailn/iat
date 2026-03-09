/* NAVBAR & MOBILE SIDEBAR */
const menuBtn = document.getElementById('menuBtn');
const mobileSidebar = document.getElementById('mobileSidebar');
const closeBtn = document.getElementById('closeBtn');
const headerStack = document.getElementById('headerStack');

menuBtn?.addEventListener('click', ()=>{
  mobileSidebar.classList.add('open');
  mobileSidebar.setAttribute('aria-hidden','false');
  menuBtn.setAttribute('aria-expanded','true');
});
closeBtn?.addEventListener('click', ()=>{
  mobileSidebar.classList.remove('open');
  mobileSidebar.setAttribute('aria-hidden','true');
  menuBtn.setAttribute('aria-expanded','false');
});
mobileSidebar?.addEventListener('click', e=>{
  if(e.target.tagName==='A' && window.innerWidth<=900){
    mobileSidebar.classList.remove('open');
    mobileSidebar.setAttribute('aria-hidden','true');
    menuBtn.setAttribute('aria-expanded','false');
  }
});
window.addEventListener('keydown', e=>{
  if(e.key==='Escape' && mobileSidebar.classList.contains('open')){
    mobileSidebar.classList.remove('open');
    mobileSidebar.setAttribute('aria-hidden','true');
    menuBtn.setAttribute('aria-expanded','false');
  }
});
window.addEventListener('resize', ()=>{
  if(window.innerWidth>900 && mobileSidebar.classList.contains('open')){
    mobileSidebar.classList.remove('open');
    mobileSidebar.setAttribute('aria-hidden','true');
    menuBtn.setAttribute('aria-expanded','false');
  }
});
window.addEventListener('scroll', ()=>{
  if(window.scrollY>6) headerStack.classList.add('scrolled');
  else headerStack.classList.remove('scrolled');
});
// ===== Hero Slider =====
const slides = document.querySelectorAll('.slide');
const dots = document.querySelectorAll('.dot');
let currentSlide = 0;

function showSlide(index){
  slides.forEach((s,i)=>s.classList.remove('active'));
  dots.forEach((d,i)=>d.classList.remove('active'));
  slides[index].classList.add('active');
  dots[index].classList.add('active');
}
document.querySelector('.prev').addEventListener('click', ()=>{
  currentSlide = (currentSlide - 1 + slides.length) % slides.length;
  showSlide(currentSlide);
});
document.querySelector('.next').addEventListener('click', ()=>{
  currentSlide = (currentSlide + 1) % slides.length;
  showSlide(currentSlide);
});
// Auto slide every 6s
setInterval(()=>{
  currentSlide = (currentSlide +1) % slides.length;
  showSlide(currentSlide);
},6000);

// ===== Prayer Times =====
// Masjidal manual init fix
window.addEventListener("load", () => {
  if (window.Masjidal && typeof window.Masjidal.init === "function") {
    window.Masjidal.init();
    console.log("Masjidal widget initialized");
  } else {
    console.error("Masjidal failed to load");
  }
});

const imamCards = document.querySelectorAll('.imam-card');

function revealImamCards() {
  const windowHeight = window.innerHeight;
  imamCards.forEach(card => {
    const cardTop = card.getBoundingClientRect().top;
    if (cardTop < windowHeight - 100) {
      card.classList.add('show');
    }
  });
}

window.addEventListener('scroll', revealImamCards);
window.addEventListener('load', revealImamCards);

// Fade-in animation
const fadeItems = document.querySelectorAll('.event-card, .service-item');

function revealFadeItems() {
  const windowHeight = window.innerHeight;
  fadeItems.forEach(item => {
    const top = item.getBoundingClientRect().top;
    if(top < windowHeight - 100) {
      item.style.opacity = 1;
      item.style.transform = 'translateY(0)';
      item.style.transition = 'transform 0.6s ease, opacity 0.6s ease';
    }
  });
}

window.addEventListener('scroll', revealFadeItems);
window.addEventListener('load', revealFadeItems);

// Show more events toggle
const serviceToggles = document.querySelectorAll('.service-toggle');

serviceToggles.forEach(toggle => {
  toggle.addEventListener('click', () => {
    const parent = toggle.closest('.service-item');
    parent.classList.toggle('open');
  });
});


// ===== Newsletter Subscription =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, doc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

/* FIREBASE CONFIG */
const firebaseConfig = {
  apiKey: "AIzaSyBg4kcfynZxLWmI9MJXPuAz4qA7gwz3lr8",
  authDomain: "i-a-t-c8495.firebaseapp.com",
  projectId: "i-a-t-c8495",
  storageBucket: "i-a-t-c8495.firebasestorage.app",
  messagingSenderId: "763474854042",
  appId: "1:763474854042:web:eccc67d35e5753839b1f23"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ELEMENTS */
const emailInput = document.getElementById("emailInput");
const statusMsg = document.getElementById("statusMsg");
const subscribeBtn = document.getElementById("subscribeBtn");
const unsubscribeBtn = document.getElementById("unsubscribeBtn");

/* COOLDOWN */
let cooldown = false;
const cooldownTime = 5000; // 5 seconds

/* HELPER TO SHOW STATUS */
function showStatus(message, color="#d4af37") {
  statusMsg.textContent = message;
  statusMsg.style.color = color;
  statusMsg.style.opacity = 1;
  statusMsg.style.transform = "translateY(0)";
  setTimeout(() => {
    statusMsg.style.opacity = 0;
    statusMsg.style.transform = "translateY(10px)";
  }, 3500);
}

/* CHECK reCAPTCHA */
function isRecaptchaValid() {
  const response = grecaptcha.getResponse();
  if(!response) {
    showStatus("Please complete the reCAPTCHA", "red");
    return false;
  }
  return true;
}

/* SUBSCRIBE */
subscribeBtn.addEventListener("click", async () => {
  if (cooldown) return;
  if (!isRecaptchaValid()) return;

  const email = emailInput.value.trim().toLowerCase();
  if (!email) return showStatus("Please enter a valid email", "red");

  try {
    await setDoc(doc(db, "subscribers", email), {
      email,
      createdAt: new Date()
    });
    showStatus("Subscribed successfully!");
    emailInput.value = "";
  } catch(err) {
    console.error(err);
    showStatus("Subscription failed", "red");
  }

  cooldown = true;
  setTimeout(() => cooldown = false, cooldownTime);
});

/* UNSUBSCRIBE */
unsubscribeBtn.addEventListener("click", async () => {
  if (cooldown) return;
  if (!isRecaptchaValid()) return;

  const email = emailInput.value.trim().toLowerCase();
  if (!email) return showStatus("Please enter a valid email", "red");

  try {
    await deleteDoc(doc(db, "subscribers", email));
    showStatus("Unsubscribed successfully!");
    emailInput.value = "";
  } catch(err) {
    console.error(err);
    showStatus("Unsubscribe failed", "red");
  }

  cooldown = true;
  setTimeout(() => cooldown = false, cooldownTime);
});

// ===== Contact Form =====

document.getElementById("contactForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const message = document.getElementById("message").value.trim();

  if (phone.length !== 10 || isNaN(phone)) {
    alert("Please enter a valid 10-digit phone number.");
    return;
  }

  const subject = encodeURIComponent("Masjid Inquiry from " + name);
  const body = encodeURIComponent(
    `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\n\nMessage:\n${message}`
  );

  window.location.href = `mailto:abuhanifahiat@gmail.com?subject=${subject}&body=${body}`;
});



document.getElementById("year").textContent = new Date().getFullYear();
(function() {
  const filename = location.pathname.split('/').pop();
  const pageName = filename.replace('.html', '');
  const storageKey = 'rated_' + filename;
  if (document.getElementById('surprise-rating')) return;

  const wrap = document.createElement('div');
  wrap.id = 'surprise-rating';
  wrap.innerHTML = `
    <style>
      #surprise-rating { position:relative; z-index:99999; text-align:center; padding:2rem 0 1.5rem; font-family:Georgia,serif; }
      #surprise-rating .sr-label { font-size:0.7rem; letter-spacing:0.15em; text-transform:uppercase; color:rgba(255,255,255,0.35); margin-bottom:0.5rem; }
      #surprise-rating .sr-stars { display:inline-flex; gap:4px; cursor:pointer; }
      #surprise-rating .sr-star { font-size:1.8rem; color:rgba(255,255,255,0.15); transition:color 0.15s,transform 0.15s; user-select:none; }
      #surprise-rating .sr-star:hover, #surprise-rating .sr-star.hover { transform:scale(1.15); color:#c4a35a; }
      #surprise-rating .sr-star.on { color:#c4a35a; }
      #surprise-rating .sr-thanks { font-size:0.85rem; color:rgba(255,255,255,0.4); margin-top:0.4rem; min-height:1.2em; opacity:0; transition:opacity 0.4s; }
      #surprise-rating .sr-comment-box { margin-top:0.8rem; opacity:0; max-height:0; overflow:hidden; transition:opacity 0.4s,max-height 0.4s; }
      #surprise-rating .sr-comment-box.show { opacity:1; max-height:200px; }
      #surprise-rating .sr-comment-box textarea { width:100%; max-width:300px; min-height:60px; padding:0.5rem; font-family:Georgia,serif; font-size:0.8rem; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.15); border-radius:8px; color:rgba(255,255,255,0.8); resize:none; outline:none; }
      #surprise-rating .sr-comment-box textarea::placeholder { color:rgba(255,255,255,0.3); }
      #surprise-rating .sr-send-btn { display:inline-block; margin-top:0.4rem; padding:0.3rem 1rem; font-family:Georgia,serif; font-size:0.75rem; background:rgba(196,163,90,0.15); border:1px solid rgba(196,163,90,0.3); border-radius:6px; color:rgba(255,255,255,0.6); cursor:pointer; }
    </style>
    <div class="sr-label">rate this surprise</div>
    <div class="sr-stars">${[1,2,3,4,5].map(n => '<span class="sr-star" data-v="' + n + '">★</span>').join('')}</div>
    <div class="sr-thanks"></div>
    <div class="sr-comment-box"><textarea placeholder="thoughts? (optional)"></textarea><br><button class="sr-send-btn">send</button></div>
    <div class="sr-comment-sent"></div>
  `;
  document.body.appendChild(wrap);

  let db = null;
  async function initFirebase() {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js");
    const { getFirestore, doc, getDoc, setDoc } = await import("https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js");
    const app = initializeApp({
      apiKey: "AIzaSyALIZpTXMPP4LtzfR-343X1XqjeOarLV9w",
      authDomain: "closerapp-project.firebaseapp.com",
      projectId: "closerapp-project",
      storageBucket: "closerapp-project.firebasestorage.app",
      messagingSenderId: "480600476692",
      appId: "1:480600476692:web:47a220b944454519036b01"
    });
    db = getFirestore(app);
    return { doc, getDoc, setDoc };
  }

  let fm = null;
  initFirebase().then(m => { fm = m; loadExisting(); });

  async function loadExisting() {
    if (!fm || !db) return;
    try {
      const snap = await fm.getDoc(fm.doc(db, "tobias-surprise-ratings", pageName));
      if (snap.exists()) {
        const d = snap.data();
        if (d.rating) showRating(d.rating);
      }
    } catch(e) {}
  }

  function showRating(v) {
    wrap.querySelectorAll('.sr-star').forEach((s,i) => s.classList.toggle('on', i < v));
    wrap.querySelector('.sr-thanks').textContent = ['','awful','meh','nice','loved it','perfect'][v];
    wrap.querySelector('.sr-thanks').style.opacity = '1';
    wrap.querySelector('.sr-comment-box').classList.add('show');
  }

  wrap.querySelectorAll('.sr-star').forEach(star => {
    star.addEventListener('click', async () => {
      const v = parseInt(star.dataset.v);
      showRating(v);
      localStorage.setItem(storageKey, v);
      if (fm && db) {
        await fm.setDoc(fm.doc(db, "tobias-surprise-ratings", pageName), {
          page: pageName, rating: v, ts: Date.now()
        }, { merge: true });
      }
    });
    star.addEventListener('mouseenter', () => {
      const v = parseInt(star.dataset.v);
      wrap.querySelectorAll('.sr-star').forEach((s,i) => s.classList.toggle('hover', i < v));
    });
    star.addEventListener('mouseleave', () => {
      wrap.querySelectorAll('.sr-star').forEach(s => s.classList.remove('hover'));
    });
  });

  const sendBtn = wrap.querySelector('.sr-send-btn');
  sendBtn.addEventListener('click', async () => {
    const txt = wrap.querySelector('textarea').value.trim();
    if (!txt) return;
    if (fm && db) {
      await fm.setDoc(fm.doc(db, "tobias-surprise-ratings", pageName), {
        comment: txt, commentTs: Date.now()
      }, { merge: true });
    }
    wrap.querySelector('.sr-comment-sent').textContent = 'sent ♡';
    wrap.querySelector('.sr-comment-sent').style.opacity = '1';
    sendBtn.style.display = 'none';
  });
})();

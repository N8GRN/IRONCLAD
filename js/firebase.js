/* ============================================================
   IRONCLAD CRM — Firebase Auth / Firestore / FCM
   Project: ironclad-127a5  (config.js)
   Writes ONLY when signed in with Firebase (session.mode === "firebase").
   "Work on this device" stays in this browser until you sign in.
   ============================================================ */
window.IC = window.IC || {};

(function (IC) {
  var app = null;
  var unsubscribers = [];

  IC.firebaseAvailable = function () {
    return typeof firebase !== "undefined" && firebase.apps;
  };

  IC.getFirebaseApp = function () {
    if (!IC.firebaseAvailable()) return null;
    if (!app) {
      app = firebase.apps.length ? firebase.app() : firebase.initializeApp(IC.FIREBASE);
    }
    return app;
  };

  IC.getAuth = function () {
    var a = IC.getFirebaseApp();
    return a ? firebase.auth() : null;
  };

  IC.getDb = function () {
    var a = IC.getFirebaseApp();
    return a ? firebase.firestore() : null;
  };

  IC.cloudUpsert = function (col, id, data) {
    var db = IC.getDb();
    if (!db || !IC.state.session || IC.state.session.mode !== "firebase") return;
    db.collection(col).doc(id).set(JSON.parse(JSON.stringify(data))).catch(function (err) {
      console.warn("[ironclad] cloud upsert failed", col, id, err);
    });
  };

  IC.cloudDelete = function (col, id) {
    var db = IC.getDb();
    if (!db || !IC.state.session || IC.state.session.mode !== "firebase") return;
    db.collection(col).doc(id).delete().catch(function (err) {
      console.warn("[ironclad] cloud delete failed", col, id, err);
    });
  };

  IC.publishSignLink = function (job) {
    var db = IC.getDb();
    if (!db || !job.contract || !job.contract.signingToken) return;
    var customer = IC.state.customers.find(function (c) { return c.id === job.customerId; }) || null;
    var payload = {
      jobId: job.id,
      job: JSON.parse(JSON.stringify(job)),
      customer: customer ? JSON.parse(JSON.stringify(customer)) : null,
      settings: JSON.parse(JSON.stringify(IC.state.settings)),
      updatedAt: IC.nowIso(),
    };
    db.collection("signLinks").doc(job.contract.signingToken).set(payload).catch(function (err) {
      console.warn("[ironclad] sign link publish failed", err);
    });
  };

  IC.loadSignLink = function (token) {
    var db = IC.getDb();
    if (!db || !token) return Promise.resolve(null);
    return db.collection("signLinks").doc(token).get().then(function (snap) {
      return snap.exists ? snap.data() : null;
    }).catch(function (err) {
      console.warn("[ironclad] sign link load failed", err);
      return null;
    });
  };

  IC.applyRemoteSignature = function (token, signature) {
    var local = IC.signByToken(token, "customer", signature);
    if (local) return Promise.resolve(local);
    var db = IC.getDb();
    if (!db) return Promise.resolve(null);
    var ref = db.collection("signLinks").doc(token);
    return ref.get().then(function (snap) {
      if (!snap.exists) return null;
      var data = snap.data();
      var job = data.job;
      if (!job || !job.contract) return null;
      var block = Object.assign({}, signature, { signedAt: IC.nowIso() });
      var both = Boolean(job.contract.companySignature);
      var contract = Object.assign({}, job.contract, {
        customerSignature: block,
        status: both ? "signed" : (job.contract.status === "draft" ? "sent" : job.contract.status),
        signedAt: both ? IC.nowIso() : job.contract.signedAt,
      });
      var nextJob = Object.assign({}, job, { contract: contract, updatedAt: IC.nowIso() });
      return ref.set(Object.assign({}, data, {
        job: JSON.parse(JSON.stringify(nextJob)),
        updatedAt: IC.nowIso(),
      })).then(function () {
        return db.collection("jobs").doc(job.id).set(JSON.parse(JSON.stringify(nextJob)), { merge: true })
          .catch(function () { /* customer has no auth */ })
          .then(function () { return nextJob; });
      });
    }).catch(function (err) {
      console.warn("[ironclad] remote sign failed", err);
      return null;
    });
  };

  IC.pullCloud = function () {
    var db = IC.getDb();
    if (!db) return Promise.resolve(false);
    return Promise.all([
      db.collection("jobs").get(),
      db.collection("customers").get(),
      db.collection("crews").get(),
      db.collection("notifications").get(),
      db.collection("meta").get(),
    ]).then(function (parts) {
      var jobsSnap = parts[0], customersSnap = parts[1], crewsSnap = parts[2];
      var notesSnap = parts[3], metaSnap = parts[4];
      var meta = {};
      metaSnap.forEach(function (d) { meta[d.id] = d.data(); });
      var payload = {
        jobs: jobsSnap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); }),
        customers: customersSnap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); }),
        crews: crewsSnap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); }),
        notifications: notesSnap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); }),
      };
      if (meta.settings) payload.settings = meta.settings;
      if (meta.team && meta.team.team) payload.team = meta.team.team;
      var hasData = payload.jobs.length + payload.customers.length > 0;
      if (hasData) {
        IC.replaceCloud(payload);
      } else {
        var s = IC.state;
        var writes = []
          .concat(s.jobs.map(function (j) { return db.collection("jobs").doc(j.id).set(JSON.parse(JSON.stringify(j))); }))
          .concat(s.customers.map(function (c) { return db.collection("customers").doc(c.id).set(JSON.parse(JSON.stringify(c))); }))
          .concat(s.crews.map(function (c) { return db.collection("crews").doc(c.id).set(JSON.parse(JSON.stringify(c))); }));
        writes.push(db.collection("meta").doc("settings").set(JSON.parse(JSON.stringify(s.settings))));
        writes.push(db.collection("meta").doc("team").set({ team: s.team }));
        return Promise.all(writes).then(function () {
          IC.state.firebaseReady = true;
          IC.emit();
          return true;
        });
      }
      IC.state.firebaseReady = true;
      IC.emit();
      return true;
    }).catch(function (err) {
      console.warn("[ironclad] pullCloud failed", err);
      return false;
    });
  };

  IC.subscribeCloud = function () {
    var db = IC.getDb();
    IC.unsubscribeCloud();
    if (!db) return;
    unsubscribers.push(db.collection("jobs").onSnapshot(function (snap) {
      IC.state.jobs = snap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });
      IC.emit();
    }));
    unsubscribers.push(db.collection("customers").onSnapshot(function (snap) {
      IC.state.customers = snap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });
      IC.emit();
    }));
    unsubscribers.push(db.collection("notifications").onSnapshot(function (snap) {
      IC.state.notifications = snap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });
      IC.emit();
    }));
    unsubscribers.push(db.collection("signLinks").onSnapshot(function (snap) {
      var byJob = {};
      snap.forEach(function (d) {
        var data = d.data();
        if (data.jobId && data.job && data.job.contract) byJob[data.jobId] = data.job;
      });
      var keys = Object.keys(byJob);
      if (!keys.length) return;
      IC.state.jobs = IC.state.jobs.map(function (j) {
        var remote = byJob[j.id];
        return remote && remote.contract ? Object.assign({}, j, { contract: remote.contract }) : j;
      });
      IC.emit();
    }));
  };

  IC.unsubscribeCloud = function () {
    unsubscribers.forEach(function (u) { try { u(); } catch (e) { /* ignore */ } });
    unsubscribers = [];
  };

  IC.matchMember = function (email) {
    var e = (email || "").trim().toLowerCase();
    var team = IC.state.team;
    return team.find(function (t) { return t.email && t.email.toLowerCase() === e; }) ||
      ((e.indexOf("nathan") >= 0 || e.indexOf("nate") >= 0) ? team.find(function (t) { return t.id === "nate"; }) : null);
  };

  IC.signInFirebase = function (email, password) {
    var auth = IC.getAuth();
    if (!auth) return Promise.reject(new Error("Firebase is not available in this environment."));
    return auth.signInWithEmailAndPassword(email, password);
  };

  IC.signOut = function () {
    var auth = IC.getAuth();
    IC.unsubscribeCloud();
    var p = auth ? auth.signOut().catch(function () {}) : Promise.resolve();
    return p.then(function () {
      IC.setSession(null);
    });
  };

  IC.registerPush = function (userId) {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
    if (!IC.firebaseAvailable() || !firebase.messaging) return;
    Notification.requestPermission().then(function (perm) {
      if (perm !== "granted") return;
      var messaging = firebase.messaging();
      return navigator.serviceWorker.register("firebase-messaging-sw.js").then(function (reg) {
        return messaging.getToken({ vapidKey: IC.VAPID, serviceWorkerRegistration: reg });
      }).then(function (token) {
        var db = IC.getDb();
        if (token && db && IC.state.session && IC.state.session.mode === "firebase") {
          db.collection("fcmTokens").doc(token).set({
            userId: userId,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            platform: navigator.userAgent,
          });
        }
        messaging.onMessage(function (payload) {
          var n = (payload && payload.notification) || {};
          try { new Notification(n.title || "IRONCLAD", { body: n.body || "", icon: IC.asset("brand/logo.png") }); }
          catch (e) { /* ignore */ }
        });
      });
    }).catch(function (err) {
      console.warn("[ironclad] push registration skipped", err);
    });
  };

  IC.listenAuth = function () {
    var auth = IC.getAuth();
    if (!auth) return;
    auth.onAuthStateChanged(function (user) {
      if (!user || !user.email) return;
      var member = IC.matchMember(user.email) || {
        id: user.uid,
        name: (user.email.split("@")[0] || "User"),
        email: user.email,
        role: "sales",
        title: "Sales",
        salesName: null,
        active: true,
      };
      IC.setSession(IC.memberToSession(member, "firebase", user.uid));
      IC.pullCloud().then(function () {
        IC.subscribeCloud();
        IC.registerPush(user.uid);
      });
    });
  };

  IC.shareOrDownload = function (opts) {
    var files = opts.blob
      ? [new File([opts.blob], opts.filename, { type: opts.blob.type || "application/pdf" })]
      : undefined;
    var tryShare = function () {
      if (!navigator.share) return Promise.reject();
      var data = { title: opts.title, text: opts.text, url: opts.url };
      if (files && navigator.canShare && navigator.canShare({ files: files })) data.files = files;
      return navigator.share(data);
    };
    return tryShare().catch(function (err) {
      if (err && err.name === "AbortError") return;
      if (opts.blob) {
        var a = document.createElement("a");
        a.href = URL.createObjectURL(opts.blob);
        a.download = opts.filename;
        a.click();
        URL.revokeObjectURL(a.href);
        return;
      }
      if (opts.url && navigator.clipboard) navigator.clipboard.writeText(opts.url);
    });
  };

  var pdfLibs = null;
  IC.loadPdfLibs = function () {
    if (pdfLibs) return pdfLibs;
    pdfLibs = Promise.all([
      loadScript("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"),
      loadScript("https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js"),
    ]);
    return pdfLibs;
  };

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[src="' + src + '"]');
      if (existing) { resolve(); return; }
      var s = document.createElement("script");
      s.src = src;
      s.onload = function () { resolve(); };
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  IC.htmlToPdf = function (element, filename) {
    return IC.loadPdfLibs().then(function () {
      var html2canvas = window.html2canvas;
      var jsPDF = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
      return html2canvas(element, { scale: 2, useCORS: true, backgroundColor: "#ffffff" }).then(function (canvas) {
        var img = canvas.toDataURL("image/jpeg", 0.92);
        var pdf = new jsPDF({ unit: "in", format: "letter", orientation: "portrait" });
        var pageW = 8.5, pageH = 11, margin = 0.4;
        var w = pageW - margin * 2;
        var h = (canvas.height / canvas.width) * w;
        var remaining = h, y = margin, srcY = 0;
        var pageDrawH = pageH - margin * 2;
        if (h <= pageDrawH) {
          pdf.addImage(img, "JPEG", margin, margin, w, h);
        } else {
          while (remaining > 0) {
            pdf.addImage(img, "JPEG", margin, y - srcY, w, h);
            remaining -= pageDrawH;
            if (remaining > 0) {
              pdf.addPage();
              srcY += pageDrawH;
              y = margin;
            }
          }
        }
        return { blob: pdf.output("blob"), filename: filename };
      });
    });
  };
})(window.IC);

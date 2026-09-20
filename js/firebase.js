/* ============================================================
   IRONCLAD CRM — Auth / Firestore / FCM
   Project: ironclad-127a5  (config.js)
   Everyone shares the same jobs, customers, catalog, and users.
   ============================================================ */
window.IC = window.IC || {};

(function (IC) {
  var app = null;
  var unsubscribers = [];
  var persistenceReady = null;
  var notesPrimed = false;
  var seenNotes = {};

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

  IC.cloudEnabled = function () {
    var auth = IC.getAuth();
    return Boolean(auth && auth.currentUser && IC.state.session && IC.isApproved(IC.state.session));
  };

  IC.initFirebase = function () {
    if (persistenceReady) return persistenceReady;
    var a = IC.getFirebaseApp();
    if (!a) {
      persistenceReady = Promise.resolve(false);
      return persistenceReady;
    }
    try {
      firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    } catch (err) { /* ignore */ }
    persistenceReady = firebase.firestore().enablePersistence({ synchronizeTabs: true })
      .then(function () { return true; })
      .catch(function () { return false; });
    return persistenceReady;
  };

  IC.cloudUpsert = function (col, id, data) {
    var db = IC.getDb();
    if (!db || !id) return;
    if (!IC.getAuth() || !IC.getAuth().currentUser) return;
    if (col !== "users" && !IC.cloudEnabled()) return;
    db.collection(col).doc(id).set(JSON.parse(JSON.stringify(data))).catch(function (err) {
      console.warn("[ironclad] cloud upsert failed", col, id, err);
    });
  };

  IC.cloudDelete = function (col, id) {
    var db = IC.getDb();
    if (!db || !IC.getAuth() || !IC.getAuth().currentUser) return;
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
      db.collection("users").get(),
    ]).then(function (parts) {
      var jobsSnap = parts[0], customersSnap = parts[1], crewsSnap = parts[2];
      var notesSnap = parts[3], metaSnap = parts[4], usersSnap = parts[5];
      var meta = {};
      metaSnap.forEach(function (d) { meta[d.id] = d.data(); });
      var users = usersSnap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });
      var payload = {
        jobs: jobsSnap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); }),
        customers: customersSnap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); }),
        crews: crewsSnap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); }),
        notifications: notesSnap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); }),
      };
      if (meta.settings) payload.settings = meta.settings;
      if (users.length) payload.team = users;
      else if (meta.team && meta.team.team) payload.team = meta.team.team;
      if (meta.catalog) payload.catalog = meta.catalog.catalog || meta.catalog;
      var hasData = payload.jobs.length + payload.customers.length + users.length > 0;
      if (hasData) {
        IC.replaceCloud(payload);
        if (!users.length) IC.seedUsers(IC.state.team);
      } else {
        var s = IC.state;
        var writes = []
          .concat(s.jobs.map(function (j) { return db.collection("jobs").doc(j.id).set(JSON.parse(JSON.stringify(j))); }))
          .concat(s.customers.map(function (c) { return db.collection("customers").doc(c.id).set(JSON.parse(JSON.stringify(c))); }))
          .concat(s.crews.map(function (c) { return db.collection("crews").doc(c.id).set(JSON.parse(JSON.stringify(c))); }))
          .concat(s.team.map(function (u) { return db.collection("users").doc(u.id).set(JSON.parse(JSON.stringify(u))); }));
        writes.push(db.collection("meta").doc("settings").set(JSON.parse(JSON.stringify(s.settings))));
        writes.push(db.collection("meta").doc("team").set({ team: s.team }));
        writes.push(db.collection("meta").doc("catalog").set({ catalog: s.catalog, updatedAt: IC.nowIso() }));
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

  IC.seedUsers = function (team) {
    var db = IC.getDb();
    (team || []).forEach(function (u) {
      if (db) db.collection("users").doc(u.id).set(JSON.parse(JSON.stringify(u))).catch(function () {});
    });
  };

  function showIncomingNote(n) {
    if (!n || seenNotes[n.id]) return;
    seenNotes[n.id] = true;
    var me = IC.state.session && IC.state.session.memberId;
    if (!me || n.userId !== me || n.read) return;
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    try { new Notification(n.title || "IRONCLAD", { body: n.body || "", icon: IC.asset("brand/logo.png") }); }
    catch (e) { /* ignore */ }
  }

  IC.subscribeCloud = function () {
    var db = IC.getDb();
    IC.unsubscribeCloud();
    if (!db) return;
    notesPrimed = false;
    unsubscribers.push(db.collection("jobs").onSnapshot(function (snap) {
      IC.state.jobs = snap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });
      IC.emit();
    }));
    unsubscribers.push(db.collection("customers").onSnapshot(function (snap) {
      IC.state.customers = snap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });
      IC.emit();
    }));
    unsubscribers.push(db.collection("crews").onSnapshot(function (snap) {
      if (!snap.docs.length) return;
      IC.state.crews = snap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });
      IC.emit();
    }));
    unsubscribers.push(db.collection("users").onSnapshot(function (snap) {
      if (!snap.docs.length) return;
      IC.state.team = snap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });
      var s = IC.state.session;
      if (s) {
        var me = IC.state.team.find(function (t) {
          return t.id === s.memberId || (s.firebaseUid && t.firebaseUid === s.firebaseUid) ||
            (s.email && t.email && t.email.toLowerCase() === s.email.toLowerCase());
        });
        if (me) IC.state.session = IC.memberToSession(me, s.mode, s.firebaseUid);
      }
      IC.emit();
    }));
    unsubscribers.push(db.collection("notifications").onSnapshot(function (snap) {
      var list = snap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });
      if (!notesPrimed) {
        notesPrimed = true;
        list.forEach(function (n) { seenNotes[n.id] = true; });
      } else {
        list.forEach(showIncomingNote);
      }
      IC.state.notifications = list;
      IC.emit();
    }));
    unsubscribers.push(db.collection("meta").onSnapshot(function (snap) {
      snap.forEach(function (d) {
        if (d.id === "settings" && d.data()) IC.state.settings = Object.assign({}, IC.state.settings, d.data());
        if (d.id === "catalog" && d.data()) {
          var cat = d.data().catalog || d.data();
          if (cat) IC.state.catalog = IC.ensureCatalog(cat);
        }
      });
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
    if (!e) return null;
    var team = IC.state.team;
    return team.find(function (t) { return t.email && t.email.toLowerCase() === e; }) || null;
  };

  IC.isBootstrapAdmin = function (email) {
    var e = (email || "").trim().toLowerCase();
    return (IC.ADMIN_EMAILS || []).some(function (x) { return String(x).toLowerCase() === e; });
  };

  IC.normalizeUser = function (raw, id) {
    raw = raw || {};
    var role = raw.role === "admin" || raw.role === "sales" ? raw.role : "pending";
    var status = raw.status || (role === "pending" ? "pending" : "active");
    return {
      id: id || raw.id,
      name: raw.name || "Teammate",
      email: raw.email || "",
      role: status === "pending" ? "pending" : role,
      title: raw.title || "",
      salesName: raw.salesName || null,
      active: status === "active",
      status: status,
      firebaseUid: raw.firebaseUid || null,
      placeholder: Boolean(raw.placeholder),
      createdAt: raw.createdAt || IC.nowIso(),
      lastLoginAt: raw.lastLoginAt || null,
    };
  };

  IC.ensureUserProfile = function (fbUser) {
    var db = IC.getDb();
    var email = (fbUser.email || "").trim();
    var uid = fbUser.uid;
    var display = (fbUser.displayName || email.split("@")[0] || "Teammate").trim();
    var finish = function (user) {
      user = IC.normalizeUser(user, user.id);
      user.lastLoginAt = IC.nowIso();
      user.firebaseUid = uid;
      user.email = email;
      IC.saveUser(user);
      return user;
    };
    if (!db) {
      var local = IC.matchMember(email);
      if (local) return Promise.resolve(finish(Object.assign({}, local, { firebaseUid: uid, email: email })));
      if (IC.isBootstrapAdmin(email)) {
        return Promise.resolve(finish({
          id: uid, name: display, email: email, role: "admin", title: "Admin", status: "active", firebaseUid: uid,
        }));
      }
      return Promise.resolve(finish({
        id: uid, name: display, email: email, role: "pending", title: "Waiting", status: "pending", firebaseUid: uid,
      }));
    }
    return db.collection("users").doc(uid).get().then(function (byUid) {
      if (byUid.exists) return finish(Object.assign({ id: uid }, byUid.data(), { firebaseUid: uid, email: email }));
      return db.collection("users").where("email", "==", email).get().then(function (q) {
        if (!q.empty) {
          var doc = q.docs[0];
          return finish(Object.assign({ id: doc.id }, doc.data(), { firebaseUid: uid, email: email, placeholder: false }));
        }
        var byAddr = IC.matchMember(email);
        if (byAddr) return finish(Object.assign({}, byAddr, { firebaseUid: uid, email: email, placeholder: false }));
        if (IC.isBootstrapAdmin(email)) {
          var nate = IC.state.team.find(function (t) { return t.id === "nate"; });
          if (nate) return finish(Object.assign({}, nate, { email: email, firebaseUid: uid, role: "admin", status: "active", placeholder: false }));
          return finish({
            id: uid, name: display, email: email, role: "admin", title: "Admin", status: "active", firebaseUid: uid,
          });
        }
        return finish({
          id: uid, name: display, email: email, role: "pending", title: "Waiting", status: "pending", firebaseUid: uid,
        });
      });
    });
  };

  IC.applyAuthUser = function (fbUser) {
    return IC.ensureUserProfile(fbUser).then(function (member) {
      IC.setSession(IC.memberToSession(member, navigator.onLine ? "online" : "offline", fbUser.uid));
      if (!IC.isApproved(member)) return member;
      return IC.pullCloud().then(function () {
        IC.subscribeCloud();
        IC.registerPush(member.id);
        return member;
      });
    });
  };

  IC.signInFirebase = function (email, password) {
    var auth = IC.getAuth();
    if (!auth) return Promise.reject(new Error("Sign-in isn’t available in this browser."));
    var persist = IC.ui.keepSignedIn === false
      ? firebase.auth.Auth.Persistence.SESSION
      : firebase.auth.Auth.Persistence.LOCAL;
    return auth.setPersistence(persist).catch(function () {}).then(function () {
      return auth.signInWithEmailAndPassword(email, password);
    });
  };

  IC.createAccount = function (name, email, password) {
    var auth = IC.getAuth();
    if (!auth) return Promise.reject(new Error("Create account isn’t available in this browser."));
    return auth.createUserWithEmailAndPassword(email, password).then(function (cred) {
      if (cred.user && name) return cred.user.updateProfile({ displayName: name }).then(function () { return cred; });
      return cred;
    });
  };

  IC.sendPasswordReset = function (email) {
    var auth = IC.getAuth();
    if (!auth) return Promise.reject(new Error("Reset isn’t available in this browser."));
    return auth.sendPasswordResetEmail(email);
  };

  IC.continueOffline = function () {
    var s = IC.state.session;
    if (!s || !IC.isApproved(s)) return false;
    IC.setSession(Object.assign({}, s, { mode: "offline" }));
    return true;
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
        var who = userId || (IC.state.session && IC.state.session.memberId);
        if (token && db && IC.getAuth() && IC.getAuth().currentUser && who) {
          db.collection("fcmTokens").doc(token).set({
            userId: who,
            email: IC.state.session && IC.state.session.email || "",
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            platform: navigator.userAgent,
          });
        }
        messaging.onMessage(function (payload) {
          var n = (payload && payload.notification) || {};
          var me = IC.state.session && IC.state.session.memberId;
          var target = (payload && payload.data && payload.data.userId) || "";
          if (target && me && target !== me) return;
          try { new Notification(n.title || "IRONCLAD", { body: n.body || "", icon: IC.asset("brand/logo.png") }); }
          catch (e) { /* ignore */ }
        });
      });
    }).catch(function (err) {
      console.warn("[ironclad] push registration skipped", err);
    });
  };

  IC.listenAuth = function () {
    IC.initFirebase();
    var auth = IC.getAuth();
    if (!auth) return;
    auth.onAuthStateChanged(function (user) {
      if (!user) return;
      IC.applyAuthUser(user).catch(function (err) {
        console.warn("[ironclad] profile failed", err);
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

// ==================== GROKDB v1.3 — NO FREEZES, EVER ====================
window.GrokDB = (function () {
  const eventBus = new EventTarget();
  const pendingDispatches = new Set(); // Prevents double-dispatch

  // Cross-tab sync (still works perfectly)
  if (!window.__grokdb_storage_attached) {
    window.addEventListener('storage', (e) => {
      if (e.key?.startsWith('__grokdb_')) {
        const collName = e.key.slice(9);
        // Use setTimeout to break any potential same-tick recursion
        setTimeout(() => {
          eventBus.dispatchEvent(new CustomEvent(collName, { detail: { fromStorage: true } }));
        }, 0);
      }
    });
    window.__grokdb_storage_attached = true;
  }

  const generateId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < 20; i++) id += chars.charAt(Math.floor(Math.random() * chars.length));
    return id;
  };

  const db = {
    collection(name) {
      const STORAGE_KEY = `__grokdb_${name}`;
      let previousData = {};

      const getData = () => {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
      };

      // THE FIX: safe dispatch that can never freeze
      const dispatchSafe = (change = null) => {
        if (pendingDispatches.has(name)) return; // Already scheduled
        pendingDispatches.add(name);

        setTimeout(() => {
          const newData = getData();
          eventBus.dispatchEvent(new CustomEvent(name, {
            detail: { data: newData, change, isInitial: false }
          }));
          pendingDispatches.delete(name);
        }, 0);
      };

      const saveAndNotify = (newData, change = null) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
        dispatchSafe(change);
      };

      const docFactory = (id) => ({
        id,
        data: () => getData()[id] || null,
        ref: { id, path: `${name}/${id}` }
      });

      const computeDocChanges = (oldData, newData, changeEvent) => {
        const changes = [];

        if (changeEvent?.isInitial) {
          Object.keys(newData).forEach((id, idx) => {
            changes.push({ type: 'added', doc: docFactory(id), newIndex: idx, oldIndex: -1 });
          });
          return changes;
        }

        if (changeEvent?.fromStorage) {
          // Full diff from another tab
          Object.entries(newData).forEach(([id, doc]) => {
            if (!oldData[id]) changes.push({ type: 'added', doc: docFactory(id), newIndex: changes.length, oldIndex: -1 });
            else if (JSON.stringify(oldData[id]) !== JSON.stringify(doc)) {
              changes.push({ type: 'modified', doc: docFactory(id), newIndex: changes.length, oldIndex: Object.keys(oldData).indexOf(id) });
            }
          });
          Object.keys(oldData).forEach(id => {
            if (!newData[id]) changes.push({ type: 'removed', doc: docFactory(id), newIndex: -1, oldIndex: Object.keys(oldData).indexOf(id) });
          });
        }
        else if (changeEvent?.change) {
          const { type, doc } = changeEvent.change;
          const docObj = docFactory(doc.id);
          changes.push({
            type,
            doc: docObj,
            newIndex: type !== 'removed' ? Object.keys(newData).indexOf(doc.id) : -1,
            oldIndex: type === 'removed' ? Object.keys(oldData).indexOf(doc.id) : -1
          });
        }

        return changes;
      };

      const collectionRef = {
        doc(id) {
          const docId = id || generateId();
          return {
            id: docId,
            set(data, { merge } = {}) {
              const current = getData();
              const ts = new Date().toISOString();
              const wasNew = !current[docId];
              current[docId] = merge
                ? { ...(current[docId] || {}), ...data, _updatedAt: ts }
                : { ...data, _createdAt: ts, _updatedAt: ts };
              saveAndNotify(current, { type: wasNew ? 'added' : 'modified', doc: { id: docId, ...current[docId] } });
              return Promise.resolve(this);
            },
            update(data) {
              const current = getData();
              if (!current[docId]) throw new Error("Document does not exist");
              current[docId] = { ...current[docId], ...data, _updatedAt: new Date().toISOString() };
              saveAndNotify(current, { type: 'modified', doc: { id: docId, ...current[docId] } });
              return Promise.resolve();
            },
            delete() {
              const current = getData();
              const deleted = current[docId];
              if (deleted) {
                delete current[docId];
                saveAndNotify(current, { type: 'removed', doc: { id: docId, ...deleted } });
              }
              return Promise.resolve();
            },
            get() {
              const data = getData()[docId];
              return Promise.resolve({ exists: () => !!data, data: () => data, id: docId });
            }
          };
        },

        add(data) { return this.doc().set(data); },

        onSnapshot(callback) {
          const handler = (e) => {
            const newData = getData();
            const changes = computeDocChanges(previousData, newData, e.detail);
            previousData = { ...newData };

            const snapshot = {
              docs: Object.entries(newData).map(([id, d]) => ({ id, data: () => d, ref: collectionRef.doc(id) })),
              empty: Object.keys(newData).length === 0,
              docChanges: () => changes,
              forEach: cb => snapshot.docs.forEach(d => cb(d))
            };

            callback(snapshot);
          };

          // Initial call — emits "added" for everything
          previousData = {};
          handler({ detail: { isInitial: true, data: getData() } });

          eventBus.addEventListener(name, handler);
          return () => eventBus.removeEventListener(name, handler);
        },

        where(field, op, value) {
          return {
            onSnapshot(cb) {
              return collectionRef.onSnapshot(snap => {
                const filtered = snap.docs.filter(d => {
                  const val = d.data()[field];
                  switch (op) {
                    case '==': return val === value;
                    case '!=': return val !== value;
                    case '<': return val < value;
                    case '<=': return val <= value;
                    case '>': return val > value;
                    case '>=': return val >= value;
                    default: return false;
                  }
                });
                cb({
                  docs: filtered,
                  empty: filtered.length === 0,
                  docChanges: () => snap.docChanges().filter(c => filtered.some(d => d.id === c.doc.id))
                });
              });
            }
          };
        }
      };

      return collectionRef;
    }
  };

  return db;
})();


// BONUS: One-liner to switch to real Firebase later
// const db = window.location.hostname === 'localhost' ? GrokDB : firebase.firestore();
import React, { useState, useEffect, useMemo } from "react";
import { Search, Plus, LogOut, MapPin, User, Trash2, Phone, ArrowLeft, Package } from "lucide-react";
import { supabase } from "./supabaseClient";

const CATEGORIES = ["Náradie", "Záhrada", "Šport", "Domácnosť", "Elektronika", "Iné"];

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16);
}

export default function KolnaApp() {
  const [view, setView] = useState("browse");
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [contactRevealed, setContactRevealed] = useState({});

  const [filterLocation, setFilterLocation] = useState("");
  const [filterCategory, setFilterCategory] = useState("Všetko");
  const [searchTerm, setSearchTerm] = useState("");

  const [authMode, setAuthMode] = useState("login");
  const [authError, setAuthError] = useState("");
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [regForm, setRegForm] = useState({ username: "", password: "", location: "", contact: "" });

  const [itemForm, setItemForm] = useState({ name: "", category: CATEGORIES[0], description: "", location: "", contact: "" });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [{ data: userRows, error: userErr }, { data: itemRows, error: itemErr }] = await Promise.all([
        supabase.from("users").select("*"),
        supabase.from("items").select("*").order("created_at", { ascending: false }),
      ]);
      if (userErr) console.error(userErr);
      if (itemErr) console.error(itemErr);
      setUsers(userRows || []);
      setItems(itemRows || []);
    } catch (e) {
      console.error("Chyba pri načítaní", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setAuthError("");
    const { username, password, location, contact } = regForm;
    if (!username.trim() || !password || !location.trim() || !contact.trim()) {
      setAuthError("Vyplň prosím všetky polia.");
      return;
    }
    const cleanUsername = username.trim();
    const exists = users.find((u) => u.username.toLowerCase() === cleanUsername.toLowerCase());
    if (exists) {
      setAuthError("Toto meno už niekto používa. Skús iné.");
      return;
    }
    const newUser = {
      username: cleanUsername,
      password_hash: simpleHash(password),
      location: location.trim(),
      contact: contact.trim(),
    };
    const { data, error } = await supabase.from("users").insert(newUser).select().single();
    if (error) {
      setAuthError("Registrácia sa nepodarila. Skús to znova.");
      return;
    }
    setUsers((prev) => [...prev, data]);
    setCurrentUser(data);
    setItemForm((f) => ({ ...f, location: data.location, contact: data.contact }));
    setRegForm({ username: "", password: "", location: "", contact: "" });
    setView("browse");
  }

  function handleLogin(e) {
    e.preventDefault();
    setAuthError("");
    const { username, password } = loginForm;
    const user = users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
    if (!user || user.password_hash !== simpleHash(password)) {
      setAuthError("Nesprávne meno alebo heslo.");
      return;
    }
    setCurrentUser(user);
    setItemForm((f) => ({ ...f, location: user.location, contact: user.contact }));
    setLoginForm({ username: "", password: "" });
    setView("browse");
  }

  function handleLogout() {
    setCurrentUser(null);
    setContactRevealed({});
    setView("browse");
  }

  async function handleAddItem(e) {
    e.preventDefault();
    setFormError("");
    if (!currentUser) return;
    const { name, category, description, location, contact } = itemForm;
    if (!name.trim() || !location.trim() || !contact.trim()) {
      setFormError("Vyplň názov, lokalitu a kontakt.");
      return;
    }
    setSaving(true);
    const newItem = {
      owner_username: currentUser.username,
      name: name.trim(),
      category,
      description: description.trim(),
      location: location.trim(),
      contact: contact.trim(),
    };
    const { data, error } = await supabase.from("items").insert(newItem).select().single();
    setSaving(false);
    if (error) {
      setFormError("Nepodarilo sa uložiť vec. Skús to znova.");
      return;
    }
    setItems((prev) => [data, ...prev]);
    setItemForm({ name: "", category: CATEGORIES[0], description: "", location: currentUser.location, contact: currentUser.contact });
    setView("mine");
  }

  async function handleDeleteItem(id) {
    const { error } = await supabase.from("items").delete().eq("id", id);
    if (!error) {
      setItems((prev) => prev.filter((it) => it.id !== id));
    }
  }

  const filteredItems = useMemo(() => {
    return items
      .filter((it) => (filterCategory === "Všetko" ? true : it.category === filterCategory))
      .filter((it) => (filterLocation.trim() ? it.location.toLowerCase().includes(filterLocation.trim().toLowerCase()) : true))
      .filter((it) => {
        if (!searchTerm.trim()) return true;
        const t = searchTerm.trim().toLowerCase();
        return it.name.toLowerCase().includes(t) || (it.description || "").toLowerCase().includes(t);
      });
  }, [items, filterCategory, filterLocation, searchTerm]);

  const myItems = useMemo(
    () => items.filter((it) => currentUser && it.owner_username === currentUser.username),
    [items, currentUser]
  );

  const selectedItem = selectedItemId ? items.find((it) => it.id === selectedItemId) : null;

  return (
    <div style={styles.app}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Work+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        button { cursor: pointer; font-family: inherit; }
        input, select, textarea { font-family: inherit; }
        ::placeholder { color: #8B8477; }
        button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible {
          outline: 2px solid #D9A441; outline-offset: 2px;
        }
        @media (max-width: 640px) {
          .kolna-grid { grid-template-columns: 1fr !important; }
          .kolna-filters { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <div style={styles.wrap}>
        <Header currentUser={currentUser} view={view} setView={setView} onLogout={handleLogout} />

        {loading ? (
          <div style={styles.loadingBox}>Načítavam kôlňu…</div>
        ) : (
          <>
            {view === "browse" && !selectedItemId && (
              <BrowseView
                items={filteredItems}
                filterLocation={filterLocation}
                setFilterLocation={setFilterLocation}
                filterCategory={filterCategory}
                setFilterCategory={setFilterCategory}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                onSelect={(id) => setSelectedItemId(id)}
              />
            )}

            {selectedItemId && selectedItem && (
              <ItemDetail
                item={selectedItem}
                onBack={() => setSelectedItemId(null)}
                currentUser={currentUser}
                revealed={!!contactRevealed[selectedItemId]}
                onReveal={() => setContactRevealed((p) => ({ ...p, [selectedItemId]: true }))}
                onLoginNeeded={() => {
                  setSelectedItemId(null);
                  setView("login");
                }}
              />
            )}

            {view === "login" && !selectedItemId && (
              <AuthView
                mode={authMode}
                setMode={setAuthMode}
                authError={authError}
                loginForm={loginForm}
                setLoginForm={setLoginForm}
                regForm={regForm}
                setRegForm={setRegForm}
                onLogin={handleLogin}
                onRegister={handleRegister}
              />
            )}

            {view === "add" && !selectedItemId && currentUser && (
              <AddItemForm itemForm={itemForm} setItemForm={setItemForm} formError={formError} saving={saving} onSubmit={handleAddItem} />
            )}

            {view === "mine" && !selectedItemId && currentUser && (
              <MyItemsView items={myItems} onDelete={handleDeleteItem} onAdd={() => setView("add")} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Header({ currentUser, view, setView, onLogout }) {
  return (
    <div style={styles.header}>
      <div style={styles.brand} onClick={() => setView("browse")}>
        <div style={styles.brandIcon}>
          <Package size={20} color="#EDE7DC" />
        </div>
        <div>
          <div style={styles.brandName}>KÔLŇA</div>
          <div style={styles.brandTag}>susedská výpožičná skladovka</div>
        </div>
      </div>
      <div style={styles.nav}>
        <NavBtn active={view === "browse"} onClick={() => setView("browse")}>
          <Search size={15} style={{ marginRight: 6 }} /> Prehľadávať
        </NavBtn>
        {currentUser ? (
          <>
            <NavBtn active={view === "add"} onClick={() => setView("add")}>
              <Plus size={15} style={{ marginRight: 6 }} /> Ponúknuť vec
            </NavBtn>
            <NavBtn active={view === "mine"} onClick={() => setView("mine")}>
              <User size={15} style={{ marginRight: 6 }} /> Moje veci
            </NavBtn>
            <NavBtn onClick={onLogout}>
              <LogOut size={15} style={{ marginRight: 6 }} /> Odhlásiť ({currentUser.username})
            </NavBtn>
          </>
        ) : (
          <NavBtn active={view === "login"} onClick={() => setView("login")}>
            <User size={15} style={{ marginRight: 6 }} /> Prihlásiť / Registrovať
          </NavBtn>
        )}
      </div>
    </div>
  );
}

function NavBtn({ children, onClick, active }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.navBtn,
        background: active ? "#D9A441" : "transparent",
        color: active ? "#23201B" : "#EDE7DC",
        borderColor: active ? "#D9A441" : "#4A5560",
      }}
    >
      {children}
    </button>
  );
}

function BrowseView({ items, filterLocation, setFilterLocation, filterCategory, setFilterCategory, searchTerm, setSearchTerm, onSelect }) {
  return (
    <div>
      <div className="kolna-filters" style={styles.filters}>
        <div style={styles.filterField}>
          <label style={styles.label}>Hľadať</label>
          <input style={styles.input} placeholder="napr. rebrík, kolobežka..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div style={styles.filterField}>
          <label style={styles.label}>Lokalita</label>
          <input style={styles.input} placeholder="mesto alebo štvrť" value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)} />
        </div>
        <div style={styles.filterField}>
          <label style={styles.label}>Kategória</label>
          <select style={styles.input} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option>Všetko</option>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {items.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 20, marginBottom: 6 }}>Kôlňa je zatiaľ prázdna</div>
          <div style={{ color: "#5B564C" }}>Nikto vo vybranej oblasti zatiaľ nič neponúkol. Buď prvý, kto niečo pridá.</div>
        </div>
      ) : (
        <div className="kolna-grid" style={styles.grid}>
          {items.map((it) => (
            <ItemCard key={it.id} item={it} onClick={() => onSelect(it.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function ItemCard({ item, onClick }) {
  return (
    <div style={styles.card} onClick={onClick}>
      <div style={styles.cardHole} />
      <div style={styles.cardCategory}>KAT: {item.category}</div>
      <div style={styles.cardName}>{item.name}</div>
      <div style={styles.cardDesc}>{item.description ? item.description.slice(0, 90) : "Bez popisu."}</div>
      <div style={styles.cardMeta}>
        <MapPin size={13} style={{ marginRight: 4 }} /> {item.location}
      </div>
    </div>
  );
}

function ItemDetail({ item, onBack, currentUser, revealed, onReveal, onLoginNeeded }) {
  return (
    <div style={styles.detailCard}>
      <button style={styles.backBtn} onClick={onBack}>
        <ArrowLeft size={15} style={{ marginRight: 6 }} /> Späť na zoznam
      </button>
      <div style={styles.cardCategory}>KAT: {item.category}</div>
      <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 28, margin: "8px 0" }}>{item.name}</div>
      <div style={{ color: "#5B564C", marginBottom: 14 }}>
        <MapPin size={14} style={{ marginRight: 4, verticalAlign: -2 }} /> {item.location}
      </div>
      <div style={{ marginBottom: 20, lineHeight: 1.6 }}>{item.description || "Majiteľ nepridal žiadny popis."}</div>
      <div style={styles.contactBox}>
        {!currentUser ? (
          <>
            <div style={{ marginBottom: 10 }}>Aby si videl kontakt na majiteľa, musíš byť prihlásený.</div>
            <button style={styles.primaryBtn} onClick={onLoginNeeded}>
              Prihlásiť sa
            </button>
          </>
        ) : revealed ? (
          <div style={{ display: "flex", alignItems: "center" }}>
            <Phone size={16} style={{ marginRight: 8 }} />
            Kontakt: <strong style={{ marginLeft: 6 }}>{item.contact}</strong>
          </div>
        ) : (
          <button style={styles.primaryBtn} onClick={onReveal}>
            Zobraziť kontakt
          </button>
        )}
      </div>
    </div>
  );
}

function AuthView({ mode, setMode, authError, loginForm, setLoginForm, regForm, setRegForm, onLogin, onRegister }) {
  return (
    <div style={styles.authCard}>
      <div style={styles.authTabs}>
        <button
          style={{ ...styles.authTab, borderColor: mode === "login" ? "#D9A441" : "transparent", color: mode === "login" ? "#23201B" : "#5B564C" }}
          onClick={() => setMode("login")}
        >
          Prihlásenie
        </button>
        <button
          style={{ ...styles.authTab, borderColor: mode === "register" ? "#D9A441" : "transparent", color: mode === "register" ? "#23201B" : "#5B564C" }}
          onClick={() => setMode("register")}
        >
          Registrácia
        </button>
      </div>

      {authError && <div style={styles.errorBox}>{authError}</div>}

      {mode === "login" ? (
        <form onSubmit={onLogin}>
          <div style={styles.filterField}>
            <label style={styles.label}>Prezývka</label>
            <input style={styles.input} value={loginForm.username} onChange={(e) => setLoginForm((f) => ({ ...f, username: e.target.value }))} />
          </div>
          <div style={styles.filterField}>
            <label style={styles.label}>Heslo</label>
            <input type="password" style={styles.input} value={loginForm.password} onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))} />
          </div>
          <button type="submit" style={styles.primaryBtnWide}>
            Prihlásiť sa
          </button>
        </form>
      ) : (
        <form onSubmit={onRegister}>
          <div style={styles.filterField}>
            <label style={styles.label}>Prezývka</label>
            <input style={styles.input} value={regForm.username} onChange={(e) => setRegForm((f) => ({ ...f, username: e.target.value }))} />
          </div>
          <div style={styles.filterField}>
            <label style={styles.label}>Heslo</label>
            <input type="password" style={styles.input} value={regForm.password} onChange={(e) => setRegForm((f) => ({ ...f, password: e.target.value }))} />
          </div>
          <div style={styles.filterField}>
            <label style={styles.label}>Mesto / štvrť</label>
            <input style={styles.input} placeholder="napr. Prievidza - Necpaly" value={regForm.location} onChange={(e) => setRegForm((f) => ({ ...f, location: e.target.value }))} />
          </div>
          <div style={styles.filterField}>
            <label style={styles.label}>Kontakt (telefón alebo email)</label>
            <input style={styles.input} value={regForm.contact} onChange={(e) => setRegForm((f) => ({ ...f, contact: e.target.value }))} />
          </div>
          <button type="submit" style={styles.primaryBtnWide}>
            Vytvoriť účet
          </button>
        </form>
      )}
    </div>
  );
}

function AddItemForm({ itemForm, setItemForm, formError, saving, onSubmit }) {
  return (
    <div style={styles.authCard}>
      <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 22, marginBottom: 16 }}>Ponúkni vec na požičanie</div>
      {formError && <div style={styles.errorBox}>{formError}</div>}
      <form onSubmit={onSubmit}>
        <div style={styles.filterField}>
          <label style={styles.label}>Názov veci</label>
          <input style={styles.input} placeholder="napr. Vŕtačka Bosch" value={itemForm.name} onChange={(e) => setItemForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div style={styles.filterField}>
          <label style={styles.label}>Kategória</label>
          <select style={styles.input} value={itemForm.category} onChange={(e) => setItemForm((f) => ({ ...f, category: e.target.value }))}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div style={styles.filterField}>
          <label style={styles.label}>Popis (nepovinné)</label>
          <textarea style={{ ...styles.input, minHeight: 80, resize: "vertical" }} value={itemForm.description} onChange={(e) => setItemForm((f) => ({ ...f, description: e.target.value }))} />
        </div>
        <div style={styles.filterField}>
          <label style={styles.label}>Lokalita</label>
          <input style={styles.input} value={itemForm.location} onChange={(e) => setItemForm((f) => ({ ...f, location: e.target.value }))} />
        </div>
        <div style={styles.filterField}>
          <label style={styles.label}>Kontakt</label>
          <input style={styles.input} value={itemForm.contact} onChange={(e) => setItemForm((f) => ({ ...f, contact: e.target.value }))} />
        </div>
        <button type="submit" style={styles.primaryBtnWide} disabled={saving}>
          {saving ? "Ukladám…" : "Pridať do kôlne"}
        </button>
      </form>
    </div>
  );
}

function MyItemsView({ items, onDelete, onAdd }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 22 }}>Moje ponúknuté veci</div>
        <button style={styles.primaryBtn} onClick={onAdd}>
          <Plus size={15} style={{ marginRight: 6, verticalAlign: -2 }} /> Pridať vec
        </button>
      </div>
      {items.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={{ color: "#5B564C" }}>Zatiaľ si nič neponúkol. Skús pridať prvú vec.</div>
        </div>
      ) : (
        <div className="kolna-grid" style={styles.grid}>
          {items.map((it) => (
            <div key={it.id} style={styles.card}>
              <div style={styles.cardHole} />
              <div style={styles.cardCategory}>KAT: {it.category}</div>
              <div style={styles.cardName}>{it.name}</div>
              <div style={styles.cardDesc}>{it.description ? it.description.slice(0, 90) : "Bez popisu."}</div>
              <div style={styles.cardMeta}>
                <MapPin size={13} style={{ marginRight: 4 }} /> {it.location}
              </div>
              <button
                style={styles.deleteBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(it.id);
                }}
              >
                <Trash2 size={14} style={{ marginRight: 6 }} /> Odstrániť
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  app: { width: "100%", background: "#EDE7DC", minHeight: "100vh", fontFamily: "'Work Sans', sans-serif", color: "#23201B" },
  wrap: { maxWidth: 960, margin: "0 auto", padding: "0 16px 40px" },
  header: {
    background: "#2A3F4E",
    margin: "0 0 24px",
    padding: "18px 24px",
    display: "flex",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "space-between",
    alignItems: "center",
  },
  brand: { display: "flex", alignItems: "center", gap: 10, cursor: "pointer" },
  brandIcon: { background: "#3B5568", padding: 8, borderRadius: 6, display: "flex" },
  brandName: { fontFamily: "'Oswald', sans-serif", fontSize: 20, letterSpacing: 1, color: "#EDE7DC", fontWeight: 600 },
  brandTag: { fontSize: 11, color: "#B7C2C9", fontFamily: "'IBM Plex Mono', monospace" },
  nav: { display: "flex", gap: 8, flexWrap: "wrap" },
  navBtn: {
    border: "1px solid",
    padding: "8px 12px",
    borderRadius: 4,
    fontSize: 13,
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    transition: "background 0.15s",
  },
  loadingBox: { textAlign: "center", padding: 60, color: "#5B564C" },
  filters: { display: "grid", gridTemplateColumns: "2fr 1.5fr 1.5fr", gap: 12, marginBottom: 24, padding: "0 16px" },
  filterField: { marginBottom: 14 },
  label: { display: "block", fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", color: "#5B564C", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  input: {
    width: "100%",
    padding: "9px 12px",
    borderRadius: 4,
    border: "1px solid #D8CFBC",
    background: "#FFFFFF",
    fontSize: 14,
    color: "#23201B",
  },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16, padding: "0 16px" },
  card: {
    background: "#FFFFFF",
    border: "1px dashed #D8CFBC",
    borderRadius: 8,
    padding: "18px 16px 16px",
    position: "relative",
    cursor: "pointer",
  },
  cardHole: {
    position: "absolute",
    top: -7,
    left: "50%",
    transform: "translateX(-50%)",
    width: 14,
    height: 14,
    borderRadius: "50%",
    background: "#EDE7DC",
    border: "2px solid #D8CFBC",
  },
  cardCategory: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#B9832A", marginBottom: 6, letterSpacing: 0.5 },
  cardName: { fontFamily: "'Oswald', sans-serif", fontSize: 18, fontWeight: 500, marginBottom: 6 },
  cardDesc: { fontSize: 13, color: "#5B564C", marginBottom: 10, lineHeight: 1.4 },
  cardMeta: { fontSize: 12, color: "#3B5568", display: "flex", alignItems: "center" },
  emptyState: { textAlign: "center", padding: "60px 20px", margin: "0 16px", border: "1px dashed #D8CFBC", borderRadius: 8, background: "#F6F2E9" },
  detailCard: { background: "#FFFFFF", border: "1px solid #D8CFBC", borderRadius: 8, padding: 24, maxWidth: 560, margin: "0 16px" },
  backBtn: { display: "flex", alignItems: "center", background: "transparent", border: "none", color: "#3B5568", fontSize: 13, marginBottom: 12, padding: 0 },
  contactBox: { background: "#F6F2E9", border: "1px solid #D8CFBC", borderRadius: 6, padding: 16, marginTop: 8 },
  primaryBtn: {
    background: "#D9A441",
    color: "#23201B",
    border: "none",
    padding: "9px 16px",
    borderRadius: 4,
    fontSize: 13,
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
  },
  primaryBtnWide: {
    background: "#D9A441",
    color: "#23201B",
    border: "none",
    padding: "11px 16px",
    borderRadius: 4,
    fontSize: 14,
    fontWeight: 600,
    width: "100%",
    marginTop: 4,
  },
  deleteBtn: {
    marginTop: 10,
    background: "transparent",
    border: "1px solid #B54A3C",
    color: "#B54A3C",
    padding: "6px 10px",
    borderRadius: 4,
    fontSize: 12,
    display: "flex",
    alignItems: "center",
  },
  authCard: { background: "#FFFFFF", border: "1px solid #D8CFBC", borderRadius: 8, padding: 24, maxWidth: 420, margin: "0 16px" },
  authTabs: { display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #D8CFBC" },
  authTab: { flex: 1, padding: "10px 0", background: "transparent", border: "none", borderBottom: "3px solid", fontSize: 14, fontWeight: 500 },
  errorBox: { background: "#FAECE7", color: "#993C1D", padding: "10px 12px", borderRadius: 4, fontSize: 13, marginBottom: 16 },
};

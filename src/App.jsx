import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Search, Plus, LogOut, MapPin, User, Trash2, ArrowLeft,
  HeartHandshake, Wrench, Sprout, Dumbbell, Home, Cpu, Package,
  Mail, Phone, Facebook, Instagram, Camera, X, Upload,
  MessageCircle, Send, Euro, HelpCircle,
} from "lucide-react";
import { supabase } from "./supabaseClient";

const CATEGORY_META = [
  { key: "Náradie", icon: Wrench },
  { key: "Záhrada", icon: Sprout },
  { key: "Šport", icon: Dumbbell },
  { key: "Domácnosť", icon: Home },
  { key: "Elektronika", icon: Cpu },
  { key: "Iné", icon: Package },
];
const CATEGORIES = CATEGORY_META.map((c) => c.key);

const CONTACT_TYPES = [
  { key: "email", label: "Email", icon: Mail },
  { key: "telefón", label: "Telefón", icon: Phone },
  { key: "facebook", label: "Facebook", icon: Facebook },
  { key: "instagram", label: "Instagram", icon: Instagram },
];

const PRICE_UNITS = [
  { key: "zadarmo", label: "Zadarmo" },
  { key: "hodina", label: "/ hodina" },
  { key: "den", label: "/ deň" },
  { key: "tyzden", label: "/ týždeň" },
];

function priceLabel(item) {
  if (!item.price_unit || item.price_unit === "zadarmo") return "Zadarmo";
  const unit = PRICE_UNITS.find((u) => u.key === item.price_unit);
  return `${item.price_amount || 0} € ${unit ? unit.label : ""}`;
}

function contactIcon(type) {
  const found = CONTACT_TYPES.find((c) => c.key === type);
  return found ? found.icon : Mail;
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16);
}

function categoryIcon(cat) {
  const found = CATEGORY_META.find((c) => c.key === cat);
  return found ? found.icon : Package;
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
  const [regForm, setRegForm] = useState({ username: "", password: "", location: "", contacts: [] });

  const [itemForm, setItemForm] = useState({ name: "", category: CATEGORIES[0], description: "", location: "", contacts: [], price_amount: "", price_unit: "zadarmo" });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [requests, setRequests] = useState([]);
  const [requestForm, setRequestForm] = useState({ title: "", description: "", category: CATEGORIES[0], location: "", contacts: [] });
  const [requestError, setRequestError] = useState("");
  const [requestSaving, setRequestSaving] = useState(false);

  const [messages, setMessages] = useState([]);
  const [chatWith, setChatWith] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [
        { data: userRows, error: userErr },
        { data: itemRows, error: itemErr },
        { data: requestRows, error: requestErr },
        { data: messageRows, error: messageErr },
      ] = await Promise.all([
        supabase.from("users").select("*"),
        supabase.from("items").select("*").order("created_at", { ascending: false }),
        supabase.from("requests").select("*").order("created_at", { ascending: false }),
        supabase.from("messages").select("*").order("created_at", { ascending: true }),
      ]);
      if (userErr) console.error(userErr);
      if (itemErr) console.error(itemErr);
      if (requestErr) console.error(requestErr);
      if (messageErr) console.error(messageErr);
      setUsers(userRows || []);
      setItems(itemRows || []);
      setRequests(requestRows || []);
      setMessages(messageRows || []);
    } catch (e) {
      console.error("Chyba pri načítaní", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setAuthError("");
    const { username, password, location, contacts } = regForm;
    if (!username.trim() || !password || !location.trim() || contacts.length === 0) {
      setAuthError("Vyplň meno, heslo, lokalitu a aspoň jeden kontakt.");
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
      contacts,
    };
    const { data, error } = await supabase.from("users").insert(newUser).select().single();
    if (error) {
      setAuthError("Registrácia sa nepodarila. Skús to znova.");
      return;
    }
    setUsers((prev) => [...prev, data]);
    setCurrentUser(data);
    setItemForm((f) => ({ ...f, location: data.location, contacts: data.contacts || [] }));
    setRegForm({ username: "", password: "", location: "", contacts: [] });
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
    setItemForm((f) => ({ ...f, location: user.location, contacts: user.contacts || [] }));
    setLoginForm({ username: "", password: "" });
    setView("browse");
  }

  function handleLogout() {
    setCurrentUser(null);
    setContactRevealed({});
    setView("browse");
  }

  function handleImagePick(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleAddItem(e) {
    e.preventDefault();
    setFormError("");
    if (!currentUser) return;
    const { name, category, description, location, contacts } = itemForm;
    if (!name.trim() || !location.trim() || contacts.length === 0) {
      setFormError("Vyplň názov, lokalitu a aspoň jeden kontakt.");
      return;
    }
    setSaving(true);

    let imageUrl = null;
    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("item-images").upload(fileName, imageFile);
      if (!uploadError) {
        const { data: pub } = supabase.storage.from("item-images").getPublicUrl(fileName);
        imageUrl = pub.publicUrl;
      }
    }

    const newItem = {
      owner_username: currentUser.username,
      name: name.trim(),
      category,
      description: description.trim(),
      location: location.trim(),
      contacts,
      image_url: imageUrl,
      price_amount: itemForm.price_unit === "zadarmo" ? null : parseFloat(itemForm.price_amount) || 0,
      price_unit: itemForm.price_unit,
    };
    const { data, error } = await supabase.from("items").insert(newItem).select().single();
    setSaving(false);
    if (error) {
      setFormError("Nepodarilo sa uložiť vec. Skús to znova.");
      return;
    }
    setItems((prev) => [data, ...prev]);
    setItemForm({ name: "", category: CATEGORIES[0], description: "", location: currentUser.location, contacts: currentUser.contacts || [], price_amount: "", price_unit: "zadarmo" });
    setImageFile(null);
    setImagePreview(null);
    setView("mine");
  }

  async function handleDeleteItem(id) {
    const { error } = await supabase.from("items").delete().eq("id", id);
    if (!error) {
      setItems((prev) => prev.filter((it) => it.id !== id));
    }
  }

  async function handleAddRequest(e) {
    e.preventDefault();
    setRequestError("");
    if (!currentUser) return;
    const { title, description, category, location, contacts } = requestForm;
    if (!title.trim() || !location.trim() || contacts.length === 0) {
      setRequestError("Vyplň názov, lokalitu a aspoň jeden kontakt.");
      return;
    }
    setRequestSaving(true);
    const newRequest = {
      requester_username: currentUser.username,
      title: title.trim(),
      description: description.trim(),
      category,
      location: location.trim(),
      contacts,
    };
    const { data, error } = await supabase.from("requests").insert(newRequest).select().single();
    setRequestSaving(false);
    if (error) {
      setRequestError("Nepodarilo sa uložiť dopyt. Skús to znova.");
      return;
    }
    setRequests((prev) => [data, ...prev]);
    setRequestForm({ title: "", description: "", category: CATEGORIES[0], location: currentUser.location, contacts: currentUser.contacts || [] });
    setView("browse");
  }

  async function handleDeleteRequest(id) {
    const { error } = await supabase.from("requests").delete().eq("id", id);
    if (!error) {
      setRequests((prev) => prev.filter((r) => r.id !== id));
    }
  }

  async function handleSendMessage() {
    if (!currentUser || !chatWith || !chatInput.trim()) return;
    setChatSending(true);
    const newMessage = {
      item_id: chatWith.itemId,
      item_name: chatWith.itemName,
      from_username: currentUser.username,
      to_username: chatWith.otherUsername,
      content: chatInput.trim(),
    };
    const { data, error } = await supabase.from("messages").insert(newMessage).select().single();
    setChatSending(false);
    if (!error) {
      setMessages((prev) => [...prev, data]);
      setChatInput("");
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

  const myConversations = useMemo(() => {
    if (!currentUser) return [];
    const map = new Map();
    messages
      .filter((m) => m.from_username === currentUser.username || m.to_username === currentUser.username)
      .forEach((m) => {
        const otherUser = m.from_username === currentUser.username ? m.to_username : m.from_username;
        const key = `${m.item_id}__${otherUser}`;
        const existing = map.get(key);
        if (!existing || new Date(m.created_at) > new Date(existing.created_at)) {
          map.set(key, { itemId: m.item_id, itemName: m.item_name, otherUsername: otherUser, content: m.content, created_at: m.created_at });}
      });
    return Array.from(map.values()).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [messages, currentUser]);

  const chatMessages = useMemo(() => {
    if (!chatWith || !currentUser) return [];
    return messages.filter(
      (m) =>
        m.item_id === chatWith.itemId &&
        ((m.from_username === currentUser.username && m.to_username === chatWith.otherUsername) ||
          (m.to_username === currentUser.username && m.from_username === chatWith.otherUsername))
    );
  }, [messages, chatWith, currentUser]);

  return (
    <div style={styles.app}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        button { cursor: pointer; font-family: inherit; }
        input, select, textarea { font-family: inherit; }
        ::placeholder { color: #B3A99B; }
        button:focus-visible, input:focus-visible, textarea:focus-visible {
          outline: 2px solid #D97757; outline-offset: 2px;
        }
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .kolna-card { animation: fadeSlideUp 0.45s ease both; transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .kolna-card:hover { transform: translateY(-4px); box-shadow: 0 10px 24px rgba(191, 95, 66, 0.14); }
        .kolna-logo-icon { transition: transform 0.3s ease; }
        .kolna-brand:hover .kolna-logo-icon { transform: rotate(-8deg) scale(1.06); }
        .kolna-catblock { transition: all 0.15s ease; }
        .kolna-catblock:hover { transform: translateY(-2px); }
        .kolna-fade { animation: fadeIn 0.5s ease both; }
        .kolna-btn { transition: transform 0.12s ease, background 0.15s ease, opacity 0.15s ease; }
        .kolna-btn:active { transform: scale(0.97); }
        @media (max-width: 640px) {
          .kolna-grid { grid-template-columns: 1fr !important; }
          .kolna-filters { grid-template-columns: 1fr !important; }
          .kolna-catgrid { grid-template-columns: repeat(3, 1fr) !important; }
        }
      `}</style>
      <div style={styles.wrap}>
        <Header currentUser={currentUser} view={view} setView={setView} onLogout={handleLogout} conversationCount={myConversations.length} />

        {loading ? (
          <div style={styles.loadingBox}>Načítavam kôlňu…</div>
        ) : chatWith ? (
          <ChatThread
            chatWith={chatWith}
            messages={chatMessages}
            currentUser={currentUser}
            chatInput={chatInput}
            setChatInput={setChatInput}
            onSend={handleSendMessage}
            sending={chatSending}
            onBack={() => setChatWith(null)}
          />
        ) : (
          <>
            {view === "browse" && !selectedItemId && (
              <BrowseView
                items={filteredItems}
                requests={requests}
                filterLocation={filterLocation}
                setFilterLocation={setFilterLocation}
                filterCategory={filterCategory}
                setFilterCategory={setFilterCategory}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                onSelect={(id) => setSelectedItemId(id)}
                currentUser={currentUser}
                onDeleteRequest={handleDeleteRequest}
                onAddRequestClick={() => (currentUser ? setView("addRequest") : setView("login"))}
              />
            )}

            {view === "messages" && !selectedItemId && currentUser && (
              <MessagesView conversations={myConversations} onOpen={(c) => setChatWith(c)} />
            )}

            {view === "addRequest" && !selectedItemId && currentUser && (
              <AddRequestForm requestForm={requestForm} setRequestForm={setRequestForm} requestError={requestError} saving={requestSaving} onSubmit={handleAddRequest} />
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
                onMessageOwner={() => {
                  setChatWith({ itemId: selectedItem.id, itemName: selectedItem.name, otherUsername: selectedItem.owner_username });
                  setSelectedItemId(null);
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
              <AddItemForm
                itemForm={itemForm}
                setItemForm={setItemForm}
                formError={formError}
                saving={saving}
                onSubmit={handleAddItem}
                imagePreview={imagePreview}
                onImagePick={handleImagePick}
              />
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

function Header({ currentUser, view, setView, onLogout, conversationCount }) {
  return (
    <div style={styles.header}>
      <div className="kolna-brand" style={styles.brand} onClick={() => setView("browse")}>
        <div className="kolna-logo-icon" style={styles.brandIcon}>
          <HeartHandshake size={22} color="#FFFFFF" />
        </div>
        <div>
          <div style={styles.brandName}>Kôlňa</div>
          <div style={styles.brandTag}>Nahraj. Požičaj. Pomôž.</div>
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
            <NavBtn active={view === "messages"} onClick={() => setView("messages")}>
              <MessageCircle size={15} style={{ marginRight: 6 }} /> Správy{conversationCount > 0 ? ` (${conversationCount})` : ""}
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
      className="kolna-btn"
      onClick={onClick}
      style={{
        ...styles.navBtn,
        background: active ? "#D97757" : "transparent",
        color: active ? "#FFFFFF" : "#3A2E24",
        borderColor: active ? "#D97757" : "#E8DDD0",
      }}
    >
      {children}
    </button>
  );
}

function CategoryPicker({ value, onChange, includeAll }) {
  const options = includeAll ? [{ key: "Všetko", icon: Package }, ...CATEGORY_META] : CATEGORY_META;
  return (
    <div className="kolna-catgrid" style={styles.catGrid}>
      {options.map((c) => {
        const Icon = c.icon;
        const active = value === c.key;
        return (
          <button
            key={c.key}
            type="button"
            className="kolna-catblock"
            onClick={() => onChange(c.key)}
            style={{
              ...styles.catBlock,
              borderColor: active ? "#D97757" : "#E8DDD0",
              background: active ? "#FBEDE5" : "#FFFFFF",
            }}
          >
            <Icon size={20} color={active ? "#BF5F42" : "#8A7C6D"} />
            <span style={{ color: active ? "#BF5F42" : "#3A2E24", fontWeight: active ? 600 : 500 }}>{c.key}</span>
          </button>
        );
      })}
    </div>
  );
}

function ContactsEditor({ contacts, onChange }) {
  const [type, setType] = useState(CONTACT_TYPES[0].key);
  const [value, setValue] = useState("");

  function addContact() {
    if (!value.trim()) return;
    onChange([...contacts, { type, value: value.trim() }]);
    setValue("");
  }

  function removeContact(idx) {
    onChange(contacts.filter((_, i) => i !== idx));
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <select style={{ ...styles.input, flex: "0 0 130px" }} value={type} onChange={(e) => setType(e.target.value)}>
          {CONTACT_TYPES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
        <input
          style={{ ...styles.input, flex: 1 }}
          placeholder="napr. jano@email.sk alebo 0900 123 456"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addContact();
            }
          }}
        />
        <button type="button" className="kolna-btn" style={styles.smallBtn} onClick={addContact}>
          Pridať
        </button>
      </div>
      {contacts.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {contacts.map((c, i) => {
            const Icon = contactIcon(c.type);
            return (
              <div key={i} style={styles.chip}>
                <Icon size={13} style={{ marginRight: 5 }} />
                {c.value}
                <button type="button" onClick={() => removeContact(i)} style={styles.chipRemove} aria-label="Odstrániť kontakt">
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BrowseView({ items, requests, filterLocation, setFilterLocation, filterCategory, setFilterCategory, searchTerm, setSearchTerm, onSelect, currentUser, onDeleteRequest, onAddRequestClick }) {
  return (
    <div>
      <div className="kolna-fade" style={styles.hero}>
        <div style={styles.heroTitle}>Nahraj. Požičaj. Pomôž.</div>
        <div style={styles.heroSub}>Zdieľaj veci so susedmi namiesto toho, aby zbytočne ležali v skrini.</div>
      </div>

      <div className="kolna-filters" style={styles.filters}>
        <div style={styles.filterField}>
          <label style={styles.label}>Hľadať</label>
          <input style={styles.input} placeholder="napr. rebrík, kolobežka..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div style={styles.filterField}>
          <label style={styles.label}>Lokalita</label>
          <input style={styles.input} placeholder="mesto alebo štvrť" value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)} />
        </div>
      </div>

      <div style={{ padding: "0 16px", marginBottom: 20 }}>
        <label style={styles.label}>Kategória</label>
        <CategoryPicker value={filterCategory} onChange={setFilterCategory} includeAll />
      </div>

      {items.length === 0 ? (
        <div style={{ ...styles.emptyState, marginBottom: 20 }}>
          <div style={{ color: "#8A7C6D" }}>Nikto vo vybranej oblasti zatiaľ nič neponúkol. Buď prvý, kto niečo pridá.</div>
        </div>
      ) : (
        <div className="kolna-grid" style={{ ...styles.grid, marginBottom: 32 }}>
          {items.map((it, idx) => (
            <ItemCard key={it.id} item={it} onClick={() => onSelect(it.id)} index={idx} />
          ))}
        </div>
      )}

      <RequestBoard requests={requests} currentUser={currentUser} onDelete={onDeleteRequest} onAddClick={onAddRequestClick} />
    </div>
  );
}

function RequestBoard({ requests, currentUser, onDelete, onAddClick }) {
  return (
    <div style={styles.requestBoard}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
            <HelpCircle size={20} color="#BF5F42" /> Hľadám
          </div>
          <div style={{ fontSize: 13, color: "#8A7C6D", marginTop: 2 }}>Susedia, ktorí niečo potrebujú – možno im vieš pomôcť.</div>
        </div>
        <button className="kolna-btn" style={styles.primaryBtn} onClick={onAddClick}>
          <Plus size={15} style={{ marginRight: 6, verticalAlign: -2 }} /> Pridať dopyt
        </button>
      </div>
      {requests.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={{ color: "#8A7C6D" }}>Zatiaľ nikto nič nehľadá. Ak niečo potrebuješ, pridaj dopyt.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {requests.map((r) => {
            const Icon = categoryIcon(r.category);
            return (
              <div key={r.id} style={styles.requestRow}>
                <div style={styles.requestIconBox}>
                  <Icon size={18} color="#BF5F42" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>{r.title}</div>
                  {r.description && <div style={{ fontSize: 13, color: "#8A7C6D", marginTop: 2 }}>{r.description}</div>}
                  <div style={{ fontSize: 12, color: "#A08E7B", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                    <MapPin size={12} /> {r.location} · hľadá {r.requester_username}
                  </div>
                </div>
                {currentUser && currentUser.username === r.requester_username && (
                  <button style={styles.deleteBtn} onClick={() => onDelete(r.id)}>
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ItemCard({ item, onClick, index }) {
  const Icon = categoryIcon(item.category);
  return (
    <div className="kolna-card" style={{ ...styles.card, animationDelay: `${Math.min(index, 8) * 0.05}s` }} onClick={onClick}>
      {item.image_url ? (
        <img src={item.image_url} alt={item.name} style={styles.cardImage} />
      ) : (
        <div style={styles.cardImagePlaceholder}>
          <Icon size={28} color="#D9A98C" />
        </div>
      )}
      <div style={{ padding: "14px 16px 16px" }}>
        <div style={styles.cardCategory}>
          <Icon size={12} style={{ marginRight: 4, verticalAlign: -2 }} /> {item.category}
        </div>
        <div style={styles.cardName}>{item.name}</div>
        <div style={styles.cardDesc}>{item.description ? item.description.slice(0, 90) : "Bez popisu."}</div>
        <div style={{ ...styles.priceBadge, marginBottom: 8 }}>{priceLabel(item)}</div>
        <div style={styles.cardMeta}>
          <MapPin size={13} style={{ marginRight: 4 }} /> {item.location}
        </div>
      </div>
    </div>
  );
}

function ItemDetailPriceRow({ item }) {
  return <div style={{ ...styles.priceBadge, marginBottom: 14 }}>{priceLabel(item)}</div>;
}

function ItemDetail({ item, onBack, currentUser, revealed, onReveal, onLoginNeeded, onMessageOwner }) {
  const Icon = categoryIcon(item.category);
  const contacts = item.contacts || [];
  const isOwnItem = currentUser && currentUser.username === item.owner_username;
  return (
    <div className="kolna-fade" style={styles.detailCard}>
      <button style={styles.backBtn} onClick={onBack}>
        <ArrowLeft size={15} style={{ marginRight: 6 }} /> Späť na zoznam
      </button>
      {item.image_url ? (
        <img src={item.image_url} alt={item.name} style={styles.detailImage} />
      ) : (
        <div style={{ ...styles.cardImagePlaceholder, height: 220, borderRadius: 10, marginBottom: 16 }}>
          <Icon size={40} color="#D9A98C" />
        </div>
      )}
      <div style={styles.cardCategory}>
        <Icon size={12} style={{ marginRight: 4, verticalAlign: -2 }} /> {item.category}
      </div>
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 28, margin: "8px 0", fontWeight: 600 }}>{item.name}</div>
      <div style={{ color: "#8A7C6D", marginBottom: 10, display: "flex", alignItems: "center" }}>
        <MapPin size={14} style={{ marginRight: 4 }} /> {item.location}
      </div>
      <ItemDetailPriceRow item={item} />
      <div style={{ marginBottom: 20, lineHeight: 1.6 }}>{item.description || "Majiteľ nepridal žiadny popis."}</div>
      <div style={styles.contactBox}>
        {!currentUser ? (
          <>
            <div style={{ marginBottom: 10 }}>Aby si videl kontakt na majiteľa, musíš byť prihlásený.</div>
            <button className="kolna-btn" style={styles.primaryBtn} onClick={onLoginNeeded}>
              Prihlásiť sa
            </button>
          </>
        ) : revealed ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {contacts.length === 0 && <span>Majiteľ nepridal kontakt.</span>}
            {contacts.map((c, i) => {
              const CIcon = contactIcon(c.type);
              return (
                <div key={i} style={styles.chip}>
                  <CIcon size={13} style={{ marginRight: 5 }} /> {c.value}
                </div>
              );
            })}
          </div>
        ) : (
          <button className="kolna-btn" style={styles.primaryBtn} onClick={onReveal}>
            Zobraziť kontakt
          </button>
        )}
      </div>
      {currentUser && !isOwnItem && (
        <button className="kolna-btn" style={{ ...styles.primaryBtnWide, marginTop: 12, background: "#3A2E24" }} onClick={onMessageOwner}>
          <MessageCircle size={16} style={{ marginRight: 8, verticalAlign: -3 }} /> Napísať majiteľovi
        </button>
      )}
    </div>
  );
}

function AuthView({ mode, setMode, authError, loginForm, setLoginForm, regForm, setRegForm, onLogin, onRegister }) {
  return (
    <div className="kolna-fade" style={styles.authCard}>
      <div style={styles.authTabs}>
        <button
          style={{ ...styles.authTab, borderColor: mode === "login" ? "#D97757" : "transparent", color: mode === "login" ? "#3A2E24" : "#8A7C6D" }}
          onClick={() => setMode("login")}
        >
          Prihlásenie
        </button>
        <button
          style={{ ...styles.authTab, borderColor: mode === "register" ? "#D97757" : "transparent", color: mode === "register" ? "#3A2E24" : "#8A7C6D" }}
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
          <button type="submit" className="kolna-btn" style={styles.primaryBtnWide}>
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
            <label style={styles.label}>Kontakty</label>
            <ContactsEditor contacts={regForm.contacts} onChange={(c) => setRegForm((f) => ({ ...f, contacts: c }))} />
          </div>
          <button type="submit" className="kolna-btn" style={styles.primaryBtnWide}>
            Vytvoriť účet
          </button>
        </form>
      )}
    </div>
  );
}

function AddItemForm({ itemForm, setItemForm, formError, saving, onSubmit, imagePreview, onImagePick }) {
  const fileInputRef = useRef(null);
  return (
    <div className="kolna-fade" style={styles.authCard}>
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, marginBottom: 16, fontWeight: 600 }}>Ponúkni vec na požičanie</div>
      {formError && <div style={styles.errorBox}>{formError}</div>}
      <form onSubmit={onSubmit}>
        <div style={styles.filterField}>
          <label style={styles.label}>Fotka veci</label>
          <div style={styles.imageUploadBox} onClick={() => fileInputRef.current && fileInputRef.current.click()}>
            {imagePreview ? (
              <img src={imagePreview} alt="Náhľad" style={styles.imageUploadPreview} />
            ) : (
              <div style={{ textAlign: "center", color: "#8A7C6D" }}>
                <Camera size={26} style={{ marginBottom: 6 }} />
                <div style={{ fontSize: 13 }}>Klikni a vyber fotku</div>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={onImagePick} style={{ display: "none" }} />
        </div>
        <div style={styles.filterField}>
          <label style={styles.label}>Názov veci</label>
          <input style={styles.input} placeholder="napr. Vŕtačka Bosch" value={itemForm.name} onChange={(e) => setItemForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div style={styles.filterField}>
          <label style={styles.label}>Kategória</label>
          <CategoryPicker value={itemForm.category} onChange={(c) => setItemForm((f) => ({ ...f, category: c }))} />
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
          <label style={styles.label}>Cena za požičanie</label>
          <div style={{ display: "flex", gap: 8 }}>
            <select
              style={{ ...styles.input, flex: "0 0 140px" }}
              value={itemForm.price_unit}
              onChange={(e) => setItemForm((f) => ({ ...f, price_unit: e.target.value }))}
            >
              {PRICE_UNITS.map((u) => (
                <option key={u.key} value={u.key}>
                  {u.label}
                </option>
              ))}
            </select>
            {itemForm.price_unit !== "zadarmo" && (
              <input
                type="number"
                min="0"
                step="0.5"
                style={{ ...styles.input, flex: 1 }}
                placeholder="suma v €"
                value={itemForm.price_amount}
                onChange={(e) => setItemForm((f) => ({ ...f, price_amount: e.target.value }))}
              />
            )}
          </div>
        </div>
        <div style={styles.filterField}>
          <label style={styles.label}>Kontakty</label>
          <ContactsEditor contacts={itemForm.contacts} onChange={(c) => setItemForm((f) => ({ ...f, contacts: c }))} />
        </div>
        <button type="submit" className="kolna-btn" style={styles.primaryBtnWide} disabled={saving}>
          {saving ? "Ukladám…" : "Pridať do kôlne"}
        </button>
      </form>
    </div>
  );
}

function AddRequestForm({ requestForm, setRequestForm, requestError, saving, onSubmit }) {
  return (
    <div className="kolna-fade" style={styles.authCard}>
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, marginBottom: 16, fontWeight: 600 }}>Pridaj, čo hľadáš</div>
      {requestError && <div style={styles.errorBox}>{requestError}</div>}
      <form onSubmit={onSubmit}>
        <div style={styles.filterField}>
          <label style={styles.label}>Čo hľadáš</label>
          <input style={styles.input} placeholder="napr. Rebrík na víkend" value={requestForm.title} onChange={(e) => setRequestForm((f) => ({ ...f, title: e.target.value }))} />
        </div>
        <div style={styles.filterField}>
          <label style={styles.label}>Kategória</label>
          <CategoryPicker value={requestForm.category} onChange={(c) => setRequestForm((f) => ({ ...f, category: c }))} />
        </div>
        <div style={styles.filterField}>
          <label style={styles.label}>Bližšie info (nepovinné)</label>
          <textarea style={{ ...styles.input, minHeight: 70, resize: "vertical" }} value={requestForm.description} onChange={(e) => setRequestForm((f) => ({ ...f, description: e.target.value }))} />
        </div>
        <div style={styles.filterField}>
          <label style={styles.label}>Lokalita</label>
          <input style={styles.input} value={requestForm.location} onChange={(e) => setRequestForm((f) => ({ ...f, location: e.target.value }))} />
        </div>
        <div style={styles.filterField}>
          <label style={styles.label}>Kontakty</label>
          <ContactsEditor contacts={requestForm.contacts} onChange={(c) => setRequestForm((f) => ({ ...f, contacts: c }))} />
        </div>
        <button type="submit" className="kolna-btn" style={styles.primaryBtnWide} disabled={saving}>
          {saving ? "Ukladám…" : "Pridať dopyt"}
        </button>
      </form>
    </div>
  );
}

function MessagesView({ conversations, onOpen }) {
  return (
    <div style={{ padding: "0 16px" }}>
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 600, marginBottom: 16 }}>Moje správy</div>
      {conversations.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={{ color: "#8A7C6D" }}>Zatiaľ nemáš žiadne konverzácie.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {conversations.map((c, i) => (
            <div key={i} style={styles.requestRow} onClick={() => onOpen(c)} className="kolna-card" >
              <div style={styles.requestIconBox}>
                <MessageCircle size={18} color="#BF5F42" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{c.otherUsername}</div>
                <div style={{ fontSize: 12, color: "#A08E7B", marginBottom: 3 }}>{c.itemName}</div>
                <div style={{ fontSize: 13, color: "#8A7C6D", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.content}</div>
              </div>
            </div>
          ))}
        </div>
      )}</div>
  );
}

function ChatThread({ chatWith, messages, currentUser, chatInput, setChatInput, onSend, sending, onBack }) {
  return (
    <div className="kolna-fade" style={styles.detailCard}>
      <button style={styles.backBtn} onClick={onBack}>
        <ArrowLeft size={15} style={{ marginRight: 6 }} /> Späť
      </button>
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 600 }}>{chatWith.otherUsername}</div>
      <div style={{ fontSize: 13, color: "#8A7C6D", marginBottom: 16 }}>ohľadom: {chatWith.itemName}</div>

      <div style={styles.chatBox}>
        {messages.length === 0 ? (
          <div style={{ color: "#A08E7B", fontSize: 13, textAlign: "center", padding: 20 }}>Zatiaľ žiadne správy. Napíš prvú!</div>
        ) : (
          messages.map((m) => {
            const mine = m.from_username === currentUser.username;
            return (
              <div key={m.id} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", marginBottom: 8 }}>
                <div style={mine ? styles.chatBubbleMine : styles.chatBubbleTheirs}>{m.content}</div>
              </div>
            );
          })
        )}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          style={{ ...styles.input, flex: 1 }}
          placeholder="Napíš správu…"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSend();
            }
          }}
        />
        <button className="kolna-btn" style={styles.smallBtn} onClick={onSend} disabled={sending}>
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}

function MyItemsView({ items, onDelete, onAdd }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, padding: "0 16px" }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 600 }}>Moje ponúknuté veci</div>
        <button className="kolna-btn" style={styles.primaryBtn} onClick={onAdd}>
          <Plus size={15} style={{ marginRight: 6, verticalAlign: -2 }} /> Pridať vec
        </button>
      </div>
      {items.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={{ color: "#8A7C6D" }}>Zatiaľ si nič neponúkol. Skús pridať prvú vec.</div>
        </div>
      ) : (
        <div className="kolna-grid" style={styles.grid}>
          {items.map((it, idx) => {
            const Icon = categoryIcon(it.category);
            return (
              <div key={it.id} className="kolna-card" style={{ ...styles.card, animationDelay: `${Math.min(idx, 8) * 0.05}s` }}>
                {it.image_url ? (
                  <img src={it.image_url} alt={it.name} style={styles.cardImage} />
                ) : (
                  <div style={styles.cardImagePlaceholder}>
                    <Icon size={28} color="#D9A98C" />
                  </div>
                )}
                <div style={{ padding: "14px 16px 16px" }}>
                  <div style={styles.cardCategory}>
                    <Icon size={12} style={{ marginRight: 4, verticalAlign: -2 }} /> {it.category}
                  </div>
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  app: { width: "100%", background: "#FFFFFF", minHeight: "100vh", fontFamily: "'Inter', sans-serif", color: "#3A2E24" },
  wrap: { maxWidth: 960, margin: "0 auto", padding: "0 0 40px" },
  header: {
    background: "#FFFFFF",
    borderBottom: "1px solid #F0E6D9",
    margin: "0 0 24px",
    padding: "18px 24px",
    display: "flex",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "space-between",
    alignItems: "center",
  },
  brand: { display: "flex", alignItems: "center", gap: 10, cursor: "pointer" },
  brandIcon: { background: "#D97757", padding: 9, borderRadius: 10, display: "flex" },
  brandName: { fontFamily: "'Fraunces', serif", fontSize: 22, color: "#3A2E24", fontWeight: 600 },
  brandTag: { fontSize: 12, color: "#BF5F42", fontWeight: 500 },
  nav: { display: "flex", gap: 8, flexWrap: "wrap" },
  navBtn: {
    border: "1px solid",
    padding: "8px 12px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
  },
  loadingBox: { textAlign: "center", padding: 60, color: "#8A7C6D" },
  hero: { padding: "18px 16px 8px", marginBottom: 6 },
  heroTitle: { fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 600, color: "#3A2E24", marginBottom: 6 },
  heroSub: { fontSize: 15, color: "#8A7C6D" },
  filters: { display: "grid", gridTemplateColumns: "2fr 1.5fr", gap: 12, marginBottom: 16, padding: "0 16px" },
  filterField: { marginBottom: 14 },
  label: { display: "block", fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", color: "#8A7C6D", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #E8DDD0",
    background: "#FFFFFF",
    fontSize: 14,
    color: "#3A2E24",
  },
  catGrid: { display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 },
  catBlock: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    padding: "12px 6px",
    borderRadius: 10,
    border: "1.5px solid",
    fontSize: 12,
    background: "#FFFFFF",
  },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16, padding: "0 16px" },
  card: {
    background: "#FFFFFF",
    border: "1px solid #F0E6D9",
    borderRadius: 12,
    overflow: "hidden",
    cursor: "pointer",
  },
  cardImage: { width: "100%", height: 140, objectFit: "cover", display: "block" },
  cardImagePlaceholder: { width: "100%", height: 140, background: "#FBEDE5", display: "flex", alignItems: "center", justifyContent: "center" },
  cardCategory: { fontSize: 11, color: "#BF5F42", marginBottom: 6, fontWeight: 600, display: "flex", alignItems: "center" },
  cardName: { fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 600, marginBottom: 6 },
  cardDesc: { fontSize: 13, color: "#8A7C6D", marginBottom: 10, lineHeight: 1.4 },
  cardMeta: { fontSize: 12, color: "#A08E7B", display: "flex", alignItems: "center" },
  emptyState: { textAlign: "center", padding: "60px 20px", margin: "0 16px", border: "1px dashed #E8DDD0", borderRadius: 12, background: "#FBF7F1" },
  detailCard: { background: "#FFFFFF", border: "1px solid #F0E6D9", borderRadius: 12, padding: 24, maxWidth: 560, margin: "0 16px" },
  detailImage: { width: "100%", height: 240, objectFit: "cover", borderRadius: 10, marginBottom: 16, display: "block" },
  backBtn: { display: "flex", alignItems: "center", background: "transparent", border: "none", color: "#BF5F42", fontSize: 13, marginBottom: 12, padding: 0 },
  contactBox: { background: "#FBF7F1", border: "1px solid #F0E6D9", borderRadius: 10, padding: 16, marginTop: 8 },
  primaryBtn: {
    background: "#D97757",
    color: "#FFFFFF",
    border: "none",
    padding: "9px 16px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
  },
  primaryBtnWide: {
    background: "#D97757",
    color: "#FFFFFF",
    border: "none",
    padding: "11px 16px",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    width: "100%",
    marginTop: 4,
  },
  smallBtn: {
    background: "#3A2E24",
    color: "#FFFFFF",
    border: "none",
    padding: "0 16px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
  },
  chip: {
    display: "inline-flex",
    alignItems: "center",
    background: "#FBEDE5",
    color: "#BF5F42",
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 500,
  },
  chipRemove: { background: "none", border: "none", color: "#BF5F42", marginLeft: 6, padding: 0, display: "flex" },
  imageUploadBox: {
    width: "100%",
    height: 160,
    borderRadius: 10,
    border: "1.5px dashed #E8DDD0",
    background: "#FBF7F1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    overflow: "hidden",
  },
  imageUploadPreview: { width: "100%", height: "100%", objectFit: "cover" },
  deleteBtn: {
    marginTop: 10,
    background: "transparent",
    border: "1px solid #E2A79A",
    color: "#B5432E",
    padding: "6px 10px",
    borderRadius: 8,
    fontSize: 12,
    display: "flex",
    alignItems: "center",
  },
  authCard: { background: "#FFFFFF", border: "1px solid #F0E6D9", borderRadius: 12, padding: 24, maxWidth: 460, margin: "0 16px" },
  authTabs: { display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #F0E6D9" },
  authTab: { flex: 1, padding: "10px 0", background: "transparent", border: "none", borderBottom: "3px solid", fontSize: 14, fontWeight: 500 },
  errorBox: { background: "#FBEAE5", color: "#B5432E", padding: "10px 12px", borderRadius: 8, fontSize: 13, marginBottom: 16 },
  priceBadge: {
    display: "inline-block",
    background: "#F3EDE3",
    color: "#6B5C46",
    fontSize: 12,
    fontWeight: 600,
    padding: "4px 10px",
    borderRadius: 999,
  },
  requestBoard: { background: "#FBF7F1", border: "1px solid #F0E6D9", borderRadius: 14, padding: 20, margin: "0 16px" },
  requestRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    background: "#FFFFFF",
    border: "1px solid #F0E6D9",
    borderRadius: 10,
    padding: 12,
    cursor: "pointer",
  },
  requestIconBox: { background: "#FBEDE5", borderRadius: 8, padding: 8, display: "flex", flexShrink: 0 },
  chatBox: { background: "#FBF7F1", border: "1px solid #F0E6D9", borderRadius: 10, padding: 14, minHeight: 180, maxHeight: 360, overflowY: "auto" },
  chatBubbleMine: { background: "#D97757", color: "#FFFFFF", padding: "8px 12px", borderRadius: "12px 12px 2px 12px", fontSize: 14, maxWidth: "75%" },
  chatBubbleTheirs: { background: "#FFFFFF", border: "1px solid #F0E6D9", color: "#3A2E24", padding: "8px 12px", borderRadius: "12px 12px 12px 2px", fontSize: 14, maxWidth: "75%" },
};

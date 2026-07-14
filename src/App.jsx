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

  const [requests, setRequests] =

  }
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
        <div className="kolna-logo-icon"

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
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
      <div style={{ fontFamily: "'Fraunces',
      </div>
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
  cardImage: { width:

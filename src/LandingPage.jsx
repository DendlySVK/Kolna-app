import React, { useState, useEffect } from "react";
import { HeartHandshake, Wrench, HelpCircle, MessageCircle, Euro, Download, Smartphone, Share } from "lucide-react";

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

export default function LandingPage() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    function handleBeforeInstall(e) {
      e.preventDefault();
      setDeferredPrompt(e);
    }
    function handleInstalled() {
      setInstalled(true);
      setDeferredPrompt(null);
    }
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  async function handleDownloadClick() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      return;
    }
    if (isIOS()) {
      setShowIosHelp(true);
      return;
    }
    window.location.href = "/app";
  }

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        button { cursor: pointer; font-family: inherit; }
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .kolna-land-fade { animation: fadeSlideUp 0.5s ease both; }
        .kolna-land-btn { transition: transform 0.15s ease, box-shadow 0.15s ease; }
        .kolna-land-btn:hover { transform: translateY(-2px); box-shadow: 0 14px 30px rgba(191,95,66,0.28); }
        .kolna-land-btn:active { transform: scale(0.98); }
        .kolna-feature-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .kolna-feature-card:hover { transform: translateY(-4px); box-shadow: 0 10px 24px rgba(191,95,66,0.12); }
        @media (max-width: 640px) {
          .kolna-features-grid { grid-template-columns: 1fr !important; }
          .kolna-hero-title { font-size: 34px !important; }
        }
      `}</style>

      <div style={styles.header}>
        <div style={styles.brand}>
          <div style={styles.brandIcon}>
            <HeartHandshake size={20} color="#FFFFFF" />
          </div>
          <div style={styles.brandName}>Kôlňa</div>
        </div>
      </div>

      <div className="kolna-land-fade" style={styles.hero}>
        <div style={styles.heroBadge}>Susedská výpožičná sieť</div>
        <div className="kolna-hero-title" style={styles.heroTitle}>Nahraj. Požičaj. Pomôž.</div>
        <div style={styles.heroSub}>
          Kôlňa je appka, cez ktorú si susedia požičiavajú veci namiesto toho, aby ich kupovali zbytočne nanovo.
          Vŕtačka, rebrík, stan, kolobežka – ak to má sused, nemusíš to mať aj ty.
        </div>

        <button className="kolna-land-btn" style={styles.downloadBtn} onClick={handleDownloadClick}>
          <Download size={20} style={{ marginRight: 10 }} />
          {installed ? "Appka je nainštalovaná" : "Stiahni si Kôlňu"}
        </button>

        {showIosHelp && (
          <div style={styles.iosHelpBox}>
            <div style={{ fontWeight: 600, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
              <Smartphone size={16} /> Inštalácia na iPhone
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.6 }}>
              1. Otvor túto stránku v prehliadači <strong>Safari</strong>.<br />
              2. Klikni na ikonku zdieľania <Share size={14} style={{ verticalAlign: -2 }} /> dole (alebo hore) v prehliadači.<br />
              3. Vyber <strong>„Pridať na plochu"</strong>.<br />
              4. Appka sa objaví na ploche ako ikonka.
            </div>
          </div>
        )}

        <div style={styles.heroNote}>Zadarmo · Bez reklám · Funguje na Androide aj iPhone</div>
      </div>

      <div style={{ padding: "40px 16px 20px" }}>
        <div style={styles.sectionTitle}>Čo appka vie</div>
        <div className="kolna-features-grid" style={styles.featuresGrid}>
          <FeatureCard icon={Wrench} title="Ponuky vecí" text="Ponúkni veci, ktoré doma zbytočne ležia, a nájdi, čo ti požičia sused." />
          <FeatureCard icon={HelpCircle} title="Nástenka Hľadám" text="Napíš, čo potrebuješ, aj keď to ešte nikto neponúka – susedia to uvidia." />
          <FeatureCard icon={Euro} title="Cena podľa seba" text="Požičiavaj zadarmo, alebo si nastav cenu za hodinu, deň či týždeň." />
          <FeatureCard icon={MessageCircle} title="Chat v appke" text="Dohodni si všetko priamo s majiteľom, bez telefonovania a hľadania kontaktov." />
        </div>
      </div>

      <div style={styles.footer}>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Kôlňa</div>
        <div style={{ fontSize: 13, color: "#8A7C6D" }}>Susedská výpožičná sieť</div>
      </div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, text }) {
  return (
    <div className="kolna-feature-card" style={styles.featureCard}>
      <div style={styles.featureIconBox}>
        <Icon size={22} color="#BF5F42" />
      </div>
      <div style={styles.featureTitle}>{title}</div>
      <div style={styles.featureText}>{text}</div>
    </div>
  );
}

const styles = {
  page: { width: "100%", minHeight: "100vh", background: "#FFFFFF", fontFamily: "'Inter', sans-serif", color: "#3A2E24" },
  header: { padding: "20px 24px", display: "flex", alignItems: "center", borderBottom: "1px solid #F0E6D9" },
  brand: { display: "flex", alignItems: "center", gap: 10 },
  brandIcon: { background: "#D97757", padding: 8, borderRadius: 10, display: "flex" },
  brandName: { fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 600 },
  hero: { maxWidth: 640, margin: "0 auto", padding: "56px 20px 20px", textAlign: "center" },
  heroBadge: {
    display: "inline-block",
    background: "#FBEDE5",
    color: "#BF5F42",
    fontSize: 13,
    fontWeight: 600,
    padding: "6px 14px",
    borderRadius: 999,
    marginBottom: 18,
  },
  heroTitle: { fontFamily: "'Fraunces', serif", fontSize: 46, fontWeight: 700, lineHeight: 1.15, marginBottom: 16 },
  heroSub: { fontSize: 16, color: "#6B5C4C", lineHeight: 1.6, marginBottom: 32, maxWidth: 480, marginLeft: "auto", marginRight: "auto" },
  downloadBtn: {
    background: "#D97757",
    color: "#FFFFFF",
    border: "none",
    padding: "16px 36px",
    borderRadius: 12,
    fontSize: 17,
    fontWeight: 700,
    display: "inline-flex",
    alignItems: "center",
    boxShadow: "0 10px 24px rgba(217,119,87,0.35)",
  },
  heroNote: { fontSize: 13, color: "#A08E7B", marginTop: 16 },
  iosHelpBox: {
    textAlign: "left",
    background: "#FBF7F1",
    border: "1px solid #F0E6D9",
    borderRadius: 12,
    padding: 18,
    marginTop: 20,
    maxWidth: 420,
    marginLeft: "auto",
    marginRight: "auto",
  },
  sectionTitle: { fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 600, textAlign: "center", marginBottom: 28 },
  featuresGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, maxWidth: 720, margin: "0 auto" },
  featureCard: { background: "#FFFFFF", border: "1px solid #F0E6D9", borderRadius: 14, padding: 22 },
  featureIconBox: { background: "#FBEDE5", width: 44, height: 44, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 },
  featureTitle: { fontFamily: "'Fraunces', serif", fontSize: 17, fontWeight: 600, marginBottom: 6 },
  featureText: { fontSize: 14, color: "#8A7C6D", lineHeight: 1.5 },
  footer: { textAlign: "center", padding: "48px 20px 40px", borderTop: "1px solid #F0E6D9", marginTop: 40 },
};

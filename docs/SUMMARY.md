# Dozent Rechnungen — Summary für Entwicklung

## Projektkontext

- **Ziel:** Web-App für freiberufliche BAMF-Dozenten (Integrationskurs, Berufssprachkurs) zur Rechnungserstellung und Abrechnung
- **Pfad:** `C:\Users\irs\source\Dozent_Rechnungen\dozent-rechnungen`
- **Zielgruppe:** ~25.000–40.000 Honorarkräfte in Deutschland

## Tech Stack

| Bereich | Technologie |
|---------|-------------|
| Frontend | Vue 3, Vite, TypeScript |
| Backend | Supabase (Auth, Postgres, Storage) |
| PDF | jsPDF + html2canvas |
| PWA | vite-plugin-pwa |
| Deploy | Vercel |

## Aktueller Stand

### Fertig

- Supabase Auth (Email)
- Profil (user_profile): Name, Adresse, IBAN, BIC, Steuernummer
- Kunden (clients): CRUD, Auswahl bei Rechnung
- Rechnungen: Auto-Nummer YYYY-MM-XXX, Provider + Client + Kurs
- Termine (Items): Datum, Kurs, Stunden, Stundensatz, Betrag
- PDF: A4, Kleinunternehmer (§ 19 UStG), Upload in Supabase Storage
- InvoicesView: Liste, PDF-Link, Löschen, **EÜR-Export (CSV)**
- **Per-Client-Felder**: leistungsbeschreibung, rechnung_preset (BAMF IK, BSK, Sonstige)
- **Onboarding**: Erstnutzer-Flow mit Profil + erste Rechnung
- **Mobile**: Hamburger-Navigation, Karten-Layout für Rechnungsliste
- **Dashboard**: Einnahmenübersicht, letzte Rechnungen
- PWA, Viewport

### Offen / Verbesserung

- GoBD (Unveränderbarkeit, Archivierung)

## Prioritäten (aus Nutzersicht)

1. **EÜR-Export** – CSV/Excel für Steuerberater
2. **Per-Client-Einstellungen** – unterschiedliche Träger-Anforderungen
3. **Onboarding** – schneller Weg zur ersten Rechnung
4. **Mobile-Anpassung** – Navigation, Tabellen
5. **Dashboard** – Einnahmenübersicht

## Geplante Änderungen

### 1. EÜR-Export

- CSV/Excel mit: Datum, Kunde, Betrag, Beschreibung
- Format für Steuerberater
- Button auf InvoicesView oder Dashboard

### 2. Per-Client-Felder

- In `clients`: `verwendungszweck`, `leistungsbeschreibung`, `zusatz_angaben`, `rechnung_preset`
- Presets: `bamf_ik`, `bsk`, `sonstige`
- In InvoicePreview: dynamische Leistungsbeschreibung statt festem Text

### 3. Mobile

- Navigation: Hamburger oder flex-wrap
- InvoiceForm-Tabelle: auf Mobile als Karten/Stack
- InvoicesView-Tabelle: analog
- Touch-Targets mind. 44px

## Wichtige Dateien

| Datei | Zweck |
|-------|-------|
| `src/components/InvoiceForm.vue` | Rechnungsformular |
| `src/components/InvoicePreview.vue` | PDF-Vorlage |
| `src/composables/useInvoice.ts` | Speichern in DB |
| `src/composables/useInvoicePdf.ts` | PDF-Generierung |
| `src/views/InvoicesView.vue` | Rechnungsliste |
| `src/views/CustomersView.vue` | Kundenverwaltung |
| `src/views/ProfileView.vue` | Profil |
| `src/App.vue` | Navigation |
| `src/assets/styles.css` | Globale Styles |

## Datenbank (Supabase)

| Tabelle | Zweck |
|---------|-------|
| `invoices` | Rechnungen (user_id, client_id, number, date, course_overview, total, pdf_path) |
| `invoice_items` | Zeilen (invoice_id, date, hours, rate, amount, course) |
| `clients` | Kunden (user_id, name, address, …) |
| `user_profile` | Profil (id = user_id, name, address, tax_number, iban, bic) |

## Nächste Schritte

1. EÜR-Export implementieren
2. Per-Client-Felder in DB und UI
3. Mobile-Anpassung
4. Onboarding-Flow

---

*Stand: Februar 2025*

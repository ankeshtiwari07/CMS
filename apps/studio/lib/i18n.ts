// UI localisation for the Studio chrome. Content locales: English, Arabic
// (MSA + country dialects, RTL), French, German, Spanish, Polish. Arabic
// dialects reuse the `ar` chrome strings (dialect matters for content, not
// button labels); everything falls back to English.
// Server-safe: no client-only code here; client helpers live in i18n-client.tsx.
export type Locale =
  | "en" | "ar" | "ar-SA" | "ar-EG" | "ar-AE" | "ar-MA" | "ar-LB"
  | "fr" | "de" | "es" | "pl";

export const LOCALES: { code: Locale; label: string; rtl?: boolean }[] = [
  { code: "en", label: "English" },
  { code: "ar", label: "العربية (فصحى)", rtl: true },
  { code: "ar-SA", label: "العربية (السعودية)", rtl: true },
  { code: "ar-EG", label: "العربية (مصر)", rtl: true },
  { code: "ar-AE", label: "العربية (الإمارات)", rtl: true },
  { code: "ar-MA", label: "العربية (المغرب)", rtl: true },
  { code: "ar-LB", label: "العربية (لبنان)", rtl: true },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "es", label: "Español" },
  { code: "pl", label: "Polski" },
];

export const isRtl = (l: string) => l.startsWith("ar");
// UI chrome falls back: Arabic dialects → ar; everything → en.
export const chromeLocale = (l: string) => (l.startsWith("ar") ? "ar" : l);

type Tr = { en: string; ar: string; fr?: string; de?: string; es?: string; pl?: string };

export const DICT: Record<string, Tr> = {
  // sidebar nav
  "nav.create": { en: "Create new", ar: "إنشاء جديد", fr: "Créer", de: "Neu erstellen", es: "Crear nuevo", pl: "Utwórz nowy" },
  "nav.search": { en: "Search", ar: "بحث", fr: "Rechercher", de: "Suchen", es: "Buscar", pl: "Szukaj" },
  "nav.projects": { en: "Projects", ar: "المشاريع", fr: "Projets", de: "Projekte", es: "Proyectos", pl: "Projekty" },
  "nav.templates": { en: "Templates", ar: "القوالب", fr: "Modèles", de: "Vorlagen", es: "Plantillas", pl: "Szablony" },
  "nav.review": { en: "Review", ar: "المراجعة", fr: "Révision", de: "Prüfung", es: "Revisión", pl: "Przegląd" },
  "nav.brand": { en: "Brand", ar: "العلامة التجارية", fr: "Marque", de: "Marke", es: "Marca", pl: "Marka" },
  "nav.design": { en: "Design", ar: "التصميم", fr: "Design", de: "Design", es: "Diseño", pl: "Projekt" },
  // create-new menu
  "create.addfiles": { en: "Add photos & files", ar: "إضافة صور وملفات", fr: "Ajouter photos et fichiers", de: "Fotos & Dateien hinzufügen", es: "Agregar fotos y archivos", pl: "Dodaj zdjęcia i pliki" },
  "create.recent": { en: "Recent projects", ar: "أحدث المشاريع", fr: "Projets récents", de: "Letzte Projekte", es: "Proyectos recientes", pl: "Ostatnie projekty" },
  "create.deck": { en: "Create Deck", ar: "إنشاء عرض تقديمي", fr: "Créer une présentation", de: "Präsentation erstellen", es: "Crear presentación", pl: "Utwórz prezentację" },
  "create.image": { en: "Create Image", ar: "إنشاء صورة", fr: "Créer une image", de: "Bild erstellen", es: "Crear imagen", pl: "Utwórz obraz" },
  "create.website": { en: "Create Website", ar: "إنشاء موقع", fr: "Créer un site web", de: "Website erstellen", es: "Crear sitio web", pl: "Utwórz stronę" },
  "create.email": { en: "Create Email", ar: "إنشاء بريد إلكتروني", fr: "Créer un e-mail", de: "E-Mail erstellen", es: "Crear correo", pl: "Utwórz e-mail" },
  "create.template": { en: "Use template", ar: "استخدام قالب", fr: "Utiliser un modèle", de: "Vorlage verwenden", es: "Usar plantilla", pl: "Użyj szablonu" },
  "create.designSystem": { en: "Design System", ar: "نظام التصميم", fr: "Système de design", de: "Designsystem", es: "Sistema de diseño", pl: "System projektowania" },
  "create.translation": { en: "Translate", ar: "ترجمة", fr: "Traduire", de: "Übersetzen", es: "Traducir", pl: "Tłumacz" },
  // user menu
  "menu.settings": { en: "Settings", ar: "الإعدادات", fr: "Paramètres", de: "Einstellungen", es: "Ajustes", pl: "Ustawienia" },
  "menu.signout": { en: "Sign out", ar: "تسجيل الخروج", fr: "Se déconnecter", de: "Abmelden", es: "Cerrar sesión", pl: "Wyloguj" },
  "menu.language": { en: "Language", ar: "اللغة", fr: "Langue", de: "Sprache", es: "Idioma", pl: "Język" },
  "lang.en": { en: "English", ar: "English" },
  "lang.ar": { en: "العربية", ar: "العربية" },
  // home
  "home.q": { en: "What do you want to create today?", ar: "ماذا تريد أن تُنشئ اليوم؟", fr: "Que voulez-vous créer aujourd'hui ?", de: "Was möchten Sie heute erstellen?", es: "¿Qué quieres crear hoy?", pl: "Co chcesz dziś stworzyć?" },
  "greet.morning": { en: "Good morning", ar: "صباح الخير", fr: "Bonjour", de: "Guten Morgen", es: "Buenos días", pl: "Dzień dobry" },
  "greet.afternoon": { en: "Good afternoon", ar: "مساء الخير", fr: "Bon après-midi", de: "Guten Tag", es: "Buenas tardes", pl: "Dzień dobry" },
  "greet.evening": { en: "Good evening", ar: "مساء الخير", fr: "Bonsoir", de: "Guten Abend", es: "Buenas noches", pl: "Dobry wieczór" },
  // prompt box
  "prompt.placeholder": { en: "Describe what you want to create", ar: "صِف ما تريد إنشاءه", fr: "Décrivez ce que vous voulez créer", de: "Beschreiben Sie, was Sie erstellen möchten", es: "Describe lo que quieres crear", pl: "Opisz, co chcesz utworzyć" },
  "prompt.followup": { en: "Ask a follow-up or refine…", ar: "اطرح سؤال متابعة أو اطلب تحسينًا…", fr: "Posez une question ou affinez…", de: "Stellen Sie eine Rückfrage oder verfeinern Sie…", es: "Haz una pregunta o refina…", pl: "Zadaj pytanie lub doprecyzuj…" },
  "prompt.generating": { en: "Generating with", ar: "جارٍ الإنشاء باستخدام", fr: "Génération avec", de: "Erstellen mit", es: "Generando con", pl: "Generowanie za pomocą" },
  "prompt.thinking": { en: "Thinking…", ar: "جارٍ التفكير…", fr: "Réflexion…", de: "Denke nach…", es: "Pensando…", pl: "Myślę…" },
  // quick actions
  "qa.conference": { en: "Conference", ar: "مؤتمر", fr: "Conférence", de: "Konferenz", es: "Conferencia", pl: "Konferencja" },
  "qa.webinar": { en: "Webinar", ar: "ندوة إلكترونية", fr: "Webinaire", de: "Webinar", es: "Seminario web", pl: "Webinarium" },
  "qa.summit": { en: "Summit", ar: "قمة", fr: "Sommet", de: "Gipfel", es: "Cumbre", pl: "Szczyt" },
  "qa.content": { en: "Content", ar: "محتوى", fr: "Contenu", de: "Inhalt", es: "Contenido", pl: "Treść" },
  "qa.campaign": { en: "Campaign", ar: "حملة", fr: "Campagne", de: "Kampagne", es: "Campaña", pl: "Kampania" },
  // continue / quick create section headings
  "home.continue": { en: "Continue creating", ar: "متابعة الإنشاء", fr: "Continuer la création", de: "Weiter erstellen", es: "Continuar creando", pl: "Kontynuuj tworzenie" },
  "home.quickcreate": { en: "Quick create", ar: "إنشاء سريع", fr: "Création rapide", de: "Schnell erstellen", es: "Creación rápida", pl: "Szybkie tworzenie" },
  "home.seeall": { en: "See all projects", ar: "عرض كل المشاريع", fr: "Voir tous les projets", de: "Alle Projekte anzeigen", es: "Ver todos los proyectos", pl: "Zobacz wszystkie projekty" },
  "home.explore": { en: "Explore", ar: "استكشاف", fr: "Explorer", de: "Entdecken", es: "Explorar", pl: "Odkryj" },
  // quick-create cards
  "qc.deck.t": { en: "Create Deck", ar: "إنشاء عرض تقديمي", fr: "Créer une présentation", de: "Präsentation erstellen", es: "Crear presentación", pl: "Utwórz prezentację" },
  "qc.deck.s": { en: "Generate polished presentations from a prompt", ar: "أنشئ عروضًا احترافية من وصف", fr: "Générez des présentations soignées à partir d'une invite", de: "Erstellen Sie ausgefeilte Präsentationen aus einem Prompt", es: "Genera presentaciones pulidas desde un prompt", pl: "Twórz dopracowane prezentacje z podpowiedzi" },
  "qc.image.t": { en: "Create Image", ar: "إنشاء صورة", fr: "Créer une image", de: "Bild erstellen", es: "Crear imagen", pl: "Utwórz obraz" },
  "qc.image.s": { en: "Turn ideas into high-quality visuals", ar: "حوّل الأفكار إلى صور عالية الجودة", fr: "Transformez vos idées en visuels de haute qualité", de: "Verwandeln Sie Ideen in hochwertige Bilder", es: "Convierte ideas en imágenes de alta calidad", pl: "Zamień pomysły w wysokiej jakości grafiki" },
  "qc.website.t": { en: "Create Website / App", ar: "إنشاء موقع / تطبيق", fr: "Créer un site web / une app", de: "Website / App erstellen", es: "Crear sitio web / app", pl: "Utwórz stronę / aplikację" },
  "qc.website.s": { en: "Create landing pages, apps, and UI flows", ar: "أنشئ صفحات هبوط وتطبيقات وواجهات", fr: "Créez des landing pages, apps et parcours UI", de: "Erstellen Sie Landingpages, Apps und UI-Flows", es: "Crea landing pages, apps y flujos de UI", pl: "Twórz strony docelowe, aplikacje i przepływy UI" },
  "qc.email.t": { en: "Email", ar: "بريد إلكتروني", fr: "E-mail", de: "E-Mail", es: "Correo", pl: "E-mail" },
  "qc.email.s": { en: "Draft campaigns and announcements", ar: "اكتب الحملات والإعلانات", fr: "Rédigez campagnes et annonces", de: "Entwerfen Sie Kampagnen und Ankündigungen", es: "Redacta campañas y anuncios", pl: "Twórz kampanie i ogłoszenia" },
  "qc.writing.t": { en: "Writing", ar: "كتابة", fr: "Rédaction", de: "Texte", es: "Redacción", pl: "Pisanie" },
  "qc.writing.s": { en: "Articles, blogs, and long-form content", ar: "مقالات ومدونات ومحتوى طويل", fr: "Articles, blogs et contenu long", de: "Artikel, Blogs und Langform-Inhalte", es: "Artículos, blogs y contenido extenso", pl: "Artykuły, blogi i długie treści" },
  "qc.translation.t": { en: "Translation", ar: "ترجمة", fr: "Traduction", de: "Übersetzung", es: "Traducción", pl: "Tłumaczenie" },
  "qc.translation.s": { en: "Localize content across languages", ar: "ترجمة المحتوى عبر اللغات", fr: "Localisez le contenu dans plusieurs langues", de: "Lokalisieren Sie Inhalte über Sprachen hinweg", es: "Localiza contenido entre idiomas", pl: "Lokalizuj treści w wielu językach" },
};

export function tr(locale: string, key: string): string {
  const e = DICT[key] as Record<string, string> | undefined;
  if (!e) return key;
  return e[locale] || e[chromeLocale(locale)] || e.en || key;
}

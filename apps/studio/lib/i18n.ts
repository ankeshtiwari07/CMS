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
  "prompt.stop": { en: "Stop", ar: "إيقاف", fr: "Arrêter", de: "Stopp", es: "Detener", pl: "Zatrzymaj" },
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
  // project card: relative time prefix
  "card.updated": { en: "Updated", ar: "حُدّث", fr: "Mis à jour", de: "Aktualisiert", es: "Actualizado", pl: "Zaktualizowano" },
  // project-type tags
  "type.deck": { en: "Deck", ar: "عرض", fr: "Présentation", de: "Präsentation", es: "Presentación", pl: "Prezentacja" },
  "type.image": { en: "Image", ar: "صورة", fr: "Image", de: "Bild", es: "Imagen", pl: "Obraz" },
  "type.website": { en: "Website", ar: "موقع", fr: "Site web", de: "Website", es: "Sitio web", pl: "Strona" },
  "type.email": { en: "Email", ar: "بريد", fr: "E-mail", de: "E-Mail", es: "Correo", pl: "E-mail" },
  "type.brand": { en: "Brand", ar: "علامة", fr: "Marque", de: "Marke", es: "Marca", pl: "Marka" },
  "type.designSystem": { en: "Design System", ar: "نظام التصميم", fr: "Système de design", de: "Designsystem", es: "Sistema de diseño", pl: "System projektowy" },
  "type.writing": { en: "Writing", ar: "كتابة", fr: "Rédaction", de: "Text", es: "Redacción", pl: "Tekst" },
  "type.translation": { en: "Translation", ar: "ترجمة", fr: "Traduction", de: "Übersetzung", es: "Traducción", pl: "Tłumaczenie" },
  "type.event": { en: "Event", ar: "فعالية", fr: "Événement", de: "Veranstaltung", es: "Evento", pl: "Wydarzenie" },
  "type.webinar": { en: "Webinar", ar: "ندوة", fr: "Webinaire", de: "Webinar", es: "Webinar", pl: "Webinarium" },
  "type.conference": { en: "Conference", ar: "مؤتمر", fr: "Conférence", de: "Konferenz", es: "Conferencia", pl: "Konferencja" },
  "type.summit": { en: "Summit", ar: "قمة", fr: "Sommet", de: "Gipfel", es: "Cumbre", pl: "Szczyt" },
  "type.campaign": { en: "Campaign", ar: "حملة", fr: "Campagne", de: "Kampagne", es: "Campaña", pl: "Kampania" },
  "type.brandGuideline": { en: "Brand Guideline", ar: "دليل العلامة", fr: "Charte de marque", de: "Markenrichtlinie", es: "Guía de marca", pl: "Wytyczne marki" },
  "type.websiteBuild": { en: "Website Build", ar: "إنشاء موقع", fr: "Création de site", de: "Website-Build", es: "Construcción web", pl: "Budowa strony" },
  "type.video": { en: "Video", ar: "فيديو", fr: "Vidéo", de: "Video", es: "Vídeo", pl: "Wideo" },
  // projects grid + create modal
  "pg.new": { en: "New project", ar: "مشروع جديد", fr: "Nouveau projet", de: "Neues Projekt", es: "Nuevo proyecto", pl: "Nowy projekt" },
  "pg.newSub": { en: "Generate with Claude or start blank", ar: "أنشئ باستخدام Claude أو ابدأ من فارغ", fr: "Générez avec Claude ou partez de zéro", de: "Mit Claude generieren oder leer starten", es: "Genera con Claude o empieza en blanco", pl: "Wygeneruj z Claude lub zacznij od zera" },
  "pg.open": { en: "Open", ar: "فتح", fr: "Ouvrir", de: "Öffnen", es: "Abrir", pl: "Otwórz" },
  "pg.justNow": { en: "just now", ar: "الآن", fr: "à l’instant", de: "gerade eben", es: "ahora mismo", pl: "przed chwilą" },
  "pg.title": { en: "Title", ar: "العنوان", fr: "Titre", de: "Titel", es: "Título", pl: "Tytuł" },
  "pg.titlePh": { en: "e.g. Q3 launch announcement", ar: "مثال: إعلان إطلاق الربع الثالث", fr: "ex. annonce de lancement T3", de: "z. B. Q3-Launch-Ankündigung", es: "p. ej. anuncio de lanzamiento del T3", pl: "np. ogłoszenie premiery w III kw." },
  "pg.type": { en: "Type", ar: "النوع", fr: "Type", de: "Typ", es: "Tipo", pl: "Typ" },
  "pg.prompt": { en: "Prompt", ar: "الموجّه", fr: "Invite", de: "Prompt", es: "Indicación", pl: "Polecenie" },
  "pg.promptPh": { en: "Describe what you want to create…", ar: "صف ما تريد إنشاءه…", fr: "Décrivez ce que vous voulez créer…", de: "Beschreiben Sie, was Sie erstellen möchten…", es: "Describe lo que quieres crear…", pl: "Opisz, co chcesz utworzyć…" },
  "pg.createBlank": { en: "Create blank", ar: "إنشاء فارغ", fr: "Créer vierge", de: "Leer erstellen", es: "Crear en blanco", pl: "Utwórz pusty" },
  "pg.creating": { en: "Creating…", ar: "جارٍ الإنشاء…", fr: "Création…", de: "Wird erstellt…", es: "Creando…", pl: "Tworzenie…" },
  "pg.generate": { en: "Generate with Claude", ar: "أنشئ باستخدام Claude", fr: "Générer avec Claude", de: "Mit Claude generieren", es: "Generar con Claude", pl: "Wygeneruj z Claude" },
  "pg.generating": { en: "Generating…", ar: "جارٍ الإنشاء…", fr: "Génération…", de: "Wird generiert…", es: "Generando…", pl: "Generowanie…" },
  "pg.copy": { en: "Copy", ar: "نسخ", fr: "Copier", de: "Kopieren", es: "Copiar", pl: "Kopiuj" },
  "pg.delete": { en: "Delete", ar: "حذف", fr: "Supprimer", de: "Löschen", es: "Eliminar", pl: "Usuń" },
  "pg.deleteConfirm": { en: "Delete this project? This cannot be undone.", ar: "حذف هذا المشروع؟ لا يمكن التراجع.", fr: "Supprimer ce projet ? Action irréversible.", de: "Dieses Projekt löschen? Kann nicht rückgängig gemacht werden.", es: "¿Eliminar este proyecto? No se puede deshacer.", pl: "Usunąć ten projekt? Tej operacji nie można cofnąć." },
  "pg.deleteFail": { en: "Could not delete the project.", ar: "تعذّر حذف المشروع.", fr: "Impossible de supprimer le projet.", de: "Projekt konnte nicht gelöscht werden.", es: "No se pudo eliminar el proyecto.", pl: "Nie udało się usunąć projektu." },
  "pg.genFail": { en: "Generation failed.", ar: "فشل الإنشاء.", fr: "Échec de la génération.", de: "Generierung fehlgeschlagen.", es: "La generación falló.", pl: "Generowanie nie powiodło się." },
  "pg.noReach": { en: "Could not reach the generation service.", ar: "تعذّر الوصول إلى خدمة الإنشاء.", fr: "Service de génération injoignable.", de: "Generierungsdienst nicht erreichbar.", es: "No se pudo acceder al servicio de generación.", pl: "Nie można połączyć się z usługą generowania." },
  "pg.noContent": { en: "(No content stored for this project.)", ar: "(لا يوجد محتوى مخزَّن لهذا المشروع.)", fr: "(Aucun contenu enregistré pour ce projet.)", de: "(Kein Inhalt für dieses Projekt gespeichert.)", es: "(No hay contenido guardado para este proyecto.)", pl: "(Brak zapisanej treści dla tego projektu.)" },
  "pg.preview": { en: "PREVIEW", ar: "معاينة", fr: "APERÇU", de: "VORSCHAU", es: "VISTA PREVIA", pl: "PODGLĄD" },
  "pg.enterPrompt": { en: "Enter a prompt to generate.", ar: "أدخل موجّهًا للإنشاء.", fr: "Saisissez une invite pour générer.", de: "Geben Sie einen Prompt ein.", es: "Introduce una indicación para generar.", pl: "Wpisz polecenie, aby wygenerować." },
  "pg.enterTitle": { en: "Enter a project title.", ar: "أدخل عنوان المشروع.", fr: "Saisissez un titre de projet.", de: "Geben Sie einen Projekttitel ein.", es: "Introduce un título de proyecto.", pl: "Wpisz tytuł projektu." },
  "pg.createFail": { en: "Create failed.", ar: "فشل الإنشاء.", fr: "Échec de la création.", de: "Erstellen fehlgeschlagen.", es: "La creación falló.", pl: "Tworzenie nie powiodło się." },
  "pg.noCreate": { en: "Could not create the project.", ar: "تعذّر إنشاء المشروع.", fr: "Impossible de créer le projet.", de: "Projekt konnte nicht erstellt werden.", es: "No se pudo crear el proyecto.", pl: "Nie udało się utworzyć projektu." },
  // chat history (sidebar)
  "chats.title": { en: "Chats", ar: "المحادثات", fr: "Discussions", de: "Chats", es: "Chats", pl: "Czaty" },
  "chats.empty": { en: "No chats yet", ar: "لا توجد محادثات بعد", fr: "Aucune discussion", de: "Noch keine Chats", es: "Aún no hay chats", pl: "Brak czatów" },
  "chats.rename": { en: "Rename", ar: "إعادة تسمية", fr: "Renommer", de: "Umbenennen", es: "Renombrar", pl: "Zmień nazwę" },
  "chats.delete": { en: "Delete", ar: "حذف", fr: "Supprimer", de: "Löschen", es: "Eliminar", pl: "Usuń" },
  "chats.renamePrompt": { en: "Rename this chat:", ar: "إعادة تسمية المحادثة:", fr: "Renommer cette discussion :", de: "Diesen Chat umbenennen:", es: "Renombrar este chat:", pl: "Zmień nazwę czatu:" },
  "chats.deleteConfirm": { en: "Delete this chat?", ar: "حذف هذه المحادثة؟", fr: "Supprimer cette discussion ?", de: "Diesen Chat löschen?", es: "¿Eliminar este chat?", pl: "Usunąć ten czat?" },
};

// Localised "Updated 3d ago" via Intl.RelativeTimeFormat (handles Arabic numerals etc).
export function relativeTime(locale: string, iso?: string): string {
  if (!iso) return "";
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  const [n, unit]: [number, Intl.RelativeTimeFormatUnit] =
    s < 3600 ? [Math.max(1, Math.round(s / 60)), "minute"] : s < 86400 ? [Math.round(s / 3600), "hour"] : [Math.round(s / 86400), "day"];
  try {
    return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(-n, unit);
  } catch {
    return `${n}${unit[0]} ago`;
  }
}

export function tr(locale: string, key: string): string {
  const e = DICT[key] as Record<string, string> | undefined;
  if (!e) return key;
  return e[locale] || e[chromeLocale(locale)] || e.en || key;
}

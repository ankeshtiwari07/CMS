// Lightweight UI localisation (English / Arabic) for the Studio chrome.
// Server-safe: this module has no client-only code, so server components can
// import DICT/tr directly; client helpers live in i18n-client.tsx.
export type Locale = "en" | "ar";

export const DICT: Record<string, { en: string; ar: string }> = {
  // sidebar nav
  "nav.create": { en: "Create new", ar: "إنشاء جديد" },
  "nav.search": { en: "Search", ar: "بحث" },
  "nav.projects": { en: "Projects", ar: "المشاريع" },
  "nav.templates": { en: "Templates", ar: "القوالب" },
  "nav.brand": { en: "Brand", ar: "العلامة التجارية" },
  "nav.design": { en: "Design", ar: "التصميم" },
  // create-new menu
  "create.addfiles": { en: "Add photos & files", ar: "إضافة صور وملفات" },
  "create.recent": { en: "Recent projects", ar: "أحدث المشاريع" },
  "create.deck": { en: "Create Deck", ar: "إنشاء عرض تقديمي" },
  "create.image": { en: "Create Image", ar: "إنشاء صورة" },
  "create.website": { en: "Create Website", ar: "إنشاء موقع" },
  "create.email": { en: "Create Email", ar: "إنشاء بريد إلكتروني" },
  "create.template": { en: "Use template", ar: "استخدام قالب" },
  "create.designSystem": { en: "Design System", ar: "نظام التصميم" },
  "create.translation": { en: "Translate", ar: "ترجمة" },
  // user menu
  "menu.settings": { en: "Settings", ar: "الإعدادات" },
  "menu.signout": { en: "Sign out", ar: "تسجيل الخروج" },
  "menu.language": { en: "Language", ar: "اللغة" },
  "lang.en": { en: "English", ar: "English" },
  "lang.ar": { en: "العربية", ar: "العربية" },
  // home
  "home.q": { en: "What do you want to create today?", ar: "ماذا تريد أن تُنشئ اليوم؟" },
  "greet.morning": { en: "Good morning", ar: "صباح الخير" },
  "greet.afternoon": { en: "Good afternoon", ar: "مساء الخير" },
  "greet.evening": { en: "Good evening", ar: "مساء الخير" },
  // prompt box
  "prompt.placeholder": { en: "Describe what you want to create", ar: "صِف ما تريد إنشاءه" },
  "prompt.followup": { en: "Ask a follow-up or refine…", ar: "اطرح سؤال متابعة أو اطلب تحسينًا…" },
  "prompt.generating": { en: "Generating with", ar: "جارٍ الإنشاء باستخدام" },
  "prompt.thinking": { en: "Thinking…", ar: "جارٍ التفكير…" },
  // quick actions
  "qa.conference": { en: "Conference", ar: "مؤتمر" },
  "qa.webinar": { en: "Webinar", ar: "ندوة إلكترونية" },
  "qa.summit": { en: "Summit", ar: "قمة" },
  "qa.content": { en: "Content", ar: "محتوى" },
  "qa.campaign": { en: "Campaign", ar: "حملة" },
  // continue / quick create section headings
  "home.continue": { en: "Continue creating", ar: "متابعة الإنشاء" },
};

export function tr(locale: Locale, key: string): string {
  const e = DICT[key];
  return e ? e[locale] || e.en : key;
}

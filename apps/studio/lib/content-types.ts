// Data-driven config for the dark Content Management surface. Field `name`
// values map 1:1 to the Payload collection fields (apps/cms content-types.ts).

export type FieldType = "text" | "textarea" | "richtext" | "date" | "time";

export type FieldDef = {
  name: string;
  label: string;
  placeholder?: string;
  type: FieldType;
  col: number; // grid columns this field spans within a 12-col row group
};

export type TemplateDef = { key: string; name: string; desc: string };

export type TabDef = {
  key: string;
  slug: string; // Payload collection slug
  label: string;
  icon: string;
  subtitle: string;
  formTitle: string;
  titleField: string; // field used as the doc title
  templates: TemplateDef[];
  fields: FieldDef[];
};

export const CORE_TABS: TabDef[] = [
  {
    key: "blog",
    slug: "blogPosts",
    label: "Blog",
    icon: "doc",
    subtitle: "Create blogs, articles, and press releases",
    formTitle: "Create Blog Post",
    titleField: "headline",
    templates: [
      { key: "modern", name: "Modern Blog", desc: "Clean and contemporary blog layout" },
      { key: "editorial", name: "Editorial Style", desc: "Magazine-inspired design" },
      { key: "minimalist", name: "Minimalist", desc: "Simple and focused layout" },
    ],
    fields: [
      { name: "headline", label: "Headline", placeholder: "Enter your headline...", type: "text", col: 6 },
      { name: "cta", label: "Call to Action", placeholder: "Subscribe, download, comment...", type: "text", col: 6 },
      { name: "hook", label: "Hook (Introduction)", placeholder: "Grab your reader's attention...", type: "textarea", col: 12 },
      { name: "problem", label: "Problem", placeholder: "What problem are you addressing?", type: "textarea", col: 6 },
      { name: "conclusion", label: "Conclusion", placeholder: "Wrap it up...", type: "textarea", col: 6 },
      { name: "solution", label: "Solution (Main Content)", placeholder: "Provide your solution...", type: "richtext", col: 12 },
      { name: "examples", label: "Examples/Tips", placeholder: "Share examples or tips...", type: "textarea", col: 12 },
    ],
  },
  {
    key: "articles",
    slug: "articles",
    label: "Articles",
    icon: "book",
    subtitle: "Create blogs, articles, and press releases",
    formTitle: "Create Article",
    titleField: "title",
    templates: [
      { key: "professional", name: "Professional", desc: "Business-focused" },
      { key: "academic", name: "Academic", desc: "Research paper style" },
      { key: "feature", name: "Feature", desc: "Long-form article" },
    ],
    fields: [
      { name: "title", label: "Title", placeholder: "Enter article title...", type: "text", col: 12 },
      { name: "introduction", label: "Introduction", placeholder: "Write your introduction...", type: "textarea", col: 6 },
      { name: "conclusion", label: "Conclusion", placeholder: "Conclude your article...", type: "textarea", col: 6 },
      { name: "body", label: "Body", placeholder: "Write your article content...", type: "richtext", col: 12 },
    ],
  },
  {
    key: "press",
    slug: "pressReleases",
    label: "Press Release",
    icon: "megaphone",
    subtitle: "Create blogs, articles, and press releases",
    formTitle: "Create Press Release",
    titleField: "headline",
    templates: [
      { key: "corporate", name: "Corporate", desc: "Standard corporate release" },
      { key: "techLaunch", name: "Tech Launch", desc: "Product / tech announcement" },
      { key: "partnership", name: "Partnership", desc: "Partnership announcement" },
    ],
    fields: [
      { name: "headline", label: "Headline", placeholder: "Enter the headline...", type: "text", col: 12 },
      { name: "releaseInfo", label: "Release Info", placeholder: "FOR IMMEDIATE RELEASE · City, Date", type: "text", col: 6 },
      { name: "subHeadline", label: "Sub-headline", placeholder: "Supporting sub-headline...", type: "text", col: 6 },
      { name: "opening", label: "Opening", placeholder: "Opening paragraph...", type: "textarea", col: 12 },
      { name: "body", label: "Body", placeholder: "Main body...", type: "richtext", col: 12 },
      { name: "quote", label: "Quote", placeholder: "Executive quote...", type: "textarea", col: 12 },
      { name: "companyInfo", label: "Company Info", placeholder: "About the company...", type: "textarea", col: 6 },
      { name: "mediaContact", label: "Media Contact", placeholder: "Name, email, phone...", type: "text", col: 6 },
    ],
  },
  {
    key: "events",
    slug: "events",
    label: "Events/Webinars",
    icon: "calendar",
    subtitle: "Create and manage events and webinars",
    formTitle: "Create Event/Webinar",
    titleField: "title",
    templates: [
      { key: "conference", name: "Conference", desc: "Large-scale event" },
      { key: "webinar", name: "Webinar", desc: "Online presentation" },
      { key: "workshop", name: "Workshop", desc: "Hands-on session" },
    ],
    fields: [
      { name: "title", label: "Event Title", placeholder: "Enter event title...", type: "text", col: 8 },
      { name: "eventType", label: "Event Type", placeholder: "Conference, Webinar...", type: "text", col: 4 },
      { name: "overview", label: "Event Overview", placeholder: "Brief overview of the event...", type: "textarea", col: 12 },
      { name: "date", label: "Date", placeholder: "", type: "date", col: 3 },
      { name: "startTime", label: "Start Time", placeholder: "", type: "time", col: 3 },
      { name: "endTime", label: "End Time", placeholder: "", type: "time", col: 3 },
      { name: "venue", label: "Venue", placeholder: "Location...", type: "text", col: 3 },
      { name: "organizer", label: "Organizer", placeholder: "Organization name...", type: "text", col: 12 },
      { name: "details", label: "Event Details", placeholder: "Detailed description...", type: "richtext", col: 12 },
      { name: "objectives", label: "Event Objectives", placeholder: "Key objectives...", type: "textarea", col: 6 },
      { name: "targetAudience", label: "Target Audience", placeholder: "Who should attend...", type: "textarea", col: 6 },
      { name: "agenda", label: "Event Agenda", placeholder: "Schedule and topics...", type: "textarea", col: 6 },
      { name: "speakers", label: "Speakers/Guests", placeholder: "Speaker names and titles...", type: "textarea", col: 6 },
    ],
  },
];

// Additional content types (opened from the launcher; no templates).
export const EXTRA_TABS: TabDef[] = [
  {
    key: "products", slug: "products", label: "Products", icon: "box",
    subtitle: "Create and manage product entries", formTitle: "Create Product", titleField: "name", templates: [],
    fields: [
      { name: "name", label: "Name", placeholder: "Product name...", type: "text", col: 12 },
      { name: "summary", label: "Summary", placeholder: "Short product summary...", type: "textarea", col: 12 },
    ],
  },
  {
    key: "caseStudies", slug: "caseStudies", label: "Case Studies", icon: "bookmark",
    subtitle: "Create and manage case studies", formTitle: "Create Case Study", titleField: "title", templates: [],
    fields: [
      { name: "title", label: "Title", placeholder: "Case study title...", type: "text", col: 12 },
      { name: "client", label: "Client", placeholder: "Client name...", type: "text", col: 6 },
      { name: "challenge", label: "Challenge", placeholder: "The challenge...", type: "textarea", col: 6 },
      { name: "solution", label: "Solution", placeholder: "The solution...", type: "richtext", col: 12 },
      { name: "results", label: "Results", placeholder: "The results...", type: "textarea", col: 12 },
    ],
  },
  {
    key: "leadership", slug: "leadership", label: "Leadership Profiles", icon: "user",
    subtitle: "Create and manage leadership profiles", formTitle: "Create Leadership Profile", titleField: "name", templates: [],
    fields: [
      { name: "name", label: "Name", placeholder: "Full name...", type: "text", col: 6 },
      { name: "role", label: "Role", placeholder: "Job title...", type: "text", col: 6 },
      { name: "bio", label: "Biography", placeholder: "Bio...", type: "richtext", col: 12 },
    ],
  },
  {
    key: "faqs", slug: "faqs", label: "FAQ", icon: "question",
    subtitle: "Create and manage FAQs", formTitle: "Create FAQ", titleField: "question", templates: [],
    fields: [
      { name: "question", label: "Question", placeholder: "The question...", type: "text", col: 12 },
      { name: "answer", label: "Answer", placeholder: "The answer...", type: "richtext", col: 12 },
      { name: "category", label: "Category", placeholder: "Category...", type: "text", col: 6 },
    ],
  },
  {
    key: "careers", slug: "careers", label: "Careers", icon: "building",
    subtitle: "Create and manage job openings", formTitle: "Create Job Opening", titleField: "title", templates: [],
    fields: [
      { name: "title", label: "Job Title", placeholder: "Job title...", type: "text", col: 8 },
      { name: "department", label: "Department", placeholder: "Department...", type: "text", col: 4 },
      { name: "location", label: "Location", placeholder: "Location...", type: "text", col: 6 },
      { name: "employmentType", label: "Employment Type", placeholder: "Full-time...", type: "text", col: 6 },
      { name: "description", label: "Description", placeholder: "Role description...", type: "richtext", col: 12 },
      { name: "responsibilities", label: "Responsibilities", placeholder: "Key responsibilities...", type: "textarea", col: 6 },
      { name: "requirements", label: "Requirements", placeholder: "Requirements...", type: "textarea", col: 6 },
      { name: "applyUrl", label: "Apply URL", placeholder: "https://...", type: "text", col: 12 },
    ],
  },
  {
    key: "mediaGalleries", slug: "mediaGalleries", label: "Media Galleries", icon: "gallery",
    subtitle: "Create and manage media galleries", formTitle: "Create Media Gallery", titleField: "title", templates: [],
    fields: [{ name: "title", label: "Title", placeholder: "Gallery title...", type: "text", col: 12 }],
  },
  {
    key: "campaignMicrosites", slug: "campaignMicrosites", label: "Campaign Microsites", icon: "mic",
    subtitle: "Create and manage campaign microsites", formTitle: "Create Campaign Microsite", titleField: "title", templates: [],
    fields: [{ name: "title", label: "Title", placeholder: "Microsite title...", type: "text", col: 12 }],
  },
];

export const TABS = CORE_TABS; // back-compat
export const ALL_TABS: TabDef[] = [...CORE_TABS, ...EXTRA_TABS];
export const findTab = (key: string) => ALL_TABS.find((t) => t.key === key);

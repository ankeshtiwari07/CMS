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
  icon: "doc" | "book" | "megaphone" | "calendar";
  subtitle: string;
  formTitle: string;
  titleField: string; // field used as the doc title
  templates: TemplateDef[];
  fields: FieldDef[];
};

export const TABS: TabDef[] = [
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
    ],
  },
];

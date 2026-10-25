// Site wide copy. Fill MEDINA_FACTS with verified facts; empty entries are hidden.
export const SITE = {
  name: "OpenMedina",
  url: "https://openmedina.org",
  tagline: "Open government for Medina County, Ohio",
  description:
    "Ask questions about local government in Medina County, Ohio, see what is on your ballot, and explore official public data, each figure linked to its source.",
};

export interface Fact {
  label: string;
  detail: string;
  sourceUrl?: string;
}

/** Add verified facts here. Each card shows the label, detail and an optional source link. */
export const MEDINA_FACTS: Fact[] = [
  // { label: "", detail: "", sourceUrl: "" },
];

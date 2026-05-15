export type OccasionType =
  | "child_birthday"
  | "family_celebration"
  | "corporate_school"
  | "other";

export const OCCASION_OPTIONS: { value: OccasionType; label: string }[] = [
  { value: "child_birthday", label: "Child's birthday party" },
  { value: "family_celebration", label: "Family celebration" },
  { value: "corporate_school", label: "School, nursery, or corporate event" },
  { value: "other", label: "Other occasion" },
];

export const DEFAULT_OCCASION: OccasionType = "child_birthday";

export function occasionFieldCopy(type: OccasionType) {
  switch (type) {
    case "child_birthday":
      return {
        sectionTitle: "Birthday child",
        sectionBlurb:
          "Tell us about the star of the day — we'll tailor the visit around them.",
        primaryLabel: "Child's name",
        primaryPlaceholder: "Lily",
        secondaryLabel: "Child's age",
        secondaryPlaceholder: "5",
        showAge: true,
        addressLabel: "Party address",
        addressPlaceholder: "1 Royal Lane, Coventry, CV1 1AA",
        childrenCountLabel: "Number of children",
      };
    case "family_celebration":
      return {
        sectionTitle: "Who we're celebrating",
        sectionBlurb:
          "Christening, family gathering, or another celebration — we'll match the magic to your plans.",
        primaryLabel: "Name (guest of honour or family)",
        primaryPlaceholder: "e.g. Amelia, or The Smith family",
        secondaryLabel: "Age (optional)",
        secondaryPlaceholder: "e.g. 3 — leave blank if not relevant",
        showAge: true,
        addressLabel: "Party address",
        addressPlaceholder: "Where we'll be visiting",
        childrenCountLabel: "Approx. number of children (optional)",
      };
    case "corporate_school":
      return {
        sectionTitle: "Organisation or group",
        sectionBlurb:
          "Nursery visit, school fair, company family day — tell us who we're visiting.",
        primaryLabel: "School, nursery, company, or event name",
        primaryPlaceholder: "Little Stars Nursery",
        secondaryLabel: "",
        secondaryPlaceholder: "",
        showAge: false,
        addressLabel: "Venue address",
        addressPlaceholder: "Hall or venue address, postcode",
        childrenCountLabel: "Approx. number of children expected",
      };
    case "other":
      return {
        sectionTitle: "Your occasion",
        sectionBlurb: "A short line helps us prepare the right tone for your visit.",
        primaryLabel: "What are you celebrating?",
        primaryPlaceholder: "e.g. Charity fair, adoption party, photoshoot",
        secondaryLabel: "",
        secondaryPlaceholder: "",
        showAge: false,
        addressLabel: "Party / venue address",
        addressPlaceholder: "Where we'll be visiting",
        childrenCountLabel: "Approx. number of guests (optional)",
      };
    default:
      return occasionFieldCopy("child_birthday");
  }
}

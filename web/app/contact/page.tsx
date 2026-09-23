import { ContactPage } from "@/components/marketing/ContactPage";
import { CONTACT } from "@/content/marketing/contact";
import { CHROME } from "@/content/marketing/chrome";
import { buildMarketingMetadata } from "@/lib/marketing";

/** `/contact` — English, and the canonical URL. See `/pricing` for the shape. */

export const metadata = buildMarketingMetadata("contact", "en", CONTACT.en);

export default function Contact() {
  return <ContactPage content={CONTACT.en} chrome={CHROME.en} locale="en" />;
}

import { Metadata } from "next";
import FeaturesPageClient from "./FeaturesPageClient";

export const metadata: Metadata = {
  title: "Features",
  description: "Explore AOT CRM features including lead management, pipeline tracking, Microsoft 365 integration, and more.",
};

export default function FeaturesPage() {
  return <FeaturesPageClient />;
}

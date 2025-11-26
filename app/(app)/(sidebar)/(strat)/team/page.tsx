import { Metadata } from "next";
import TeamPage from "./page.client";

export const metadata: Metadata = {
  title: "Team Management",
};

export default function TeamManagementPage() {
  return <TeamPage />;
}

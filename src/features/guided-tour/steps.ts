export type TourStep = { target: string; title: string; description: string };

type Context = {
  team: boolean;
  member: boolean;
  hasTeams: boolean;
  orgAdmin: boolean;
  teamSettings: boolean;
};

export function tourSteps(context: Context): TourStep[] {
  const step = (target: string, title: string, description: string): TourStep => ({ target, title, description });
  if (context.team) {
    const steps = [step("workspace", "Your team workspace", "This sidebar belongs to your current team. Use Back to organisation to return to the organisation overview.")];
    if (!context.member) return [...steps, step("Back to organisation", "A members-only workspace", "Team content is private to its members. Return to the organisation to find a team you belong to or ask a team leader about joining.")];
    steps.push(
      step("Board", "Track your team's work", "Use the Board to organise tasks and follow their progress. This tour will not create or change any tasks."),
      step("Chat", "Keep conversations together", "Chat is where your team exchanges messages and discusses its work."),
      step("Documents", "Write together", "Documents are shared team documents with live collaborative editing. Opening a Document may require an individual access grant."),
      step("Files", "Share files securely", "Upload and access team files here. If access or key setup is required, follow the on-screen prompts; team membership alone does not unlock every file."),
      step("Members", "Meet your team", "See who belongs to the team and their roles."),
      step("AI inbox", "Find AI results", "AI results appear in the AI inbox. The unread count helps you spot new results; availability depends on your team's AI settings."),
    );
    if (context.teamSettings) steps.push(step("Team settings", "Configure your team", "Manage team configuration here. This control is only shown to people with permission."));
    return steps;
  }
  const steps = [
    step("workspace", "Your organisation", "You are browsing your current organisation. The header shows its name and lets you switch when you belong to multiple organisations."),
    step("Overview", "Start with the overview", "The Overview is your organisation's starting page."),
    step("Teams", "Find your team", context.hasTeams ? "Browse teams here, or use your team links in the sidebar to enter a team workspace." : "You are not in a team yet. Browse Teams to find a team and ask its leader about joining."),
    step("Resources", "Plan shared resources", "Find shared resources and manage their bookings here."),
  ];
  if (context.orgAdmin) steps.push(
    step("People", "Manage organisation members", "Manage the people in your organisation. This section is available to organisation administrators."),
    step("Settings", "Configure the organisation", "Manage organisation configuration here. Administration does not grant access to private team content."),
  );
  return steps;
}

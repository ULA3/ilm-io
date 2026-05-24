/** Sidebar selection when generating for the whole class, not one learner. */
export const GENERAL_CLASS_ID = "__general__";

export function isGeneralClassSelection(id: string | null | undefined): boolean {
  return id === GENERAL_CLASS_ID;
}

/**
 * Shared geometry for the prompt boxes.
 *
 * There are three prompt boxes on screen (Home's hero and its closing CTA,
 * both `AgentV2`, plus the Agent tab's `PromptComposer`) and each one holds a
 * Web/Mobile switch. Before this, every one of those parts carried its own
 * radius literal: the two cards disagreed with each other (15 vs 18) and the
 * switches agreed with neither, so a switch could sit inside a card that was
 * visibly less round than it was.
 *
 * One value, imported everywhere, is the only way those stay in step.
 */

/** The outer curve of a prompt card — the ring, not the fill inside it. */
export const PROMPT_RADIUS = 18;

// Ring THICKNESS is deliberately not shared: Home's card uses 1.5 and the
// Agent tab's uses 1, and at their different sizes that reads as the same
// weight of stroke. Only the curve has to agree.

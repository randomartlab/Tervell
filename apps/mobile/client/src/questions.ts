import type {Interaction} from './model';

export interface QuestionDraft {
  selected: string[];
  custom: string;
}
export type QuestionDrafts = Record<string, QuestionDraft>;
export const questionKey = (requestId: string, index: number) => requestId + ':' + index;

export function chooseQuestionOption(draft: QuestionDraft | undefined, label: string, multiple: boolean): QuestionDraft {
  const selected = draft?.selected ?? [];
  return {
    selected: multiple ? selected.includes(label) ? selected.filter(value => value !== label) : [...selected, label] : [label],
    custom: ''
  };
}

/** 只提交此请求当前问题的回答，同名问题在其他请求中的草稿不能混入。 */
export function questionAnswers(interaction: Interaction, drafts: QuestionDrafts): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [index, question] of (interaction.questions ?? []).entries()) {
    const draft = drafts[questionKey(interaction.requestId, index)];
    const selected = question.options.filter(option => draft?.selected.includes(option.label)).map(option => option.label);
    const value = draft?.custom.trim() || (question.multiSelect ? selected : selected.slice(0, 1)).join(', ');
    if (value) result[question.question] = value;
  }
  return result;
}

export function readQuestionDrafts(value: string | null): QuestionDrafts {
  if (!value || value.length > 250000) return {};
  try {
    const data: unknown = JSON.parse(value);
    if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
    const result: QuestionDrafts = {};
    for (const [key, entry] of Object.entries(data).slice(-100)) {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
      const draft = entry as Record<string, unknown>;
      if (typeof draft.custom !== 'string' || draft.custom.length > 4000 || !Array.isArray(draft.selected)) continue;
      result[key] = {custom: draft.custom, selected: draft.selected.filter((item): item is string => typeof item === 'string' && item.length <= 500).slice(0, 20)};
    }
    return result;
  } catch { return {}; }
}

// Morph slider cards. Placeholder: every card repeats the same sample case study — swap in
// each one's own details, and its case study link as `href` (until then the link shows as
// plain text).
// `colors` paint the card's picture from the hero palette: [0] → [2] left to right (that's
// also the colour its strands melt in), with a soft highlight of [1] towards the top left.
const SAMPLE = {
  tags: 'Fintech · iOS & Android',
  year: '2025',
  title: 'Rebuilding everyday banking for first-time savers',
  summary:
    'A ground-up redesign of onboarding, goals and transfers for a neobank whose users had never held a savings account.',
  role: 'Lead product designer',
  outcome: '+38% onboarding completion',
  href: null,
}

export const SLIDES = [
  { id: 'one', ...SAMPLE, colors: ['#023e8a', '#48cae4', '#0096c7'] },
  { id: 'two', ...SAMPLE, colors: ['#0077b6', '#caf0f8', '#00b4d8'] },
  { id: 'three', ...SAMPLE, colors: ['#03045e', '#0096c7', '#0077b6'] },
  { id: 'four', ...SAMPLE, colors: ['#00b4d8', '#caf0f8', '#48cae4'] },
  { id: 'five', ...SAMPLE, colors: ['#0096c7', '#ade8f4', '#023e8a'] },
  { id: 'six', ...SAMPLE, colors: ['#48cae4', '#ffffff', '#0077b6'] },
]

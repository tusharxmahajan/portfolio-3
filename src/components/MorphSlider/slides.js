// Morph slider cards. Placeholder: every card repeats the same sample case study — swap in
// each one's own details, and its case study link as `href` (until then the link shows, but
// goes nowhere).
// `layout` picks how the details are laid out (CardDetails.jsx) — one of each for now, to
// compare: classic · metric · numbered · chips · minimal · footer.
// `colors` paint the card's picture from the hero palette: [0] → [2] left to right,
// with a soft highlight of [1] towards the top left.
const SAMPLE = {
  tags: ['Fintech', 'iOS & Android'],
  year: '2025',
  title: 'Rebuilding everyday banking for first-time savers',
  summary:
    'A ground-up redesign of onboarding, goals and transfers for a neobank whose users had never held a savings account.',
  role: 'Lead product designer',
  metric: '+38%', // the outcome, as a figure …
  metricLabel: 'onboarding completion', // … and what it measures
  href: null,
}

export const SLIDES = [
  { id: 'one', layout: 'classic', ...SAMPLE, colors: ['#023e8a', '#48cae4', '#0096c7'] },
  { id: 'two', layout: 'metric', ...SAMPLE, colors: ['#0077b6', '#caf0f8', '#00b4d8'] },
  { id: 'three', layout: 'numbered', ...SAMPLE, colors: ['#03045e', '#0096c7', '#0077b6'] },
  { id: 'four', layout: 'chips', ...SAMPLE, colors: ['#00b4d8', '#caf0f8', '#48cae4'] },
  { id: 'five', layout: 'minimal', ...SAMPLE, colors: ['#0096c7', '#ade8f4', '#023e8a'] },
  { id: 'six', layout: 'footer', ...SAMPLE, colors: ['#48cae4', '#ffffff', '#0077b6'] },
]

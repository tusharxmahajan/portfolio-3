// Selected work — placeholder content and media. Replace freely: each project needs a
// title, description and at least two or three media items (images or SVGs; width/height
// are the file's own size, used for its aspect ratio).
import approvalFlows1 from '../../assets/work/approval-flows-1.svg'
import approvalFlows2 from '../../assets/work/approval-flows-2.svg'
import approvalFlows3 from '../../assets/work/approval-flows-3.svg'
import ledger1 from '../../assets/work/ledger-1.svg'
import ledger2 from '../../assets/work/ledger-2.svg'
import ledger3 from '../../assets/work/ledger-3.svg'
import spendConsole1 from '../../assets/work/spend-console-1.svg'
import spendConsole2 from '../../assets/work/spend-console-2.svg'
import spendConsole3 from '../../assets/work/spend-console-3.svg'

export const PROJECTS = [
  {
    id: 'spend-console',
    title: 'Spend Console',
    description:
      'Brought every company purchase, from request to reconciliation, into one calm, searchable workspace',
    href: '#spend-console',
    media: [
      { src: spendConsole1, width: 480, height: 600, alt: 'Mobile spend approval screen' },
      { src: spendConsole2, width: 1000, height: 600, alt: 'Spend dashboard with KPIs and a monthly chart' },
      { src: spendConsole3, width: 600, height: 600, alt: 'Spend trend card' },
    ],
  },
  {
    id: 'ledger',
    tag: 'Heavy data',
    title: 'Ledger',
    year: '2024',
    description:
      'Turned dense financial tables into views that finance teams can scan, filter and act on at month-end',
    capabilities: ['Data tables', 'Dashboards', 'Interaction design', 'Usability testing'],
    href: '#ledger',
    media: [
      { src: ledger1, width: 600, height: 600, alt: 'Spend breakdown by category' },
      { src: ledger2, width: 1000, height: 600, alt: 'Transactions table with bulk actions' },
      { src: ledger3, width: 480, height: 600, alt: 'Transaction detail panel' },
    ],
  },
  {
    id: 'approval-flows',
    tag: 'Complex workflows',
    title: 'Approval Flows',
    year: '2023',
    description:
      'Designed a no-code rule builder that lets admins set up multi-step approvals in minutes',
    capabilities: ['Systems thinking', 'Rule builders', 'Prototyping', 'Enterprise UX'],
    href: '#approval-flows',
    media: [
      { src: approvalFlows1, width: 1000, height: 600, alt: 'Approval flow builder canvas' },
      { src: approvalFlows2, width: 480, height: 600, alt: 'Mobile approval request' },
      { src: approvalFlows3, width: 600, height: 600, alt: 'Approval rule settings with timeline' },
    ],
  },
]

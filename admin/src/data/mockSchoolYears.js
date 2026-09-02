export const mockSchoolYears = [
  { id: 'sy-2026-2027', name: '2026-2027', isCurrent: true },
  { id: 'sy-2025-2026', name: '2025-2026', isCurrent: false },
  { id: 'sy-2024-2025', name: '2024-2025', isCurrent: false },
  { id: 'sy-2023-2024', name: '2023-2024', isCurrent: false },
  { id: 'sy-2022-2023', name: '2022-2023', isCurrent: false },
]

export const mockStrands = {
  'sy-2026-2027': [
    { id: 'strand-gas', name: 'GAS', sections: ['A', 'B'] },
    { id: 'strand-stem', name: 'STEM', sections: ['A', 'B', 'C'] },
    { id: 'strand-abm', name: 'ABM', sections: ['A'] },
    { id: 'strand-humss', name: 'HUMSS', sections: ['A', 'B'] },
    { id: 'strand-tvl', name: 'TVL', sections: ['A', 'B', 'C'] },
  ],
  'sy-2025-2026': [
    { id: 'strand-gas-25', name: 'GAS', sections: ['A'] },
    { id: 'strand-stem-25', name: 'STEM', sections: ['A', 'B'] },
  ],
}

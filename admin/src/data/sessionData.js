export const schoolYears = [
  { id: 'sy-2026-2027', name: '2026-2027' },
  { id: 'sy-2025-2026', name: '2025-2026' },
  { id: 'sy-2024-2025', name: '2024-2025' },
  { id: 'sy-2023-2024', name: '2023-2024' },
  { id: 'sy-2022-2023', name: '2022-2023' },
]

export const strandCatalog = {
  'sy-2026-2027': [
    { id: 'strand-gas', name: 'GAS', sections: ['A', 'B'] },
    { id: 'strand-stem', name: 'STEM', sections: ['A', 'B', 'C'] },
    { id: 'strand-abm', name: 'ABM', sections: ['A'] },
    { id: 'strand-humss', name: 'HUMSS', sections: ['A', 'B'] },
    { id: 'strand-tvl', name: 'TVL', sections: ['A', 'B', 'C', 'D'] },
  ],
  'sy-2025-2026': [
    { id: 'strand-gas-25', name: 'GAS', sections: ['A'] },
    { id: 'strand-stem-25', name: 'STEM', sections: ['A', 'B'] },
    { id: 'strand-abm-25', name: 'ABM', sections: ['A'] },
    { id: 'strand-tvl-25', name: 'TVL', sections: ['A', 'B'] },
  ],
  'sy-2024-2025': [
    { id: 'strand-gas-24', name: 'GAS', sections: ['A', 'B'] },
    { id: 'strand-stem-24', name: 'STEM', sections: ['A', 'B'] },
    { id: 'strand-abm-24', name: 'ABM', sections: ['A'] },
    { id: 'strand-humss-24', name: 'HUMSS', sections: ['A'] },
  ],
  'sy-2023-2024': [
    { id: 'strand-gas-23', name: 'GAS', sections: ['A'] },
    { id: 'strand-stem-23', name: 'STEM', sections: ['A', 'B'] },
    { id: 'strand-abm-23', name: 'ABM', sections: ['A'] },
  ],
  'sy-2022-2023': [
    { id: 'strand-gas-22', name: 'GAS', sections: ['A'] },
    { id: 'strand-stem-22', name: 'STEM', sections: ['A', 'B', 'C'] },
  ],
}

export const initialStudents = [
  { id: 'student-001', schoolYearId: 'sy-2026-2027', strandId: 'strand-stem', sectionId: 'A', name: 'Juan Dela Cruz', status: 'pending' },
  { id: 'student-002', schoolYearId: 'sy-2026-2027', strandId: 'strand-stem', sectionId: 'A', name: 'Maria Santos', status: 'captured' },
  { id: 'student-003', schoolYearId: 'sy-2026-2027', strandId: 'strand-stem', sectionId: 'A', name: 'Pedro Reyes', status: 'captured' },
  { id: 'student-004', schoolYearId: 'sy-2026-2027', strandId: 'strand-stem', sectionId: 'A', name: 'Ana Garcia', status: 'in_progress' },
  { id: 'student-005', schoolYearId: 'sy-2026-2027', strandId: 'strand-stem', sectionId: 'A', name: 'Mark Santos', status: 'pending' },
  { id: 'student-006', schoolYearId: 'sy-2026-2027', strandId: 'strand-stem', sectionId: 'B', name: 'Rosa Villanueva', status: 'pending' },
  { id: 'student-007', schoolYearId: 'sy-2026-2027', strandId: 'strand-stem', sectionId: 'B', name: 'Leo Bautista', status: 'retake_needed' },
  { id: 'student-008', schoolYearId: 'sy-2026-2027', strandId: 'strand-stem', sectionId: 'B', name: 'Carmen Reyes', status: 'editing' },
  { id: 'student-009', schoolYearId: 'sy-2026-2027', strandId: 'strand-stem', sectionId: 'B', name: 'Emmanuel Cruz', status: 'approved' },
  { id: 'student-010', schoolYearId: 'sy-2026-2027', strandId: 'strand-gas', sectionId: 'A', name: 'Grace Lim', status: 'pending' },
  { id: 'student-011', schoolYearId: 'sy-2025-2026', strandId: 'strand-stem-25', sectionId: 'A', name: 'Mika Dela Rosa', status: 'pending' },
  { id: 'student-012', schoolYearId: 'sy-2024-2025', strandId: 'strand-abm-24', sectionId: 'A', name: 'Nico Tolentino', status: 'captured' },
  { id: 'student-013', schoolYearId: 'sy-2022-2023', strandId: 'strand-stem-22', sectionId: 'C', name: 'Ari Serrano', status: 'pending' },
]

export const defaultEditorSettings = {
  brightness: 100,
  contrast: 100,
  exposure: 100,
  saturation: 100,
  temperature: 0,
  sharpness: 0,
  grayscale: false,
  rotate: 0,
  crop: 0,
  straighten: 0,
}

export const initialPhotos = [
  {
    id: 'photo-001',
    studentId: 'student-009',
    schoolYearId: 'sy-2026-2027',
    strandId: 'strand-stem',
    sectionId: 'B',
    source: 'camera',
    status: 'approved',
    originalPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80',
    approvedPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80',
    createdAt: '2026-08-20T09:00:00Z',
  },
  {
    id: 'photo-002',
    studentId: 'student-008',
    schoolYearId: 'sy-2026-2027',
    strandId: 'strand-stem',
    sectionId: 'B',
    source: 'existing_upload',
    status: 'editing',
    originalPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80',
    approvedPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80',
    createdAt: '2026-08-20T10:30:00Z',
  },
  {
    id: 'photo-003',
    studentId: 'student-007',
    schoolYearId: 'sy-2026-2027',
    strandId: 'strand-stem',
    sectionId: 'B',
    source: 'camera',
    status: 'retake_needed',
    originalPhoto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=80',
    approvedPhoto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=80',
    createdAt: '2026-08-20T11:15:00Z',
  },
]

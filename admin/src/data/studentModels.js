export const studentDataModel = {
  id: 'string',
  schoolYearId: 'string',
  strandId: 'string',
  sectionId: 'string | null',
  studentNumber: 'string',
  lrn: 'string | null',
  firstName: 'string',
  middleName: 'string | null',
  lastName: 'string',
  suffix: 'string | null',
  gender: 'string | null',
  email: 'string | null',
  status: 'pending | captured | editing | retake_needed | approved | archived',
  photoStatus: 'not_started | captured | editing | approved',
  createdAt: 'timestamp',
  updatedAt: 'timestamp',
}

export const schoolYearDataModel = {
  id: 'string',
  name: '2026-2027',
  startYear: 'number',
  endYear: 'number',
  isCurrent: 'boolean',
  archived: 'boolean',
}

export const strandDataModel = {
  id: 'string',
  schoolYearId: 'string',
  name: 'STEM',
  code: 'string | null',
  sections: ['A', 'B', 'C'],
  archived: 'boolean',
}

export const sectionDataModel = {
  id: 'string',
  schoolYearId: 'string',
  strandId: 'string | null',
  name: 'A',
  description: 'string | null',
}

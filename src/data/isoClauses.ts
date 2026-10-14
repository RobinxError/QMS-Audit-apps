import { ISOClauseInfo } from '../types/audit';

export const ISO_9001_CLAUSES: ISOClauseInfo[] = [
  {
    clauseNumber: '4.1',
    title: 'Understanding the organization and its context',
    description: 'Determining internal and external issues relevant to purpose and strategic direction.',
    sweaterIndustryApplication: 'Factory strategic planning, compliance with BGMEA / buyer codes of conduct, geopolitical stability, energy access in industrial zones.',
  },
  {
    clauseNumber: '4.4',
    title: 'Quality management system and its processes',
    description: 'Establishing, implementing, maintaining, and continually improving QMS processes.',
    sweaterIndustryApplication: 'Process interaction from Yarn Inward -> Knitting -> Linking -> Washing -> Finishing -> QC -> Packing & Dispatch.',
  },
  {
    clauseNumber: '5.2',
    title: 'Quality Policy',
    description: 'Top management commitment to quality, communicated and understood within the factory.',
    sweaterIndustryApplication: 'Quality policy displayed in English & Bengali at knitting floors, trims store, and packing halls, understood by line supervisors.',
  },
  {
    clauseNumber: '6.1',
    title: 'Actions to address risks and opportunities',
    description: 'Risk assessment covering operational, safety, and buyer compliance risks.',
    sweaterIndustryApplication: 'Risk assessment for new sweater styles (e.g., high-twist yarns, intarsia knitting, lycra spirality, delicate trims pull safety).',
  },
  {
    clauseNumber: '7.1.5',
    title: 'Monitoring and Measuring Resources',
    description: 'Ensuring fitness of resources used for valid and reliable monitoring and measurement results.',
    sweaterIndustryApplication: 'Calibration of digital weight scales, pull testers (90N), 9-point metal detectors (1.0mm/1.2mm ferrous sphere), lux meters, and steel tape measures.',
  },
  {
    clauseNumber: '7.2',
    title: 'Competence',
    description: 'Determining necessary competence of persons doing work affecting QMS performance.',
    sweaterIndustryApplication: 'Skill matrix for linking machine operators, Jacquard knitters, 100% inspectors, Farnsworth-Munsell 100 hue color blindness tests for shade matchers.',
  },
  {
    clauseNumber: '7.5',
    title: 'Documented Information',
    description: 'Creating, updating, and controlling documented information required by QMS and buyers.',
    sweaterIndustryApplication: 'Master list of documents, tech-pack distribution logs, obsolete document stamping, retention of inspection logs for minimum 2 years.',
  },
  {
    clauseNumber: '8.1',
    title: 'Operational Planning and Control',
    description: 'Planning, implementing, and controlling processes needed to meet requirements.',
    sweaterIndustryApplication: 'Manufacturing Control Process (MCP), Pre-Production (PP) meeting minutes, sample sealed tag approval prior to bulk knitting.',
  },
  {
    clauseNumber: '8.4',
    title: 'Control of externally provided processes, products and services',
    description: 'Ensuring purchased products/services conform to requirements.',
    sweaterIndustryApplication: 'Yarn supplier evaluation, outsourced embroidery or printing vendor audits, trims OEKO-TEX standard verification.',
  },
  {
    clauseNumber: '8.5.1',
    title: 'Control of Production and Service Provision',
    description: 'Controlled conditions including availability of documented info, monitoring resources, suitable equipment.',
    sweaterIndustryApplication: 'Line pilot runs, approved golden sample on the line, standard operating parameters for milling & softener bath, knitting tension check.',
  },
  {
    clauseNumber: '8.5.2',
    title: 'Identification and Traceability',
    description: 'Identifying process outputs and status with respect to monitoring and measurement requirements.',
    sweaterIndustryApplication: 'Yarn lot number, bundle ticketing, knitting machine panel tracking cards, wash lot identification, barcode labels.',
  },
  {
    clauseNumber: '8.5.4',
    title: 'Preservation',
    description: 'Preserving outputs during production and delivery to ensure conformity to requirements.',
    sweaterIndustryApplication: 'Carton stacking on pallets (off floor), moisture barrier sheets, silica gel pouches, polybag ventilation, carton drop test.',
  },
  {
    clauseNumber: '8.6',
    title: 'Release of Products and Services',
    description: 'Verifying that product requirements have been met prior to delivery.',
    sweaterIndustryApplication: 'Final AQL inspection (Level II, Major 1.5, Minor 2.5), 100% metal detector passing log, buyer QA final audit report.',
  },
  {
    clauseNumber: '8.7',
    title: 'Control of Nonconforming Outputs',
    description: 'Identifying and controlling nonconforming outputs to prevent unintended use or delivery.',
    sweaterIndustryApplication: 'Red tagged nonconforming rejection boxes at knitting, linking, and finishing; quarantined rejected yarn lots; stain mending isolation.',
  },
  {
    clauseNumber: '9.2',
    title: 'Internal Audit',
    description: 'Conducting internal audits at planned intervals to verify QMS conformity.',
    sweaterIndustryApplication: 'Planned bi-annual internal QMS audits, cross-departmental auditing by certified lead auditors, reporting to top management.',
  },
  {
    clauseNumber: '10.2',
    title: 'Nonconformity and Corrective Action',
    description: 'Reacting to nonconformity, evaluating root cause, implementing corrective actions, reviewing effectiveness.',
    sweaterIndustryApplication: 'Formal CAPA logged for internal/buyer audit findings, 5-Why root cause analysis, target dates, verification and closure by QMS Manager.',
  },
];

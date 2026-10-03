export type PathClass =
  | 'category'
  | 'pattern'
  | 'number-string'
  | 'datetime'
  | 'boolean'
  | 'identifier'
  | 'free-text'
  | 'nested'
  | 'array'
  | 'open-map'
  | 'rejected';

export type DatetimeFormat = 'date' | 'date-time';

export type PathStats = {
  path: string;
  pathClass: PathClass;
  presenceRate: number;
  nullRate: number;
  emptyStringRate: number;
  emptyArrayRate: number;
  emptyObjectRate: number;
  cardinality: number;
  missingKeyRate: number;
  categoryValues?: string[];
  datetimeFormat?: DatetimeFormat;
  itemPathClass?: PathClass;
  itemDatetimeFormat?: DatetimeFormat;
  itemCategoryValues?: string[];
  typeVariants?: string[];
};

export type DateOrderInvariant = {
  earlierPath: string;
  laterPath: string;
};

export type ParentChildInvariant = {
  parentPath: string;
  childPath: string;
  arrayPath: string;
};

export type ValueEquality = {
  scope: 'document' | 'array-item';
  arrayPath?: string;
  paths: string[];
};

export type CrossTypeLink = {
  localPath: string;
  remoteDocumentType: string;
  remoteField: string;
};

export type ProfileVersion = {
  versionId: string;
  documentType: string;
  contour: string;
  snapshotId: string;
  createdAt: string;
  paths: PathStats[];
  mappingIndex: string;
  aliases: Array<{ from: string; to: string }>;
  corpusValueFingerprints: Set<string>;
  sampleDocumentCount: number;
  activatable: boolean;
  identifierPaths?: string[];
  dateShiftPaths?: string[];
  dateOrderInvariants?: DateOrderInvariant[];
  parentChildInvariants?: ParentChildInvariant[];
  valueEqualities?: ValueEquality[];
  crossTypeLinks?: CrossTypeLink[];
};

export type ProfileDiff = {
  fromVersionId: string;
  toVersionId: string;
  added: string[];
  removed: string[];
  typeChanged: string[];
  enumChanged: string[];
  aliasApplied: string[];
  rejected: string[];
  keptByHysteresis: string[];
};

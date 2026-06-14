import type { BusSign, Tag } from '@/types/sign';

export interface FieldComparison<T> {
  left: T;
  right: T;
  isSame: boolean;
}

export interface TagsComparison {
  leftOnly: Tag[];
  rightOnly: Tag[];
  both: Tag[];
}

export interface SignComparisonResult {
  city: FieldComparison<string>;
  era: FieldComparison<string>;
  inUse: FieldComparison<boolean>;
  styleDescription: FieldComparison<string>;
  tags: TagsComparison;
  allFields: Array<{
    key: keyof Omit<SignComparisonResult, 'allFields' | 'tags'>;
    label: string;
    isSame: boolean;
  }>;
}

function normalizeTags(tags?: Tag[]): Tag[] {
  return tags ?? [];
}

function compareTags(leftTags: Tag[], rightTags: Tag[]): TagsComparison {
  const leftSet = new Map(leftTags.map((t) => [t.id, t]));
  const rightSet = new Map(rightTags.map((t) => [t.id, t]));

  const leftOnly: Tag[] = [];
  const rightOnly: Tag[] = [];
  const both: Tag[] = [];

  for (const tag of leftTags) {
    if (rightSet.has(tag.id)) {
      both.push(tag);
    } else {
      leftOnly.push(tag);
    }
  }

  for (const tag of rightTags) {
    if (!leftSet.has(tag.id)) {
      rightOnly.push(tag);
    }
  }

  return { leftOnly, rightOnly, both };
}

export function compareSigns(left: BusSign, right: BusSign): SignComparisonResult {
  const city: FieldComparison<string> = {
    left: left.city,
    right: right.city,
    isSame: left.city === right.city,
  };

  const era: FieldComparison<string> = {
    left: left.era,
    right: right.era,
    isSame: left.era === right.era,
  };

  const inUse: FieldComparison<boolean> = {
    left: left.inUse,
    right: right.inUse,
    isSame: left.inUse === right.inUse,
  };

  const styleDescription: FieldComparison<string> = {
    left: left.styleDescription,
    right: right.styleDescription,
    isSame: left.styleDescription === right.styleDescription,
  };

  const tags = compareTags(normalizeTags(left.tags), normalizeTags(right.tags));

  const allFields = [
    { key: 'city' as const, label: '城市', isSame: city.isSame },
    { key: 'era' as const, label: '年代', isSame: era.isSame },
    { key: 'inUse' as const, label: '使用状态', isSame: inUse.isSame },
    { key: 'styleDescription' as const, label: '样式描述', isSame: styleDescription.isSame },
  ];

  return {
    city,
    era,
    inUse,
    styleDescription,
    tags,
    allFields,
  };
}

export function formatInUse(inUse: boolean): string {
  return inUse ? '使用中' : '已停用';
}

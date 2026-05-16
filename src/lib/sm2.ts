export type SM2Input = {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
};

export type SM2Result = {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReviewAt: Date;
};

export type Quality = 1 | 2 | 3 | 4;

export function sm2(quality: Quality, prev: SM2Input): SM2Result {
  let { easeFactor, intervalDays, repetitions } = prev;

  if (quality === 1) {
    repetitions = 0;
    intervalDays = 0.0007; // ~1 minute
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  } else if (quality === 2) {
    if (repetitions === 0) {
      intervalDays = 1;
      repetitions = 1;
    } else {
      intervalDays = intervalDays * 1.2;
    }
    easeFactor = Math.max(1.3, easeFactor - 0.15);
  } else if (quality === 3) {
    if (repetitions === 0) {
      intervalDays = 1;
      repetitions = 1;
    } else if (repetitions === 1) {
      intervalDays = 6;
      repetitions = 2;
    } else {
      intervalDays = intervalDays * easeFactor;
      repetitions += 1;
    }
  } else {
    if (repetitions === 0) {
      intervalDays = 1;
      repetitions = 1;
    } else if (repetitions === 1) {
      intervalDays = 6;
      repetitions = 2;
    } else {
      intervalDays = intervalDays * easeFactor * 1.3;
      repetitions += 1;
    }
    easeFactor += 0.15;
  }

  const nextReviewAt = new Date(
    Date.now() + intervalDays * 24 * 60 * 60 * 1000
  );

  return { easeFactor, intervalDays, repetitions, nextReviewAt };
}

export function formatInterval(days: number): string {
  if (days < 0.0014) return "<1m";
  if (days < 0.042) return `${Math.round(days * 24 * 60)}m`;
  if (days < 1) return `${Math.round(days * 24)}h`;
  if (days < 30) return `${Math.round(days)}d`;
  return `${Math.round(days / 30)}mo`;
}

export function previewIntervals(prev: SM2Input): Record<Quality, string> {
  return {
    1: formatInterval(sm2(1, prev).intervalDays),
    2: formatInterval(sm2(2, prev).intervalDays),
    3: formatInterval(sm2(3, prev).intervalDays),
    4: formatInterval(sm2(4, prev).intervalDays),
  };
}

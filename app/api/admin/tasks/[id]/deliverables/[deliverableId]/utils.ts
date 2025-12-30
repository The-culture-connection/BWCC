// Shared helper to resolve deliverables from mixed arrays (strings + objects)
export function resolveDeliverable(deliverables: any[], deliverableId: string) {
  if (!Array.isArray(deliverables)) return { kind: 'none' as const };

  // 1) Index addressing: legacy-3 or obj-3
  const m = deliverableId.match(/^(legacy|obj)-(\d+)$/);
  if (m) {
    const idx = Number(m[2]);
    const d = deliverables[idx];
    if (idx >= 0 && idx < deliverables.length && d) {
      return { kind: 'byIndex' as const, idx, d };
    }
  }

  // 2) ID addressing for objects inside mixed arrays
  const obj = deliverables.find((d: any) => d && typeof d === 'object' && d.id === deliverableId);
  if (obj) return { kind: 'byId' as const, d: obj };

  // 3) If they passed a raw URL
  if (deliverableId.startsWith('http')) {
    return { kind: 'rawUrl' as const, url: deliverableId };
  }

  return { kind: 'none' as const };
}


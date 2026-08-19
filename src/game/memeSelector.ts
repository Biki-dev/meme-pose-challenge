// src/game/memeSelector.ts
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export class MemeSelector {
  private bag: string[] = [];
  private allMemeIds: string[];

  constructor(allMemeIds: string[]) {
    this.allMemeIds = allMemeIds;
    this.refill(null);
  }

  private refill(lastUsedId: string | null) {
    this.bag = shuffle(this.allMemeIds);
    // Avoid immediate repeat
    if (this.bag[0] === lastUsedId && this.bag.length > 1) {
      [this.bag[0], this.bag[1]] = [this.bag[1], this.bag[0]];
    }
  }

  next(lastUsedId: string | null): string {
    if (this.bag.length === 0) this.refill(lastUsedId);
    return this.bag.pop()!;
  }
}
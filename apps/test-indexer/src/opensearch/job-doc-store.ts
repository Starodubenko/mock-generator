export class JobDocStore {
  private readonly ids = new Map<string, Set<string>>();

  private key(index: string, jobId: string): string {
    return `${index}:${jobId}`;
  }

  remember(index: string, jobId: string, documentIds: string[]): void {
    const key = this.key(index, jobId);
    const bucket = this.ids.get(key) ?? new Set<string>();
    for (const id of documentIds) {
      bucket.add(id);
    }
    this.ids.set(key, bucket);
  }

  list(index: string, jobId: string): string[] {
    return [...(this.ids.get(this.key(index, jobId)) ?? [])];
  }

  forget(index: string, jobId: string): void {
    this.ids.delete(this.key(index, jobId));
  }
}

export class CollapseState {
  private collapsed = new Set<string>();
  toggle(path: string) {
    if (this.collapsed.has(path)) this.collapsed.delete(path); else this.collapsed.add(path);
  }
  isCollapsed(path: string) { return this.collapsed.has(path); }
  collapse(path: string) { this.collapsed.add(path); }
  expand(path: string) { this.collapsed.delete(path); }
  reset() { this.collapsed.clear(); }
  serialize() { return Array.from(this.collapsed); }
  restore(paths: string[]) { this.collapsed = new Set(paths); }
}

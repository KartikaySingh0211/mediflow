import { PatternTraceService } from '../../pattern-tracing/PatternTraceService';

export interface BillComponent {
  getId(): string;
  getName(): string;
  getTotal(): number;
  getDescription(): string;
  isGroup(): boolean;
  getChildren?(): BillComponent[];
}

// Leaf: Individual Hospital Charge Line Item
export class BillItem implements BillComponent {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly category: string,
    public readonly unitPrice: number,
    public readonly quantity: number = 1
  ) {}

  getId(): string { return this.id; }
  getName(): string { return this.name; }
  isGroup(): boolean { return false; }

  getTotal(): number {
    return this.unitPrice * this.quantity;
  }

  getDescription(): string {
    return `${this.name} (${this.quantity}x @ $${this.unitPrice.toFixed(2)}) = $${this.getTotal().toFixed(2)}`;
  }
}

// Composite: Departmental or Service Group
export class BillGroup implements BillComponent {
  public readonly id: string;
  private children: BillComponent[] = [];

  constructor(public readonly name: string, initialChildren: BillComponent[] = []) {
    this.id = `grp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    this.children = [...initialChildren];
  }

  getId(): string { return this.id; }
  getName(): string { return this.name; }
  isGroup(): boolean { return true; }

  add(component: BillComponent): this {
    this.children.push(component);
    PatternTraceService.emit({
      pattern: 'Composite',
      category: 'Structural',
      module: 'Hospital Billing',
      step: 1,
      message: `Composite: Added "${component.getName()}" to group "${this.name}"`
    });
    return this;
  }

  remove(componentId: string): boolean {
    const prevLen = this.children.length;
    this.children = this.children.filter(c => c.getId() !== componentId);
    return this.children.length < prevLen;
  }

  getChildren(): BillComponent[] {
    return [...this.children];
  }

  getTotal(): number {
    const total = this.children.reduce((acc, child) => acc + child.getTotal(), 0);
    return Math.round(total * 100) / 100;
  }

  getDescription(): string {
    return `${this.name} (${this.children.length} charges) — Subtotal: $${this.getTotal().toFixed(2)}`;
  }
}

// Root Bill Builder Helper using Composite Structure
export class CompositeBillCalculator {
  static buildInvoiceTree(groupsData: Array<{ name: string; items: Array<{ id?: string; name: string; category?: string; amount: number; quantity: number }> }>): {
    rootGroup: BillGroup;
    subtotal: number;
    tax: number;
    total: number;
  } {
    const root = new BillGroup('Comprehensive Inpatient Hospital Bill');

    groupsData.forEach(gData => {
      const group = new BillGroup(gData.name);
      gData.items.forEach((item, idx) => {
        group.add(new BillItem(item.id || `bi_${Date.now()}_${idx}`, item.name, item.category || gData.name, item.amount, item.quantity));
      });
      root.add(group);
    });

    const subtotal = root.getTotal();
    const tax = Math.round(subtotal * 0.05 * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;

    PatternTraceService.emit({
      pattern: 'Composite',
      category: 'Structural',
      module: 'Hospital Billing',
      step: 2,
      message: `Composite: Recursive invoice total calculated ($${total.toFixed(2)}) across ${groupsData.length} service groups`
    });

    return { rootGroup: root, subtotal, tax, total };
  }
}

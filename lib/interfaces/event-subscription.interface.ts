export interface EventSubscription {
  priority: number;
  prepend: boolean;
  order: number;
  register: () => void;
}

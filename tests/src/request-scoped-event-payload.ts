/**
 * Class used to test injected payloads on the RequestScoped listener.
 * Each value stored in the instance represents a different type of payload.
 */
export class RequestScopedEventPayload {
  public objectValue: Record<string, any>;
  public arrayValue: any[];
  public stringValue: string;

  constructor() {
    this.objectValue = {};
    this.arrayValue = [];
    this.stringValue = '';
  }

  public setPayload(value: any) {
    if (Array.isArray(value)) {
      this.arrayValue = value;
    } else if (typeof value === 'string') {
      this.stringValue = value;
    } else {
      this.objectValue = value;
    }
  }
}

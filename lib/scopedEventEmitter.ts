import {event, EventEmitter2, eventNS} from "eventemitter2";
import {Inject, Injectable, Scope} from "@nestjs/common";
import {ContextId, ContextIdFactory, REQUEST} from "@nestjs/core";

export class ScopedEvent {
    constructor(public event: any, public context: ContextId) {}
}

@Injectable({ scope: Scope.REQUEST } )
export class ScopedEventEmitter {
    private readonly contextId: ContextId;
    constructor(@Inject(REQUEST) private request: any, private readonly emitter: EventEmitter2) {
        this.contextId = ContextIdFactory.getByRequest(request);
    }

    private enrichWithContext(values: any[]): any[] {
        return values.map(a => new ScopedEvent(a, this.contextId));
    }

    emitAsync(event: event | eventNS, ...values: any[]): Promise<any[]> {
        return this.emitter.emitAsync(event, ...this.enrichWithContext(values));
    }

    emit(event: event | eventNS, ...values: any[]): boolean {
        return this.emitter.emit(event, ...this.enrichWithContext(values));
    }
}

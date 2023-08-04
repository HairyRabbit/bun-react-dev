import { reload } from "./reload";

type DisposeHandler = () => void;
type AcceptHandler = (args: { module: any, deps: any[] }) => void;
type AcceptCallbackObject = {
  deps: string[],
  callback: AcceptHandler
}

export class HotModule {
  data: any = {}
  is_lock: boolean = false
  is_declined: boolean = false
  is_accepted: boolean = false
  accept_handlers: AcceptCallbackObject[] = []
  dispose_handlers: DisposeHandler[] = []

  constructor(public id: string) {}
  static create(id: string) {
    return new HotModule(id)
  }

  lock(): void {
    this.is_lock = true;
  }

  dispose(callback: DisposeHandler): void {
    this.dispose_handlers.push(callback);
  }

  invalidate(): void {
    reload();
  }

  decline(): void {
    this.is_declined = true;
  }

  accept(_deps: string[], callback: true | AcceptHandler = true): void {
    if (this.is_lock) return

    if (!this.is_accepted) {
      // sendSocketMessage({ id: this.id, type: "hotAccept" });
      this.is_accepted = true;
    }

    if (!Array.isArray(_deps)) {
      callback = _deps || callback;
      _deps = [];
    }

    if (callback === true) {
      callback = () => {};
    }

    const deps = _deps.map((dep) => {
      // const ext = dep.split(".").pop();
      // if (!ext) {
      //   dep += ".js";
      // } else if (ext !== "js") {
      //   dep += ".proxy.js";
      // }
      return new URL(dep, `${window.location.origin}${this.id}`).pathname;
    })

    this.accept_handlers.push({
      deps,
      callback,
    })
  }
}
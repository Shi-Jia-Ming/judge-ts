export interface ISystemStatus {
  version: string;
  cpus: number;
  langs: string[];
  /** @deprecated */
  "ext-features": string[];
  occupied: number;
  queue: number;
}
import { Port } from "./port";
export declare class BoundPorts {
    private readonly ports;
    getBinding(port: Port): Port;
    setBinding(key: Port, value: Port): BoundPorts;
    iterator(): Iterable<[Port, Port]>;
}

/// <reference types="node" />
import dockerode, { ContainerInspectInfo } from "dockerode";
import { Duration } from "node-duration";
import { Command, ContainerName, ExitCode } from "./docker-client";
import { Host } from "./docker-client-factory";
import { Port } from "./port";
export declare type Id = string;
export declare type HealthCheckStatus = "none" | "starting" | "unhealthy" | "healthy";
export declare type InspectResult = {
    internalPorts: Port[];
    internalIp: Host;
    hostPorts: Port[];
    name: ContainerName;
    healthCheckStatus: HealthCheckStatus;
};
declare type ExecInspectResult = {
    exitCode: ExitCode;
};
interface Exec {
    start(): Promise<NodeJS.ReadableStream>;
    inspect(): Promise<ExecInspectResult>;
}
declare type ExecOptions = {
    cmd: Command[];
    attachStdout: true;
    attachStderr: true;
};
declare type StopOptions = {
    timeout: Duration;
};
declare type RemoveOptions = {
    removeVolumes: boolean;
};
export interface Container {
    getId(): Id;
    start(): Promise<void>;
    stop(options: StopOptions): Promise<void>;
    remove(options: RemoveOptions): Promise<void>;
    exec(options: ExecOptions): Promise<Exec>;
    logs(): Promise<NodeJS.ReadableStream>;
    inspect(): Promise<InspectResult>;
    inspectFull(): Promise<ContainerInspectInfo>;
}
export declare class DockerodeContainer implements Container {
    private readonly container;
    constructor(container: dockerode.Container);
    getId(): Id;
    start(): Promise<void>;
    stop(options: StopOptions): Promise<void>;
    remove(options: RemoveOptions): Promise<void>;
    exec(options: ExecOptions): Promise<Exec>;
    logs(): Promise<NodeJS.ReadableStream>;
    inspectFull(): Promise<ContainerInspectInfo>;
    inspect(): Promise<InspectResult>;
    private getName;
    private getInternalPorts;
    private getInternalIp;
    private getHostPorts;
    private getHealthCheckStatus;
}
export {};

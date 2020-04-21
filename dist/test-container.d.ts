import { ContainerInspectInfo } from "dockerode";
import { Duration } from "node-duration";
import { Id as ContainerId, InspectResult } from "./container";
import { AuthConfig, BindMode, Command, ContainerName, Dir, EnvKey, EnvValue, ExecResult, NetworkMode, TmpFs } from "./docker-client";
import { Host } from "./docker-client-factory";
import { Port } from "./port";
import { WaitStrategy } from "./wait-strategy";
export interface TestContainer {
    start(): Promise<StartedTestContainer>;
    withEnv(key: EnvKey, value: EnvValue): this;
    withCmd(cmd: Command[]): this;
    withTmpFs(tmpFs: TmpFs): this;
    withExposedPorts(...ports: Port[]): this;
    withBindMount(source: Dir, target: Dir, bindMode: BindMode): this;
    withWaitStrategy(waitStrategy: WaitStrategy): this;
    withStartupTimeout(startupTimeout: Duration): this;
    withNetworkMode(networkMode: NetworkMode): this;
    withDefaultLogDriver(): this;
    withAuthentication(authConfig: AuthConfig): this;
}
export interface OptionalStopOptions {
    timeout?: Duration;
    removeVolumes?: boolean;
}
interface StopOptions {
    timeout: Duration;
    removeVolumes: boolean;
}
export declare const DEFAULT_STOP_OPTIONS: StopOptions;
export interface StartedTestContainer {
    stop(options?: OptionalStopOptions): Promise<StoppedTestContainer>;
    remove(): Promise<void>;
    getContainerIpAddress(): Host;
    getMappedPort(port: Port): Port;
    getName(): ContainerName;
    getId(): ContainerId;
    inspect(): Promise<InspectResult>;
    inspectFull(): Promise<ContainerInspectInfo>;
    exec(command: Command[]): Promise<ExecResult>;
}
export interface StoppedTestContainer {
}
export {};

import Dockerode, { ContainerInfo, Network } from "dockerode";
import { Duration } from "node-duration";
import { BoundPorts } from "./bound-ports";
import { Container } from "./container";
import { Host } from "./docker-client-factory";
import { CreateNetworkOptions } from "./network";
import { RepoTag } from "./repo-tag";
export declare type Command = string;
export declare type ContainerName = string;
export declare type NetworkMode = string;
export declare type ExitCode = number;
export declare type EnvKey = string;
export declare type EnvValue = string;
export declare type Env = {
    [key in EnvKey]: EnvValue;
};
export declare type Dir = string;
export declare type TmpFs = {
    [dir in Dir]: Dir;
};
export declare type HealthCheck = {
    test: string;
    interval?: Duration;
    timeout?: Duration;
    retries?: number;
    startPeriod?: Duration;
};
export declare type BuildContext = string;
export declare type BuildArgs = {
    [key in EnvKey]: EnvValue;
};
export declare type StreamOutput = string;
export declare type ExecResult = {
    output: StreamOutput;
    exitCode: ExitCode;
};
export declare type BindMode = "rw" | "ro";
export declare type BindMount = {
    source: Dir;
    target: Dir;
    bindMode: BindMode;
};
export declare type AuthConfig = {
    username: string;
    password: string;
    serveraddress: string;
    email?: string;
};
export declare type LogConfig = {
    logDriver: string;
    logOpts?: object;
};
declare type CreateOptions = {
    repoTag: RepoTag;
    env: Env;
    cmd: Command[];
    bindMounts: BindMount[];
    tmpFs: TmpFs;
    boundPorts: BoundPorts;
    name?: ContainerName;
    networkMode?: NetworkMode;
    healthCheck?: HealthCheck;
    useDefaultLogDriver: boolean;
};
export interface DockerClient {
    pull(repoTag: RepoTag, authConfig?: AuthConfig): Promise<void>;
    create(options: CreateOptions): Promise<Container>;
    getContainer(id: string): Container;
    retrieveContainerInfoByName(name: string): Promise<ContainerInfo>;
    getNetwork(id: string): Network;
    createNetwork(options: CreateNetworkOptions): Promise<string>;
    removeNetwork(id: string): Promise<void>;
    start(container: Container): Promise<void>;
    exec(container: Container, command: Command[]): Promise<ExecResult>;
    buildImage(repoTag: RepoTag, context: BuildContext, buildArgs: BuildArgs): Promise<void>;
    fetchRepoTags(): Promise<RepoTag[]>;
    getHost(): Host;
}
export declare class DockerodeClient implements DockerClient {
    private readonly host;
    private readonly dockerode;
    constructor(host: Host, dockerode: Dockerode);
    pull(repoTag: RepoTag, authConfig?: AuthConfig): Promise<void>;
    getContainer(id: string): Container;
    retrieveContainerInfoByName(name: string): Promise<ContainerInfo>;
    create(options: CreateOptions): Promise<Container>;
    getNetwork(id: string): Network;
    createNetwork(options: CreateNetworkOptions): Promise<string>;
    removeNetwork(id: string): Promise<void>;
    start(container: Container): Promise<void>;
    exec(container: Container, command: Command[]): Promise<ExecResult>;
    buildImage(repoTag: RepoTag, context: BuildContext, buildArgs: BuildArgs): Promise<void>;
    fetchRepoTags(): Promise<RepoTag[]>;
    getHost(): Host;
    private isDanglingImage;
    private getEnv;
    private getHealthCheck;
    private toNanos;
    private getExposedPorts;
    private getPortBindings;
    private getBindMounts;
    private getLogConfig;
}
export {};

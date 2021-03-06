import Dockerode, { ContainerInfo, Network, PortMap as DockerodePortBindings } from "dockerode";
import { Duration, TemporalUnit } from "node-duration";
import streamToArray from "stream-to-array";
import tar from "tar-fs";
import { BoundPorts } from "./bound-ports";
import { Container, DockerodeContainer } from "./container";
import { Host } from "./docker-client-factory";
import log from "./logger";
import { CreateNetworkOptions, NetworkInfo } from "./network";
import { PortString } from "./port";
import { RepoTag } from "./repo-tag";

export type Command = string;
export type ContainerName = string;
export type NetworkMode = string;
export type ExitCode = number;

export type EnvKey = string;
export type EnvValue = string;
export type Env = { [key in EnvKey]: EnvValue };
type DockerodeEnvironment = string[];

export type Dir = string;

export type TmpFs = { [dir in Dir]: Dir };

export type HealthCheck = {
  test: string;
  interval?: Duration;
  timeout?: Duration;
  retries?: number;
  startPeriod?: Duration;
};

type DockerodeHealthCheck = {
  Test: string[];
  Interval: number;
  Timeout: number;
  Retries: number;
  StartPeriod: number;
};

export type BuildContext = string;
export type BuildArgs = { [key in EnvKey]: EnvValue };

export type StreamOutput = string;
export type ExecResult = { output: StreamOutput; exitCode: ExitCode };
type DockerodeExposedPorts = { [port in PortString]: {} };

export type BindMode = "rw" | "ro";
export type BindMount = {
  source: Dir;
  target: Dir;
  bindMode: BindMode;
};
type DockerodeBindMount = string;

export type AuthConfig = {
  username: string;
  password: string;
  serveraddress: string;
  email?: string;
};

export type LogConfig = {
  logDriver: string;
  logOpts?: object;
};
type DockerodeLogConfig = {
  Type: string;
  Config: any;
};

type CreateOptions = {
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
  findNetworkByName(name: string): Promise<NetworkInfo>;
  start(container: Container): Promise<void>;
  exec(container: Container, command: Command[]): Promise<ExecResult>;
  buildImage(repoTag: RepoTag, context: BuildContext, buildArgs: BuildArgs): Promise<void>;
  fetchRepoTags(): Promise<RepoTag[]>;
  getHost(): Host;
}

export class DockerodeClient implements DockerClient {
  constructor(private readonly host: Host, private readonly dockerode: Dockerode) {}

  public async pull(repoTag: RepoTag, authConfig?: AuthConfig): Promise<void> {
    log.info(`Pulling image: ${repoTag}`);
    const stream = await this.dockerode.pull(repoTag.toString(), {
      authconfig: authConfig
    });
    await streamToArray(stream);
  }

  public getContainer(id: string): Container {
    log.info(`Getting container by id: ${id}`);
    return new DockerodeContainer(this.dockerode.getContainer(id));
  }

  public async retrieveContainerInfoByName(name: string): Promise<ContainerInfo> {
    log.info(`Looking for a container with the name: ${name}`);
    const infos = await this.dockerode.listContainers({
      filters: {
        name: [name]
      }
    });
    if (!infos.length) {
      throw new Error(`Container with the name of ${name} not found`);
    }
    return infos[0];
  }

  public async create(options: CreateOptions): Promise<Container> {
    log.info(`Creating container for image: ${options.repoTag}`);

    const dockerodeContainer = await this.dockerode.createContainer({
      name: options.name,
      Image: options.repoTag.toString(),
      Env: this.getEnv(options.env),
      ExposedPorts: this.getExposedPorts(options.boundPorts),
      Cmd: options.cmd,
      // @ts-ignore
      Healthcheck: this.getHealthCheck(options.healthCheck),
      HostConfig: {
        NetworkMode: options.networkMode,
        PortBindings: this.getPortBindings(options.boundPorts),
        Binds: this.getBindMounts(options.bindMounts),
        Tmpfs: options.tmpFs,
        LogConfig: this.getLogConfig(options.useDefaultLogDriver)
      }
    });

    return new DockerodeContainer(dockerodeContainer);
  }

  public getNetwork(id: string): Network {
    return this.dockerode.getNetwork(id);
  }

  public async createNetwork(options: CreateNetworkOptions): Promise<string> {
    log.info(`Creating network ${options.name}`);
    const network: Network = await this.dockerode.createNetwork(options);
    return network.id;
  }

  public async removeNetwork(id: string): Promise<void> {
    log.info(`Removing network ${id}`);
    const network = this.getNetwork(id);
    const { message } = await network.remove();
    if (message) {
      log.warn(message);
    }
  }

  public async findNetworkByName(name: string): Promise<NetworkInfo> {
    log.info(`Looking for a network with the name ${name}`);
    const networks = await this.dockerode.listNetworks({
      filters: {
        name: [name]
      }
    });
    if (!networks.length) {
      throw new Error(`Network with the name of ${name} not found`);
    }
    return networks[0];
  }

  public start(container: Container): Promise<void> {
    log.info(`Starting container with ID: ${container.getId()}`);
    return container.start();
  }

  public async exec(container: Container, command: Command[]): Promise<ExecResult> {
    const exec = await container.exec({
      cmd: command,
      attachStdout: true,
      attachStderr: true
    });

    const stream = await exec.start();
    const output = Buffer.concat(await streamToArray(stream)).toString();
    const { exitCode } = await exec.inspect();

    return { output, exitCode };
  }

  public async buildImage(repoTag: RepoTag, context: BuildContext, buildArgs: BuildArgs): Promise<void> {
    log.info(`Building image '${repoTag.toString()}' with context '${context}'`);

    const tarStream = tar.pack(context);
    const stream = await this.dockerode.buildImage(tarStream, {
      buildargs: buildArgs,
      t: repoTag.toString()
    });
    await streamToArray(stream);
  }

  public async fetchRepoTags(): Promise<RepoTag[]> {
    const images = await this.dockerode.listImages();

    return images.reduce((repoTags: RepoTag[], image) => {
      if (this.isDanglingImage(image)) {
        return repoTags;
      }
      const imageRepoTags = image.RepoTags.map(imageRepoTag => {
        const [imageName, tag] = imageRepoTag.split(":");
        return new RepoTag(imageName, tag);
      });
      return [...repoTags, ...imageRepoTags];
    }, []);
  }

  public getHost(): Host {
    return this.host;
  }

  private isDanglingImage(image: Dockerode.ImageInfo) {
    return image.RepoTags === null;
  }

  private getEnv(env: Env): DockerodeEnvironment {
    return Object.entries(env).reduce((dockerodeEnvironment, [key, value]) => {
      return [...dockerodeEnvironment, `${key}=${value}`];
    }, [] as DockerodeEnvironment);
  }

  private getHealthCheck(healthCheck?: HealthCheck): DockerodeHealthCheck | undefined {
    if (healthCheck === undefined) {
      return undefined;
    }
    return {
      Test: ["CMD-SHELL", healthCheck.test],
      Interval: healthCheck.interval ? this.toNanos(healthCheck.interval) : 0,
      Timeout: healthCheck.timeout ? this.toNanos(healthCheck.timeout) : 0,
      Retries: healthCheck.retries || 0,
      StartPeriod: healthCheck.startPeriod ? this.toNanos(healthCheck.startPeriod) : 0
    };
  }

  private toNanos(duration: Duration): number {
    return duration.get(TemporalUnit.MILLISECONDS) * 1e6;
  }

  private getExposedPorts(boundPorts: BoundPorts): DockerodeExposedPorts {
    const dockerodeExposedPorts: DockerodeExposedPorts = {};
    for (const [internalPort] of boundPorts.iterator()) {
      dockerodeExposedPorts[internalPort.toString()] = {};
    }
    return dockerodeExposedPorts;
  }

  private getPortBindings(boundPorts: BoundPorts): DockerodePortBindings {
    const dockerodePortBindings: DockerodePortBindings = {};
    for (const [internalPort, hostPort] of boundPorts.iterator()) {
      dockerodePortBindings[internalPort.toString()] = [{ HostPort: hostPort.toString() }];
    }
    return dockerodePortBindings;
  }

  private getBindMounts(bindMounts: BindMount[]): DockerodeBindMount[] {
    return bindMounts.map(({ source, target, bindMode }) => `${source}:${target}:${bindMode}`);
  }

  private getLogConfig(useDefaultLogDriver: boolean): DockerodeLogConfig | undefined {
    if (!useDefaultLogDriver) {
      return undefined;
    }

    return {
      Type: "json-file",
      Config: {}
    };
  }
}

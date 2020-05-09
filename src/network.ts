import { DockerodeClientFactory } from "./docker-client-factory";
import { isEmptyObj, lowerKeysDeep } from "./utils";
import { RandomUuid } from "./uuid";

export type CreateNetworkOptions = {
  name: string;
  driver: "bridge" | "overlay" | string; // third option is for user-installed custom network drivers
  checkDuplicate: boolean;
  internal: boolean;
  attachable: boolean;
  ingress: boolean;
  enableIPv6: boolean;
  labels?: { [key: string]: string };
  options?: { [key: string]: string };
};

export type NetworkInfo = CreateNetworkOptions & {
  id: string;
  containers: string[];
  created: string;
};

class StartedNetwork {
  private initialized = false;
  get isInitialized() {
    return this.initialized;
  }

  constructor(
    private readonly id: string,
    private readonly options: CreateNetworkOptions,
    private readonly dockerClientFactory: DockerodeClientFactory
  ) {
    this.initialized = true;
  }

  private get network() {
    return this.dockerClientFactory.getClient().getNetwork(this.id);
  }

  public getId(): string {
    return this.id!;
  }

  public getName(): string {
    return this.options.name;
  }

  public async close(): Promise<void> {
    await this.dockerClientFactory.getClient().removeNetwork(this.id);
    this.initialized = false;
  }

  public async inspect(): Promise<NetworkInfo> {
    try {
      const info = await this.network.inspect();
      return lowerKeysDeep(info, ["IPAM"]);
    } catch (ex) {
      this.initialized = false;
      throw ex;
    }
  }

  public async hasContainers(): Promise<boolean> {
    const { containers } = await this.inspect();
    return !isEmptyObj(containers);
  }
}

export class Network {
  public static async newNetwork(
    partialOptions: Partial<CreateNetworkOptions> = {},
    dockerClientFactory: DockerodeClientFactory = new DockerodeClientFactory()
  ): Promise<StartedNetwork> {
    const options: CreateNetworkOptions = {
      name: new RandomUuid().nextUuid(),
      driver: "bridge",
      checkDuplicate: true,
      internal: true,
      attachable: false,
      ingress: false,
      enableIPv6: false,
      ...partialOptions
    };
    const id = await dockerClientFactory.getClient().createNetwork(options);
    return new StartedNetwork(id, options, dockerClientFactory);
  }

  public static async fromId(
    id: string,
    dockerClientFactory: DockerodeClientFactory = new DockerodeClientFactory()
  ): Promise<StartedNetwork> {
    const network = dockerClientFactory.getClient().getNetwork(id);
    const info = await network.inspect();
    return new StartedNetwork(id, lowerKeysDeep(info, ["IPAM"]), dockerClientFactory);
  }

  public static async fromName(
    name: string,
    dockerClientFactory: DockerodeClientFactory = new DockerodeClientFactory()
  ): Promise<StartedNetwork> {
    const info = lowerKeysDeep(await dockerClientFactory.getClient().findNetworkByName(name), ["IPAM"]);
    return new StartedNetwork(info.id, info, dockerClientFactory);
  }

  constructor() {
    throw new Error(`use static newNetwork() method to instantiate network`);
  }
}

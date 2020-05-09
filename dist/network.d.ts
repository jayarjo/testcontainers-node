import { DockerodeClientFactory } from "./docker-client-factory";
export declare type CreateNetworkOptions = {
    name: string;
    driver: "bridge" | "overlay" | string;
    checkDuplicate: boolean;
    internal: boolean;
    attachable: boolean;
    ingress: boolean;
    enableIPv6: boolean;
    labels?: {
        [key: string]: string;
    };
    options?: {
        [key: string]: string;
    };
};
export declare type NetworkInfo = CreateNetworkOptions & {
    id: string;
    containers: string[];
    created: string;
};
export interface TestNetwork {
    isInitialized: boolean;
    getId(): string;
    getName(): string;
    close(): Promise<void>;
    inspect(): Promise<NetworkInfo>;
    hasContainers(): Promise<boolean>;
}
declare class StartedNetwork implements TestNetwork {
    private readonly id;
    private readonly options;
    private readonly dockerClientFactory;
    private initialized;
    get isInitialized(): boolean;
    constructor(id: string, options: CreateNetworkOptions, dockerClientFactory: DockerodeClientFactory);
    private get network();
    getId(): string;
    getName(): string;
    close(): Promise<void>;
    inspect(): Promise<NetworkInfo>;
    hasContainers(): Promise<boolean>;
}
export declare class Network {
    static newNetwork(partialOptions?: Partial<CreateNetworkOptions>, dockerClientFactory?: DockerodeClientFactory): Promise<StartedNetwork>;
    static fromId(id: string, dockerClientFactory?: DockerodeClientFactory): Promise<StartedNetwork>;
    static fromName(name: string, dockerClientFactory?: DockerodeClientFactory): Promise<StartedNetwork>;
    constructor();
}
export {};

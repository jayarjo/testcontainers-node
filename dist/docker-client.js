"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_duration_1 = require("node-duration");
const stream_to_array_1 = __importDefault(require("stream-to-array"));
const tar_fs_1 = __importDefault(require("tar-fs"));
const container_1 = require("./container");
const logger_1 = __importDefault(require("./logger"));
const repo_tag_1 = require("./repo-tag");
class DockerodeClient {
    constructor(host, dockerode) {
        this.host = host;
        this.dockerode = dockerode;
    }
    pull(repoTag, authConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.default.info(`Pulling image: ${repoTag}`);
            const stream = yield this.dockerode.pull(repoTag.toString(), {
                authconfig: authConfig
            });
            yield stream_to_array_1.default(stream);
        });
    }
    getContainer(id) {
        logger_1.default.info(`Getting container by id: ${id}`);
        return new container_1.DockerodeContainer(this.dockerode.getContainer(id));
    }
    retrieveContainerInfoByName(name) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.default.info(`Looking for a container with the name: ${name}`);
            const infos = yield this.dockerode.listContainers({
                filters: {
                    name: [name]
                }
            });
            if (!infos.length) {
                throw new Error(`Container with the name of ${name} not found`);
            }
            return infos[0];
        });
    }
    create(options) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.default.info(`Creating container for image: ${options.repoTag}`);
            const dockerodeContainer = yield this.dockerode.createContainer({
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
            return new container_1.DockerodeContainer(dockerodeContainer);
        });
    }
    getNetwork(id) {
        return this.dockerode.getNetwork(id);
    }
    createNetwork(options) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.default.info(`Creating network ${options.name}`);
            const network = yield this.dockerode.createNetwork(options);
            return network.id;
        });
    }
    removeNetwork(id) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.default.info(`Removing network ${id}`);
            const network = this.getNetwork(id);
            const { message } = yield network.remove();
            if (message) {
                logger_1.default.warn(message);
            }
        });
    }
    findNetworkByName(name) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.default.info(`Looking for a network with the name ${name}`);
            const networks = yield this.dockerode.listNetworks({
                filters: {
                    name: [name]
                }
            });
            if (!networks.length) {
                throw new Error(`Network with the name of ${name} not found`);
            }
            return networks[0];
        });
    }
    start(container) {
        logger_1.default.info(`Starting container with ID: ${container.getId()}`);
        return container.start();
    }
    exec(container, command) {
        return __awaiter(this, void 0, void 0, function* () {
            const exec = yield container.exec({
                cmd: command,
                attachStdout: true,
                attachStderr: true
            });
            const stream = yield exec.start();
            const output = Buffer.concat(yield stream_to_array_1.default(stream)).toString();
            const { exitCode } = yield exec.inspect();
            return { output, exitCode };
        });
    }
    buildImage(repoTag, context, buildArgs) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.default.info(`Building image '${repoTag.toString()}' with context '${context}'`);
            const tarStream = tar_fs_1.default.pack(context);
            const stream = yield this.dockerode.buildImage(tarStream, {
                buildargs: buildArgs,
                t: repoTag.toString()
            });
            yield stream_to_array_1.default(stream);
        });
    }
    fetchRepoTags() {
        return __awaiter(this, void 0, void 0, function* () {
            const images = yield this.dockerode.listImages();
            return images.reduce((repoTags, image) => {
                if (this.isDanglingImage(image)) {
                    return repoTags;
                }
                const imageRepoTags = image.RepoTags.map(imageRepoTag => {
                    const [imageName, tag] = imageRepoTag.split(":");
                    return new repo_tag_1.RepoTag(imageName, tag);
                });
                return [...repoTags, ...imageRepoTags];
            }, []);
        });
    }
    getHost() {
        return this.host;
    }
    isDanglingImage(image) {
        return image.RepoTags === null;
    }
    getEnv(env) {
        return Object.entries(env).reduce((dockerodeEnvironment, [key, value]) => {
            return [...dockerodeEnvironment, `${key}=${value}`];
        }, []);
    }
    getHealthCheck(healthCheck) {
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
    toNanos(duration) {
        return duration.get(node_duration_1.TemporalUnit.MILLISECONDS) * 1e6;
    }
    getExposedPorts(boundPorts) {
        const dockerodeExposedPorts = {};
        for (const [internalPort] of boundPorts.iterator()) {
            dockerodeExposedPorts[internalPort.toString()] = {};
        }
        return dockerodeExposedPorts;
    }
    getPortBindings(boundPorts) {
        const dockerodePortBindings = {};
        for (const [internalPort, hostPort] of boundPorts.iterator()) {
            dockerodePortBindings[internalPort.toString()] = [{ HostPort: hostPort.toString() }];
        }
        return dockerodePortBindings;
    }
    getBindMounts(bindMounts) {
        return bindMounts.map(({ source, target, bindMode }) => `${source}:${target}:${bindMode}`);
    }
    getLogConfig(useDefaultLogDriver) {
        if (!useDefaultLogDriver) {
            return undefined;
        }
        return {
            Type: "json-file",
            Config: {}
        };
    }
}
exports.DockerodeClient = DockerodeClient;

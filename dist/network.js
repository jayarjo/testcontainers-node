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
Object.defineProperty(exports, "__esModule", { value: true });
const docker_client_factory_1 = require("./docker-client-factory");
const utils_1 = require("./utils");
const uuid_1 = require("./uuid");
class StartedNetwork {
    constructor(id, options, dockerClientFactory) {
        this.id = id;
        this.options = options;
        this.dockerClientFactory = dockerClientFactory;
        this.initialized = false;
        this.initialized = true;
    }
    get isInitialized() {
        return this.initialized;
    }
    get network() {
        return this.dockerClientFactory.getClient().getNetwork(this.id);
    }
    getId() {
        return this.id;
    }
    getName() {
        return this.options.name;
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.dockerClientFactory.getClient().removeNetwork(this.id);
            this.initialized = false;
        });
    }
    inspect() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const info = yield this.network.inspect();
                return utils_1.lowerKeysDeep(info, ["IPAM"]);
            }
            catch (ex) {
                this.initialized = false;
                throw ex;
            }
        });
    }
    hasContainers() {
        return __awaiter(this, void 0, void 0, function* () {
            const { containers } = yield this.inspect();
            return !utils_1.isEmptyObj(containers);
        });
    }
}
class Network {
    static newNetwork(partialOptions = {}, dockerClientFactory = new docker_client_factory_1.DockerodeClientFactory()) {
        return __awaiter(this, void 0, void 0, function* () {
            const options = Object.assign({ name: new uuid_1.RandomUuid().nextUuid(), driver: "bridge", checkDuplicate: true, internal: false, attachable: false, ingress: false, enableIPv6: false }, partialOptions);
            const id = yield dockerClientFactory.getClient().createNetwork(options);
            return new StartedNetwork(id, options, dockerClientFactory);
        });
    }
    static byId(id, dockerClientFactory = new docker_client_factory_1.DockerodeClientFactory()) {
        return __awaiter(this, void 0, void 0, function* () {
            const network = dockerClientFactory.getClient().getNetwork(id);
            const info = yield network.inspect();
            return new StartedNetwork(id, utils_1.lowerKeysDeep(info, ["IPAM"]), dockerClientFactory);
        });
    }
    static byName(name, dockerClientFactory = new docker_client_factory_1.DockerodeClientFactory()) {
        return __awaiter(this, void 0, void 0, function* () {
            const info = utils_1.lowerKeysDeep(yield dockerClientFactory.getClient().findNetworkByName(name), ["IPAM"]);
            return new StartedNetwork(info.id, info, dockerClientFactory);
        });
    }
    constructor() {
        throw new Error(`use static newNetwork() method to instantiate network`);
    }
}
exports.Network = Network;

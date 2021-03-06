import Dockerode from "dockerode";
import { GenericContainer } from "./generic-container";
import { Network } from "./network";

jest.setTimeout(45000);

describe("Network", () => {
  it("should start container in a user-defined network", async () => {
    const network = await Network.newNetwork();

    const container = await new GenericContainer("cristianrgreco/testcontainer", "1.1.12")
      .withNetworkMode(network.getName())
      .start();

    const dockerodeClient = new Dockerode();

    const dockerContainer = dockerodeClient.getContainer(container.getId());
    const containerInfo = await dockerContainer.inspect();
    expect(containerInfo.HostConfig.NetworkMode).toBe(network.getName());

    await container.stop();
    await network.close();
  });

  it("two containers in user-defined network should be able to ping each other by name", async () => {
    const network = await Network.newNetwork();

    const container1 = await new GenericContainer("cristianrgreco/testcontainer", "1.1.12")
      .withName("container1")
      .withNetworkMode(network.getName())
      .start();

    const container2 = await new GenericContainer("cristianrgreco/testcontainer", "1.1.12")
      .withName("container2")
      .withNetworkMode(network.getName())
      .start();

    const { exitCode } = await container1.exec(["ping", "-c", "3", "container2"]);

    expect(exitCode).toBe(0);

    await container1.stop();
    await container2.stop();
    await network.close();
  });

  it("instantiating Network should throw", () => {
    expect(() => new Network()).toThrowError("use static newNetwork() method to instantiate network");
  });

  it("Network.byId()", async () => {
    const network1 = await Network.newNetwork();
    const network2 = await Network.byId(network1.getId());

    expect(network1.getName()).toBe(network2.getName());
    await network1.close();
    await expect(network2.inspect()).rejects.toThrow();
    expect(network2.isInitialized).toBe(false);
  });

  it("Network.byName()", async () => {
    const name = `testcontainers-${Date.now()}`;
    const network1 = await Network.newNetwork({
      name
    });
    const network2 = await Network.byName(name);
    expect(network1.getId()).toBe(network2.getId());
    await network1.close();
  });

  it("Network.hasContainers()", async () => {
    const network = await Network.newNetwork();
    const container = await new GenericContainer("cristianrgreco/testcontainer", "1.1.12")
      .withName("container")
      .withNetworkMode(network.getName())
      .start();

    await expect(network.hasContainers()).resolves.toBe(true);
    await container.stop();
    await expect(network.hasContainers()).resolves.toBe(false);
    await network.close();
  });
});

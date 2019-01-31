"use strict";

describe("Scripts", function() {
  // deps
  const fs = require("fs");
  const path = require("path");
  const proxyquire = require("proxyquire");

  const config = require(path.resolve("src/utils/config"));
  const utils = require(path.resolve("src/utils/utils"));
  const cst = require(path.resolve("src/const"));
  const heredoc = cst.HEREDOC;
  const heredoc_2 = cst.HEREDOC_2;
  const heredoc_3 = cst.HEREDOC_3;

  const scripts = require(path.resolve(
    "src/" + config.getJobNameForPipeline3() + "/scripts"
  ));

  it("should generate remote commands.", function() {
    // setup
    var ssh = {
      user: "user",
      ip: "host",
      port: "22"
    };

    // verif
    expect(scripts.remote(ssh, "echo test")).toEqual(
      "ssh -T " +
        ssh.user +
        "@" +
        ssh.ip +
        " -p " +
        ssh.port +
        " /bin/bash <<" +
        heredoc +
        "\n" +
        "echo test\n" +
        heredoc +
        "\n"
    );
  });

  it("should add or remove trailing slashes to directory paths.", function() {
    expect(scripts.trailSlash("foo", true)).toEqual("foo/");
    expect(scripts.trailSlash("foo/", true)).toEqual("foo/");
    expect(scripts.trailSlash("foo/")).toEqual("foo/");
    expect(scripts.trailSlash("foo", false)).toEqual("foo");
    expect(scripts.trailSlash("foo/", false)).toEqual("foo");
    expect(scripts.trailSlash("foo", undefined)).toEqual("foo");
    expect(scripts.trailSlash("foo/", undefined)).toEqual("foo/");
    expect(scripts.trailSlash("foo", null)).toEqual("foo");
    expect(scripts.trailSlash("foo/", null)).toEqual("foo/");

    expect(function() {
      scripts.trailSlash("foo/", {});
    }).toThrow();
    expect(function() {
      scripts.trailSlash("foo/", { foo: "bar" });
    }).toThrow();
    expect(function() {
      scripts.trailSlash("foo/", "bar");
    }).toThrow();
  });

  it("should generate rsync commands.", function() {
    // setup
    var ssh = {
      user: "user",
      ip: "host",
      port: "22"
    };

    // verif
    expect(scripts.rsync(null, "/src", "/dst")).toEqual(
      "rsync -avz /src /dst\n"
    );
    expect(scripts.rsync(null, "/src", "/dst", true, true)).toEqual(
      "rsync -avz /src/ /dst/\n"
    );
    expect(scripts.rsync(null, "/src", "/dst", null, null, "-xyz")).toEqual(
      "rsync -xyz /src /dst\n"
    );

    expect(scripts.rsync(ssh, "/src", "/dst")).toEqual(
      "rsync -avz /src /dst\n"
    );
    Object.assign(ssh, { remoteDst: true });
    expect(scripts.rsync(ssh, "/src", "/dst")).toEqual(
      "rsync -avz -e 'ssh -p 22' /src user@host:/dst\n"
    );
    delete ssh.remoteDst;
    Object.assign(ssh, { remoteSrc: true });
    expect(scripts.rsync(ssh, "/src", "/dst")).toEqual(
      "rsync -avz -e 'ssh -p 22' user@host:/src /dst\n"
    );
  });

  it("should generate Docker run command", function() {
    var docker = scripts.getDeploymentScripts("docker");

    var instanceDef = {
      type: "dev",
      group: "tlc",
      deployment: {
        hostDir: "/var/docker-volumes/cacb5448-46b0-4808-980d-5521775671c0",
        type: "docker",
        value: {
          image: "mekomsolutions/bahmni",
          tag: "cambodia-release-0.90",
          ports: {
            "443": "8733",
            "80": "8180"
          }
        }
      }
    };

    var mounts = {
      "/mnt": instanceDef.deployment.hostDir
    };

    expect(docker.run("cambodia1", instanceDef, mounts)).toEqual(
      "set -e\n" +
        "docker run -dit --restart unless-stopped " +
        "--publish 8180:80 --publish 8733:443 --label type=dev --label group=tlc " +
        "--name cambodia1 --hostname bahmni " +
        "--mount type=bind,source=/var/docker-volumes/cacb5448-46b0-4808-980d-5521775671c0,target=/mnt " +
        "mekomsolutions/bahmni:cambodia-release-0.90\n"
    );
  });

  it("should generate ifExists wrapper", function() {
    var docker = scripts.getDeploymentScripts("docker");
    expect(docker.ifExists("cambodia1", "cmd1\n", "cmd2\n")).toEqual(
      "set -e\n" +
        "container=\\$(docker ps -a --filter name=cambodia1 --format {{.Names}})\n" +
        'if [ "\\$container" == "cambodia1" ]\n' +
        "then cmd1\n" +
        "else cmd2\n" +
        "fi\n"
    );
    expect(docker.ifExists("cambodia1")).toEqual(
      "set -e\n" +
        "container=\\$(docker ps -a --filter name=cambodia1 --format {{.Names}})\n" +
        'if [ "\\$container" == "cambodia1" ]\n' +
        "then echo\n" +
        "else echo\n" +
        "fi\n"
    );
  });

  it("should generate Docker restart command", function() {
    var docker = scripts.getDeploymentScripts("docker");
    expect(docker.restart("cambodia1")).toEqual(
      docker.ifExists("cambodia1", "set -e\n" + "docker restart cambodia1\n")
    );
  });

  it("should generate Docker remove command", function() {
    var docker = scripts.getDeploymentScripts("docker");
    expect(docker.remove("cambodia1")).toEqual(
      docker.ifExists(
        "cambodia1",
        "set -e\ndocker stop cambodia1\ndocker rm -v cambodia1\n"
      )
    );
  });

  it("should generate Docker exec command", function() {
    var docker = scripts.getDeploymentScripts("docker");
    expect(docker.exec("cambodia1", "echo 'test'")).toEqual(
      "set -e\n" +
        "docker exec -i cambodia1 /bin/bash -s <<" +
        heredoc_2 +
        "\n" +
        "set -e\n" +
        "echo 'test'\n" +
        heredoc_2 +
        "\n"
    );
  });

  it("should generate Docker copy command", function() {
    var docker = scripts.getDeploymentScripts("docker");
    expect(docker.copy("cambodia1", "/tmp/test1", "/tmp/test2")).toEqual(
      "docker cp /tmp/test1 cambodia1:/tmp/test2\n"
    );
  });

  it("should linkFolder", function() {
    var mockUtils = Object.assign({}, utils);
    mockUtils.random = function() {
      return "0.123456789";
    };

    var scripts_ = proxyquire(
      path.resolve("src/" + config.getJobNameForPipeline3() + "/scripts.js"),
      { "../utils/utils": mockUtils }
    );

    var expectedScript = scripts_.linkFolder(
      "source123",
      "target123",
      "bahmni",
      "bahmni",
      true
    );

    expect(expectedScript).toContain("rsync -avz target123/ target123.backup");
    expect(expectedScript).toContain("mkdir -p source123");
    expect(expectedScript).toContain("rsync -avz target123/ source123");
    expect(expectedScript).toContain("rm -rf target123");
    expect(expectedScript).toContain("ln -s source123 target123");
    expect(expectedScript).toContain("chown -R bahmni:bahmni source123");
  });

  it("should set timezone", function() {
    expect(scripts.setTimezone("Europe/Paris")).toContain(
      "mv /etc/localtime /etc/localtime.backup\n" +
        "ln -s /usr/share/zoneinfo/Europe/Paris /etc/localtime"
    );
  });

  it("should linkComponents", function() {
    var mockUtils = Object.assign({}, utils);
    mockUtils.random = function() {
      return "0.123456789";
    };

    var scripts_ = proxyquire(
      path.resolve("src/" + config.getJobNameForPipeline3() + "/scripts.js"),
      { "../utils/utils": mockUtils }
    );

    var links = [
      {
        type: "artifact",
        component: "bahmniconnect",
        source: "/mnt/artifacts/bahmni_emr/bahmniconnect/bahmni-connect-apps",
        target: "/opt/bahmni-offline/bahmni-connect-apps",
        user: "bahmni",
        group: "bahmni"
      },
      {
        type: "data",
        component: "db_dumps",
        source: "/mnt/data/db_dumps",
        target: "/data",
        user: "mysql",
        group: "mysql"
      }
    ];

    var artifactsLinks = "";
    artifactsLinks += scripts_.linkFolder(
      links[0].source,
      links[0].target,
      links[0].user,
      links[0].group,
      true
    );
    var dataLinks = "";
    dataLinks += scripts_.linkFolder(
      links[1].source,
      links[1].target,
      links[1].user,
      links[1].group,
      true
    );

    var actualScript = scripts_.linkComponents(links);
    expect(actualScript).toContain(artifactsLinks);
    expect(actualScript).toContain(dataLinks);
  });

  it("should compute additional instance's scripts", function() {
    var instanceDef = {
      uuid: "1-22-333",
      scripts: [
        {
          type: "shell",
          executionStage: "6",
          conditions: ["data"],
          value: "/a/script.sh"
        }
      ],
      deployment: {
        host: {
          type: "ssh",
          value: {
            ip: "54.154.133.95",
            user: "ec2-user",
            port: "22"
          }
        },
        type: "docker"
      }
    };
    var docker = scripts.getDeploymentScripts(instanceDef.deployment.type);

    process.env[config.varDataChanges()] = "true";
    process.env[config.varArtifactsChanges()] = "true";
    process.env[config.varDeploymentChanges()] = "true";

    var scriptsToRun = [];
    var script = [];
    script.push("some commands");
    var currentStage = "6";

    scriptsToRun = scripts.computeAdditionalScripts(
      script,
      instanceDef,
      currentStage,
      config,
      process.env
    );
    expect(scriptsToRun.script).toEqual([
      "some commands",
      scripts.remote(
        instanceDef.deployment.host.value,
        docker.exec(instanceDef.uuid, instanceDef.scripts[0].value)
      )
    ]);

    script = [];
    script.push("some commands");
    // Setting a different 'currentStage'
    currentStage = "7";

    scriptsToRun = scripts.computeAdditionalScripts(
      script,
      instanceDef,
      currentStage,
      config,
      process.env
    );
    expect(scriptsToRun.script).toEqual(["some commands"]);

    // Sets 'atStageStart' to true
    instanceDef.scripts[0].atStageStart = "true";
    script = [];
    script.push("some commands");
    currentStage = "6";

    scriptsToRun = scripts.computeAdditionalScripts(
      script,
      instanceDef,
      currentStage,
      config,
      process.env
    );

    // Expects the 'scriptsToRun' to be placed first in the whole script
    expect(scriptsToRun.script).toEqual([
      scripts.remote(
        instanceDef.deployment.host.value,
        docker.exec(instanceDef.uuid, instanceDef.scripts[0].value)
      ),
      "some commands"
    ]);

    // Set a 'false' data changes
    process.env[config.varDataChanges()] = "false";
    process.env[config.varArtifactsChanges()] = "true";
    process.env[config.varDeploymentChanges()] = "true";

    script = [];
    script.push("some commands");
    currentStage = "6";

    scriptsToRun = scripts.computeAdditionalScripts(
      script,
      instanceDef,
      currentStage,
      config,
      process.env
    );
    expect(scriptsToRun.script).toEqual(["some commands"]);

    script = [];
    script.push("some commands");
    instanceDef.scripts.push({
      type: "shell",
      executionStage: "6",
      conditions: ["artifacts"],
      restart: "true",
      value: "/b/script.sh"
    });

    scriptsToRun = scripts.computeAdditionalScripts(
      script,
      instanceDef,
      currentStage,
      config,
      process.env
    );

    expect(scriptsToRun.script).toEqual([
      "some commands",
      scripts.remote(
        instanceDef.deployment.host.value,
        docker.exec(instanceDef.uuid, "/b/script.sh")
      )
    ]);
    expect(scriptsToRun.restartNeeded).toBeTruthy();
  });
});

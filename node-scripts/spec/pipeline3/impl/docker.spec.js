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

    it("should generate Docker run command", function() {
        var docker = scripts["docker"];

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
                    },
                    networks: ["network1", "network2"]
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
            "--name cambodia1 --hostname bahmni --network network1 --network network2 " +
            "--mount type=bind,source=/var/docker-volumes/cacb5448-46b0-4808-980d-5521775671c0,target=/mnt " +
            "mekomsolutions/bahmni:cambodia-release-0.90\n"
        );

        instanceDef.deployment.value.privileged = "true";
        expect(docker.run("cambodia1", instanceDef, mounts)).toContain(
            "--privileged"
        );
        expect(docker.run("cambodia1", instanceDef, mounts)).toContain(
            "-v /sys/fs/cgroup:/sys/fs/cgroup:ro"
        );
    });

    it("should generate ifExists wrapper", function() {
        var docker = scripts["docker"];
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
        var docker = scripts["docker"];
        expect(docker.restart("cambodia1")).toEqual(
            docker.ifExists("cambodia1", "set -e\n" + "docker restart cambodia1\n")
        );
    });

    it("should generate Docker remove command", function() {
        var docker = scripts["docker"];
        expect(docker.remove("cambodia1")).toEqual(
            docker.ifExists(
                "cambodia1",
                "set -e\ndocker stop cambodia1\ndocker rm -v cambodia1\n"
            )
        );
    });

    it("should generate Docker exec command", function() {
        var docker = scripts["docker"];
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
        var docker = scripts["docker"];
        expect(docker.copy("cambodia1", "/tmp/test1", "/tmp/test2")).toEqual(
            "docker cp /tmp/test1 cambodia1:/tmp/test2\n"
        );
    });

    // Tests for Docker Pipeline steps

    describe("Pipeline steps", function () {

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
                    },
                    networks: ["network1", "network2"]
                },
                "host": {
                    "type": "ssh",
                    "value": {
                        "ip": "hsc-dev.mekomsolutions.net",
                        "user": "mekom",
                        "port": "22"
                    }
                }
            }
        };

        it("should generate Docker Pre-Host Preparation deployment script", () => {
            var docker = scripts["docker"];
            expect(docker.preHostPreparation.getDeploymentScript(instanceDef)).toEqual("");
        });

        it("should generate Docker Pre-Host Preparation data script", () => {
            var docker = scripts["docker"];
            expect(docker.preHostPreparation.getDataScript(instanceDef)).toEqual("");
        });

        it("should generate Docker Pre-Host Preparation artifacts script", () => {
            var docker = scripts["docker"];
            expect(docker.preHostPreparation.getArtifactsScript(instanceDef)).toEqual("");
        });


        it("should generate Docker Host Preparation deployment script", () => {
            var docker = scripts["docker"];
            expect(docker.hostPreparation.getDeploymentScript(instanceDef)).toEqual(
                "ssh -T mekom@hsc-dev.mekomsolutions.net -p 22 /bin/bash --login <<heredoc_delimiter_7e228d99\n" +
                "docker pull mekomsolutions/bahmni:cambodia-release-0.90\n" +
                "heredoc_delimiter_7e228d99\n"
            );
        });

        it("should generate Docker Host Preparation data script", () => {
            var docker = scripts["docker"];
            expect(docker.hostPreparation.getDataScript(instanceDef)).toEqual("");
        });

        it("should generate Docker Host Preparation artifacts script", () => {
            var docker = scripts["docker"];
            expect(docker.hostPreparation.getArtifactsScript(instanceDef)).toEqual("");
        });


        it("should generate Docker Start Instance deployment script", () => {
            var docker = scripts["docker"];
            expect(docker.startInstance.getDeploymentScript(instanceDef)).toEqual(
                "ssh -T mekom@hsc-dev.mekomsolutions.net -p 22 /bin/bash --login <<heredoc_delimiter_7e228d99\n" +
                "set -e\n" +
                "container=\\$(docker ps -a --filter name=undefined --format {{.Names}})\n" +
                "if [ \"\\$container\" == \"undefined\" ]\n" +
                "then set -e\n" +
                "docker stop undefined\n" +
                "docker rm -v undefined\n" +
                "else echo\n" +
                "fi\n" +
                "heredoc_delimiter_7e228d99\n" +
                "\n" +
                "ssh -T mekom@hsc-dev.mekomsolutions.net -p 22 /bin/bash --login <<heredoc_delimiter_7e228d99\n" +
                "set -e\n" +
                "docker run -dit --restart unless-stopped --publish 8180:80 --publish 8733:443 --label type=dev --label group=tlc --name undefined --hostname bahmni --network network1 --network network2 --mount type=bind,source=/var/docker-volumes/cacb5448-46b0-4808-980d-5521775671c0,target=/mnt mekomsolutions/bahmni:cambodia-release-0.90\n" +
                "heredoc_delimiter_7e228d99\n" +
                "\n" +
                "\n"
            );
        });

        it("should generate Docker Start Instance data script", () => {
            var docker = scripts["docker"];
            expect(docker.startInstance.getDataScript(instanceDef)).toEqual("");
        });

        it("should generate Docker Start Instance artifacts script", () => {
            var docker = scripts["docker"];
            expect(docker.startInstance.getArtifactsScript(instanceDef)).toEqual("");
        });

    });



});

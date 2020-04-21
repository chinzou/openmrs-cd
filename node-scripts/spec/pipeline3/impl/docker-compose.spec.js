"use strict";

describe("Scripts", function () {
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

    describe("Pipeline steps", function () {

        var instanceDef = {
            uuid: "cacb5448-46b0-4808-980d-5521775671c0",
            type: "dev",
            group: "tlc",
            deployment: {
                hostDir: "/var/docker-volumes/cacb5448-46b0-4808-980d-5521775671c0",
                type: "dockerCompose",
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

        it("should generate docker compose Pre-Host Preparation deployment script", () => {
            var docker = scripts[instanceDef.deployment.type];
            expect(docker.preHostPreparation.getDeploymentScript(instanceDef)).toEqual(
                "git clone undefined " + process.env.WORKSPACE + "/cacb5448-46b0-4808-980d-5521775671c0/docker/bahmni_docker\n" +
                "cd " + process.env.WORKSPACE + "/cacb5448-46b0-4808-980d-5521775671c0/docker/bahmni_docker && docker-compose -p undefined build --pull\n" +
                "docker save -o " + process.env.WORKSPACE + "/cacb5448-46b0-4808-980d-5521775671c0/docker/bahmni_imagesundefined_images.tar $(docker images --filter=reference='undefined_*' -q)"
            );
        });

        it("should generate docker compose Pre-Host Preparation data script", () => {
            var docker = scripts[instanceDef.deployment.type];
            expect(docker.preHostPreparation.getDataScript(instanceDef)).toEqual("");
        });

        it("should generate docker compose Pre-Host Preparation artifacts script", () => {
            var docker = scripts[instanceDef.deployment.type];
            expect(docker.preHostPreparation.getArtifactsScript(instanceDef)).toEqual("");
        });


        it("should generate docker compose Host Preparation deployment script", () => {
            var docker = scripts[instanceDef.deployment.type];
            expect(docker.hostPreparation.getDeploymentScript(instanceDef)).toEqual(
                "rsync -avz " + process.env.WORKSPACE + "/cacb5448-46b0-4808-980d-5521775671c0/dockerbahmni_docker/ /var/docker-volumes/cacb5448-46b0-4808-980d-5521775671c0undefinedbahmni_docker/\n" +
                "\n" +
                "rsync -avz " + process.env.WORKSPACE + "/cacb5448-46b0-4808-980d-5521775671c0/dockerbahmni_images/ /var/docker-volumes/cacb5448-46b0-4808-980d-5521775671c0undefinedbahmni_images/\n" +
                "ssh -T mekom@hsc-dev.mekomsolutions.net -p 22 /bin/bash --login <<heredoc_delimiter_7e228d99\n" +
                "docker load < /var/docker-volumes/cacb5448-46b0-4808-980d-5521775671c0undefinedbahmni_images/undefined_images.tar\n" +
                "heredoc_delimiter_7e228d99\n"
            );
        });

        it("should generate docker compose Host Preparation data script", () => {
            var docker = scripts[instanceDef.deployment.type];
            expect(docker.hostPreparation.getDataScript(instanceDef)).toEqual("");
        });

        it("should generate docker compose Host Preparation artifacts script", () => {
            var docker = scripts[instanceDef.deployment.type];
            expect(docker.hostPreparation.getArtifactsScript(instanceDef)).toEqual(
                "echo 'OPENMRS_MODULES_PATH='/var/docker-volumes/cacb5448-46b0-4808-980d-5521775671c0undefineddocker_compose/openmrs_modules/\n" +
                "> .env"
            );
        });


        it("should generate docker compose Start Instance deployment script", () => {
            var docker = scripts[instanceDef.deployment.type];
            expect(docker.startInstance.getDeploymentScript(instanceDef)).toEqual("");
        });

        it("should generate docker compose Start Instance data script", () => {
            var docker = scripts[instanceDef.deployment.type];
            expect(docker.startInstance.getDataScript(instanceDef)).toEqual("");
        });

        it("should generate docker compose Start Instance artifacts script", () => {
            var docker = scripts[instanceDef.deployment.type];
            expect(docker.startInstance.getArtifactsScript(instanceDef)).toEqual("");
        });

    });
});

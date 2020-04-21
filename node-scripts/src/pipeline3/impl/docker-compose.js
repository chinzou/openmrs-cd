"use strict";

const path = require("path");
const _ = require("lodash");
const uuid = require("uuid/v4");

const cst = require("../../const");
const heredoc = cst.HEREDOC;
const heredoc_2 = cst.HEREDOC_2;
const heredoc_3 = cst.HEREDOC_3;
const utils = require("../../utils/utils");
const model = require("../../utils/model");
const config = require("../../utils/config");
const scripts = require("../scripts");
/*
 * Implementation of script utils to specifically manipulate Docker Compose containers.
 *
 */

module.exports = {
  preHostPreparation: {
    getDeploymentScript: function(instanceDef) {
      var script = "";
      var gitRepo = instanceDef.deployment.value.gitUrl;



      script += require("../scripts").gitClone(
        gitRepo,
        path.resolve(config.getCDDockerDirPath(instanceDef.uuid), "bahmni_docker"),
        instanceDef.deployment.value.commitId
      ); // "e619660"

      var dockerComposeBuild = "";
      dockerComposeBuild +=
        "cd " +
        path.resolve(config.getCDDockerDirPath(instanceDef.uuid), "bahmni_docker") +
        " && docker-compose -p " +
        instanceDef.name +
        " build --pull\n";

      script += dockerComposeBuild;

      script +=
        "docker save -o " +
        path.resolve(config.getCDDockerDirPath(instanceDef.uuid), "bahmni_images") +
        instanceDef.name +
        "_images.tar $(docker images --filter=reference='" +
        instanceDef.name +
        "_*' -q)";

      return script;
    },
    getDataScript: function(instanceDef) {
      return "";
    },
    getArtifactsScript: function(instanceDef) {
      return "";
    }
  },
  hostPreparation: {
    getDeploymentScript: function(instanceDef) {
      var scripts = require('../scripts');
      var script = scripts.rsync(
        instanceDef.deployment.host.value,
        config.getCDDockerDirPath(instanceDef.uuid) + "bahmni_docker/",
        instanceDef.deployment.hostDir + instanceDef.name + "bahmni_docker/",
        true
      );
      script += "\n";
      script += scripts.rsync(
          instanceDef.deployment.host.value,
        config.getCDDockerDirPath(instanceDef.uuid) + "bahmni_images/",
        instanceDef.deployment.hostDir + instanceDef.name + "bahmni_images/",
        true
      );
      script += scripts.remote(
          instanceDef.deployment.host.value,
        "docker load < " +
          instanceDef.deployment.hostDir +
          instanceDef.name +
          "bahmni_images/" +
          instanceDef.name +
          "_images.tar"
      );

      return script;
    },
    getDataScript: function(instanceDef) {
      // script += "echo 'OPENMRS_MODULES_PATH='"
      return "";
    },
    getArtifactsScript: function(instanceDef) {
      var script =
        "echo 'OPENMRS_MODULES_PATH='" +
        instanceDef.deployment.hostDir +
        instanceDef.name +
        "docker_compose/" +
        "openmrs_modules/\n" +
        "> .env";
      return script;
    }
  },
  startInstance: {
    getDeploymentScript: function(instanceDef) {
      return "";
    },
    getDataScript: function(instanceDef) {
      return "";
    },
    getArtifactsScript: function(instanceDef) {
      return "";
    }
  },
  /*
     * Util function that wraps the passed commands so each is applied either accordingly.
     *
     * @param {String} containerName - The name of the container.
     * @param {String} ifExistsCommand - The command that should run if the container exists.
     * @param {String} elseCommand - The command that will run if the container does *not* exist.
     *
     * @return {String} The script as a string.
     */
  ifExists: function() {},
  restart: function() {},
  remove: function(instanceDef, sudo) {
    var script = "";

    if (sudo) {
      script += "sudo ";
    }
    script += "docker-compose down -v " + instanceDef.name;

    return script + "\n";

  },
  pull: function() {}
};

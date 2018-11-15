import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import * as inquirer from "inquirer";

init();

function init() {
  const configFile = path.join(__dirname, "config.yml");
  const templateFile = path.join(__dirname, "config.yml.example");

  if (fs.existsSync(configFile)) {
    process.exit(0);
  }

  console.log(`Initialzing ${configFile}`);

  const config = yaml.safeLoad(fs.readFileSync(templateFile, "utf8"));
  const questions: Array<inquirer.Question> = [
    {
      type: "input",
      name: "deploy_user",
      message: "Deploy username:",
      default: config.all.vars.deploy_user
    },
    {
      type: "input",
      name: "gh_pubkey_user",
      message: "GitHub username (to pull publickey from):",
      default: config.all.vars.gh_pubkey_user
    },
    {
      type: "input",
      name: "host",
      message: "Hostname or IP address:",
      validate: function(input) {
        const validIpAddressRegex = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;
        const validHostnameRegex = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/;
        return (
          !!(input.match(validHostnameRegex) || input.match(validHostnameRegex)) ||
          "Please enter a valid hostname or IP address."
        );
      }
    }
  ];

  for (let i = 0; i < config.production.vars.cron_jobs.length; i++) {
    questions.push(
      {
        type: "input",
        name: `job_${i}_cron_hour`,
        message: `Job ${i}: cron_hour:`,
        default: config.production.vars.cron_jobs[i].cron_hour
      },
      {
        type: "input",
        name: `job_${i}_app_args`,
        message: `Job ${i}: app_args:`,
        default: config.production.vars.cron_jobs[i].app_args
      }
    );
  }

  (async function() {
    const answers = await inquirer.prompt(questions);
    config.all.vars.deploy_user = answers.deploy_user;
    config.all.vars.gh_pubkey_user = answers.gh_pubkey_user;
    config.production.hosts = answers.host;
    for (let i = 0; i < config.production.vars.cron_jobs.length; i++) {
      config.production.vars.cron_jobs[i].cron_hour = answers[`job_${i}_cron_hour`];
      config.production.vars.cron_jobs[i].app_args = answers[`job_${i}_app_args`];
    }
    fs.writeFileSync(configFile, yaml.safeDump(config));
  })();
}

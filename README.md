# ynab-amazon-memos

Updates Amazon purchase transactions in YNAB with a memo listing the order items

## Deploy

Deployment is handled with an Ansible playbook located on the `ops/` folder.  To deploy the app:

1. Initialize the config file with: `cp ops/config.yml.example ops/config.yml`
2. Update `ops/config.yml` with appropriate values, based on the example
3. Run `npm run deploy`
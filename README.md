# ynab-utils

Some miscellaneous utilities for YNAB

## Usage

```
USAGE

     index.ts <command> [options]

   COMMANDS

     importTransactions <email> <password> <account_ids>                  Import transactions
     updateAmazonMemos <email> <password> <budget_id> <access_token>      Update Amazon transactions in YNAB with list of order items
     help <command>                                                       Display help for a specific command

   GLOBAL OPTIONS

     -h, --help         Display help
     -V, --version      Display version
     --no-color         Disable colors
     --quiet            Quiet mode - only displays warn and error messages
     -v, --verbose      Verbose mode - will also output debug messages
```

## Deployment

Deployment is handled with an Ansible playbook located on the `ops/` folder.  To deploy the app, run `npm run deploy`. The first time you run this you will be prompted for deployment config values which will be saved to `ops/config.yml`.

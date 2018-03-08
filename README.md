# ynab-utils

Various utilities for YNAB

## Usage

```
USAGE

     index.ts <command> [options]

   COMMANDS

     importTransactions <email> <password> <account_id>                   Import transactions for an account
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

Deployment is handled with an Ansible playbook located on the `ops/` folder.  To deploy the app:

1. Initialize the config file with: `cp ops/config.yml.example ops/config.yml`
2. Update `ops/config.yml` with appropriate values, based on the example
3. Run `npm run deploy`
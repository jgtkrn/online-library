## Description

Command list to generate architecture documentation.

## Preparation
Create `.env` file in the root directory (near `package.json`)

```
PORT=3000
```
## Running the doc generator

```bash
# generate and run doc
$ npm run documentation:serve

# generate doc only
$ npm run documentation:generate
```

## Output

Documentation result located in ./documentation folder, you can simply run index.html file if do not want to run with app serve.

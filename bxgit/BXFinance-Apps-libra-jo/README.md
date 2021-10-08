# BXFinance-Apps
Single page application (SPA) built with React; JSX, ECMAscript 2017, react-router, react-strap, SASS, JSON.

# IMPORTANT
BXFinance was built on react-script version 3.4.3. Do NOT update to react-scripts version 4.0.1. Despite the warning of a prototype pollution vulnerability, the update to v4.0.1 has a breaking change related to the same package that has the vulnerability. This breaking change prevents compilation of the project.

## Points of Interest

### Cloning BXFinance and running the app
**NOTE:** Any branch other than master is for our SDLC and is NOT considered stable. Clone command below is recommended. All pull requests will be ignored unless previously agreed collaboration is in place.

**Pre-requisites**
- You must have the Node Package Manager. To install on Mac, `brew install node`. For other OS', @see https://www.npmjs.com/get-npm

1. Clone the repo `git clone --single-branch --branch master https://github.com/Technical-Enablement-PingIdentity/BXFinance-Apps.git`.
2. Change directory to the source root: `cd BXFinance/bxfinance-scenario1`.
3. Edit the .env file and modify the custom environement variables for your host...
- This is detailed in the .env file.
3. Run the following command to get current React and node package dependencies: `npm install`. This will create a node_modules folder with everything the app needs to run. **NOTE:** you may see npm warn about vulerabilities. Do NOT run `npm audit fix`. This is related to the Important note listed above.
4. Once that completes, run: `npm start`.

- `npm start` will do a "dev build", spin up the app locally with an embedded web server supporting hot code reloading. This should also pop a browser tab to the running host:port. If not, the terminal output of npm start will instruct you where to browse to see the app. This is the simplest way to get the app up and running on the fly that also allows you to edit the code to customize it for your own demos.
- If you want to do a "production buid", which is optimized for performance, you can run `npm run build`. This will additionally minify, chunk, and bundle the code. This will create a build folder with the production source code. This build folder becomes your app root for your own web server.

### Source Files Notes
- All points of integration in the UI are tagged with "Ping Integration" comments. Depending on whether you are in pure ECMAScript or JSX the comment labels will be one of the following, 

> 1. Single line integration comment // Ping Integration ...
> 2. Multi-line integration comment /* Ping Integration ... */ 
> 3. JSX comment {/* Ping Integration ... */}

- There are roughly 50+ console.info() entries to show the app flow in the dev tools console. I tried to be conscious and consistent about using the proper console method for the right purpose; info() vs. log() vs. warn() vs. error(). And tried to be diligent about not leaving debugging logging in the code, unless it was long running debug/chore crossing iterations.
- Tech debt and other design concerns are tagged with **TODO** markers. Tech debt is managed and removed during sprints and will end up in future version releases. See "Recommended Extensions" list for TODO details. 
- 2 Dockerfiles: optional...
Creating a Docker image of the React app is not required. If choose to do so, there is one Dockerfile for the development environment build and another used for QA, staging, and production. The .env config file should be updated accordingly before running "docker build...". The Dev environment has its own DockerFile and Compose YAML file because we want a React "dev build" that allows for hot code reloading and volume mounted source for our development with VSCode Remote (recommended), or the IDE of your choice.
- 2 docker-compose.yaml files: optional...
Creating a Docker mage of the React app is not required. If you choose to do so, there is one YAML file for the development environment and another used for QA, staging, and production containers. The Dev environment has its own Compose YAML file because of the volumes needed for code editing, and some settings needed to support hot code reloading. The image definition's tag should be changed according to environment name... or whatever you named your images. 
- .env file:
This is the environment config file which contains a couple settings required for the app and integrations. This file is thoroughly commented.
- Ignore Files:

There are multiple ignore files so each build, run, and version tools don't pick up unnecessary artifacts that can be confusing and bloat the file system.
> 1. .npmignore for when running the dev version or building the prod version of the React code base.
> 2. .dockerignore for when executing Dockerfiles.
> 3. .gitignore for ignoring intentionally untracked files.

### Recommended VSCode Extensions for Development
- Remote Development Extension Pack by Microsoft (*if your dev server is hosted remotely, such as Scalr*)
- Kubernetes by Microsoft (*if your dev server is deployed in a k8s deployment*)
- Babel Javascript by Michael McDermott
- ESLint by Dirk Baeumer
- Prettier - Code Formatter by Prettier
- env-cmd-file-syntax by Nixon
- nginx.conf hint by Liu Yue (*if your using Nginx for prod builds*)
- TODO Tree by Gruntfuggly
